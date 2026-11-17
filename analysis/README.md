# Reproducing the adopted analysis

The website already includes the complete, fixed result and requires no Python
packages beyond the optional local HTTP server. These instructions are for
inspecting or reproducing the adopted audio preprocessing and feature extraction.

## Input and environment

Download **dataset.zip** from the [CatMeows v1.0.2 record](https://zenodo.org/records/4008297).
Read its CC BY-NC 4.0 terms before reuse. The original archive is not bundled here.
The script checks the archive hash and each recording hash before processing it.

The adopted analysis was prepared on macOS arm64 with Python 3.12.16.
`provenance.json` records the input and output hashes and the relevant environment.

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r analysis/requirements.txt
.venv/bin/python analysis/reproduce.py --archive /path/to/dataset.zip
```

Run these commands from the repository root. Outputs go to the ignored
`work/reproduction/` directory:

- `audio/`: processed 8 kHz mono PCM16 WAV files, checked against the adopted audio;
- `features.npz`: the 440 × 34,160 log-Mel feature matrix;
- `fixed_map.npz`: a copy of the adopted coordinates;
- `verification.json`: feature and audio checks.

The default command does not fit UMAP. It validates the exact feature bytes
against the frozen reference. Results can differ across dependency versions or
platforms; the script reports mismatches rather than silently replacing the site.

## Optional map refitting

To study the adopted settings, add `--refit-map`. This writes a separate
`refitted_map.npz` and reports its difference from the fixed reference. It is not
needed for building, viewing, or publishing the website. No coordinate adjustment
is applied, and the stored `site/data.js` is never overwritten.

Use the original archive for feature reproduction. The website's playback WAVs
have already been trimmed, faded, and quantized to PCM16; processing them again
would not reproduce the original feature extraction.

## Files

- `recipe.json`: the adopted settings, separated from historical experiment paths;
- `records.json`: IDs, dataset metadata, original archive paths and hashes;
- `reference.npz`: IDs, fixed coordinates, and the adopted nearest-neighbor references;
- `provenance.json`: feature fingerprint, media fingerprints, and environment;
- `reproduce.py`: the adopted preprocessing and feature operations, with an optional UMAP refit.

Recording context and cat identity are retained as metadata; they are not passed
to UMAP. This reproduction is not a new parameter search or an evaluation of
emotion recognition or unseen-recording performance.
