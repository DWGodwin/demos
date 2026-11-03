# Tools

Single-file HTML tools. No build step: every `.html` file here is served as-is.

| Tool | |
|---|---|
| [Geotransform Playground](geotransform.html) | GDAL geotransform, affine and projective matrices, in degrees, Web Mercator or UTM metres |
| [Pizza Map Lab](pizza-map-lab/) | Land cover accuracy assessment explained with a pixel pizza, after Stehman & Foody (2019) |

To add a tool, commit one self-contained `name.html` and add a line to `index.html`.

A multi-page project can live in its own folder with an `index.html`, like `pizza-map-lab/`. If it has a local build step, commit the built pages so the host still serves everything as-is. See that folder's README.
