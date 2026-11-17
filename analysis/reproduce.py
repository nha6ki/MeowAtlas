"""Reproduce the adopted features from CatMeows; never modify the published site."""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault("NUMBA_CACHE_DIR", str(ROOT / "work/numba-cache"))

import librosa
import numpy as np
import soundfile as sf


def sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def prepare_clip(wav_bytes: bytes, parameters: dict) -> np.ndarray:
    samples, rate = sf.read(io.BytesIO(wav_bytes), dtype="float64", always_2d=True)
    if rate != parameters["sample_rate_hz"] or samples.shape[1] != 1 or not np.isfinite(samples).all():
        raise ValueError("Expected finite mono CatMeows audio at 8000 Hz")
    trim = int(parameters["trim_each_end_seconds"] * rate)
    fade = int(parameters["linear_fade_each_end_seconds"] * rate)
    if len(samples) <= 2 * (trim + fade):
        raise ValueError("Recording too short for the adopted preprocessing")
    signal = samples[trim:-trim, 0].copy()
    ramp = np.linspace(0.0, 1.0, fade)
    signal[:fade] *= ramp
    signal[-fade:] *= ramp[::-1]
    return signal


def extract_spectrogram(signal: np.ndarray, parameters: dict) -> np.ndarray:
    power = librosa.feature.melspectrogram(y=signal, **parameters)
    return librosa.power_to_db(power, ref=np.max, amin=1e-10, top_db=80.0)


def flatten_spectrograms(spectrograms: list[np.ndarray]) -> np.ndarray:
    max_frames = max(spec.shape[1] for spec in spectrograms)
    vectors = []
    for spec in spectrograms:
        std = spec.std()
        if not np.isfinite(spec).all() or std <= 1e-12:
            raise ValueError("Invalid or constant spectrogram")
        standardized = (spec - spec.mean()) / std
        padded = np.pad(standardized, ((0, 0), (0, max_frames - spec.shape[1])))
        vectors.append(padded.ravel(order="C"))
    return np.asarray(vectors, dtype=np.float32)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, required=True, help="Unmodified CatMeows v1.0.2 dataset.zip")
    parser.add_argument("--output", type=Path, default=ROOT / "work/reproduction")
    parser.add_argument("--refit-map", action="store_true", help="Also fit a separate UMAP; not required to run the website")
    args = parser.parse_args()
    output = args.output.resolve()
    if not output.is_relative_to((ROOT / "work").resolve()):
        parser.error("Use an output directory inside this repository's ignored work/ folder")

    recipe = json.loads((ROOT / "analysis/recipe.json").read_text())
    provenance = json.loads((ROOT / "analysis/provenance.json").read_text())
    records = json.loads((ROOT / "analysis/records.json").read_text())
    if sha256(args.archive.read_bytes()) != provenance["dataset"]["archive_sha256"]:
        raise ValueError("Dataset archive does not match the adopted CatMeows v1.0.2 input")
    if sha256((ROOT / "analysis/reference.npz").read_bytes()) != provenance["reference_sha256"]:
        raise ValueError("Frozen reference has changed")
    output.mkdir(parents=True, exist_ok=True)
    (output / "audio").mkdir(exist_ok=True)
    expected_media = {item["id"]: item for item in provenance["media"]}
    spectrograms = []
    with zipfile.ZipFile(args.archive) as archive:
        for i, record in enumerate(records):
            wav_bytes = archive.read(record["archive_member"])
            if sha256(wav_bytes) != record["sha256"]:
                raise ValueError(f"Original audio differs: {record['id']}")
            signal = prepare_clip(wav_bytes, recipe["audio_preprocessing"])
            spectrograms.append(extract_spectrogram(signal, recipe["mel"]))
            path = output / "audio" / f"{record['id']}.wav"
            sf.write(path, signal, 8000, format="WAV", subtype="PCM_16")
            if sha256(path.read_bytes()) != expected_media[record["id"]]["audio_sha256"]:
                raise ValueError(f"Prepared audio differs: {record['id']}")
            if (i + 1) % 110 == 0:
                print(f"Reproduced {i + 1}/{len(records)} recordings", flush=True)

    vectors = flatten_spectrograms(spectrograms)
    feature_hash = sha256(np.asarray(vectors, dtype="<f4", order="C").tobytes(order="C"))
    features_match = feature_hash == provenance["features"]["sha256"]
    with np.load(ROOT / "analysis/reference.npz", allow_pickle=False) as reference:
        ids = reference["ids"].copy()
        coordinates = reference["coordinates"].copy()
    np.testing.assert_array_equal(ids, [r["id"] for r in records])
    np.savez_compressed(output / "features.npz", ids=ids, mel=vectors)
    np.savez_compressed(output / "fixed_map.npz", ids=ids, coordinates=coordinates)
    report = {"clips": len(records), "feature_shape": list(vectors.shape),
              "features_sha256": feature_hash, "features_exact": features_match,
              "audio_exact": True, "fixed_coordinates_copied": True,
              "model_refitted": False, "site_modified": False}
    if features_match and args.refit_map:
        import umap
        coordinates_refit = umap.UMAP(**recipe["umap"]).fit_transform(vectors)
        np.savez_compressed(output / "refitted_map.npz", ids=ids, coordinates=coordinates_refit)
        report.update(model_refitted=True,
                      refitted_coordinates_exact=bool(np.array_equal(coordinates, coordinates_refit)),
                      max_absolute_coordinate_difference=float(np.max(np.abs(coordinates - coordinates_refit))))
    (output / "verification.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    if not features_match:
        raise SystemExit("Features differ from the frozen reference; inspect the report and dependency versions. The site was not changed.")


if __name__ == "__main__":
    main()
