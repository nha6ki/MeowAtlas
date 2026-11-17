"""Verify the fixed release with Python's standard library; no downloads or writes."""
from __future__ import annotations

from collections import Counter
import hashlib
from html.parser import HTMLParser
import json
import math
from pathlib import Path
import struct
from urllib.parse import unquote, urlsplit
import wave

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class References(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.urls = []
        self.ids = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if "id" in values:
            self.ids.append(values["id"])
        for key in ("href", "src"):
            if values.get(key):
                self.urls.append((tag, key, values[key]))


def main() -> None:
    manifest = json.loads((ROOT / "release-manifest.json").read_text())
    files = {p.relative_to(SITE).as_posix(): p for p in SITE.rglob("*") if p.is_file()}
    require(set(files) == set(manifest["site_sha256"]), "Unexpected or missing runtime files")
    for name, path in files.items():
        require(not path.is_symlink(), f"Runtime symlink: {name}")
        require(digest(path) == manifest["site_sha256"][name], f"Runtime file changed: {name}")

    raw = (SITE / "data.js").read_text()
    require(raw.startswith("window.MEOW_ATLAS="), "Unexpected data wrapper")
    data = json.loads(raw.removeprefix("window.MEOW_ATLAS=").strip().removesuffix(";"))
    lean_raw = (SITE / "experience-data.js").read_text()
    require(lean_raw.startswith("window.MEOW_ATLAS="), "Unexpected Experience data wrapper")
    lean = json.loads(lean_raw.removeprefix("window.MEOW_ATLAS=").strip().removesuffix(";"))
    require(lean == {key: value for key, value in data.items() if key not in ("featureOrder", "mapOrder")},
            "Experience must use the same frozen map and metadata as Analysis")
    experience_html = (SITE / "index.html").read_text()
    require('src="experience-data.js"' in experience_html and 'src="data.js"' not in experience_html,
            "Experience must not load Analysis comparison rankings")
    require('src="vendor/plotly-basic.min.js"' in experience_html,
            "Experience must use the smaller scatter-capable Plotly bundle")
    points = data["points"]
    require(len(points) == 440, "Expected 440 recordings")
    require(len({p["id"] for p in points}) == 440, "Duplicate recording IDs")
    require(len({p["cat"] for p in points}) == 21, "Expected 21 cats")
    require(Counter(p["context"] for p in points) == {"B": 127, "F": 92, "I": 221}, "Context counts changed")
    require(data["coordinatePostprocessing"] == "none", "Coordinates must not be adjusted")
    require(data["candidate"] == "mel_n15_d0.1" and data["seed"] == 42, "Adopted map changed")
    require(all(len(p["coordinates"]) == 2 and all(math.isfinite(v) for v in p["coordinates"]) for p in points), "Invalid coordinates")
    for key in ("featureOrder", "mapOrder"):
        require(len(data[key]) == 440, f"Missing {key}")
        for i, order in enumerate(data[key]):
            require(len(order) == 439 and set(order) == set(range(440)) - {i}, f"Invalid {key} row {i}")

    records = json.loads((ROOT / "analysis/records.json").read_text())
    require([r["id"] for r in records] == [p["id"] for p in points], "Metadata order changed")
    provenance = json.loads((ROOT / "analysis/provenance.json").read_text())
    require(digest(ROOT / "analysis/reference.npz") == provenance["reference_sha256"], "Frozen reference changed")
    media = {m["id"]: m for m in provenance["media"]}
    for point in points:
        expected = media[point["id"]]
        audio = SITE / point["audio"]
        spectrum = SITE / point["spectrum"]
        require(digest(audio) == expected["audio_sha256"], f"Audio mismatch: {point['id']}")
        require(digest(spectrum) == expected["spectrum_sha256"], f"Spectrum mismatch: {point['id']}")
        with wave.open(str(audio), "rb") as wav:
            require((wav.getframerate(), wav.getnchannels(), wav.getsampwidth()) == (8000, 1, 2), "Audio format changed")
            require(wav.getnframes() == expected["samples"], "Audio length changed")
            require(abs(point["duration"] - wav.getnframes() / 8000) < 1e-12, "Displayed duration mismatch")
        png = spectrum.read_bytes()
        require(png[:8] == b"\x89PNG\r\n\x1a\n", "Invalid spectrum PNG")
        require(struct.unpack(">II", png[16:24]) == (point["frames"], 40), "Spectrum dimensions changed")
    require(len(list((SITE / "audio").glob("*.wav"))) == 440, "Unexpected audio files")
    require(len(list((SITE / "spectra").glob("*.png"))) == 440, "Unexpected spectra")

    credits = json.loads((SITE / "cat-images/credits.json").read_text())
    require(credits == data["catImages"], "Image credits and runtime data differ")
    require(set(credits) == set(data["catProfiles"]), "Missing cat-image credits")
    for cat, credit in credits.items():
        require(digest(SITE / credit["src"]) == credit["sha256"], f"Image mismatch: {cat}")
        require(credit["breedCode"] == data["catProfiles"][cat]["breedCode"], "Breed-image mismatch")
        require(all(credit.get(k) for k in ("title", "author", "sourceUrl", "license", "licenseUrl", "changes")), "Incomplete photo attribution")
    require(len({c["sha256"] for c in credits.values()}) == 21, "Photos must differ by cat")

    for page in SITE.glob("*.html"):
        parsed = References()
        parsed.feed(page.read_text())
        require(len(parsed.ids) == len(set(parsed.ids)), f"Duplicate HTML IDs: {page.name}")
        for tag, key, value in parsed.urls:
            url = urlsplit(value)
            if url.scheme or url.netloc:
                require(not (key == "src" and url.scheme in ("http", "https")), "Runtime depends on external asset")
                continue
            if not url.path:
                continue
            require(not url.path.startswith("/"), f"Root-relative link breaks project hosting: {value}")
            target = (page.parent / unquote(url.path)).resolve()
            require(target.is_relative_to(SITE.resolve()), f"Link escapes site: {value}")
            require(target.exists(), f"Missing local link: {page.name}: {value}")

    require("CC BY-NC 4.0" in (SITE / "credits.html").read_text(), "Missing dataset license")
    require("credits.html" in (SITE / "index.html").read_text(), "Experience lacks credits link")
    require("credits.html" in (SITE / "analysis.html").read_text(), "Analysis lacks credits link")
    for name in ("experience.png", "analysis.png"):
        require((ROOT / "docs/images" / name).is_file(), f"Missing README screenshot: {name}")
    for folder in (SITE, ROOT / "analysis"):
        require(not any(p.name.startswith(".env") for p in folder.rglob("*")), "Unexpected environment file")
    print(json.dumps({"status": "passed", "runtime_files": len(files), "recordings": 440,
                      "cats": 21, "photos": 21, "frozen_media_exact": True,
                      "rankings_complete": True, "local_links_valid": True,
                      "site_bytes": sum(p.stat().st_size for p in files.values()),
                      "external_runtime_assets": False}, indent=2))


if __name__ == "__main__":
    main()
