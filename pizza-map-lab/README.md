# Pizza Map Lab

Silly, interactive explainers for Stehman & Foody (2019), *Key issues in rigorous accuracy assessment of land cover products* (Remote Sensing of Environment 231, 111199). A classifier maps the toppings on a sheet pizza, a taster checks a sample, and you work out how good the map really is. The pizza is baked so its map's mistakes match the paper's own worked example (Table 5) exactly.

Each explainer is a single static HTML file. This folder lives in the demos repo and deploys with it to Cloudflare Pages. Locally, just open `index.html`.

- `01-anchovy-problem.html`: user's vs producer's accuracy, and why overall accuracy can't see a rare topping
- `02-twenty-five-of-each.html`: equal-allocation stratified samples, and why the counts must be weighted by area

## Working on it

The built pages in this folder are generated. Edit the sources in `src/`, then:

```
python3 src/build.py     # paste the shared pizza kit into each page
node tests/check.js      # scripts parse, pizza matches Table 5, spreads match the paper's SEs
```

See `GUIDE.md` for the decisions, style, kit API and plans for the remaining explainers.
