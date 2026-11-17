# Publication

## Destinations

- GitHub: https://github.com/nha6ki/MeowAtlas
- Website: https://nha6ki.github.io/MeowAtlas/
- Personal project page: https://nha6ki.github.io/projects/meowatlas/

The personal site's published Astro implementation uses the `redesign-astro`
branch. Its older `master` branch is not the source of the current site.
The project page belongs in `site/src/content/projects/meowatlas.md` in that
repository. Its only screenshot is Experience; do not add an Analysis screenshot.

## Release scope

The release contains the finished static application, all 440 processed audio
files and spectrograms, 21 cat-reference images, stored coordinates and rankings,
analysis reproduction code, methods, notices, and validation tooling. Original
dataset archives, development caches, credentials, experimental outputs and
unrelated project files are excluded.

Version 1.0.0 added credits links inside Experience's existing about dialog and
in Analysis's footer. Version 1.0.1 optimizes Experience's rendering and loading;
see [performance notes](PERFORMANCE.md). Audio, spectrograms, coordinates,
rankings, and the interaction design are preserved.

Original application code uses MIT. Dataset-derived assets retain CatMeows
v1.0.2's CC BY-NC 4.0 terms, and photographs retain their individual licenses.
See [Third-party notices](../THIRD_PARTY_NOTICES.md).

## Deployment sequence

1. Recheck the remote MeowAtlas repository and the live personal-site branch for
   changes. Preserve unrelated work; do not force-push.
2. Run `python3 scripts/verify_release.py` and browser checks at a `/MeowAtlas/`
   URL prefix. Review the files to be committed.
3. Commit and push to `main`. The validation workflow runs automatically.
4. Use GitHub Actions as the GitHub Pages source, then explicitly run
   **Publish MeowAtlas to GitHub Pages** on `main`.
   A code push alone does not trigger website deployment.
5. Confirm the deployment result and public URLs, including audio playback,
   Analysis, credits, and mobile layout.
6. Publish personal-site content on its current Astro branch after the demo
   URL works. Confirm its build, project links, and Experience-only screenshot.
7. Tag the release commit and publish the corresponding release notes.

## Checks

- `python3 scripts/verify_release.py`: frozen assets, metadata, file references,
  all recording media, and image credits.
- `node --check site/app.js` and the corresponding Experience, photo, and data scripts.
- `analysis/reproduce.py`: verifies original archive and WAV hashes, reproduces
  adopted features and playback audio, and compares the resulting hashes.
- The personal site uses its existing `npm run check` and `npm run build` commands.

Local preparation results are recorded in [VALIDATION.md](VALIDATION.md).
Remote validation and deployment results are available in GitHub Actions.
