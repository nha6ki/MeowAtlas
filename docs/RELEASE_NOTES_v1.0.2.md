# MeowAtlas v1.0.2

Add explicit two-finger map zoom and a smaller playback card in Experience.

- Spread or pinch two fingers horizontally, vertically, or diagonally to zoom
  the map around their midpoint. One-finger dragging pans the map.
- Keep page scale fixed during map gestures; gestures outside the map retain
  the browser's normal behavior.
- Update a lightweight visual transform during movement and commit the viewport
  once on release. Moving or pinching does not start another recording.
- Reduce the playback card's photo size and spacing while retaining its content
  and playback controls. At a 390 px viewport, the checked card changes from
  356 × 195 px to 340 × 171 px. Actual height depends on the cat profile.

Recordings, saved coordinates, colors, and Analysis are unchanged. Desktop
clicking, dragging, wheel zoom, and the zoom buttons remain available.

Browser checks cover seven pinch gestures, anchor preservation, transitions
between one and two fingers, cancellation, tap playback, 320–1440 px layouts,
all 21 cat profiles, and the selected-recording handoff to Analysis. These checks
use desktop Chrome with touch emulation; they do not replace physical-device testing.

Website: https://nha6ki.github.io/MeowAtlas/
