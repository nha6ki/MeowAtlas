# MeowAtlas v1.0.3

Use the available height for the Experience map and further reduce the playback card.

- Extend the drawable map from just below the header to just above the footer.
  At a 390 × 844 viewport, the vertical drawing area increases from about
  250 px to 715 px. Points remain visible and selectable near its upper and lower edges.
- Preserve equal coordinate scales by expanding the visible coordinate range,
  instead of shrinking the plot's drawing area. Saved coordinates are unchanged.
- Preserve the view's center and relative zoom across repeated orientation changes.
- Reduce card photos and spacing and remove the decorative “A VOICE FROM” line.
  Cat ID, profile, recording context, photo, playback, and seek controls remain.
  The checked NIG01 card changes from 340 × 171 px to 300 × 145 px on mobile;
  height varies with profile length. Playback and close buttons retain their touch targets.

Checks cover upper/lower point selection, equal axis scales, repeated rotation,
two-finger zoom, pan, playback, desktop controls, and all 21 profiles. Audio,
images, data, and Analysis match v1.0.2.

Website: https://nha6ki.github.io/MeowAtlas/
