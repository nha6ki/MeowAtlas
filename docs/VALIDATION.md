# Local preparation validation

Checked on 2026-11-17. The machine-readable results are in [validation.json](validation.json).
No GitHub upload, GitHub Actions run, production deployment, or personal-site
publication was performed as part of these checks.

| Check | Result |
| --- | --- |
| Release integrity | 915 runtime files; hashes match the prepared manifest |
| Recording inventory | 440 unique recordings from 21 cats; contexts B=127, F=92, I=221 |
| Audio and spectrograms | All 440 WAVs and all 440 PNGs match the completed local demo |
| Image credits | 21 distinct reference photographs with matching hashes and complete attribution |
| Reproduction from original dataset | All 440 processed WAVs and the 440 × 34,160 float32 feature matrix match exactly |
| Saved coordinates and interaction code | Preserved; no model refit |
| Local links | All HTML file references resolve under the `/MeowAtlas/` prefix |
| JavaScript syntax | Passed for the application, Experience, photo, and data scripts |
| Desktop browser | Point selection, playback, A/B selection, playback exclusion, breed filters, comparison candidates, credits navigation |
| Mobile browser | Experience, Analysis, and credits fit a 320 px viewport without horizontal overflow |
| Runtime requests | No failed asset requests, JavaScript errors, or external runtime requests in the demo smoke check |
| Personal-site checks | Astro check: 0 errors and warnings; static build: 22 pages |
| Personal-site browser | Project content, images, and links checked at 1440 px and 390 px; homepage and Projects cards present |

The browser checks use Chrome on the development Mac. They do not certify every
browser or device. The optional `--refit-map` path was not run: the release keeps
the adopted embedding. Perceptual similarity, emotional interpretation, and
unseen-audio performance were not evaluated by these publication checks.

The release validator can be rerun without third-party Python packages:

```sh
python3 scripts/verify_release.py
```

Publication-specific additions are the standalone credits page and its links in
the existing Experience about dialog and Analysis footer. Original completed
workspace files were not modified.
