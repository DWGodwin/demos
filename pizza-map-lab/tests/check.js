// Pizza Map Lab checks. Run from the repo root after building:  node tests/check.js
// 1. Every built page's inline script parses, and its paper equations were converted with a slot for every live number.
// 2. The shared kit bakes a pizza whose true error matrix is exactly Table 5, for several seeds.
// 3. Tasting 25 per topping 300 times gives weighted estimates near the truth, raw estimates
//    near the paper's naive numbers, and a spread near Table 5's standard errors.
// 4. The kit's stratified estimator turns Table 4 into every Table 5 number and standard error.
// 5. Every probability design in the kit is unbiased over many repeats; the convenience design is not.
// 6. Eq. 1 gives the paper's 246 and 384, Table 4 gives Table 5's 69.5-89.7% interval, and 95% intervals
//    catch the truth about 95% of the time once the sample is big (explainer 04).
// 7. The clumping dials keep Table 5 exact, leave today's pizza unchanged at 0, and change precision but not bias:
//    whole squares spread more as mistakes clump, spread-out designs less (explainer 05).
// 8. Area from the sample: Eq. 21 adds up, Eq. 22 equals Eq. 19 under stratified sampling, and under simple random
//    sampling Eq. 19 spreads least (explainer 06).
// 9. An imperfect taster: Foody's (2013) Eq. 4 figures, the two-class pizza, and simulated areas that match Eq. 4 (explainer 07).
// 10. Normalizing forces every total to 1/c and makes user's equal producer's; Table 5's kappa is 0.653; kappa tracks overall accuracy (explainer 08).
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
let failed = 0;
const ok = (cond, msg) => { console.log((cond ? "  ok   " : "  FAIL ") + msg); if (!cond) failed++; };

console.log("Scripts parse");
const pages = fs.readdirSync(root).filter(f => f.endsWith(".html"));
for (const p of pages) {
  const s = fs.readFileSync(path.join(root, p), "utf8"), m = s.match(/<script>([\s\S]*)<\/script>/);
  try { new vm.Script(m ? m[1] : ""); ok(!!m, p); } catch (e) { ok(false, `${p}: ${e.message}`); }
  ok(!s.includes("@@KIT@@"), `${p} has the kit pasted in`);
}

console.log("Paper equations");
for (const p of pages) {
  const s = fs.readFileSync(path.join(root, p), "utf8");
  if (!s.includes("<math") && !s.includes("setEq")) continue;
  ok(!/<\/?tex\b/.test(s) && !s.includes("temml-error"), `${p}: every <tex> became MathML`);
  // setEq("q-x", ...) needs id="q-x"; setEq("q-x"+(k+1), ...) needs q-x1 to q-x4
  const ids = new Set([...s.matchAll(/\bid="([^"]+)"/g)].map(m => m[1])), missing = [];
  for (const [, id, loop] of s.matchAll(/setEq\("([\w-]+)"(\+)?/g))
    for (const want of loop ? [1, 2, 3, 4].map(k => id + k) : [id]) if (!ids.has(want)) missing.push(want);
  ok(!missing.length, `${p}: every live number has its slot${missing.length ? " (missing " + missing.join(", ") + ")" : ""}`);
  // a slot must be a single MathML token: a placeholder like {-2.4} becomes an <mrow>, and text set on an mrow doesn't show
  const rows = [...s.matchAll(/<mrow[^>]*\bid="([^"]+)"/g)].map(m => m[1]);
  ok(!rows.length, `${p}: every live number is a token that can show text${rows.length ? " (mrow: " + rows.join(", ") + ")" : ""}`);
}

const kit = fs.readFileSync(path.join(root, "src", "kit.js"), "utf8");
const K = new Function(kit + "; return {bakePaperPizza, SEED, TABLE5, MAP_SHARE, N, CUTS, rng, mapStrata, sampleSRS, sampleSystematic, allocate, sampleStratified, sampleClusters, pickFrom, edgePieceSpots, countMatrix, stratEstimate, clusterEstimate, sampleBySquare, sampleTwoStage, strataEstimate, bakeAnchovyPizza, tasterSays, foody};")();

console.log("Paper pizza matches Table 5");
for (const seed of [K.SEED, 12345, 987654]) {
  const P = K.bakePaperPizza(seed), M = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  for (const i of P.ids) M[P.map[i]][P.truth[i]]++;
  let worst = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) worst = Math.max(worst, Math.abs(100 * M[i][j] / P.T - K.TABLE5[i][j]));
  const rows = M.map(r => r.reduce((a, b) => a + b, 0));
  ok(worst < 0.01, `seed ${seed}: every cell within 0.01 points of Table 5 (worst ${worst.toFixed(4)})`);
  ok(rows.every((v, k) => Math.abs(100 * v / P.T - K.MAP_SHARE[k]) < 0.01), `seed ${seed}: map shares are 60/25/10/5`);
  ok(new Set(P.ids.map(i => P.piece[i])).size === K.CUTS * K.CUTS, `seed ${seed}: ${K.CUTS * K.CUTS} squares`);
}

console.log("300 tastings of 25 per topping");
{
  const P = K.bakePaperPizza(K.SEED), strata = [[], [], [], []];
  for (const i of P.ids) strata[P.map[i]].push(i);
  const W = strata.map(s => s.length / P.T), out = { rawOA: [], wtOA: [], rawPAD: [], wtPAD: [] };
  for (let r = 0; r < 300; r++) {
    const c = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    strata.forEach((s, h) => { const got = new Set(); while (got.size < 25) got.add(s[Math.floor(Math.random() * s.length)]); got.forEach(i => c[h][P.truth[i]]++); });
    const p = c.map((row, i) => row.map(v => W[i] * v / 25));
    out.rawOA.push((c[0][0] + c[1][1] + c[2][2] + c[3][3]) / 100);
    out.wtOA.push(p[0][0] + p[1][1] + p[2][2] + p[3][3]);
    const colN = c[0][3] + c[1][3] + c[2][3] + c[3][3], colP = p[0][3] + p[1][3] + p[2][3] + p[3][3];
    if (colN) out.rawPAD.push(c[3][3] / colN); out.wtPAD.push(p[3][3] / colP);
  }
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); };
  const pc = v => (100 * v).toFixed(1);
  ok(Math.abs(mean(out.wtOA) - 0.796) < 0.015, `weighted overall accuracy averages ${pc(mean(out.wtOA))}% (truth 79.6)`);
  ok(Math.abs(mean(out.rawOA) - 0.75) < 0.02, `raw overall accuracy averages ${pc(mean(out.rawOA))}% (paper's naive 75)`);
  ok(Math.abs(100 * sd(out.wtOA) - 5.1) < 1.2, `weighted overall accuracy spread ${pc(sd(out.wtOA))} points (Table 5 SE 5.1)`);
  ok(Math.abs(mean(out.wtPAD) - 0.432) < 0.06, `weighted producer's D averages ${pc(mean(out.wtPAD))}% (truth 43.2)`);
  ok(Math.abs(100 * sd(out.wtPAD) - 11.1) < 3.5, `weighted producer's D spread ${pc(sd(out.wtPAD))} points (Table 5 SE 11.1)`);
}

console.log("Table 4 in, Table 5 out (Eqs. 12-20, n - 1 in every variance)");
{
  const T4 = [[21,3,1,0],[4,18,0,3],[0,2,20,3],[5,2,2,16]], e = K.stratEstimate(T4, [.6, .25, .1, .05]);
  const same = (got, want) => got.every((v, k) => (100 * v).toFixed(1) === want[k].toFixed(1));
  ok(same([e.O, e.se.O], [79.6, 5.1]), "overall accuracy 79.6, SE 5.1");
  ok(same(e.U, [84, 72, 80, 64]) && same(e.se.U, [7.5, 9.2, 8.2, 9.8]), "user's 84/72/80/64, SEs 7.5/9.2/8.2/9.8");
  ok(same(e.P, [91.0, 68.2, 74.1, 43.2]) && same(e.se.P, [3.2, 10.8, 16.7, 11.1]), "producer's 91.0/68.2/74.1/43.2, SEs 3.2/10.8/16.7/11.1");
  ok(same(e.area, [55.4, 26.4, 10.8, 7.4]) && same(e.se.area, [4.9, 4.6, 2.6, 1.9]), "area 55.4/26.4/10.8/7.4, SEs 4.9/4.6/2.6/1.9");
}

console.log("Sampling designs, 2,000 repeats of 100 tastes (explainer 03)");
{
  const P = K.bakePaperPizza(K.SEED), st = K.mapStrata(P), Nh = st.map(s => s.length), W = Nh.map(v => v / P.T), r = K.rng(7);
  const edge = K.edgePieceSpots(P), post = ids => K.stratEstimate(K.countMatrix(P, ids), W);
  const truth = { O: 0.796, area: P.colT[3] / P.T };
  const designs = {
    "simple random": () => post(K.sampleSRS(P, 100, r)),
    "systematic": () => post(K.sampleSystematic(P, 100, r)),
    "equal strata": () => post(K.sampleStratified(st, K.allocate(100, [1, 1, 1, 1]), r)),
    "proportional strata": () => post(K.sampleStratified(st, K.allocate(100, Nh), r)),
    "clusters 2x2": () => K.clusterEstimate(P, K.sampleClusters(25, 2, r)),
    "clusters 5x5": () => K.clusterEstimate(P, K.sampleClusters(4, 5, r)),
  };
  const run = fn => { const o = { O: [], area: [] }; for (let k = 0; k < 2000; k++) { const e = fn(); if (e.ok) { o.O.push(e.O); o.area.push(e.area[3]); } } return o; };
  const m = a => a.reduce((x, y) => x + y, 0) / a.length, sd = a => { const u = m(a); return Math.sqrt(a.reduce((x, y) => x + (y - u) ** 2, 0) / (a.length - 1)); };
  for (const [name, fn] of Object.entries(designs)) {
    const o = run(fn), dO = m(o.O) - truth.O, dA = m(o.area) - truth.area;
    ok(Math.abs(dO) < 3 * sd(o.O) / Math.sqrt(o.O.length) && Math.abs(dA) < 3 * sd(o.area) / Math.sqrt(o.area.length),
      `${name}: unbiased (overall ${(100 * m(o.O)).toFixed(1)}%, anchovy area ${(100 * m(o.area)).toFixed(2)}%)`);
  }
  const c = run(() => post(K.pickFrom(edge, 100, r)));
  ok(m(c.O) - truth.O > 0.025, `convenience (edge pieces only): overall accuracy biased high (${(100 * m(c.O)).toFixed(1)}% vs 79.6)`);
}

console.log("Sample size and intervals (explainer 04)");
{
  const eq1 = (z, p, d) => z * z * p * (1 - p) / (d * d);
  ok(Math.round(eq1(1.96, 0.8, 0.05)) === 246 && Math.round(eq1(1.96, 0.5, 0.05)) === 384, "Eq. 1 gives 246 (p = 0.8) and 384 (p = 0.5)");
  const e = K.stratEstimate([[21,3,1,0],[4,18,0,3],[0,2,20,3],[5,2,2,16]], [.6, .25, .1, .05]);
  ok((100 * (e.O - 1.96 * e.se.O)).toFixed(1) === "69.5" && (100 * (e.O + 1.96 * e.se.O)).toFixed(1) === "89.7", "Table 5's overall 95% interval, 69.5% to 89.7%");
  const P = K.bakePaperPizza(K.SEED), st = K.mapStrata(P), Nh = st.map(s => s.length), W = Nh.map(v => v / P.T), r = K.rng(11);
  const c = P.cell, tU = c.map((row, k) => row[k] / P.rowT[k]), tO = c.reduce((a, row, k) => a + row[k], 0) / P.T;
  const cover = (n, fpc) => { const h = { O: 0, U0: 0, U3: 0 }, u3 = [];
    for (let k = 0; k < 2000; k++) { const e = K.stratEstimate(K.countMatrix(P, K.sampleStratified(st, [n, n, n, n], r)), W, fpc ? Nh : undefined);
      const hit = (v, s, t) => Math.abs(v - t) <= 1.96 * s; h.O += hit(e.O, e.se.O, tO); h.U0 += hit(e.U[0], e.se.U[0], tU[0]); h.U3 += hit(e.U[3], e.se.U[3], tU[3]); u3.push(e.U[3]); }
    const m = u3.reduce((a, b) => a + b) / u3.length, sd = Math.sqrt(u3.reduce((a, v) => a + (v - m) ** 2, 0) / (u3.length - 1));
    return { O: h.O / 20, U0: h.U0 / 20, U3: h.U3 / 20, ratio: sd / Math.sqrt(tU[3] * (1 - tU[3]) / (n - 1)) }; };
  const a = cover(100, false);
  ok(Math.abs(a.O - 95) < 2 && Math.abs(a.U0 - 95) < 3, `at 100 per topping, overall and user's A intervals catch the truth about 95% of the time (${a.O}%, ${a.U0}%)`);
  const b = cover(246, false), f = cover(246, true);
  ok(b.U3 > 97 && Math.abs(b.ratio - Math.sqrt(1 - 246 / Nh[3])) < 0.05, `at 246, the paper's formula overstates user's D spread on this small pizza (coverage ${b.U3}%, spread/SE ${b.ratio.toFixed(2)} vs ${Math.sqrt(1 - 246 / Nh[3]).toFixed(2)})`);
  ok(Math.abs(f.U3 - 95) < 2, `with the small-pizza correction, user's D coverage is back near 95% (${f.U3}%)`);
  const s5 = cover(5, false);
  ok(s5.U0 < 85, `at 5 per topping, user's A intervals overpromise (${s5.U0}%)`);
}

console.log("Clumped toppings and mistakes (explainer 05)");
{
  // fingerprints of today's pizza, taken before the dials existed
  const fp = a => { let x = 2166136261 >>> 0; for (const v of a) { x ^= (v & 255); x = Math.imul(x, 16777619) >>> 0; } return x.toString(16); };
  const want = { [K.SEED]: ["41055a28", "1798ad01"], 12345: ["822d96fe", "28285959"], 987654: ["f95128ee", "883271bf"] };
  for (const [seed, [t, m]] of Object.entries(want)) {
    const P = K.bakePaperPizza(+seed, { clumpTop: 0, clumpErr: 0 });
    ok(fp(P.truth) === t && fp(P.map) === m, `seed ${seed}: dials at 0 give today's pizza spot for spot`);
  }
  for (const seed of [K.SEED, 12345]) for (const [ct, ce] of [[0.5, 0], [1, 0], [0, 0.5], [0, 1], [1, 1]]) {
    const P = K.bakePaperPizza(seed, { clumpTop: ct, clumpErr: ce }), M = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    for (const i of P.ids) M[P.map[i]][P.truth[i]]++;
    let worst = 0; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) worst = Math.max(worst, Math.abs(100 * M[i][j] / P.T - K.TABLE5[i][j]));
    ok(worst < 0.01, `seed ${seed}, toppings ${ct}, mistakes ${ce}: Table 5 exact (worst ${worst.toFixed(4)})`);
  }
  // the stratified estimator: one stratum is the simple random one; squares as strata is Eq. 16 with W_h = 1/64
  const P0 = K.bakePaperPizza(K.SEED), r = K.rng(21), ids = K.sampleSRS(P0, 300, r);
  const a = K.strataEstimate(P0, [ids]), b = K.clusterEstimate(P0, ids.map(i => [i]));
  const close = (x, y) => Math.abs(x - y) < 1e-12;
  ok(close(a.O, b.O) && close(a.se.O, b.se.O) && [0, 1, 2, 3].every(k => close(a.U[k], b.U[k]) && close(a.se.U[k], b.se.U[k]) && close(a.se.P[k], b.se.P[k]) && close(a.se.area[k], b.se.area[k])),
    "one stratum gives the simple random estimates and SEs");
  const g = K.sampleBySquare(4, r), e = K.strataEstimate(P0, g);
  let v = 0; for (const s of g) { const o = s.filter(i => P0.map[i] === P0.truth[i]).length / 4; v += o * (1 - o) / 3; }
  ok(close(e.se.O, Math.sqrt(v) / 64), "squares as strata: overall SE is Eq. 16 with W_h = 1/64");
  ok(isNaN(K.strataEstimate(P0, K.sampleBySquare(1, r)).se.O), "one bite per square has no SE (criterion 6)");
  // 2,000 repeats at 256 tastes
  const m = a => a.reduce((x, y) => x + y, 0) / a.length, sd = a => { const u = m(a); return Math.sqrt(a.reduce((x, y) => x + (y - u) ** 2, 0) / (a.length - 1)); };
  const run = (P, f, key) => { const o = [], se = []; for (let k = 0; k < 2000; k++) { const e = f(P); o.push(key === "O" ? e.O : e.area[3]); se.push(key === "O" ? e.se.O : e.se.area[3]); } return { m: m(o), sd: sd(o), se: m(se.filter(isFinite)) }; };
  const D = {
    random: P => K.strataEstimate(P, [K.sampleSRS(P, 256, r)]),
    systematic: P => K.strataEstimate(P, [K.sampleSystematic(P, 225, r)]),
    "every square": P => K.strataEstimate(P, K.sampleBySquare(4, r)),
    "two-stage": P => K.clusterEstimate(P, K.sampleTwoStage(16, 16, r)),
    "whole squares": P => K.clusterEstimate(P, K.sampleClusters(2, 15, r)),
    "5x5 blocks": P => K.clusterEstimate(P, K.sampleClusters(10, 5, r)),
  };
  const Pe = K.bakePaperPizza(K.SEED, { clumpErr: 1 }), Pt = K.bakePaperPizza(K.SEED, { clumpTop: 1 }), res = {};
  for (const [name, f] of Object.entries(D)) {
    const o = res[name] = run(Pe, f, "O");
    ok(Math.abs(o.m - 0.796) < 3 * o.sd / Math.sqrt(2000) + 0.002, `mistakes clumped, ${name}: unbiased (overall ${(100 * o.m).toFixed(1)}%)`);
  }
  const w0 = run(P0, D["whole squares"], "O");
  ok(res["whole squares"].sd > 2 * w0.sd, `whole squares spread more as mistakes clump (${(100 * w0.sd).toFixed(1)} -> ${(100 * res["whole squares"].sd).toFixed(1)} points)`);
  ok(res.systematic.sd < 0.8 * res.random.sd && res["every square"].sd < 0.8 * res.random.sd,
    `spread-out designs beat random (systematic ${(100 * res.systematic.sd).toFixed(1)}, every square ${(100 * res["every square"].sd).toFixed(1)}, random ${(100 * res.random.sd).toFixed(1)})`);
  ok(res.systematic.se > 1.3 * res.systematic.sd, `the simple random formula overstates systematic's error (${(100 * res.systematic.se).toFixed(1)} vs ${(100 * res.systematic.sd).toFixed(1)})`);
  // with 2 whole squares the variance formula is right on average (its square root runs low), but ratios lean
  { const v = [], o = [], u = [];
    for (let k = 0; k < 6000; k++) { const e = D["whole squares"](Pe); v.push(e.se.O ** 2); o.push(e.O); if (isFinite(e.U[3])) u.push(e.U[3]); }
    const ratio = m(v) / sd(o) ** 2, tU = P0.cell[3][3] / P0.rowT[3];
    ok(Math.abs(ratio - 1) < 0.15 && m(v.map(Math.sqrt)) < 0.9 * sd(o), `2 whole squares: mean variance / real variance ${ratio.toFixed(2)}, mean SE ${(100 * m(v.map(Math.sqrt))).toFixed(1)} below spread ${(100 * sd(o)).toFixed(1)}`);
    ok(m(u) < tU - 0.05, `2 whole squares: user's D, a ratio, leans low (${(100 * m(u)).toFixed(1)}% vs ${(100 * tU).toFixed(1)}%)`); }
  const a0 = run(P0, D["whole squares"], "A"), a1 = run(Pt, D["whole squares"], "A");
  ok(a1.sd > 1.2 * a0.sd && Math.abs(a1.m - 0.074) < 3 * a1.sd / Math.sqrt(2000) + 0.001, `toppings clumped: whole squares' anchovy area spreads more (${(100 * a0.sd).toFixed(1)} -> ${(100 * a1.sd).toFixed(1)}) and stays unbiased (${(100 * a1.m).toFixed(2)}%)`);
}

console.log("Area from the sample (explainer 06)");
{
  const m = a => a.reduce((x, y) => x + y, 0) / a.length, sd = a => { const u = m(a); return Math.sqrt(a.reduce((x, y) => x + (y - u) ** 2, 0) / (a.length - 1)); };
  // Eq. 21 on the census: map share - commission + omission = real share, for every topping and several bakes
  let worst = 0;
  for (const seed of [K.SEED, 12345, 987654]) { const P = K.bakePaperPizza(seed);
    for (let k = 0; k < 4; k++) { let com = 0, om = 0; for (let j = 0; j < 4; j++) if (j !== k) { com += P.cell[k][j]; om += P.cell[j][k]; }
      worst = Math.max(worst, Math.abs(P.rowT[k] - com + om - P.colT[k])); } }
  ok(worst === 0, "Eq. 21: map share - commission + omission = real share, spot for spot");
  const P = K.bakePaperPizza(K.SEED), st = K.mapStrata(P), W = st.map(s => s.length / P.T), r = K.rng(31), T5 = K.TABLE5;
  const comD = T5[3][0] + T5[3][1] + T5[3][2], omD = T5[0][3] + T5[1][3] + T5[2][3];
  ok((5 - comD + omD).toFixed(1) === "7.4" && comD.toFixed(1) === "1.8" && omD.toFixed(1) === "4.2" && (5 - 7.4).toFixed(1) === "-2.4",
    "Table 5, anchovy: 5.0 mapped - 1.8 commission + 4.2 omission = 7.4; map bias (Eq. 5) -2.4");
  const e4 = K.stratEstimate([[21,3,1,0],[4,18,0,3],[0,2,20,3],[5,2,2,16]], [.6, .25, .1, .05]), hw = 1.96 * e4.se.area[3];
  ok((100 * hw).toFixed(1) === "3.6" && (100 * (e4.area[3] - hw)).toFixed(1) === "3.8" && (100 * (e4.area[3] + hw)).toFixed(1) === "11.0",
    `Table 4: anchovy area 95% interval 3.8% to 11.0% (half-width ${(100 * hw).toFixed(2)}, from the unrounded SE ${(100 * e4.se.area[3]).toFixed(2)})`);
  // Eq. 22 = Eq. 19 exactly under stratified random sampling
  let gap = 0;
  for (let t = 0; t < 300; t++) { const e = K.stratEstimate(K.countMatrix(P, K.sampleStratified(st, [25, 25, 25, 25], r)), W);
    for (let k = 0; k < 4; k++) { const pk = e.p[k].reduce((a, b) => a + b, 0); gap = Math.max(gap, Math.abs(W[k] + (e.area[k] - pk) - e.area[k])); } }
  ok(gap < 1e-12, "Eq. 22 equals Eq. 19 on every stratified sample");
  // one simple random sample read three ways: all unbiased, and Eq. 19 < Eq. 22 < ignoring the map in spread
  const o = { plain: [], adj: [], est: [] }, n = 100, tA = P.colT[3] / P.T;
  for (let t = 0; t < 4000; t++) { const ids = K.sampleSRS(P, n, r), c = K.countMatrix(P, ids), nk = ids.filter(i => P.truth[i] === 3).length, mk = ids.filter(i => P.map[i] === 3).length;
    o.plain.push(nk / n); o.adj.push(W[3] + (nk - mk) / n); const e = K.stratEstimate(c, W); if (e.ok) o.est.push(e.area[3]); }
  const near = a => Math.abs(m(a) - tA) < 3 * sd(a) / Math.sqrt(a.length) + 0.0005;
  ok(near(o.plain) && near(o.adj) && near(o.est), `simple random, 100 tastes: all three centre on ${(100 * tA).toFixed(1)}% (${[o.plain, o.adj, o.est].map(a => (100 * m(a)).toFixed(2)).join(", ")})`);
  ok(sd(o.est) < sd(o.adj) && sd(o.adj) < sd(o.plain), `spread: Eq. 19 ${(100 * sd(o.est)).toFixed(2)} < Eq. 22 ${(100 * sd(o.adj)).toFixed(2)} < ignoring the map ${(100 * sd(o.plain)).toFixed(2)}`);
  // Eq. 23: at 25 per topping the sample beats pixel counting for anchovy; at 5 it doesn't; for pepperoni it doesn't at 100
  const rmse = (k, nn) => { const a = []; for (let t = 0; t < 2000; t++) a.push(K.stratEstimate(K.countMatrix(P, K.sampleStratified(st, [nn, nn, nn, nn], r)), W).area[k]);
    return Math.sqrt(m(a.map(v => (v - P.colT[k] / P.T) ** 2))); };
  const bD = Math.abs(W[3] - P.colT[3] / P.T), bC = Math.abs(W[2] - P.colT[2] / P.T);
  const r25 = rmse(3, 25), r5 = rmse(3, 5), rC = rmse(2, 100);
  ok(r25 < bD && r5 > bD && rC > bC, `Eq. 23, anchovy: sample error ${(100 * r5).toFixed(1)} at 5 and ${(100 * r25).toFixed(1)} at 25 per topping vs pixel counting's ${(100 * bD).toFixed(1)}; pepperoni at 100: ${(100 * rC).toFixed(2)} vs ${(100 * bC).toFixed(2)}`);
}

console.log("The taster is wrong too (explainer 07)");
{
  const F = K.foody, near = (a, b, d) => Math.abs(a - b) <= d, p = v => (100 * v).toFixed(2);
  // Foody (2013) Eq. 4: E^A = E(Pt + Po - 1) - Po + 1, the taster's accuracies only
  const I = F(.01, .95, .95, .9, .9), II = F(.01, .8, .8, .7, .7), II5 = F(.005, .8, .8, .7, .7), III = F(.01, .8, .9, .7, .8);
  ok((I.EA / .01).toFixed(1) === "5.9", `Scenario I at 1%: ${(I.EA / .01).toFixed(1)}x too big (Foody 5.9, S&F "nearly 6")`);
  ok((II.EA / .01).toFixed(1) === "20.6", `Scenario II at 1%: ${(II.EA / .01).toFixed(1)}x (Foody 20.6)`);
  ok((100 * II5.EA).toFixed(1) === "20.3" && (II5.EA / .005).toFixed(1) === "40.6", `Scenario II at 0.5%: ${p(II5.EA)}%, ${(II5.EA / .005).toFixed(1)}x (Foody 20.3%, 40.6x; S&F "nearly 40")`);
  ok((100 * III.EA).toFixed(2) === "10.70", `Scenario III at 1%: ${p(III.EA)}% (Foody Fig. 1(c) 10.70%)`);
  ok((100 * F(.01, .85, .95, .7, .8).EA).toFixed(1) === "5.8", "Scenario III with an 85/95 taster: 5.8%");
  ok((100 * F(.01, .99, .99, .7, .8).EA).toFixed(2) === "1.98", "a 99/99 taster: 1.98% (Foody's text says 1.89%, a typo)");
  ok(F(.01, .8, .9, 1, 1).EA === III.EA && F(.01, .8, .9, .5, .5).EA === III.EA, "the map's accuracy doesn't enter Eq. 4");
  const c = III.cells, want = [.025, .179, .082, .713], got = [c.a, c.b, c.c, c.d];
  ok(got.every((v, k) => near(v, want[k], .0011)), `Fig. 1(c) cells from Eqs. 5-8: ${got.map(v => v.toFixed(4)).join(" / ")} (printed .025/.179/.082/.713)`);
  ok(near(100 * III.Pt, 23.73, .01) && near(100 * III.Ut, 12.39, .01) && near(100 * III.Po, 79.88, .01) && near(100 * III.truth.Ut, 3.41, .005),
    `Fig. 1: apparent producer's t ${(100 * III.Pt).toFixed(3)}, user's t ${(100 * III.Ut).toFixed(3)}, producer's o ${(100 * III.Po).toFixed(3)}, true user's t ${(100 * III.truth.Ut).toFixed(2)}`);
  ok(near(F(.25, .95, .95, .9, .9).EA / .25, 1.1, 1e-9) && near(F(.4, .8, .8, .7, .7).EA / .4, 1.1, 1e-9) && near(F(.25, .8, .9, .7, .8).EA / .25, 1.1, 1e-9) && near(F(.5, .8, .9, .7, .8).EA / .5, .9, 1e-9),
    "within 10% from 25% (I), 40% (II), and only 25-50% (III), as Foody says");
  ok((100 * F(.074, .95, .95, .432, .98).EA).toFixed(1) === "11.7", "the paper pizza's 7.4% anchovy reads 11.7% to a 95/95 taster (ours)");
  // the two-class pizza and the taster: exact counts
  let exact = true, groups = true, census = 0;
  for (const seed of [K.SEED, 4242]) for (const E of [.005, .01, .074, .2, .5]) for (const [ct, co] of [[.7, .8], [.9, .9], [1, 1]]) {
    const P = K.bakeAnchovyPizza(seed, E, ct, co), nA = Math.round(E * P.T), nO = P.T - nA, m = [[0, 0], [0, 0]];
    for (const i of P.ids) m[P.map[i]][P.truth[i]]++;
    exact = exact && P.nA === nA && m[1][1] === Math.round(ct * nA) && m[1][0] === Math.round((1 - co) * nO) && m[0][1] + m[1][1] === nA;
    const [rt, ro] = [.8, .9], v = K.tasterSays(P, rt, ro, seed + 1), g = [[[0, 0], [0, 0]], [[0, 0], [0, 0]]];
    for (const i of P.ids) { g[P.truth[i]][P.map[i]][0]++; g[P.truth[i]][P.map[i]][1] += v[i]; }
    for (let t = 0; t < 2; t++) for (let mm = 0; mm < 2; mm++) groups = groups && g[t][mm][1] === Math.round((t ? rt : 1 - ro) * g[t][mm][0]);
    let says = 0; for (const i of P.ids) says += v[i];
    census = Math.max(census, Math.abs(says - P.T * F(nA / P.T, rt, ro, ct, co).EA));
  }
  ok(exact, "anchovy-or-not pizza: exact anchovy share and exact map hits and false alarms (0.5-50%, two seeds, three maps)");
  ok(groups, "the taster's slips: exact counts in every (real, map) group, so they are independent of the map's");
  ok(census <= 2, `the taster's census area equals Eq. 4 to within ${census.toFixed(1)} spots`);
  // 3,000 stratified samples of 100 per map class: the perfect taster centres on E, this taster on Eq. 4
  const P = K.bakeAnchovyPizza(K.SEED, .01, .7, .8), V = K.tasterSays(P, .8, .9, 9), r = K.rng(77);
  const st = [[], []]; for (const i of P.ids) st[P.map[i] ? 0 : 1].push(i);
  const W = st.map(a => a.length / P.T), m = a => a.reduce((x, y) => x + y, 0) / a.length, sd = a => { const u = m(a); return Math.sqrt(a.reduce((x, y) => x + (y - u) ** 2, 0) / (a.length - 1)); };
  const area = (ids, lab) => { const c = [[0, 0], [0, 0]]; for (const i of ids) c[P.map[i] ? 0 : 1][lab[i] ? 0 : 1]++; const e = K.stratEstimate(c, W); return [e.area[0], e.se.area[0]]; };
  const perf = [], tast = [], seT = [];
  for (let k = 0; k < 3000; k++) { const ids = st.flatMap(a => K.pickFrom(a, 100, r)), [a] = area(ids, P.truth), [b, s] = area(ids, V); perf.push(a); tast.push(b); seT.push(s); }
  const EA = F(.01, .8, .9, .7, .8).EA;
  ok(near(m(perf), .01, 3 * sd(perf) / Math.sqrt(3000)), `perfect taster: Eq. 19 averages ${p(m(perf))}% (real 1.00%)`);
  ok(near(m(tast), EA, 3 * sd(tast) / Math.sqrt(3000)), `Scenario III taster: Eq. 19 averages ${p(m(tast))}% (Eq. 4 says ${p(EA)}%)`);
  ok(near(m(seT) / sd(tast), 1, .1), `one taster: the Eq. 20 SE matches the spread (${p(m(seT))} vs ${p(sd(tast))})`);
  // a panel of tasters who differ by up to 10 points: spread grows, the formula SE doesn't (ours)
  const offs = [-1, -5 / 7, -3 / 7, -1 / 7, 1 / 7, 3 / 7, 5 / 7, 1], perm = [5, 2, 7, 0, 3, 6, 1, 4];
  const panel = offs.map((u, j) => K.tasterSays(P, Math.min(1, .8 + .1 * u), Math.min(1, .9 - .05 * offs[perm[j]]), 100 + j));
  const pv = [], ps = [];
  for (let k = 0; k < 3000; k++) { const ids = st.flatMap(a => K.pickFrom(a, 100, r)), [a, s] = area(ids, panel[Math.floor(r() * 8)]); pv.push(a); ps.push(s); }
  ok(sd(pv) > 1.3 * m(ps), `a panel of tasters: spread ${p(sd(pv))} points against a formula SE of ${p(m(ps))}`);
}

// ---- 08 · Normalizing and Kappa ----
console.log("Normalizing and kappa (explainer 08)");
{
  // the page's own matrix helpers, duplicated here: proportions of area, rows map, columns reference
  const sum = a => a.reduce((x, y) => x + y, 0), rowT = m => m.map(sum), colT = m => m[0].map((_, j) => sum(m.map(r => r[j])));
  const normPass = m => { const c = m.length, r = rowT(m); const x = m.map((row, i) => row.map(v => r[i] ? v / (c * r[i]) : 0)); const cl = colT(x); return x.map(row => row.map((v, j) => cl[j] ? v / (c * cl[j]) : 0)); };
  const normalize = (p, n) => { let m = p; for (let s = 0; s < n; s++) m = normPass(m); return m; };
  const accs = p => { const r = rowT(p), c = colT(p), O = sum(p.map((row, i) => row[i])), e = sum(r.map((v, i) => v * c[i])); return { O, e, k: (O - e) / (1 - e), U: p.map((row, i) => row[i] / r[i]), P: p.map((row, i) => row[i] / c[i]), row: r, col: c }; };
  const T5 = K.TABLE5.map(r => r.map(v => v / 100)), T4 = [[21,3,1,0],[4,18,0,3],[0,2,20,3],[5,2,2,16]].map(r => r.map(v => v / 100));
  for (const [name, p] of [["Table 5", T5], ["Table 4", T4]]) {
    const n = normalize(p, 20), a = accs(n), worst = Math.max(...rowT(n).map(v => Math.abs(v - .25)), ...colT(n).map(v => Math.abs(v - .25)));
    ok(worst < 1e-4, `${name} normalized: every row and column total is 1/c (worst off by ${worst.toExponential(1)})`);
    ok([0, 1, 2, 3].every(k => Math.abs(a.U[k] - a.P[k]) < 1e-4), `${name} normalized: user's equals producer's for every class (${a.U.map(v => (100 * v).toFixed(1)).join("/")})`);
  }
  const n5 = normalize(T5, 20), n4 = normalize(T4, 20), same = Math.max(...n5.flat().map((v, q) => Math.abs(v - n4.flat()[q])));
  ok(same < 1e-9, `Table 4 and Table 5 normalize to the same matrix (the map's shares are thrown away): biggest difference ${same.toExponential(1)}`);
  ok(accs(n5).U.map(v => (100 * v).toFixed(1)).join("/") === "76.9/72.2/82.8/72.0" && (100 * accs(n5).O).toFixed(1) === "76.0", "normalized Table 5: accuracies 76.9/72.2/82.8/72.0, diagonal sum 76.0 (ours)");
  const a5 = accs(T5), a4 = accs(T4);
  ok(a5.k.toFixed(3) === "0.653" && a5.e.toFixed(3) === "0.413" && a5.O.toFixed(3) === "0.796", `Eq. 24 on Table 5: chance agreement ${a5.e.toFixed(3)}, kappa ${a5.k.toFixed(3)} (ours)`);
  ok(a4.k.toFixed(3) === "0.667" && a4.e.toFixed(2) === "0.25", `Eq. 24 on Table 4's counts: chance agreement ${a4.e.toFixed(3)}, kappa ${a4.k.toFixed(3)} (ours)`);
  const ch = accs(normalize([[.036, .096], [.004, .864]], 20));
  ok(Math.abs(ch.col[0] - .5) < 1e-4 && Math.abs(ch.row[0] - .5) < 1e-4, `Sec. 1.2: a 4% change map normalizes to ${(100 * ch.col[0]).toFixed(1)}% change`);
  ok(Math.abs((a5.O - a5.col[0]) / (1 - a5.col[0]) - (a5.O - .554) / .446) < 1e-9 && accs([[.554, .264, .108, .074], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]).k === 0, "a map that calls everything cheese has kappa 0 under Eq. 24");
  // kappa against overall accuracy over 300 maps of the paper pizza, made the way the page makes them (ours)
  const P = K.bakePaperPizza(K.SEED), r = K.rng(808), other = new Int8Array(K.N * K.N), od = new Float64Array(K.N * K.N);
  for (const i of P.ids) { const t = P.truth[i]; let b = -1, bd = 1e9; for (let k = 0; k < 4; k++) if (k !== t && P.dist[k][i] < bd) { bd = P.dist[k][i]; b = k; } other[i] = b; od[i] = bd + 4 * P.jit[i]; }
  const edge = P.ids.slice().sort((a, b) => od[a] - od[b]), lazy = P.ids.filter(i => P.truth[i] !== 0).sort((a, b) => (P.dist[0][a] + 4 * P.jit[a]) - (P.dist[0][b] + 4 * P.jit[b])), keen = P.ids.filter(i => P.truth[i] !== 3).sort((a, b) => (P.dist[3][a] + 4 * P.jit[a]) - (P.dist[3][b] + 4 * P.jit[b]));
  const makeMap = (e, l, q) => { const map = Int8Array.from(P.truth); for (let s = 0, n = Math.round(e * P.T); s < n; s++) map[edge[s]] = other[edge[s]]; for (let s = 0, n = Math.round(l * lazy.length); s < n; s++) map[lazy[s]] = 0; for (let s = 0, n = Math.round(q * keen.length); s < n; s++) map[keen[s]] = 3;
    const c = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]; for (const i of P.ids) c[map[i]][P.truth[i]]++; return c.map(row => row.map(v => v / P.T)); };
  const xs = [], ys = [];
  for (let q = 0; q < 300; q++) { const u = r(), a = accs(makeMap(r() * .6, u >= .4 && u < .7 ? r() : 0, u >= .7 ? r() * .5 : 0)); xs.push(a.O); ys.push(a.k); }
  const mx = sum(xs) / 300, my = sum(ys) / 300; let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < 300; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  const rr = sxy / Math.sqrt(sxx * syy);
  ok(rr > .95, `kappa against overall accuracy over 300 maps of the paper pizza: r = ${rr.toFixed(3)} (Liu et al. 2007; ours)`);
  const e0 = accs(makeMap(.2, 0, 0)), e1 = accs(makeMap(.2, .5, 0));
  ok(e1.e > e0.e && Math.abs(e0.e - a5.e) < .03, `edge mistakes alone keep chance agreement near Table 5's (${(100 * e0.e).toFixed(1)}%); calling half the rest cheese raises it (${(100 * e1.e).toFixed(1)}%)`);
}

// ---- 10 · Tasting the Training Slice ----
console.log("Tasting the training slice (explainer 10)");
{
  const K10 = new Function(kit + "; return {bakePaperPizza, SEED, rng, bakePhoto, knnClassify, splitHalf, sampleTwoStage, mapStrata, pickFrom, countMatrix, stratEstimate, N};")();
  const fp = a => { let x = 2166136261 >>> 0; for (const v of a) { x ^= (v & 255); x = Math.imul(x, 16777619) >>> 0; } return x.toString(16); };
  const P = K10.bakePaperPizza(K10.SEED), before = fp(P.truth) + fp(P.map), ph = K10.bakePhoto(P, K10.SEED);
  ok(fp(P.truth) + fp(P.map) === before && before === "41055a28" + "1798ad01", "the photo leaves the paper pizza unchanged");
  let inRange = true, crustOff = true; for (let i = 0; i < K10.N * K10.N; i++) for (let c = 0; c < 3; c++) { const v = ph.band[3 * i + c]; if (P.inside[i]) inRange = inRange && v >= 0 && v <= 1; else crustOff = crustOff && v === -1; }
  ok(inRange && crustOff, "photo bands are 0-1 on the pizza and -1 on the crust");
  const m = a => a.reduce((x, y) => x + y, 0) / a.length, sd = a => { const u = m(a); return Math.sqrt(a.reduce((x, y) => x + (y - u) ** 2, 0) / (a.length - 1)); };
  const acc = (map, ids) => { let h = 0; for (const i of ids) h += map[i] === P.truth[i]; return 100 * h / ids.length; };
  // the bucketed search is exact: same answer as brute force
  { const r = K10.rng(3), g = K10.sampleTwoStage(16, 25, r), s = K10.splitHalf(g, false, r), lam = 40, k = 3, fast = K10.knnClassify(P, ph, s.train, k, lam);
    let same = true; for (const i of P.ids.filter((_, q) => q % 37 === 0)) { const x = i % K10.N, y = (i / K10.N) | 0, d = s.train.map(j => { let c = 0; for (let b = 0; b < 3; b++) c += (ph.band[3 * i + b] - ph.band[3 * j + b]) ** 2; return [(j % K10.N - x) ** 2 + (((j / K10.N) | 0) - y) ** 2 + lam * lam * c, j]; }).sort((a, b) => a[0] - b[0]).slice(0, k);
      const v = [0, 0, 0, 0]; for (const [, j] of d) v[P.truth[j]]++; let best = P.truth[d[0][1]]; for (let c = 0; c < 4; c++) if (v[c] > v[best]) best = c; same = same && fast[i] === best; }
    ok(same, "knnClassify matches a brute-force search");
    ok(s.train.length === 200 && s.test.length === 200 && !s.train.some(i => s.test.includes(i)), "split by spot: 200 / 200, disjoint");
    const q = K10.splitHalf(g, true, r), sq = ids => new Set(ids.map(i => P.piece[i]));
    ok(q.train.length === 200 && [...sq(q.train)].every(p => !sq(q.test).has(p)) && sq(q.train).size === 8, "split by square: 8 whole squares each way");
    ok(acc(K10.knnClassify(P, ph, s.train, 1, lam), s.train) === 100, "tasting the training slice with 1 neighbour: 100%"); }
  // 30 seeded tastings at the page's defaults (16 squares, 25 bites, position and colour, 3 neighbours)
  const fresh = (map, r) => { const Q = { ids: P.ids, map, truth: P.truth }, st = K10.mapStrata(Q), W = st.map(s => s.length / P.T), ids = st.flatMap(s => K10.pickFrom(s, Math.min(25, s.length), r)); return 100 * K10.stratEstimate(K10.countMatrix(Q, ids), W).O; };
  const run = (mm, b, lam, k, seed, n = 30) => { const r = K10.rng(seed), o = { spot: [], sq: [], ind: [], cSpot: [], cSq: [] };
    for (let t = 0; t < n; t++) { const g = K10.sampleTwoStage(mm, b, r);
      for (const bySq of [false, true]) { const s = K10.splitHalf(g, bySq, r), map = K10.knnClassify(P, ph, s.train, k, lam), real = acc(map, P.ids);
        (bySq ? o.sq : o.spot).push(acc(map, s.test) - real); (bySq ? o.cSq : o.cSpot).push(acc(map, s.test)); if (!bySq) o.ind.push(fresh(map, r) - real); } } return o; };
  const d = run(16, 25, 40, 3, 101);
  ok(m(d.cSpot) > m(d.cSq) + 10, `split by spot claims more than split by square (${m(d.cSpot).toFixed(1)}% vs ${m(d.cSq).toFixed(1)}%)`);
  ok(m(d.spot) > 8 && d.spot.filter(v => v > 0).length >= 28, `split by spot is graded too kindly: gap ${m(d.spot).toFixed(1)} points, kind ${d.spot.filter(v => v > 0).length} of 30 times`);
  ok(Math.abs(m(d.sq)) < 6, `split by square lands near its real accuracy (gap ${m(d.sq).toFixed(1)} points)`);
  ok(Math.abs(m(d.ind)) < 3 * sd(d.ind) / Math.sqrt(30) + 0.3, `a fresh sample stratified by the map is unbiased (gap ${m(d.ind).toFixed(2)} points, spread ${sd(d.ind).toFixed(1)})`);
  const c = run(16, 25, 1000, 3, 102, 10), e = run(64, 25, 40, 3, 103, 10);
  ok(m(c.spot) < 4 && m(c.spot) < m(d.spot) / 3, `colour only, the leak nearly vanishes (gap ${m(c.spot).toFixed(1)} points)`);
  ok(m(e.spot) < 4 && m(e.spot) < m(d.spot) / 3, `with bites in all 64 squares, so does the inflation (gap ${m(e.spot).toFixed(1)} points)`);
  const f = run(8, 100, 15, 3, 104, 10);
  ok(m(f.spot) > m(d.spot), `fewer squares, more bites and more weight on position leak more (gap ${m(f.spot).toFixed(1)} points)`);
}

// ---- 09 · Wrong Amount, Wrong Place ----
console.log("Quantity, exchange and shift (explainer 09)");
{
  // the page's own helpers, lifted from its source: components() is S&F Eqs. 6-11 and P&S Eqs. 1-9, merge() joins two classes
  const src = fs.readFileSync(path.join(root, "src", "09-wrong-amount-wrong-place.html"), "utf8");
  const a = src.indexOf("function components(M){"), b = src.indexOf("\n}\n", src.indexOf("function merge(M,a,b){")) + 3;
  const H = new Function("const sum=a=>a.reduce((x,y)=>x+y,0);" + src.slice(a, b) + "; return {components, merge};")();
  const e1 = v => v.toFixed(1), near = (x, y, d = 1e-9) => Math.abs(x - y) <= d;
  const T5 = H.components(K.TABLE5);
  ok(e1(T5.O) === "79.6" && e1(T5.D) === "20.4" && e1(T5.Q) === "4.6" && e1(T5.A) === "15.8" && near(T5.Q + T5.A, T5.D),
    `Table 5: D = 100 - 79.6 = ${e1(T5.D)} = Q ${e1(T5.Q)} + A ${e1(T5.A)} (Eqs. 6-11)`);
  ok(e1(T5.E) === "9.6" && e1(T5.S) === "6.2" && near(T5.Q + T5.E + T5.S, T5.D) && near(T5.E + T5.S, T5.A),
    `Table 5: exchange ${e1(T5.E)} + shift ${e1(T5.S)} = A, so D = ${e1(T5.Q)} + ${e1(T5.E)} + ${e1(T5.S)} (P&S Eq. 9)`);
  const pairs = T5.ex.flat().reduce((x, y) => x + y, 0);
  ok(e1(T5.ex[1][0]) === "8.0" && near(pairs, T5.E) && e1(T5.ex[3][1]) === "0.8" && e1(T5.ex[3][2]) === "0.8",
    `Table 5: cheese-mushroom exchange ${e1(T5.ex[1][0])} of ${e1(T5.E)}; the six pair exchanges add to E (P&S Eq. 3)`);
  ok(e1(T5.q[3]) === "2.4" && e1(T5.e[3]) === "1.6" && e1(T5.s[3]) === "2.0" && e1(T5.d[3]) === "6.0",
    `Table 5, anchovy: quantity ${e1(T5.q[3])}, exchange ${e1(T5.e[3])}, shift ${e1(T5.s[3])}, d = ${e1(T5.d[3])}`);
  ok([0, 1, 2, 3].every(k => near(T5.a[k], T5.e[k] + T5.s[k]) && near(T5.a[k], T5.d[k] - T5.q[k])), "each topping's a_k (Eq. 8) is its exchange plus its shift, and d_k - q_k");
  // P&S Fig. 1 (p. 7545): seven six-pixel cases, map then reference, two columns of three read across
  const cases = [["AAAAAA", "BBBBBB", "6/0/0"], ["ABABAB", "BABABA", "0/6/0"], ["AABBCC", "CCAABB", "0/0/6"], ["AABBCC", "BBAAAA", "2/4/0"],
    ["AAAABB", "BBBBCC", "4/0/2"], ["AABBCC", "BCAABC", "0/2/3"], ["AABBCC", "BCAABB", "1/2/3"]];
  const got = cases.map(([m, r]) => { const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let i = 0; i < 6; i++) M["ABC".indexOf(m[i])]["ABC".indexOf(r[i])]++; const c = H.components(M); return `${c.Q}/${c.E}/${c.S}`; });
  ok(got.every((v, k) => v === cases[k][2]), `P&S Fig. 1's seven cases: ${got.join(", ")}`);
  // any square matrix: Q + E + S = D = Q + A = total - trace, nothing negative, two classes have no shift
  const r = K.rng(909); let bad = 0, worst = 0, twoShift = 0;
  for (let t = 0; t < 600; t++) { const c = 2 + Math.floor(r() * 5), M = []; for (let i = 0; i < c; i++) { M.push([]); for (let j = 0; j < c; j++) M[i].push(r() < .3 ? 0 : Math.floor(r() * (i === j ? 50 : 12))); }
    const o = H.components(M), tot = M.flat().reduce((x, y) => x + y, 0), tr = M.reduce((s, row, k) => s + row[k], 0);
    worst = Math.max(worst, Math.abs(o.Q + o.E + o.S - o.D), Math.abs(o.Q + o.A - o.D), Math.abs(tot - tr - o.D));
    if ([o.Q, o.E, o.S, o.A, ...o.q, ...o.e, ...o.s].some(v => v < -1e-9)) bad++;
    if (c === 2 && o.S !== 0) twoShift++; }
  ok(worst < 1e-9 && !bad && !twoShift, `600 random matrices (2-6 classes): Q + E + S = Q + A = D = total - trace (worst gap ${worst.toExponential(1)}), nothing negative, two classes never shift`);
  // merging cheese and mushroom
  const Cm = H.components(H.merge(K.TABLE5, 0, 1));
  ok(e1(Cm.D) === "9.2" && e1(T5.D - Cm.D) === "11.2" && e1(Cm.E) === "5.2" && e1(Cm.Q) === "3.2" && e1(Cm.S) === "0.8",
    `merge cheese + mushroom: D ${e1(T5.D)} -> ${e1(Cm.D)} (11.2 gone: their 8.0 exchange and 3.2 one-sided); then Q ${e1(Cm.Q)}, E ${e1(Cm.E)}, S ${e1(Cm.S)}`);
  // the page's three edits each move one component. Quantity: correct mushroom -> map cheese. Exchange: pairs, correct cheese -> map
  // mushroom and correct mushroom -> map cheese. Shift: correct mushroom -> map cheese, correct anchovy -> map mushroom, correct cheese -> map anchovy
  const P = K.bakePaperPizza(K.SEED), base = H.components(P.cell), pts = v => 100 * v / P.T;
  const edit = (nq, ne, ns) => { const M = P.cell.map(row => row.slice());
    M[0][1] += nq; M[1][1] -= nq;
    M[1][0] += ne; M[0][0] -= ne; M[0][1] += ne; M[1][1] -= ne;
    M[0][1] += ns; M[1][1] -= ns; M[1][3] += ns; M[3][3] -= ns; M[3][0] += ns; M[0][0] -= ns;
    return H.components(M); };
  const same = (x, y) => near(pts(x), pts(y), 1e-9);
  let pure = true;
  for (const n of [1, 144, 1152]) { const o = edit(n, 0, 0); pure = pure && same(o.Q, base.Q + n) && same(o.E, base.E) && same(o.S, base.S) && same(o.D, base.D + n); }
  for (const n of [1, 72, 432]) { const o = edit(0, n, 0); pure = pure && same(o.Q, base.Q) && same(o.E, base.E + 2 * n) && same(o.S, base.S) && same(o.D, base.D + 2 * n); }
  for (const n of [1, 48, 144]) { const o = edit(0, 0, n); pure = pure && same(o.Q, base.Q) && same(o.E, base.E) && same(o.S, base.S + 3 * n) && same(o.D, base.D + 3 * n); }
  const all = edit(1152, 432, 144);
  ok(pure && same(all.Q, base.Q + 1152) && same(all.E, base.E + 864) && same(all.S, base.S + 432),
    "the page's edits: quantity, exchange and shift each move their own component only, up to the slider limits, and add up together");
  ok(e1(pts(base.D)) === "20.4" && e1(pts(base.Q)) === "4.6" && e1(pts(base.E)) === "9.6" && e1(pts(base.S)) === "6.2", "this pizza's census splits like Table 5: 20.4 = 4.6 + 9.6 + 6.2");
}

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
