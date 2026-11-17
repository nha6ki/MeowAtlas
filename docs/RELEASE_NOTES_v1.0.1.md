# MeowAtlas v1.0.1

Improve Experience performance on mobile while preserving the interface and fixed map.

- Combine point-halo blur into one layer to reduce work during map movement.
- Use the same-version Plotly basic bundle for Experience.
- Load a smaller Experience data file without Analysis-only comparison rankings.
- Reuse fixed point arrays and consolidate resize updates.

Recordings, coordinates, colors, controls, and Analysis are preserved.
Synthetic mobile-browser checks show lower pan frame gaps and about 79% less
uncompressed JavaScript loaded by Experience. Actual device performance varies;
see [performance notes](https://github.com/nha6ki/MeowAtlas/blob/main/docs/PERFORMANCE.md).

Website: https://nha6ki.github.io/MeowAtlas/
