# Pizza Map Lab: working guide

Read this before building or changing anything. It records what has been decided, how the pieces fit together, and what each remaining explainer should do. Each work session builds one explainer, then updates the **Status** and **Changelog** sections at the bottom.

## What this is

A suite of silly, interactive explainers for:

> Stehman, S.V. & Foody, G.M. (2019). Key issues in rigorous accuracy assessment of land cover products. *Remote Sensing of Environment* 231, 111199. https://doi.org/10.1016/j.rse.2019.05.018

A classifier maps the toppings on a pizza, a taster checks a sample, and the reader works out how good the map really is. The audience is people learning remote sensing accuracy assessment who want intuition, not formulas first. The paper PDF is not in the repo (copyright). Attach it in each work session and check every figure against it.

## Decisions already made

- **One static HTML file per explainer**, plus `index.html`. No server, no build tools beyond `src/build.py`, no frameworks. In the spirit of Simon Willison's single-file HTML tools. Vanilla JS, canvas for pizzas and charts. Google Fonts is the only external load, and pages work without it.
- **Paper equations are MathML made at build time.** Write LaTeX in `<tex>` tags in `src/`; `build.py` turns it into MathML with Temml (an npm dev dependency, pinned). Browsers draw MathML natively, so the built pages still load no script or font for it. Show the paper's equation next to the plain-words version, then the same equation filled in with the page's live numbers, and give its number (Eq. 3, Eq. 12…).
- **The paper pizza.** Every explainer uses the same pizza, from `src/kit.js`:
  - A **square sheet pizza**: a 128×128 canvas, 120×120 spots of pizza (14,400) inside a 4-spot crust, cut into an **8×8 grid of 15×15 squares** ("image chips"). Faint knife cuts are drawn on every pizza.
  - Baked so the **true error matrix is exactly Table 5** of the paper (to within 0.01 points). Map shares are 60/25/10/5. Reference shares are 55.4/26.4/10.8/7.4. True overall accuracy is 79.6%.
  - **Classes A–D are cheese, mushroom, pepperoni, anchovy.** B and C were assigned so the paper's biggest confusion for D (mapped as B) is anchovy vs mushroom, which look alike. Always show the paper's letter next to the topping where tables are compared with the paper.
  - Map mistakes sit near topping edges, giving the map the frayed look of a real classifier.
  - **Fixed default seed** `SEED = 20190518`, so the reader sees the same pizza on every page. "Bake a new pizza" picks a random seed and still matches Table 5 exactly.
- **Numbering.** The overall accuracy trap was folded into 01 (its "Never says anchovy" preset), so the list runs 01–10 plus bonus B1.
- **The round pizza is a later bonus (B1)**, about unequal study areas: a round pizza "party cut" into squares, with edge pieces clipped by the crust.
- **Honesty over tidiness.** When a simulation shows something the simple story skips (for example the small-sample lean of weighted producer's accuracy in 02), the page says so in plain words.

## Look and voice

The look is a lab bench of square boxes on a gingham tablecloth, with pixel art, and deliberately not a polished product site.

- **Shapes:** square everything. `border-radius: 0`, 2–3px solid borders, hard offset shadows (`box-shadow: 6px 6px 0 var(--shadow)`). Buttons press in (`translate(3px,3px)`, shadow 0).
- **Type:** `Silkscreen` (pixel display face) for headings, labels, buttons and table headers. `IBM Plex Mono` for body text and numbers. Use `font-variant-numeric: tabular-nums` in tables.
- **Colour tokens:** these live in each page's `:root`, with light and dark values in the three-block pattern (bare `:root`, `prefers-color-scheme: dark` guarded by `:not([data-theme="light"])`, and `[data-theme="dark"]`).
  - Ground: `--bg` (kraft), `--check` (gingham), `--panel`, `--ink`, `--muted`, `--line`, `--shadow`, `--tomato` (accent).
  - Topping colours: `--cheese-a/b`, `--mush-a/b`, `--pep-a/b`, `--anch-a/b`, `--crust-a/b`. These are identical in both themes.
  - Page-specific semantics:
    - 01: commission `--commit` (magenta), omission `--omit` (basil green).
    - 02: raw counts `--raw` (muted brown), weighted `--good` (basil green).
    - Keep omission colours away from anything blue-grey, because that reads as anchovy.
- **Components to reuse** (copy from 01/02): `.box`, `.btn`, `.seg` radio buttons, chunky square range sliders, `.probe` (dashed hover-readout box), `.legend` with `.sw` swatches, pixel `.meter`, error-matrix tables (rows = map, columns = reference, like the paper's Table 3), `.eq` paper-equation cards (`.eq-tag`, `.eq-m` rows, `.eq-cap`, plus the `math{}` rules).
- **Layout:** `.wrap` max ~1120px, side gutter `max(16px, env(safe-area-inset-*))`, grids that stack to one column under ~820px, wide tables in `overflow-x:auto`.
- **Copy:** plain, short, active sentences. The pizza jokes carry the silliness, so the prose doesn't need to. Avoid em-dash asides, "not X, but Y", and stock phrases. Name things the way a reader would. Cite the paper's section, equation or table on every page.
- **Every page opens working:** the paper pizza loaded, a sample drawn, charts filled.

## How the code fits together

The lab lives in the `pizza-map-lab/` folder of the demos repo (`DWGodwin/demo-tools`), next to the other single-file tools. All paths below are relative to that folder.

```
index.html, 01-*.html, ...   built pages (what Cloudflare Pages serves) — don't edit these
src/kit.js                   shared paper pizza kit, pasted into every page
src/*.html                   page sources, each with exactly one /* @@KIT@@ */ marker
src/build.py                 pastes the kit in, turns <tex> into MathML, writes the built pages to the repo root
src/tex.js                   LaTeX -> MathML helper that build.py calls (Temml); not shipped
package.json                 build-only dependency (Temml); run `npm install` once
tests/check.js               checks: scripts parse, equations converted, Table 5 exact, simulated spread ≈ paper SEs
```

Build and check, from `pizza-map-lab/`:

```
npm install            # once, for the LaTeX converter
python3 src/build.py
node tests/check.js
```

### Paper equations

- Inline: `<tex>W_i</tex>`. Full size (fractions and sums drawn large): `<tex display>U_i = p_{ii}/p_{i+}</tex>`. Put each display equation in its own `<div class="eq-m">`, which scrolls sideways if it is too wide.
- **Live numbers:** wrap a number in `\id{q-some-name}{64.0}`. The page sets it with `setEq("q-some-name", value)`. Keep `\%` and other symbols outside the `\id{}` so the id lands on the number itself. The value written in the LaTeX is only a placeholder until the script runs.
- `tests/check.js` fails if any `<tex>` is left over, or if a `setEq("id")` has no matching slot. For loops, `setEq("q-x"+(k+1), …)` needs `q-x1` to `q-x4`.
- Never write a literal `<tex>` inside a comment in `src/`; the build will try to convert it.
- Split a long worked line into two `.eq-m` rows, starting the second with `\phantom{O} = …` so it lines up. Check phone width: a line may scroll inside its box, but the page itself must not.
- Pages number classes 1–4 like the paper's Table 3 (A–D in Table 5), so say which topping a subscript means.

The host does no building. The built pages are committed, so the demos repo's rule still holds: every `.html` is served as-is.

### Kit API (`src/kit.js`)

| Name | What it is |
|---|---|
| `N=128, EDGE=4, CUTS=8, CHIP=15, SEED` | Canvas grid, crust width, squares per side, square size, default seed |
| `NAMES`, `TITLE`, `PAPER_CLASS` | `cheese mushroom pepperoni anchovy`, capitalised titles, `A B C D` |
| `VAR` | CSS token names for each topping's two tones |
| `TABLE5`, `MAP_SHARE` | Table 5 (% of area, rows map, columns reference) and 60/25/10/5 |
| `rng(seed)` | Seeded PRNG (mulberry32) |
| `nb4(i)` | 4-neighbours of pixel index `i` |
| `bakePaperPizza(seed)` | Returns the object below (~60 ms) |
| `hexRGB`, `cssVar`, `pizzaPalette()` | Read topping colours from CSS tokens |
| `paintPizza(canvas, colorAt)` | `colorAt(i)` returns `[r,g,b,alpha]` or `null`. Draws crisp pixels plus knife cuts and returns the 2D context so you can draw overlays |

`bakePaperPizza(seed)` returns:

- `ids`: pizza pixel indices (inside the crust).
- `T`: their count (14,400).
- `inside` and `crust`: masks.
- `piece`: square index 0–63 per pixel, or −1 for crust. Use this for cluster and spatial-strata designs.
- `truth`: the reference topping per pixel.
- `map`: the classifier's label per pixel.
- `cell`: exact pixel counts per matrix cell.
- `rowT` and `colT`: map and reference totals.
- `dist[k]`: 4-neighbour distance to the nearest real topping `k`.
- `jit`: a fixed random number per pixel.
- `tex`: the two-tone texture.

Pixel index is `y*N + x`. Changing the kit changes every page. Rebuild, rerun `tests/check.js` and look at every page afterwards.

## Recipe for a new explainer

1. **Plan it** from the section below and the paper. Decide which paper figures the page must hit, and say them in the page.
2. **Copy `src/02-twenty-five-of-each.html`** as the template: a full document with doctype, charset, viewport, `<title>` and the `claude:viewport-fit-sides` meta. Keep the token block and shared components, keep exactly one `/* @@KIT@@ */` inside the script, and replace the content.
3. **Add the page to `PAGES`** in `src/build.py`.
4. **Turn its card on** in `src/index.html`: change `<div class="card soon">` to `<a class="card" href="NN-name.html">` and the status to `Open`.
5. **Link it.** Give the new page a crumb back to `index.html` and previous/next links in its footer, and update the previous page's "Next" link.
6. **Write a small logic test** that runs the page's estimators in node against known answers (paper figures, or the census truth). Consider adding lasting checks to `tests/check.js`.
7. **Build, check, look.** Run `python3 src/build.py` (after `npm install` once) and `node tests/check.js`, then look at the page in a browser (both themes, phone width).
8. **Hand back.** Update **Status** and **Changelog** below, commit to the explainer's branch and push. Check the Cloudflare preview, then merge to `main` when it's ready.

### Publishing (Cloudflare Pages)

The demos repo deploys to Cloudflare Pages from `main`. Anything on another branch stays off the live site.

**Branch workflow**
- The first launch (01, 02 and the index) is developed on the branch `pizza-map-lab`, then merged into `main`.
- After launch, each new explainer gets a short-lived branch (`lab-03`, `lab-04`, …) that merges when it's done. Until then its card on the index stays "Coming", so the live lab only shows finished pages.

**Previews**
- Cloudflare Pages builds every pushed branch at a preview address of the form `<branch>.<project>.pages.dev`. The exact address is under the project's Deployments tab in the Cloudflare dashboard. Use it to check a page in a real browser before merging.
- Preview addresses are unlisted but public. To make them private, put Cloudflare Access in front of the project's preview deployments.

**Pretty URLs:** Cloudflare Pages serves `/pizza-map-lab/01-anchovy-problem` for `01-anchovy-problem.html` and `/pizza-map-lab/` for `index.html`, and redirects the `.html` forms there. Relative links between pages keep working. The lab index links back to the demos index with `../`.

**Known wrinkle:** `src/` is served too. Those source pages don't work on their own because the kit isn't pasted in yet. This is harmless; nothing links to them.

**After merging a new explainer:**
- add it to the "Tools" list in the demos root `index.html` if it should be listed on its own;
- update the lab's `README.md` page list.

- **Claude artifact (optional):** the lab is also a private multi-page artifact at https://claude.ai/artifact/Cmr34SAhXa45UsD4esESBo.
  - To update it, run `python3 src/build.py --artifact <dir>`.
  - Then publish `<dir>/index.html` to that URL with each explainer passed as a supporting file (`"01-anchovy-problem.html": "<path to built file>"`, and so on). Relative links between pages work there.
  - The artifact's main page must not include the doctype/head/body wrapper; `--artifact` strips it. The supporting pages keep theirs.

## Plans for the remaining explainers

Section numbers refer to the paper. Figures marked *ours* are our own back-of-envelope numbers, not the paper's.

**03 · The Sampling Design Lab** (Sec. 2.1, 2.2, 2.6, Table 2)
- **Designs:** simple random, systematic grid, stratified by map class (equal and proportional allocation), and one-stage cluster (whole squares, using `piece`).
- **Show:** where the bites land, then 1,000 repeats as histograms of overall accuracy, producer's accuracy for D, and the area of D.
- **Key ideas:**
  - A probability sample means every spot has a known, non-zero chance of being picked.
  - "The sample must look like the population" is a myth: equal allocation is fine if you weight.
  - A non-probability "convenience" design (only tasting near the crust, or only clean single-topping spots) biases everything.
- **Estimators:** pair each design with its matching one (poststratified for simple random and systematic).

**04 · How Many Tastes?** (Sec. 2.5, Eq. 1)
- **Eq. 1:** n = z²p(1−p)/d². With p = 0.8 and d = 0.05 at 95%, n = 246; with p = 0.5, n = 384; z = 1.645 gives 90%.
- **Confidence intervals:** simulate their coverage, and show the paper's example of a user deciding between 78–85% and 60–85%.
- **Key ideas:**
  - The absolute sample size matters, not the percentage sampled.
  - Hay's 50 per class.
  - The small-sample lean of weighted producer's accuracy seen in 02 (pepperoni) is a good hook.
- **Finite population:** the D map stratum has about 720 spots, so 246 tastes is about a third of it. Say this.

**05 · Every Square Its Own Pizza** (Sec. 2.4, 2.2, 4.7, Table 2)
- **The dial:** run from "toppings scattered" to "every square its own pizza".
- **Designs:**
  - eat a few whole squares (one-stage cluster);
  - one bite per square (spatially stratified, as in Fattorini et al. and Fichet et al.'s 20×20 km cells);
  - systematic grid, simple random, and two-stage (some squares, a few bites each).
- **What it should show:** standard errors balloon for whole squares and shrink for one bite per square and for systematic sampling.
- **Clumped mistakes:** what really matters is clumped mistakes, not clumped toppings. Consider a camera glare spot where the map is bad.
- **Per-square accuracy:** sets up Sec. 4.7, where the overall matrix hides where the errors are and per-region estimates need big samples.
- **Open question:** should the dial keep Table 5 totals exactly? The default leaning is yes.

**06 · How Much Anchovy Is There?** (Sec. 4.3, Eqs. 5, 19–23)
- **Headline:** the map says D is 5% of the pizza (pixel counting). From the sample, Table 5 estimates 7.4% with SE 1.9, a 95% CI of about ±3.7.
- **Table 5 total-row SEs:** A 4.9, B 4.6, C 2.6, D 1.9.
- **Map bias** is p_k+ − p_+k (Eq. 5). The stratified area estimator is Eq. 19, and its variance is Eq. 20.
- **Key ideas:**
  - The map's job is to shrink standard errors.
  - The "bias-adjusted" estimator (Eq. 22) is not the same as the stratified one.
  - MSE = variance + bias² (Eq. 23).

**07 · The Taster Is Wrong Too** (Sec. 6.1–6.3)
- **Foody (2013):** a binary map with producer's accuracy of 90% and reference data at 95% overestimated area by nearly 6×, and a rarer class by nearly 40×.
- *Ours:* with a reference that is 95% accurate in both classes, about 1% prevalence gives roughly 6× and about 0.13% gives roughly 40×. Verify against Foody (2013) before stating it.
- **On our pizza:** use a binary anchovy-vs-not setup with a rare class of about 1% (144 spots).
- **Also cover:** interpreter disagreement inflating standard errors (McRoberts et al. 2018), and primary/alternate labels.

**08 · Normalizing and Kappa** (Sec. 4.1, 4.8, 7.5, Eq. 24)
- **Normalizing:** forces every row and column total to 1/c and makes user's equal producer's. Use Tables 4 and 5.
- **Kappa:** moves almost in lockstep with overall accuracy (Liu et al. 2007).
- **The 85% benchmark:** from Anderson (1971), and not universal.
- **Section 1.2's example:** about 3–5% change shown as about 50% in a normalized matrix.

**09 · Wrong Amount, Wrong Place** (Eqs. 5–11)
- **Pontius & Millones' split:** quantity disagreement Q, allocation disagreement A, and D = Q + A, plus exchange and shift (Pontius & Santacruz 2014).
- **On our pizza:** compute these for the paper pizza, and let the reader move toppings to change one without the other.

**10 · Tasting the Training Slice** (Sec. 2.7)
- **The point:** splitting training and test data by pixel instead of by cluster inflates accuracy (Friedl et al. 2000, Zhen et al. 2013, Lyons et al. 2018). The squares are the clusters.
- **Needs:** a toy classifier, for example a nearest-neighbour classifier on position and colour, so that leakage is visible.

**B1 · Round Pizza, Square Cuts** (bonus)
- **The setup:** a round pizza cut into a square grid. Edge pieces are clipped by the crust, like image tiles hanging over a study-area boundary.
- **Key ideas:** unequal cluster sizes, and only spots inside the region count.

## Status

| # | Page | Status |
|---|---|---|
| 01 | The Anchovy Problem (`01-anchovy-problem.html`) | Done |
| 02 | Twenty-Five of Each (`02-twenty-five-of-each.html`) | Done |
| — | Paper equations (live MathML) on 01 and 02 | Done |
| 03–10 | See plans above | Not started |
| B1 | Round Pizza, Square Cuts | Later |

## Changelog

- **2026-11-03** Paper equations session (on `pizza-map-lab`, no new explainer).
  - `build.py` now turns `<tex>` LaTeX into MathML with Temml 0.14.0 (`npm install` once). The built pages still need no script or font for the maths.
  - 01: Eqs. 2, 3 and 4 beside the plain-words formulas, filled in with the map's pixel counts. They follow the topping picker, sliders and presets.
  - 02: new "Step 3: the paper's formulas" box with Eqs. 12–15 filled in with the current sample. Clicking a cell in either matrix picks the cell (Eq. 12), row (Eq. 14) and column (Eq. 15). Eq. 14 shows the weight cancelling; Eqs. 13 and 15 show the raw-count answer for contrast.
  - Checked every equation's notation against the paper (pp. 10–11). `tests/check.js` now checks the equations were converted and every live number has a slot.
- **2026-11-03** First session.
  - Built 01 and 02 and the index.
  - Moved to the paper pizza (exact Table 5, 128×128), then to the square sheet pizza (8×8 squares).
  - 02's 300-sample spread matches Table 5's standard errors: about 5 vs 5.1 for overall accuracy, about 11–13 vs 11.1 for producer's D.
  - Added the shared kit, the build script and the checks.
  - Moved into the demos repo (`DWGodwin/demo-tools`) as `pizza-map-lab/`, developed on branch `pizza-map-lab` until launch. Deploys with Cloudflare Pages from `main`.
