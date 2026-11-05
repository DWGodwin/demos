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
  - The tablecloth (`--bg`, `--check`) stays light kraft and red gingham in both themes; only the cards go dark. Text sitting straight on the cloth (the index's stage headings, the footer) keeps dark ink through `--cloth-ink`, `--cloth-muted` and `--cloth-accent`, which a rule near `footer` swaps in for `--ink`, `--muted` and `--tomato`. Cards cast a dark brown `--cloth-shadow` in both themes; buttons inside cards keep `--shadow` (the author's decision, 2026-11-05).
  - Topping colours: `--cheese-a/b`, `--mush-a/b`, `--pep-a/b`, `--anch-a/b`, `--crust-a/b`. These are identical in both themes.
  - Page-specific semantics:
    - 01: commission `--commit` (magenta), omission `--omit` (basil green).
    - 02: raw counts `--raw` (muted brown), weighted `--good` (basil green).
    - Keep omission colours away from anything blue-grey, because that reads as anchovy.
- **Masthead:** a card (`<header class="box mast">`) with the crumb, eyebrow and title, then `.mast-body`: the intro paragraphs in `.intro` beside an "On this page" `.toc` list. The list links to every top-level card that has an `h2`, by id: `step-N` for steps, `check`, `notes`, `formulas`, or a short name. Add a new card's link when you add the card. Step headings read `Step N · Title`.
- **Components to reuse** (copy from 01/02): `.box`, `.btn`, `.seg` radio buttons, chunky square range sliders, `.probe` (dashed hover-readout box), `.legend` with `.sw` swatches, pixel `.meter`, error-matrix tables (rows = map, columns = reference, like the paper's Table 3), `.eq` paper-equation cards (`.eq-tag`, `.eq-m` rows, `.eq-cap`, plus the `math{}` rules).
- **Layout:** `.wrap` max ~1120px, side gutter `max(16px, env(safe-area-inset-*))`, grids that stack to one column under ~820px, wide tables in `overflow-x:auto`.
  - Cards stack one per row at full width. Don't put two cards side by side: a table squeezed into half a card grows tall and narrow (the author's decision, 2026-11-05). Inside a card, a short side-by-side pair (two small matrices to compare, controls beside a pizza) is fine.
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

At the demos repo root, shared by every project in the repo:

```
.githooks/                   git hooks that commit each Claude Code session's transcript with its commits
.githooks/transcript.py      writes a session's conversation to transcripts/
transcripts/                 one Markdown transcript per Claude Code session, named <date>-<session id>.md
```

Build and check, from `pizza-map-lab/`:

```
npm install            # once, for the LaTeX converter
python3 src/build.py
node tests/check.js
```

### Session transcripts

Every commit made from a Claude Code session carries that session's transcript. This is set up for the whole demos repo, not just this project.

- **Turn the hooks on once per clone**, from the demos repo root: `git config core.hooksPath .githooks`.
- **What happens:** when a commit runs inside Claude Code (which sets `CLAUDE_CODE_SESSION_ID`), `pre-commit` runs `.githooks/transcript.py` and stages the transcript. `commit-msg` then adds a `Transcript: transcripts/<file>.md` trailer. Commits made in your own terminal are untouched.
- **What's kept:** only the user's messages and Claude's replies. Tool calls and their output are dropped, because for this lab they include text from the paywalled papers.
- **Later commits rewrite the file.** It is one file per session, so later commits in the same session update it. Talk after the last commit isn't saved. To keep it, run `python3 .githooks/transcript.py <session id>` and commit the result.
- **It's public.** `transcripts/` deploys to the live site along with the rest of the repo.
- **Don't add `Claude-Session:` trailers by hand.** For cloud or Remote Control sessions, consider turning off Claude Code's `attribution.sessionUrl` setting, so commits link only to the repo transcript.
- **If a commit fails with "could not save the session transcript"**, Claude Code's transcript format has probably changed. Fix `.githooks/transcript.py` rather than skipping the hook.

### Paper equations

- Inline: `<tex>W_i</tex>`. Full size (fractions and sums drawn large): `<tex display>U_i = p_{ii}/p_{i+}</tex>`. Put each display equation in its own `<div class="eq-m">`, which scrolls sideways if it is too wide.
- **Live numbers:** wrap a number in `\id{q-some-name}{64.0}`. The page sets it with `setEq("q-some-name", value)`. Keep `\%` and other symbols outside the `\id{}` so the id lands on the number itself. The value written in the LaTeX is only a placeholder until the script runs.
- `tests/check.js` fails if any `<tex>` is left over, or if a `setEq("id")` has no matching slot. For loops, `setEq("q-x"+(k+1), …)` needs `q-x1` to `q-x4`.
- Never write a literal `<tex>` inside a comment in `src/`; the build will try to convert it.
- Keep `\id{}` placeholders unsigned, such as `\id{q-x}{2.4}`. A placeholder like `{-2.4}` becomes an `<mrow>`, and text set on an mrow doesn't show. `setEq` can still write "−2.4" into the slot. `tests/check.js` catches this.
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
| `bakePaperPizza(seed, opt?)` | Returns the object below (~20–60 ms). Optional `opt.clumpTop` and `opt.clumpErr` (0–1) are 05's dials: toppings pile around hot spots (two for mushroom, two for pepperoni, one for anchovy), and mistakes gather under a glare spot. Table 5 stays exact at every setting; at 0 the pizza is the same spot for spot (checked by fingerprint in `tests/check.js`) |
| `hexRGB`, `cssVar`, `pizzaPalette()` | Read topping colours from CSS tokens |
| `paintPizza(canvas, colorAt)` | `colorAt(i)` returns `[r,g,b,alpha]` or `null`. Draws crisp pixels plus knife cuts and returns the 2D context so you can draw overlays |
| `SIDE`, `mapStrata(P)` | Study-area side (120); pixel lists for each map class (the strata) |
| `pickFrom(list, n, r)`, `allocate(n, shares)` | `n` distinct picks, all equally likely; split `n` by shares so the parts add to `n` |
| `sampleSRS(P,n,r)`, `sampleSystematic(P,n,r)`, `sampleStratified(strata,alloc,r)`, `sampleClusters(m,b,r)` | Samplers. Systematic needs a square `n` whose root divides 120 (64, 100, 144, 225, 400, 576…; random start). Clusters tile the study area with `b`×`b` blocks and return one pixel list per block; `b = 15` gives whole squares |
| `SQUARE_SPOTS`, `sampleBySquare(b,r)`, `sampleTwoStage(m,k,r)` | The spots of each of the 64 squares; `b` random bites in every square (spatial strata, one list per square); `m` random squares with `k` bites each (two-stage, one list per square) |
| `edgePieceSpots(P)` | Pixels in the outer ring of squares (the 28 pieces with crust); 03's convenience taster picks only from these |
| `countMatrix(P, ids)` | Sample counts, rows map, columns reference |
| `stratEstimate(c, W, Nh?)` | Eqs. 12–20 with SEs, as proportions. `n_i+ − 1` in every variance. `ok` is false if a row has no tastes. Optional `Nh` (spots per stratum) applies the finite population correction `1 − n_i+/N_i+` to each stratum's term; the paper leaves it out, and only 04 uses it |
| `clusterEstimate(P, groups)` | One-stage cluster estimator for equal-size blocks (block means, ratio estimators, SEs from the spread between blocks). Also the usual estimator for two-stage samples with equal bites per square |
| `strataEstimate(P, groups)` | Plain-share estimator for equal-size strata with equal bites in each (05's squares as strata), SEs from the spread within each stratum. One group gives the simple random estimator. For overall accuracy it is Eq. 16 with `W_h = 1/H`. NaN SEs with one bite per stratum |
| `drawRepeats(canvas, rows, truth, opt)` | The shared repeats histogram: one row per method on a fixed 0–100% axis, dashed truth line, triangle at each average |
| `bakeAnchovyPizza(seed, E, mapPt, mapPo)` | 07's anchovy-or-not pizza, 4–37 ms. `truth` and `map` are 1 for anchovy, 0 for the rest. Real anchovy is exactly round(E·T) spots. The map calls exactly round(mapPt·nA) of them anchovy, with its misses at fillet edges, and exactly round((1 − mapPo)·nO) other spots, nearest the fillets. Returns `{inside, crust, piece, ids, T, truth, map, jit, tex, nA, nO, E, cell}`; `cell` is rows = map [rest, anchovy], columns = real |
| `tasterSays(P, pt, po, seed)` | The taster's fixed verdict at every spot (1 = says anchovy), exact within each (real, map) group, so the taster's slips are independent of the map's, as Foody's equations assume |
| `foody(E, rt, ro, ct, co)` | Foody (2013) Eqs. 1–8: `{EA, Pt, Po, Ut, O, cells:{a,b,c,d}, truth:{Pt, Po, Ut, O}}` for the map checked against the taster |
| `PHOTO_BASE` | 10's base photo colour per topping (3 bands, 0–1); mushroom and anchovy are close |
| `bakePhoto(P, seed, {grain, blotch})` | 10's noisy photo of pizza `P`: base colour, blotches shared by neighbours at 16- and 4-spot scales (`blotch` 0–1, default .5), shine at `P.glare`, and per-spot grain (`grain` 0–1, default .5). Returns `{band: Float32Array(3·N·N), grain, blotch}`; crust is −1. About 5–7 ms |
| `knnClassify(P, ph, train, k, lam)` | k-nearest-neighbour classifier on position and colour: distance² = spots apart² + (lam · colour difference)², so `lam` = 0 is position only and about 1000 is colour only. `train` is pixel ids labelled with `P.truth`. Exact search over 8×8 buckets (checked against brute force). Returns `Int8Array(N·N)`, −1 off the pizza. 5–15 ms with 200 training spots; up to about 135 ms colour-only with 3,200 |
| `splitHalf(groups, bySquare, r)` | Splits reference spots (one list per square) into equal training and test halves, by whole square or by spot. Returns `{train, test}` |

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
- `hot`, `glare`: the hot-spot centres per topping and the glare centre (from their own seeded stream), plus the `clumpTop` and `clumpErr` used.

Pixel index is `y*N + x`. Changing the kit changes every page. Rebuild, rerun `tests/check.js` and look at every page afterwards.

## Recipe for a new explainer

1. **Plan it** from the section below and the paper. Decide which paper figures the page must hit, and say them in the page. Cite the passages in the plan's **Based on** list, and reread them in the PDF before writing.
2. **Copy `src/02-twenty-five-of-each.html`** as the template: a full document with doctype, charset, viewport, `<title>` and the `claude:viewport-fit-sides` meta. Keep the token block and shared components, keep exactly one `/* @@KIT@@ */` inside the script, and replace the content.
3. **Add the page to `PAGES`** in `src/build.py`.
4. **Turn its card on** in `src/index.html`: change `<div class="card soon">` to `<a class="card" href="NN-name.html">` and the status to `Open`.
5. **Link it.** Give the new page a crumb back to `index.html` and previous/next links in its footer, and update the previous page's "Next" link.
6. **Write a small logic test** that runs the page's estimators in node against known answers (paper figures, or the census truth). Consider adding lasting checks to `tests/check.js`.
7. **Build, check, look.** Run `python3 src/build.py` (after `npm install` once) and `node tests/check.js`, then look at the page in a browser (both themes, phone width).
8. **Hand back for review.** Update **Status** and **Changelog** below and leave everything uncommitted on the current branch (no new branch per explainer). Tell the author what changed and how to look at it (see **Reviewing and committing**).
9. **Commit after review.** When the author approves, commit in the same Claude Code session, so the hooks add the transcript (see **Session transcripts**). Merge to `main` and push when the author says it's ready; that's what deploys.

### Reviewing and committing

Nothing is committed until the author has reviewed it locally.

- **See what changed:** `git status` and `git diff` (sources in `src/`, plus `GUIDE.md` and `tests/`). The built HTML in this folder changes too; skip it in the diff with `git diff -- . ':!*.html' src/`.
- **Look at the pages:** double-click the built `.html` in Finder (or `open 03-sampling-design-lab.html`). Each page is self-contained, so it works straight from disk, and links between pages work too. A local server (`python3 -m http.server 8000`) is only needed if a page ever starts loading files at runtime.
- **Run the checks yourself:** `python3 src/build.py && node tests/check.js`.
- **Approve or ask for changes** in the same Claude Code session. Claude commits only after a clear go-ahead. A commit from your own terminal works too, but it won't carry the session transcript.
- **No new branches:** build each new explainer on the branch that's already checked out. Don't create a branch or worktree per explainer (the author's decision, 2026-11-03).

### Publishing (Cloudflare Pages)

The demos repo deploys to Cloudflare Pages from `main`. Anything on another branch stays off the live site.

**Branch workflow**
- The first launch (01, 02 and the index) is developed on the branch `pizza-map-lab`, then merged into `main`.
- After launch, explainers were first built on short-lived branches (`lab-03`, `lab-04`). That's dropped: new explainers no longer get their own branch, and are built on the branch that's checked out. They reach the live site only when the author merges into `main`.

**Previews:** not used. The author reviews pages locally (see **Reviewing and committing**). Work branches don't need pushing; Cloudflare would build a public, unlisted preview for any branch that is pushed.

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

Done in the 03 session, except step 1 (waiting on the author) and optional step 4 (skipped: 02 keeps its inline `estimate()`).

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
- **Convenience design:** taste only the edge pieces (the outer ring of 28 squares, 44% of the pizza). Toppings thin out toward the crust, so those pieces are mostly cheese and overall accuracy comes out about 5 points too high (83–86% over eight bakes). The 36 middle squares have zero chance, which breaks the probability-sample rule. Rejected alternatives: clean spots away from topping edges (felt arbitrary); spots along the knife cuts (nearly unbiased here, because toppings ignore the cuts); a thin crust band (too little anchovy, so most samples can't be estimated).
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
- **Headline:** the map says D is 5% of the pizza (pixel counting). From the sample, Table 5 estimates 7.4% with SE 1.9, a 95% CI of ±3.6 (3.8–11.0%) from the unrounded SE of 1.85. The rounded 1.9 would give ±3.7.
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
| 03 | The Sampling Design Lab (`03-sampling-design-lab.html`) | Built on `lab-03`; page copy is a draft for the author to rewrite; not merged |
| 04 | How Many Tastes? (`04-how-many-tastes.html`) | Built on `lab-04`; page copy is a draft for the author to rewrite; not merged |
| 05 | Every Square Its Own Pizza (`05-every-square-its-own-pizza.html`) | Built on `pizza-map-lab`; page copy is a draft for the author to rewrite; not merged |
| 06 | How Much Anchovy Is There? (`06-how-much-anchovy.html`) | Built on `pizza-map-lab`; page copy is a draft for the author to rewrite; not merged |
| 07 | The Taster Is Wrong Too (`07-the-taster-is-wrong-too.html`) | Built on `pizza-map-lab`; page copy is a draft for the author to rewrite; not merged |
| 08 | Normalizing and Kappa (`08-normalizing-and-kappa.html`) | Built on `pizza-map-lab`; page copy is a draft for the author to rewrite; not merged |
| 09 | Wrong Amount, Wrong Place (`09-wrong-amount-wrong-place.html`) | Built on `pizza-map-lab`; page copy is a draft for the author to rewrite; not merged |
| 10 | Tasting the Training Slice (`10-tasting-the-training-slice.html`) | Built on `pizza-map-lab`; page copy is a draft for the author to rewrite; not merged |
| B1 | Round Pizza, Square Cuts | Later |

## Changelog

- **2026-11-05** Style session (on `pizza-map-lab`, no new explainer).
  - Cards no longer sit two to a row. Every page's `<section class="lower">` (the paper check beside the notes; 01's error matrix beside its notes; 02's Step 1 and Step 2) is unwrapped, so each card runs full width. 01's error matrix no longer scrolls sideways at desktop width. 07 and 08 keep `.lower` inside cards for their matrix pairs.
  - Dark mode keeps the light tablecloth. The dark `--bg` and `--check` overrides are gone, and new `--cloth-*` tokens keep the index stage headings and footer readable on it. Cards cast a dark brown shadow in both themes (`--cloth-shadow`), so they match light mode.
  - Each explainer's masthead is now a card, with an "On this page" list beside the intro that links to every card (ids added). Smooth scrolling unless the reader prefers reduced motion.
  - 02's step headings now read `Step N · Title` like the other pages. 07's Step 5 stacks its histogram and the panel table.
  - Considered and declined: two text columns in the notes cards to fill the space beside the 66ch text.
  - Checked in headless Chrome, both themes, at 1280 and 500 px. `tests/check.js` passes.

- **2026-11-05** 08, 09 and 10 session (on `pizza-map-lab`, no new branch). The author asked for all three pages at once, built by three parallel Fable sub-agents in the same working copy; another exception to the one-explainer rule. The lead session seeded each page from the 02 template and did the shared wiring first (`PAGES`, index cards, 07's Next link), so each agent owned only its page, its own block of `tests/check.js`, and (10 only) additions to the kit.
  - Kit: `PHOTO_BASE`, `bakePhoto`, `knnClassify`, `splitHalf` for 10. Additions only (44 lines); the paper-pizza fingerprints still pass.
  - Browser: Claude in Chrome would not connect for any agent, so each checked its page in headless Chrome: light and dark themes, 390 px with no page scroll, console clean. Sliders and hover were driven by script on 09 only. The author should still try 08–10 in a real browser.
  - `tests/check.js`, 08: normalized Table 4 and Table 5 have every total at 1/c and user's = producer's, and normalize to the same matrix; normalized Table 5 accuracies 76.9/72.2/82.8/72.0, diagonal 76.0; Eq. 24 on Table 5 gives chance 0.413 and kappa 0.653, on Table 4 0.25 and 0.667; a 4% change map normalizes to 50%; an all-cheese map has kappa 0; the seeded 300-map scatter has r 0.969.
  - `tests/check.js`, 09: Table 5 gives D 20.4 = Q 4.6 + E 9.6 + S 6.2, E + S = A = 15.8; cheese–mushroom exchange 8.0; anchovy 2.4/1.6/2.0; a_k = e_k + s_k = d_k − q_k per class; P&S Fig. 1's seven cases; 600 seeded random 2–6 class matrices give Q + E + S = D; merging cheese + mushroom gives D 9.2 (Q 3.2, E 5.2, S 0.8); each page edit moves only its own component; the baked pizza's census splits like Table 5.
  - `tests/check.js`, 10: the photo leaves the pizza unchanged; bucketed k-NN equals brute force; splits are equal and disjoint; resubstitution with 1 neighbour is 100%; over 30 seeded tastings (16 squares × 25 bites, position and colour, k = 3), split by spot is graded +16.3 points above its map's real accuracy (too kindly 30 of 30), by square −1.3, a fresh stratified sample +1.25 (spread 6.8); colour only +0.5; bites in all 64 squares −0.7; 8 squares × 100 bites, mostly position, +37.
  - 08 page: Step 1 normalizes Table 4 or 5 pass by pass (0–20), with before/after matrices and a pizza grown to the normalized totals. Step 2, Sec. 1.2's change map on the two-class pizza (1–10% change shown as 50%). Step 3, Eq. 24 live for Table 5 and four chance models (0.543–0.728 for the same map), with a "map made by chance". Step 4, kappa against overall accuracy for 300 maps of our own. Step 5, Table 5's numbers against an 85% (or other) target with 95% intervals. Check table and notes.
  - Found (08): every baked paper pizza is Table 5 exactly, so the plan's "scatter over many baked pizzas" can't vary. The scatter uses our own maps: random shares of edge mistakes, some with a cheese-happy or anchovy-happy classifier, and the page says so. Kappa spans about 0.60–0.70 among maps within 2 points of 79.6%.
  - Found (08): normalizing Table 4 and Table 5 ends at the same matrix (to 1e-15): the rescaling throws away the map weights W_i that Table 5 put back in. About 20 passes to converge; one pass leaves a total 3.4 points off. Anchovy goes from 64.0 vs 43.2 to 72.0 vs 72.0.
  - Found (08): at 85%, none of Table 5's five headline numbers clears it; anchovy user's (64.0 ± 19.2) falls short and the other four intervals straddle it.
  - 09 page: Step 1, P&S Fig. 1's seven six-spot cases as editable trays with a live matrix and Q/E/S bar. Step 2 adds mistakes of exactly one kind to the paper pizza with three sliders (quantity: real mushroom mapped cheese; exchange: cheese–mushroom pairs; shift: a three-way shuffle), bars per topping, the matrix with mirror-cell hover, a pair table like P&S Table 4, and seven live equation cards (S&F Eqs. 5–11, P&S Eqs. 1, 3, 4, 5, 9). Step 3 merges any two toppings. Check table and notes.
  - Found (09): "fix the map's anchovy" (relabel map-mushroom real-anchovy spots) doesn't reduce quantity: anchovy's q falls and mushroom's rises by the same amount, so the gain is all shift. Growing cheese at mushroom's expense is the pure quantity edit. Pure edits need the added cell to already outweigh its mirror cell.
  - Found (09): merging cheese and mushroom erases 11.2 points (the 7.2 + 4.0 cells), not just the 8.0 exchange; D 20.4 → 9.2, overall 79.6 → 90.8%, and the components re-sort (Q 3.2, E 5.2, S 0.8). P&S's 6.49% counts only the exchange.
  - Found (09): per topping, Eq. 8's a_k equals e_k + s_k, so allocation splits into exchange and shift class by class.
  - 10 page: Step 1, the paper pizza beside a noisy photo (grain and blotch sliders, glare). Step 2, a two-stage reference sample (8–64 squares × 10–100 bites) split half and half by spot and by square; a k-NN classifier (position, mostly position, position and colour, colour) makes a map from each; tiles for claimed, real (census) and an independent stratified sample (Eq. 13 ± Eq. 16), plus resubstitution and how close test spots sit to training spots. Step 3, 30 repeats as a gap histogram. Eq. 13 live. Check table and notes.
  - Found (10): at the defaults a position-and-colour map is about 70% right but claims about 85–92% split by spot. Fewer squares, more bites per square and more weight on position widen the gap. With reference spots in all 64 squares the inflation vanishes: the leak is a clustered-reference-data problem, Sec. 2.7's cluster case. Anchovy's user's accuracy looks 30+ points too good split by spot.
  - Found (10): split by square reads 1–3 points low, because the census also counts training squares the map memorised; the independent sample has no lean. The page says so.
  - Open for the author: 08, whether the scatter's maps are described honestly enough, the "map made by chance" pizza, the name "iterative proportional fitting", and producer's on the 85% strips; 09, the quantity slider's cheese framing (or a fourth "fix anchovy" control that shows the surprise), and the editorial "fewer classes is always more accurate" line; 10, toning the photo's rainbow speckle down to brightness noise, and "Fresh sample" vs "Independent sample".
  - All page text is a draft in the guide's voice; the author writes the final copy (see README). README's page list is left for the author.

- **2026-11-03** 06 and 07 session (on `pizza-map-lab`, no new branch). The author asked for both pages in one session, an exception to the one-explainer rule. 07 was built by a forked sub-agent while 06 was built in the main session; both were checked in a browser in both themes and at phone width.
  - Kit: `bakeAnchovyPizza`, `tasterSays` and `foody` for 07. Nothing existing changed; the paper-pizza fingerprints still pass.
  - `tests/check.js`: a new check that every live equation number is a MathML token (a signed placeholder had made Eq. 5's number vanish on 06).
  - `tests/check.js`, 06: Eq. 21 adds up spot for spot on three bakes; Table 5's anchovy 5.0 − 1.8 + 4.2 = 7.4 and map bias −2.4; Table 4's anchovy interval 3.8–11.0% (half-width 3.63); Eq. 22 equals Eq. 19 on every stratified sample; with 100 simple random tastes, ignoring the map, Eq. 22 and Eq. 19 all centre on 7.4% and spread 2.63, 2.43 and 2.31; Eq. 23 crossing checks.
  - `tests/check.js`, 07: Foody's 5.9×, 20.6×, 20.30% (40.6×), 10.70%, 5.8% and 1.98%; Fig. 1(c) cells from Eqs. 5–8; the map's accuracy doesn't enter Eq. 4; exact counts for the two-class pizza and the taster; the taster's census matches Eq. 4; seeded stratified samples average 0.98% (perfect taster) and 10.67% (Scenario III, Eq. 4 says 10.70%); a panel of tasters spreads 3.97 against a formula SE of 2.44.
  - 06 page: Step 1 takes the map's count apart with Eq. 21 as a waterfall (map share − commission + omission = real share) beside the pizza, for any topping, with Eq. 5's map bias. Step 2 tastes n per topping (5–200, default 25) with Eq. 19, Eq. 20, the 95% interval and Eq. 22 (equal to Eq. 19 here). Step 3 reads one simple random sample (100/400/1,000) three ways (ignore the map, Eq. 22 with plain shares, Eq. 19 poststratified), with 1,000 repeats against pixel counting. Step 4 plots the square root of Eq. 23's MSE against tastes per topping, 500 repeats per point, with optional taster slips (0/2/5/10%). Check table and notes.
  - Found: the anchovy interval is ±3.6, not ±3.7 (the index card said ±3.7; fixed). Same rounding effect as 04 found for overall accuracy.
  - Found: Eq. 22 only differs from Eq. 19 when its bias term uses plain sample shares. If you poststratify the bracket, the estimated map share is W_k and Eq. 22 is Eq. 19 again. The page says so.
  - Found (*ours*): pixel counting beats the stratified sample for anchovy below about 13–15 tastes per topping (Eq. 20 estimate: 14). For pepperoni the map is only 0.8 points off, so pixel counting wins until about 244 per topping by Eq. 20, and earlier in the simulation because of the small-pizza correction. With a taster who slips on 10% of spots, the sample's bias (about 2.4–2.6 points for anchovy) is as big as the map's.
  - 07 page (built by the fork): Step 1 sets real anchovy (0.5–50%, with a 7.4% stop), taster and map accuracy, with presets for Foody's Scenarios I–III, III with a better taster, a 99/99 taster, a perfect map and the paper pizza's anchovy; three pizzas and readouts. Step 2 shows Foody's Fig. 1(b) and (c) from the census beside his Eqs. 1–4, with Eq. 4, Eq. 1 and Eq. 3 cards. Step 3 runs Eqs. 1–4 over every share (Figs. 2–4), with the 0.9–1.1 band. Step 4 tastes 1,000 stratified samples: perfect taster, this taster, and one corrected with Eq. 4 (*ours*). Step 5 hires from a panel of 8 tasters whose accuracies differ (*ours*). Step 6 puts primary and alternate labels on the paper pizza (*ours*). Check table and notes.
  - Found: Foody prints 23.73% and 79.88%; his Eqs. 1–2 give 23.738% and 79.888%, so he truncated. He prints cell b as 0.179 where Eq. 6 gives 0.1796, while rounding c to 0.082. The 99/99 taster's 1.89% is a typo for 1.98%. The page says all three.
  - Found (*ours*): on the paper pizza, a 95/95 taster turns 7.4% anchovy into 11.7% (1.6×). The Eq. 4 correction centres on the truth but spreads about 5 times wider than a perfect taster, and needs the taster's accuracy to be known (Sec. 6.1). With tasters differing by ±10 points, the spread roughly doubles while each sample's SE stays put. With mixed spots 1 spot wide, 34% of spots are mixed and accuracy goes from 79.6% to 91.0% when the alternate label counts.
  - Honesty notes on 07: the taster's slips are scattered at random, as Foody's equations assume; real tasters may stumble at the same edges as the map. Census producer's accuracy reads 90.3% where Eq. 1 says 90% because 144 anchovy spots round to whole spots.
  - Review fixes after the browser pass: topping picker 2×2 on 06; Eq. 23 squares the rounded numbers it shows; chart labels moved off the lines; two 07 tables narrowed so they don't scroll at desktop width.
  - All page text is a draft in the guide's voice; the author writes the final copy (see README). README's page list is left for the author.

- **2026-11-03** 05 session (on `pizza-map-lab`, no new branch).
  - Kit: `bakePaperPizza(seed, {clumpTop, clumpErr})`. Clumped toppings drop a share of each topping near its hot spots (kept apart, so one topping doesn't fill another's). Clumped mistakes add the distance to a glare spot to the edge-distance rule that places each Table 5 mistake, weighted (ce/(1 − ce))²/10, so the dial moves smoothly. Mistake counts per cell are fixed, so Table 5 stays exact at every setting. The dials at 0 take no random draws and run the old code, so 01–04 are unchanged.
  - Kit: `SQUARE_SPOTS`, `sampleBySquare`, `sampleTwoStage`, `strataEstimate`. `sampleSystematic` also takes 64 and 576 (one and nine per square).
  - `tests/check.js`: fingerprints of today's pizza for three seeds at dials 0; Table 5 exact at five dial settings and two seeds; one stratum equals the simple random estimator; squares as strata give Eq. 16 with W_h = 1/64; one bite per square has no SE; with mistakes clumped every design is unbiased, whole squares spread 6.7 → 21.0 points, systematic and every-square spread less than random (1.6 vs 2.5), and the random formula overstates systematic (2.7 vs 1.6); with toppings clumped, whole squares' anchovy area spreads 6.2 → 9.2 and stays unbiased.
  - 05 page (before review): Step 1, the two dials with presets, the map / real pizza / mistakes views with the glare drawn, and an 8×8 map of each square's accuracy or anchovy share. Step 2, five designs at 64, 256 or 576 tastes (whole squares, two-stage with 16 squares, simple random, systematic grid, bites in every square), one sample of each in a table. Step 3, 1,000 repeats as histograms plus spread, formula SE and "worth" in random tastes. Step 4, each design's spread as one dial goes 0–100%. Step 5, Sec. 4.7: each square's accuracy from 1–100 bites per square against the truth. Cards for Eq. 16 with squares as strata, the one-stage cluster SE, the SE you get if you ignore the clusters, and "worth". "Check against the paper" tests Sec. 2.2, 2.4 and 4.2's claims at the current dials, plus Table 2's matching designs.
  - Every design on this page gives each spot the same chance, so all use plain shares; the page says the paper would poststratify simple random and systematic samples (Sec. 4.2).
  - Whole squares can't hit 64 or 256 tastes (a square is 225 spots, and two are needed for an SE), so they take 450; 576 gives three squares (675). Systematic at 256 uses 225, the nearest grid. The table shows actual tastes, and "worth" evens it out.
  - Found: with 2–3 whole squares, their own SE averages well below their real spread (13.6 vs 19.5 at 60% mistakes). The variance itself is right on average (mean estimated / real variance 1.03, now a check); the square root of a variance from 2 clusters runs low. For ratios the SE is unreliable too.
  - Found: user's and producer's accuracy from 2–3 whole squares lean low, a small-sample ratio effect: user's D averages about 46–52% against 63.9, producer's D about 31–40% against 43.2. The page marks these with * and says shares stay unbiased; the masthead says ratios are the one catch.
  - Review (a Fable sub-agent read the page against the paper) led to these changes: the masthead and Step 3 qualify "never biases" for ratios from few clusters; the SE caption says the variance is right on average; the check table says systematic's gain needs positive correlation, and that the paper's "usually too big" is said of the poststratified formulas; Table 2 rows now say Fichet et al. (2014) and Wickham et al. (2004) take one cluster per cell; two-stage notes its SE runs a little high (a quarter of the squares picked); a sixth design, 5 × 5 blocks (3/10/23 blocks, 75/250/575 tastes), gives a cluster design that fits the budget. Poststratifying was checked and kept out: it tightens area and producer's accuracy by about 12–20% for random, systematic and every-square alike, without changing their order.
  - Found: clumped toppings move overall accuracy only a little, because mistakes sit at topping edges and follow them. Clumped mistakes don't move anchovy area at all (it doesn't depend on the map). Step 4 says which dial matters for which number.
  - Found: at the default pizza, systematic at 64 (one bite per square, same place in every square) spreads slightly more than random for overall accuracy (5.8 vs 5.0); it wins clearly once mistakes clump.
  - All page text is a draft in the guide's voice; the author writes the final copy (see README).

- **2026-11-03** 04 session (on `lab-04`; no new branch, per the author's new rule).
  - Workflow: the author dropped the branch-per-explainer rule. `CLAUDE.md` and this guide now say to build on the checked-out branch.
  - Kit: `stratEstimate` takes an optional `Nh` for the finite population correction. Without it, output is unchanged (Table 4 → 5 check still exact).
  - `tests/check.js`: Eq. 1 gives 246 and 384; Table 4 gives Table 5's 69.5–89.7% interval; at 100 per topping, overall and user's A intervals catch the truth about 95% of the time; at 246, user's D coverage is about 99% and the spread is √(1 − 246/720) ≈ 0.81 of Eq. 17's SE; with the correction, coverage is back to 95%; at 5 per topping, user's A coverage is about 57%. All seeded, so deterministic.
  - 04 page: Step 1, an Eq. 1 planner (confidence, p, d, the paper's presets) with a half-width-against-tastes chart marking Table 4's 25 and Hay's 50, and what n per topping means on this pizza. Step 2, one equal-allocation sample at 5–400 per topping with 95% intervals for 8 numbers on 0–100% strips, beside Sec. 2.5's cropland example (78–85% vs 60–85%). Step 3, 1,000 repeats as an interval ladder, plus a coverage curve over 13 sizes for six numbers. Step 4, "count, not percent": this pizza's 720 map-anchovy spots against a bottomless pizza (tasting with replacement). Cards for Eqs. 1 (and turned around), 16, 17, the Sec. 4.4 interval, and the correction (marked not in the paper). "Check against the paper" table.
  - Found: coverage is low at small sizes. At 5 per topping: overall about 81%, user's A about 57% (its SE is often 0 when every taste agrees), producer's C about 35%. Producer's C leans high by about 3 points at 25 per topping and 6 at 10.
  - Found: user's A coverage zigzags a little (about 91–93% at 50–100), because the estimate can only be whole tastes over n.
  - Found: Table 5's 69.5–89.7% uses the unrounded SE (5.13); 79.6 ± 1.96 × 5.1 would give 69.6–89.6. The page says so.
  - The paper rounds Eq. 1 to the nearest taste (384.16 → 384), not up. The page says so.
  - All page text is a draft in the guide's voice; the author writes the final copy (see README).

- **2026-11-03** 03 session (on `lab-03`, branched from `pizza-map-lab`; the launch merge into `main` is left for the author).
  - Kit: samplers, the stratified/poststratified estimator (Eqs. 12–20 with SEs), a one-stage cluster estimator, `edgePieceSpots`, and `drawRepeats`, a repeats histogram with a fixed 0–100% axis (the author asked for 0–100 on every metric).
  - `tests/check.js`: Table 4 in gives every Table 5 number and SE out; every probability design is unbiased over 2,000 repeats; the convenience design is not (about 84.5% overall).
  - 03 page: seven designs (simple random, systematic, equal and proportional strata, 2×2 and 5×5 clusters, convenience). Each shows where the bites land and a map of each spot's chance. The page also has this sample's estimates with SEs, 1,000 repeats of every design, and live Eqs. 13 and 16, the 1/π weight and a cluster card. "Check against the paper" covers Table 2 examples and Table 4 → 5.
  - Found: Eq. 20 is printed with `n_i+`, but Table 5's area SEs need `n_i+ − 1` (`n_i+` gives 4.8/4.5/2.5/1.8). The page says so.
  - Found: on this pizza the systematic grid's gain depends on spacing. At 100 tastes (every 12 spots) the SRS formula is about right, or slightly low for overall accuracy. At 225–400 it overstates, e.g. producer's D at 400 spreads 4.9 while the formula says 7.1. The page reports this live instead of claiming it always overstates. 05's clumping should make it clearer.
  - Found: equal strata are less precise than simple random for overall accuracy (about 5.0 vs 4.1 at 100), the Sec. 2.5 trade-off. The page points it out.
  - Clusters at 100 tastes: 25 blocks of 2×2 are worth about 60 single tastes, 4 blocks of 5×5 about 20. With 4 blocks, each sample's own SE is unreliable.
  - Convenience design changed after review: from "clean spots away from topping edges" to "edge pieces only" (see the 03 plan).
  - All page text is a draft in the guide's voice; the author writes the final copy (see README).

- **2026-11-03** Planning session (no pages built).
  - Checked the plans for 03–10 against the papers in `reference/`, now including Foody (2013) and Pontius & Santacruz (2014).
  - Confirmed that Eqs. 16–18 and 20 on Table 4 reproduce every Table 5 standard error exactly.
  - Added "Before 03: shared groundwork" (shared estimators in the kit, launch merge) and filled each plan with checked figures and a test.
  - Fixed 07: the paper's "nearly 40" is Foody's Scenario II (80% taster, 0.5% share), not the 95% taster of the "nearly 6" case.
  - Added exchange and shift figures to 09.
  - Settled the 05 open question: keep Table 5 exact, with separate dials for clumped toppings and clumped mistakes.
  - Gave every plan a **Based on** list of the passages it draws from, with page numbers.
  - Added session transcripts for the whole demos repo: git hooks in `.githooks/` at the repo root commit each Claude Code session's transcript to `transcripts/`, with a `Transcript:` trailer.
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
