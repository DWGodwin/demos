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
}

const kit = fs.readFileSync(path.join(root, "src", "kit.js"), "utf8");
const K = new Function(kit + "; return {bakePaperPizza, SEED, TABLE5, MAP_SHARE, N, CUTS, rng, mapStrata, sampleSRS, sampleSystematic, allocate, sampleStratified, sampleClusters, pickFrom, edgePieceSpots, countMatrix, stratEstimate, clusterEstimate, sampleBySquare, sampleTwoStage, strataEstimate};")();

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

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
