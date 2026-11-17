# Experience touch checks

The Experience map handles touch input within its map surface. It derives zoom
from the distance between two fingers and keeps their midpoint anchored in the
map. A single finger pans; a tap selects the nearest visible point within the
hit radius. Dragging, pinching, and cancellation do not select a new recording.

During a gesture, one SVG transform provides visual feedback. The saved point
coordinates never change. On release, the transform is converted to axis ranges
with one Plotly relayout. Resize, cancellation, or an explicit control action
clears a pending gesture.

The drawing area occupies the available height between the header and footer.
The visible coordinate ranges adapt to the viewport aspect ratio, with equal
pixel scales on both axes. Resizing retains the view center and zoom relative
to the fitted map, avoiding cumulative zoom-out on repeated rotations.

## Optional browser regression check

With Playwright available to Node.js and its Chromium browser installed, serve
the static site and run:

```sh
python3 -m http.server 8767 --bind 127.0.0.1 --directory site
# In another terminal:
node scripts/check_touch.cjs
```

`MEOW_TEST_URL` overrides the URL, `CHROME_EXECUTABLE` selects a local Chrome
binary, and `MEOW_TEST_OUTPUT_DIR` changes the report directory (default:
`work/touch-check`). `PLAYWRIGHT_MODULE` can point to an existing Playwright installation.

The check validates horizontal, vertical, and diagonal zoom in both directions;
the midpoint anchor; unchanged page scale; a single viewport update per gesture;
pan/pinch transitions; cancellation; playback; responsive controls; fixed
coordinates; and the recording handoff to Analysis. It uses touch emulation,
so testing on physical mobile browsers remains useful.

The check also requires a full-height drawing area, equal axis scales, tappable
points near the upper/lower edges, and an unchanged view after repeated rotations.
