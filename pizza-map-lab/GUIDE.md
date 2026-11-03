# Pizza Map Lab: working guide

Read this before building or changing anything. It records what has been decided, how the pieces fit together, and what each remaining explainer should do. Each work session builds one explainer, then updates the **Status** and **Changelog** sections at the bottom.

## What this is

A suite of silly, interactive explainers for:

> Stehman, S.V. & Foody, G.M. (2019). Key issues in rigorous accuracy assessment of land cover products. *Remote Sensing of Environment* 231, 111199. https://doi.org/10.1016/j.rse.2019.05.018

A classifier maps the toppings on a pizza, a taster checks a sample, and the reader works out how good the map really is. The audience is people learning remote sensing accuracy assessment who want intuition, not formulas first.

The papers live in `reference/`, which is gitignored (copyright), so they exist only on the working machine. Check every figure on a page against them:

- Stehman & Foody (2019), the main paper.
- Foody, G.M. (2013). Ground reference data error and the mis-estimation of the area of land cover change as a function of its abundance. *Remote Sensing Letters* 4, 783–792. Used by 07.
- Pontius Jr., R.G. & Santacruz, A. (2014). Quantity, exchange, and shift components of difference in a square contingency table. *Int. J. Remote Sens.* 35, 7543–7554. Used by 09.

`pdftotext` (no `-layout`) gives the papers in reading order; the two-column layout scrambles otherwise.

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

1. **Plan it** from the section below and the paper. Decide which paper figures the page must hit, and say them in the page. Cite the passages in the plan's **Based on** list, and reread them in the PDF before writing.
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

## Before 03: shared groundwork

Do this in the 03 session, on `lab-03`.

1. **Finish the launch.** Merge `pizza-map-lab` into `main`, then branch `lab-03` from `main`.
2. **Add shared estimators to `src/kit.js`.** Pages 03–06 need the same maths, and 02 currently keeps its own inline `estimate()`. Add:
   - samplers: simple random, systematic grid (random start), stratified with any allocation, and cluster;
   - the stratified and poststratified estimator, Eqs. 12–20, with standard errors (Eqs. 16–18 and 20, using n − 1);
   - a one-stage cluster estimator;
   - a shared "1,000 repeats" histogram, generalised from 02's `drawHist`.
3. **Add a lasting check** to `tests/check.js`: Table 4 in must give every Table 5 number out. Verified once by hand: overall 79.6 (SE 5.1), user's SEs 7.5/9.2/8.2/9.8, producer's 91.0/68.2/74.1/43.2 with SEs 3.2/10.8/16.7/11.1, area SEs 4.9/4.6/2.6/1.9, all exact.
4. Optionally move 02 onto the shared estimator. Its checks must still pass.

Later kit additions, each made in the session that needs it: a clumpiness option for the bake (05), a two-class pizza (07), a noisy photo layer and a toy classifier (10), and a round mask (B1). Each must leave today's paper pizza unchanged, and `tests/check.js` should prove it.

## Plans for the remaining explainers

Section and equation numbers refer to Stehman & Foody (2019) unless another paper is named. Figures marked *ours* are our own numbers, computed from the paper's equations but not printed in it. Build in number order; if 05 stalls, 06 can go first because it needs nothing new in the kit.

Each plan opens with **Based on**: the parts of the papers it draws from, with page numbers. Use that list for the page's citations and its "check against the paper" box. Page numbers are the journals' own. Stehman & Foody's PDF pages match them; the Foody and Pontius & Santacruz PDFs start with a cover page, so their PDF page numbers run ahead.

**03 · The Sampling Design Lab** (Sec. 2.1, 2.2, 2.6, 4.2, Table 2)
- **Based on:**
  - Sec. 2, opening (p. 4): the four basic designs; probability sampling is the one criterion a design must meet.
  - Sec. 2.1 (p. 4): inclusion probabilities π known and above zero; convenience and "homogeneous spot" picking as the common failures; the "sample must represent the population" myth; which designs have equal inclusion probabilities.
  - Sec. 2.2 (p. 5): the seven design criteria; "stratify for objectives, cluster for costs"; a cluster is worth only a few unclustered points.
  - Sec. 2.5, allocation paragraph (p. 7): proportional allocation gains little over poststratifying a simple random sample.
  - Sec. 2.6 and Table 2 (pp. 7–8): designs used in real assessments.
  - Sec. 4.2 (pp. 11–12): weights of 1/π, consistent estimation, poststratification, Eqs. 12–18, the systematic variance overestimate, and cluster designs needing their own variance formulas.
  - Sec. 1.2, criterion 2 (p. 3): what "statistically rigorous" requires.
- **Designs:** simple random, systematic grid, stratified by map class (equal and proportional allocation), one-stage cluster, and a convenience design.
- **Cluster size:** a whole square is 225 tastes, far more than a 100-taste budget. Use small blocks of spots here and save whole squares for 05.
- **Systematic grid:** offer grid-friendly sample sizes only (100, 144, 225, 400 on the 120×120 study area).
- **Convenience design:** taste only clean spots far from any topping edge. The map is almost always right there, so overall accuracy comes out too high. Those edge spots have zero chance of being picked, which breaks the probability-sample rule.
- **Show:** where the bites land, then 1,000 repeats as histograms of overall accuracy, producer's accuracy for D, and the area of D. Each probability design should centre on 79.6, 43.2 and 7.4.
- **Key ideas:**
  - A probability sample means every spot has a known, non-zero chance of being picked (Sec. 2.1).
  - "The sample must look like the population" is a myth: equal allocation is fine if you weight (Sec. 2.1).
  - "Stratify for objectives, cluster for costs" (Sec. 2.2).
- **Estimators:** pair each design with its matching one, poststratified for simple random and systematic (Sec. 4.2).
- **Honesty notes:**
  - A simple random sample of 100 sometimes has no map-anchovy tastes at all. Say so instead of hiding it.
  - The simple-random variance formula usually overstates systematic sampling's error (Sec. 4.2). The simulation shows this, so point it out.
- **Test:** every probability design is unbiased over many repeats; the convenience design is not.

**04 · How Many Tastes?** (Sec. 2.5, Eq. 1)
- **Based on:**
  - Sec. 2.5 (pp. 6–7): Eq. 1, the 246 and 384 examples, choosing p and d, the 78–85% vs 60–85% user example, the allocation options, and "absolute size, not percent sampled".
  - Sec. 4.2, Eqs. 16–17 (p. 11): the standard errors the intervals are built from.
  - Sec. 4.4 and Table 5 (pp. 13–14): a 95% interval as estimate ± 1.96 SE, and the 69.5–89.7% overall accuracy interval.
  - Sec. 1.1 (p. 3): Hay (1979) and the minimum of 50 per class.
  - Sec. 1.2, criterion 4 (p. 3): reliability shown by small standard errors.
- **Eq. 1:** n = z²p(1−p)/d². With p = 0.8 and d = 0.05 at 95%, n = 246; with p = 0.5, n = 384 (both in the paper). z = 1.645 gives 90%.
- **Confidence intervals:** simulate how often a 95% interval contains the truth, and show where that drops at small samples. Show the paper's example of a user deciding between 78–85% and 60–85%.
- **Key ideas:**
  - The absolute sample size matters, not the percentage sampled.
  - Hay's 50 per class.
  - The small-sample lean of weighted producer's accuracy seen in 02 (pepperoni) is a good hook.
- **Finite population:** the D map stratum has 720 spots, so 246 tastes is about a third of it. The paper's formulas have no correction for that, so the simulated spread comes out about 19% below the formula (√(1 − 246/720) ≈ 0.81). Show the gap and explain it.
- **Test:** coverage is close to 95% at large samples.

**05 · Every Square Its Own Pizza** (Sec. 2.4, 2.2, 4.7, Table 2)
- **Based on:**
  - Sec. 2.4 (p. 6): spatial correlation changes precision, never bias; it raises cluster standard errors and lowers systematic ones; one unit per spatial stratum (Fattorini et al. 2015, Fichet et al. 2014); ad hoc spacing rules break probability sampling.
  - Sec. 2.2 (p. 5): design criteria 6 (an unbiased variance estimator) and 7 (spread over the study area); correlation within clusters.
  - Table 2 (p. 8): the Fichet et al. row, with 20 × 20 km strata and one sampled unit in each.
  - Sec. 4.2, cluster paragraph (p. 12): one-stage and two-stage formulas, and variances that come out too small if clustering is ignored.
  - Sec. 4.7 (p. 15): the error matrix says nothing about where errors are, and estimates for parts of the map need large samples.
- **Kit change:** add a clumpiness option to the bake, with two dials, "clumped toppings" and "clumped mistakes". The paper's point is about the second; consider a camera glare spot where the map is bad. Keep Table 5 totals exact at every setting. With both dials at 0, the bake must give today's pizza pixel for pixel.
- **Designs:**
  - eat a few whole squares (one-stage cluster);
  - one bite per square (spatially stratified, as in Fattorini et al. 2015 and Fichet et al. 2014's 20×20 km cells);
  - systematic grid, simple random, and two-stage (some squares, a few bites each).
- **What it should show:** standard errors balloon for whole squares and shrink for one bite per square and for systematic sampling.
- **Honesty note:** with one bite per square there is no unbiased variance estimator, which is design criterion 6 in Sec. 2.2. Show the simulated spread and say so.
- **Per-square accuracy:** sets up Sec. 4.7, where the overall matrix hides where the errors are and per-region estimates need big samples.
- **Test:** Table 5 is exact at every dial setting; the dials at 0 reproduce today's pizza; the cluster design's spread grows with clumping.

**06 · How Much Anchovy Is There?** (Sec. 4.3, Eqs. 5, 19–23)
- **Based on:**
  - Sec. 4.1 (pp. 10–11): Eq. 5, map bias, also called non-site-specific accuracy, as the bias of pixel counting.
  - Sec. 4.3 (p. 12): area should come from the reference sample (Olofsson et al. 2014); Eqs. 19–20.
  - Sec. 4.3.1 (pp. 12–13): the map's role is to shrink standard errors; Eq. 21 (mapped area − commission + omission); Eq. 22 and why "bias-adjusted" is a misleading name; Eq. 22 equals Eq. 19 only under stratified random sampling.
  - Sec. 4.3.2 (p. 13): Eq. 23, MSE = variance + bias², for pixel counting vs the sample estimate.
  - Sec. 4.4 and Table 5 (pp. 13–14): the 7.4% (SE 1.9) estimate and reporting area with standard errors.
- **Headline:** the map says D is 5% of the pizza (pixel counting). From the sample, Table 5 estimates 7.4% with SE 1.9, a 95% CI of about ±3.7.
- **Eq. 21 as a picture:** 5.0 mapped, minus 1.8 of mistakes in the map's anchovy, plus 4.2 of anchovy the map missed, gives 7.4.
- **Table 5 total-row SEs:** A 4.9, B 4.6, C 2.6, D 1.9.
- **Map bias** is p_k+ − p_+k (Eq. 5): −2.4 points for D. The stratified area estimator is Eq. 19, and its variance is Eq. 20.
- **Key ideas:**
  - The map's job is to shrink standard errors (Sec. 4.3.1).
  - The "bias-adjusted" estimator (Eq. 22) equals the stratified one (Eq. 19) only under stratified random sampling. Use a simple random sample to show the gap, and that Eq. 19 has the smaller spread.
  - MSE = variance + bias² (Eq. 23). Pixel counting's error is its 2.4-point bias; the sample's is its 1.9 SE at 25 per class. A sample-size slider lets the reader find where pixel counting wins.
- **Test:** Eq. 22 matches Eq. 19 exactly under stratified sampling.

**07 · The Taster Is Wrong Too** (Sec. 6.1–6.3; Foody 2013)
- **Based on, Stehman & Foody:**
  - Sec. 6, opening (p. 16): the three kinds of imperfect reference data.
  - Sec. 6.1 (pp. 16–17): Foody (2013)'s "nearly 6" and "nearly 40" overestimates, and reference error making accuracy depend on prevalence.
  - Sec. 6.2 (p. 17): primary and alternate labels, and the fuzzy MAX and RIGHT operators.
  - Sec. 6.3 (p. 17): interpreter disagreement inflates the standard errors of area estimates (McRoberts et al. 2018).
  - Sec. 4.3.2 (p. 13): reference error is the only source of bias in the sample-based area estimate.
  - Sec. 5 (pp. 15–16): design-based inference assumes the reference labels are correct.
- **Based on, Foody (2013):**
  - Sec. 2 (pp. 785–787): Eqs. 1–4, the apparent accuracies and apparent area, and Scenarios I–III.
  - Sec. 3 (pp. 787–791): the 5.9×, 20.6× and 40.6× results; the Scenario III matrix in Fig. 1 (p. 784); the better-taster variants, including the 1.89% typo (p. 791).
- **Foody's Eq. 4:** apparent area = E(Pt + Po − 1) − Po + 1, where E is the true share and Pt and Po are the taster's accuracy on the target class and on the rest. The map's accuracy does not appear. That is the page's hook: a perfect map still gets the area wrong if the taster is wrong.
- **Figures to hit (all reproduce from Foody's Eq. 4):**
  - Scenario I (taster 95/95, map 90/90) at 1%: apparent area 5.9%, so 5.9× too big. This is the paper's "nearly a factor of 6".
  - Scenario II (taster 80/80, map 70/70) at 0.5%: apparent area 20.3%, 40.6× too big. This is the paper's "nearly 40"; it is a different scenario from the 6× one. At 1% it is 20.6×.
  - Scenario III (taster 80/90, map 70/80) at 1%: apparent area 10.7%, with the full matrix in Foody's Fig. 1.
  - Scenario III with a better taster (85/95): 5.8%.
- **Foody typo:** Foody's text says a 99/99 taster gives 1.89%, but his Eq. 4 gives 1.98%, which also fits his "close to double". Use 1.98% or leave it out.
- **On our pizza:** this page breaks the "same pizza on every page" rule. On the paper pizza, anchovy is 7.4%, and a 95% taster only inflates it 1.6× (*ours*), too small to make the point. Add a two-class anchovy-or-not pizza with a prevalence slider: 1% is 144 spots, 0.5% is 72.
- **Also cover:** interpreter disagreement inflating standard errors (McRoberts et al. 2018), and primary/alternate labels (Sec. 6.2).
- **Test:** the simulated apparent areas match Eq. 4.

**08 · Normalizing and Kappa** (Sec. 4.1, 4.8, 7.5, Eq. 24)
- **Based on:**
  - Sec. 1.2, criterion 1 (pp. 3–4): the "map relevant" rule, and the binary change map with 3–5% change shown as about 50%.
  - Sec. 4.1 (p. 10): normalizing forces every total to 1/c and makes user's equal producer's (Congalton et al. 1983; Stehman 2004).
  - Sec. 4.8 (p. 15): Eq. 24; chance agreement as a model construct; kappa's close tie to overall accuracy (Liu et al. 2007); kappa as the appendix of accuracy assessment.
  - Sec. 7.5 (p. 19): the three bad practices, which are the 85% target, normalizing, and chance correction.
  - Sec. 1.1 (p. 3): where the 85% benchmark came from (Anderson 1971).
  - Tables 4 and 5 (pp. 13–14): the matrices to normalize.
- **Normalizing:** forces every row and column total to 1/c and makes user's equal producer's (Sec. 4.1). Build it by repeatedly rescaling rows and columns. Use Tables 4 and 5.
- **Kappa:** moves almost in lockstep with overall accuracy (Liu et al. 2007). Kappa for Table 5 is 0.653 (*ours*, from Eq. 24). Show a scatter of kappa against overall accuracy over many baked pizzas.
- **The 85% benchmark:** from Anderson (1971), and not universal (Sec. 7.5).
- **Section 1.2's example:** about 3–5% change shown as about 50% in a normalized matrix.
- **Test:** a normalized matrix has user's equal to producer's for every class.

**09 · Wrong Amount, Wrong Place** (Eqs. 5–11; Pontius & Santacruz 2014)
- **Based on, Stehman & Foody:**
  - Sec. 4.1 (pp. 10–11): Eqs. 5–11 (map bias, quantity q and Q, allocation a and A, D = Q + A), and the paragraph introducing exchange and shift.
- **Based on, Pontius & Santacruz (2014):**
  - Sec. 2.1 and Fig. 1 (pp. 7544–7546): seven six-pixel examples of quantity, exchange and shift. A good model for the page's own small examples.
  - Sec. 2.2 (pp. 7546–7548): Eqs. 1–9, and the note that for error assessment the time terms drop out.
  - Sec. 4 and Table 4 (pp. 7550–7553): the coniferous–deciduous exchange and the 6.49% that merging would erase; what each component suggests about a classifier's problems.
- **Pontius & Millones' split:** quantity disagreement Q, allocation disagreement A, and D = Q + A (Eqs. 6–11).
- **Pontius & Santacruz's split** of allocation into exchange and shift (their Eqs. 1–9). Their table has rows for the map and columns for the reference, like ours.
  - Exchange for a pair of toppings is twice the smaller of the two mirror-image error cells.
  - Shift is what remains: d − q − exchange.
- **Table 5 numbers** (*ours*, from those equations):
  - Total disagreement 20.4 = quantity 4.6 + exchange 9.6 + shift 6.2. Exchange plus shift is 15.8, matching A.
  - Cheese–mushroom swaps make 8.0 of the 9.6 exchange. This mirrors the paper's coniferous–deciduous example, where merging two forest classes erases 6.49% error. On our pizza, merging cheese and mushroom erases 8 points.
  - Anchovy alone: quantity 2.4, exchange 1.6, shift 2.0.
- **On our pizza:** let the reader edit the map so one part changes without the others, for example swapping pairs of mistakes (exchange) versus growing the map's anchovy (quantity).
- **Test:** Q + exchange + shift = D for any matrix.

**10 · Tasting the Training Slice** (Sec. 2.7)
- **Based on:**
  - Sec. 2.7 (pp. 7–8): training and validation must be independent (Hammond and Verbyla 1996); a separate probability sample achieves that; building strata from the map does not break independence; with cluster sampling, assign whole clusters to training or testing; splitting pixels inflates accuracy (Friedl et al. 2000, Zhen et al. 2013, Lyons et al. 2018).
- **The point:** splitting training and test data by pixel instead of by cluster inflates accuracy (Friedl et al. 2000, Zhen et al. 2013, Lyons et al. 2018). The squares are the clusters.
- **Kit change:** a noisy "photo" layer (topping colour plus noise, maybe glare) and a nearest-neighbour classifier on position and colour, so leakage is visible. This page makes its own map, not the Table 5 one.
- **Test:** splitting by spot scores higher than splitting by square.

**B1 · Round Pizza, Square Cuts** (bonus)
- **Based on:** the paper doesn't treat unequal cluster sizes directly, so the page should say it goes beyond the paper. The nearest passages are:
  - Sec. 2.1 (p. 4): every pixel in the region of interest must have a chance above zero, and only those pixels.
  - Sec. 2.2 (p. 5): document the primary and secondary sampling units.
  - Sec. 4.2, cluster paragraph (p. 12): pointers to the cluster formulas (Stehman 1997b and others).
  - Sec. 1.2, criterion 1 (p. 3): estimates must be faithful to the region the map covers.
- **The setup:** a round pizza cut into a square grid. Edge pieces are clipped by the crust, like image tiles hanging over a study-area boundary.
- **Key ideas:** unequal cluster sizes, and only spots inside the region count.
- **Kit change:** a round mask, and a ratio estimator for clusters of unequal size.

## Status

| # | Page | Status |
|---|---|---|
| 01 | The Anchovy Problem (`01-anchovy-problem.html`) | Done |
| 02 | Twenty-Five of Each (`02-twenty-five-of-each.html`) | Done |
| — | Paper equations (live MathML) on 01 and 02 | Done |
| 03–10 | See plans above (checked against the papers) | Not started |
| B1 | Round Pizza, Square Cuts | Later |

## Changelog

- **2026-11-03** Planning session (no pages built).
  - Checked the plans for 03–10 against the papers in `reference/`, now including Foody (2013) and Pontius & Santacruz (2014).
  - Confirmed that Eqs. 16–18 and 20 on Table 4 reproduce every Table 5 standard error exactly.
  - Added "Before 03: shared groundwork" (shared estimators in the kit, launch merge) and filled each plan with checked figures and a test.
  - Fixed 07: the paper's "nearly 40" is Foody's Scenario II (80% taster, 0.5% share), not the 95% taster of the "nearly 6" case.
  - Added exchange and shift figures to 09.
  - Settled the 05 open question: keep Table 5 exact, with separate dials for clumped toppings and clumped mistakes.
  - Gave every plan a **Based on** list of the passages it draws from, with page numbers.
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
