/* ---- Pizza Map Lab shared kit (src/kit.js), pasted identically into every page ----
   The "paper pizza": a square sheet pizza, 120x120 spots inside a crust border and cut into
   an 8x8 grid of 15x15 squares (think image chips), whose true error matrix is exactly
   Table 5 of Stehman & Foody (2019). Classes A-D are cheese, mushroom, pepperoni, anchovy.
   Map shares are 60/25/10/5 and reference shares are 55.4/26.4/10.8/7.4. */
const N=128, EDGE=4, CUTS=8, CHIP=15, SEED=20190518; /* study area is x,y in [EDGE, EDGE+CUTS*CHIP) */
const NAMES=["cheese","mushroom","pepperoni","anchovy"];
const TITLE=["Cheese","Mushroom","Pepperoni","Anchovy"];
const PAPER_CLASS=["A","B","C","D"];
const VAR=[["--cheese-a","--cheese-b"],["--mush-a","--mush-b"],["--pep-a","--pep-b"],["--anch-a","--anch-b"]];
const TABLE5=[[50.4,7.2,2.4,0],[4.0,18.0,0,3.0],[0,0.8,8.0,1.2],[1.0,0.4,0.4,3.2]]; /* % of area; rows map, columns reference */
const MAP_SHARE=[60,25,10,5];
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function nb4(i){const x=i%N,y=(i/N)|0,o=[]; if(x>0)o.push(i-1); if(x<N-1)o.push(i+1); if(y>0)o.push(i-N); if(y<N-1)o.push(i+N); return o;}
function bakePaperPizza(seed){
  const r=rng(seed), NN=N*N, inside=new Uint8Array(NN), crust=new Uint8Array(NN), piece=new Int16Array(NN).fill(-1), ids=[], END=EDGE+CUTS*CHIP;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;
    if(x>=EDGE&&x<END&&y>=EDGE&&y<END){inside[i]=1; ids.push(i); piece[i]=Math.floor((y-EDGE)/CHIP)*CUTS+Math.floor((x-EDGE)/CHIP);}
    else crust[i]=1;}
  const T=ids.length;
  /* target cell counts: Table 5 scaled to this pizza, map row totals exactly 60/25/10/5 */
  const rowT=MAP_SHARE.map(w=>Math.round(w*T/100)); rowT[0]=T-rowT[1]-rowT[2]-rowT[3];
  const cell=TABLE5.map((row,i)=>row.map((v,j)=>i===j?0:Math.round(v*T/100)));
  for(let i=0;i<4;i++){let off=0; for(let j=0;j<4;j++) if(j!==i) off+=cell[i][j]; cell[i][i]=rowT[i]-off;}
  const colT=[0,1,2,3].map(j=>cell[0][j]+cell[1][j]+cell[2][j]+cell[3][j]);
  /* the real pizza */
  const truth=new Int8Array(NN).fill(-1); for(const i of ids) truth[i]=0;
  const count=[T,0,0,0], put=(i,k)=>{count[truth[i]]--; truth[i]=k; count[k]++;};
  const stamp=(cells,k,minFrac)=>{let ok=0; const keep=[];
    for(const [x,y] of cells){ if(x<0||y<0||x>=N||y>=N) continue; const i=y*N+x; if(inside[i]&&truth[i]===0){ok++; keep.push(i);} }
    if(cells.length&&ok/cells.length>=minFrac){keep.forEach(i=>put(i,k)); return true;} return false;};
  const randPt=m=>[EDGE+m+r()*(CUTS*CHIP-2*m), EDGE+m+r()*(CUTS*CHIP-2*m)];
  const peps=[];
  for(let t=0;t<5000&&count[2]<colT[2]-80;t++){ const [px,py]=randPt(8);
    if(!peps.every(p=>Math.hypot(p[0]-px,p[1]-py)>14.5)) continue;
    const cells=[]; for(let y=Math.floor(py-7);y<=py+7;y++) for(let x=Math.floor(px-7);x<=px+7;x++) if(Math.hypot(x+.5-px,y+.5-py)<6.3) cells.push([x,y]);
    if(stamp(cells,2,1)) peps.push([px,py]); }
  const cap=[]; for(let dy=-5;dy<=0;dy++) for(let dx=-7;dx<=7;dx++) if((dx/7.5)**2+(dy/5.5)**2<=1) cap.push([dx,dy]);
  for(let dy=1;dy<=5;dy++) for(let dx=-2;dx<=1;dx++) cap.push([dx,dy]);
  const rots=[cap, cap.map(([a,b])=>[-b,a]), cap.map(([a,b])=>[-a,-b]), cap.map(([a,b])=>[b,-a])];
  for(let t=0;t<9000&&count[1]<colT[1]-60;t++){ const [mx,my]=randPt(7), o=rots[Math.floor(r()*4)];
    stamp(o.map(([a,b])=>[Math.round(mx)+a,Math.round(my)+b]),1,.85); }
  for(let t=0;t<9000&&count[3]<colT[3]-40;t++){ const [ax,ay]=randPt(10), th=r()*Math.PI, L=16+r()*10, ux=Math.cos(th), uy=Math.sin(th), cells=[];
    for(let y=Math.floor(ay-L/2-2);y<=ay+L/2+2;y++) for(let x=Math.floor(ax-L/2-2);x<=ax+L/2+2;x++){
      const vx=x+.5-ax, vy=y+.5-ay, s=vx*ux+vy*uy, q=Math.abs(-vx*uy+vy*ux); if(Math.abs(s)<=L/2&&q<=1.4) cells.push([x,y]); }
    stamp(cells,3,.9); }
  /* nudge each topping's edges until the reference shares are exact */
  for(const k of [2,1,3]) for(let pass=0;pass<400&&count[k]!==colT[k];pass++){
    const need=colT[k]-count[k];
    const cand=ids.filter(i=>need>0?(truth[i]===0&&nb4(i).some(j=>truth[j]===k)):(truth[i]===k&&nb4(i).some(j=>truth[j]===0)));
    for(let a=cand.length-1;a>0;a--){const b=Math.floor(r()*(a+1)); const t=cand[a]; cand[a]=cand[b]; cand[b]=t;}
    const m=Math.min(Math.abs(need),Math.max(1,Math.ceil(cand.length/3)),cand.length);
    for(let q=0;q<m;q++) put(cand[q],need>0?k:0); }
  /* distance from every pixel to the nearest pixel of each real topping */
  const dist=[0,1,2,3].map(k=>{const d=new Int16Array(NN).fill(9999), q=[]; for(const i of ids) if(truth[i]===k){d[i]=0; q.push(i);}
    for(let h=0;h<q.length;h++){const i=q[h]; for(const j of nb4(i)) if(d[j]>d[i]+1){d[j]=d[i]+1; q.push(j);}} return d;});
  const rp=rng(seed*31+7), jit=new Float64Array(NN), tex=new Uint8Array(NN);
  for(let i=0;i<NN;i++){jit[i]=rp(); tex[i]=rp()<.3?1:0;}
  /* the classifier's map: each Table 5 mistake is placed where that topping's edge is closest */
  const map=Int8Array.from(truth);
  for(let j=0;j<4;j++){ let pool=ids.filter(i=>truth[i]===j);
    const order=[0,1,2,3].filter(i=>i!==j&&cell[i][j]>0).sort((a,b)=>cell[b][j]-cell[a][j]);
    for(const i of order){ pool.sort((a,b)=>(dist[i][a]+4*jit[a])-(dist[i][b]+4*jit[b]));
      for(const p of pool.slice(0,cell[i][j])) map[p]=i; pool=pool.slice(cell[i][j]); } }
  return {inside,crust,piece,ids,T,truth,map,dist,jit,tex,cell,rowT,colT};
}
function hexRGB(h){h=String(h).trim().replace("#",""); if(h.length===3) h=h.split("").map(c=>c+c).join(""); const n=parseInt(h,16); return [n>>16&255,n>>8&255,n&255];}
function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
function pizzaPalette(){return {top:VAR.map(v=>[hexRGB(cssVar(v[0])),hexRGB(cssVar(v[1]))]), crust:[hexRGB(cssVar("--crust-a")),hexRGB(cssVar("--crust-b"))]};}
/* paint one colour per pizza pixel (colorAt returns [r,g,b,alpha] or null), scaled up with crisp edges */
function paintPizza(cv,colorAt){
  if(!cv._off){cv._off=document.createElement("canvas"); cv._off.width=N; cv._off.height=N;}
  const octx=cv._off.getContext("2d"), img=octx.createImageData(N,N), d=img.data;
  for(let i=0;i<N*N;i++){const c=colorAt(i); if(!c) continue; d[4*i]=c[0]; d[4*i+1]=c[1]; d[4*i+2]=c[2]; d[4*i+3]=c.length>3?c[3]:255;}
  octx.putImageData(img,0,0);
  const ctx=cv.getContext("2d"); ctx.imageSmoothingEnabled=false; ctx.clearRect(0,0,cv.width,cv.height); ctx.drawImage(cv._off,0,0,cv.width,cv.height);
  /* faint knife cuts between the 8x8 squares */
  const s=cv.width/N; ctx.save(); ctx.globalAlpha=.22; ctx.fillStyle="#2b1b12";
  for(let k=1;k<CUTS;k++){const p=Math.round((EDGE+k*CHIP)*s)-1; ctx.fillRect(p,EDGE*s,2,CUTS*CHIP*s); ctx.fillRect(EDGE*s,p,CUTS*CHIP*s,2);}
  ctx.restore();
  return ctx;
}
/* ---- sampling designs (Sec. 2). Each returns pixel indices; r is a PRNG such as rng(seed) or Math.random ---- */
const SIDE=CUTS*CHIP; /* the study area is SIDE x SIDE spots */
const mapStrata=P=>{const s=[[],[],[],[]]; for(const i of P.ids) s[P.map[i]].push(i); return s;};
/* n distinct picks from a list, every member equally likely */
function pickFrom(list,n,r){ n=Math.min(n,list.length); const got=new Set();
  if(n>list.length/2){const a=list.slice(); for(let k=0;k<n;k++){const j=k+Math.floor(r()*(a.length-k)); const t=a[k]; a[k]=a[j]; a[j]=t;} return a.slice(0,n);}
  while(got.size<n) got.add(list[Math.floor(r()*list.length)]); return [...got]; }
const sampleSRS=(P,n,r)=>pickFrom(P.ids,n,r);
/* one random start, then every s-th spot across and down; n must be a square whose root divides SIDE */
function sampleSystematic(P,n,r){ const s=SIDE/Math.sqrt(n); if(s%1) throw new Error("systematic: "+n+" spots don't make a grid");
  const x0=Math.floor(r()*s), y0=Math.floor(r()*s), out=[];
  for(let gy=y0;gy<SIDE;gy+=s) for(let gx=x0;gx<SIDE;gx+=s) out.push((EDGE+gy)*N+EDGE+gx); return out; }
/* split n by shares, rounding so the parts still add to n (largest remainder) */
function allocate(n,shares){ const t=shares.reduce((a,b)=>a+b,0), raw=shares.map(v=>n*v/t), out=raw.map(Math.floor);
  const order=raw.map((v,k)=>[v-out[k],k]).sort((a,b)=>b[0]-a[0]); for(let q=0;q<n-out.reduce((a,b)=>a+b,0);q++) out[order[q][1]]++; return out; }
/* simple random within each stratum: alloc[h] picks from strata[h] */
const sampleStratified=(strata,alloc,r)=>strata.flatMap((s,h)=>pickFrom(s,alloc[h],r));
/* one-stage cluster: the study area is tiled by b x b blocks; m blocks are picked at random and every spot in them is tasted */
function sampleClusters(m,b,r){ const per=SIDE/b; if(per%1) throw new Error("clusters: "+b+" doesn't tile the pizza");
  const blocks=pickFrom([...Array(per*per).keys()],m,r);
  return blocks.map(q=>{const bx=(q%per)*b, by=Math.floor(q/per)*b, g=[];
    for(let y=0;y<b;y++) for(let x=0;x<b;x++) g.push((EDGE+by+y)*N+EDGE+bx+x); return g;}); }
/* spots in the outer ring of squares, the pieces with crust: where a convenience taster would grab from */
const edgePieceSpots=P=>P.ids.filter(i=>{const q=P.piece[i], qx=q%CUTS, qy=Math.floor(q/CUTS); return qx===0||qy===0||qx===CUTS-1||qy===CUTS-1;});
/* ---- estimators (Sec. 4.2). Rows are the map (strata), columns the reference ---- */
function countMatrix(P,ids){ const c=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]; for(const i of ids) c[P.map[i]][P.truth[i]]++; return c; }
/* Stratified estimator, Eqs. 12-20, as proportions (0-1). W = each map class's share of the map.
   Used for stratified samples and, as poststratification, for simple random and systematic ones.
   Variances use n_i+ - 1 throughout, which reproduces every Table 5 standard error from Table 4.
   A row with no tastes can't be estimated (ok=false); a row with one taste gives estimates but no variance.
   Optional Nh (spots in each stratum) applies the finite population correction, 1 - n_i+/N_i+, to each stratum's
   variance term. The paper's formulas leave it out (real maps have millions of pixels); 04 uses it to show the gap. */
function stratEstimate(c,W,Nh){
  const K=c.length, nr=c.map(row=>row.reduce((a,b)=>a+b,0)), p=c.map((row,i)=>row.map(v=>nr[i]?W[i]*v/nr[i]:0));
  const q=nr.map((n,i)=>(Nh?1-n/Nh[i]:1)/(n-1)); /* each stratum's variance divisor, with the correction if asked */
  const col=[...Array(K).keys()].map(j=>p.reduce((a,row)=>a+row[j],0));
  const U=nr.map((n,i)=>n?c[i][i]/n:NaN), Pa=col.map((v,j)=>v?p[j][j]/v:NaN);
  let O=0, vO=0; for(let i=0;i<K;i++){O+=p[i][i]; vO+=W[i]**2*U[i]*(1-U[i])*q[i];}
  const vU=U.map((u,i)=>u*(1-u)*q[i]);
  const vP=Pa.map((Pj,j)=>{ let s=0; for(let i=0;i<K;i++) if(i!==j&&nr[i]){const f=c[i][j]/nr[i]; s+=W[i]**2*f*(1-f)*q[i];}
    return (W[j]**2*(1-Pj)**2*U[j]*(1-U[j])*q[j]+Pj**2*s)/col[j]**2; });
  const vA=col.map((_,k)=>{let s=0; for(let i=0;i<K;i++) if(nr[i]){const f=c[i][k]/nr[i]; s+=W[i]**2*f*(1-f)*q[i];} return s;});
  const se=v=>v>=0&&isFinite(v)?Math.sqrt(v):NaN;
  return {ok:nr.every(n=>n>0), nr, p, O, U, P:Pa, area:col, se:{O:se(vO), U:vU.map(se), P:vP.map(se), area:vA.map(se)}};
}
/* One-stage cluster estimator for m equal-size blocks picked by simple random sampling (Stehman 1997b):
   proportions are block averages, accuracies are ratios, and standard errors come from the spread between blocks.
   Without the finite population correction, like the paper's stratified formulas. */
function clusterEstimate(P,groups){
  const m=groups.length, K=4, z=()=>new Float64Array(m), ok=z(), tr=[...Array(K)].map(z), mp=[...Array(K)].map(z), hit=[...Array(K)].map(z);
  groups.forEach((g,c)=>{ for(const i of g){const a=P.map[i], b=P.truth[i]; tr[b][c]++; mp[a][c]++; if(a===b){ok[c]++; hit[a][c]++;}}
    const L=g.length; ok[c]/=L; for(let k=0;k<K;k++){tr[k][c]/=L; mp[k][c]/=L; hit[k][c]/=L;} });
  const mean=a=>a.reduce((s,v)=>s+v,0)/m;
  const seMean=a=>{const u=mean(a); return Math.sqrt(a.reduce((s,v)=>s+(v-u)**2,0)/(m-1)/m);};
  const ratio=(y,x)=>{const R=mean(y)/mean(x), xb=mean(x); let s=0; for(let c=0;c<m;c++) s+=(y[c]-R*x[c])**2;
    return [R, xb?Math.sqrt(s/(m-1)/m)/xb:NaN];};
  const P_=[], U=[], seP=[], seU=[];
  for(let k=0;k<K;k++){ [P_[k],seP[k]]=ratio(hit[k],tr[k]); [U[k],seU[k]]=ratio(hit[k],mp[k]); }
  const O=mean(ok), area=tr.map(mean);
  return {ok:true, m, O, U, P:P_, area, se:{O:seMean(ok), U:seU, P:seP, area:tr.map(seMean)}};
}
/* ---- repeats histogram on a fixed 0-100% axis: one row of columns per method, a dashed truth line, a triangle at each row's average.
   rows = [{name, vals (in %), col (CSS colour), dim}]; opt = {bin, left (label width), px (device pixel ratio)}.
   Returns [{mean, sd, n}] per row ---- */
function drawRepeats(cv,rows,truth,opt={}){
  const px=opt.px||1, ctx=cv.getContext("2d"), Wd=cv.width/px, Hd=cv.height/px, ink=cssVar("--ink"), muted=cssVar("--muted"), font=cssVar("--f-body");
  ctx.setTransform(px,0,0,px,0,0); ctx.clearRect(0,0,Wd,Hd);
  const bin=opt.bin||1, lo=0, hi=100; /* always the full 0-100% scale, so every metric and design reads on the same axis */
  const L=opt.left||150, Rm=24, T=22, B=34, gap=10, ph=(Hd-T-B-gap*(rows.length-1))/rows.length, X=v=>L+(v-lo)/(hi-lo)*(Wd-L-Rm);
  const nb=Math.ceil((hi-lo)/bin), bw=(Wd-L-Rm)/nb;
  ctx.font=`12px ${font}`; ctx.textBaseline="middle";
  const out=rows.map((row,ri)=>{
    const top=T+ri*(ph+gap), bins=new Array(nb).fill(0); row.vals.forEach(v=>bins[Math.max(0,Math.min(nb-1,Math.floor((v-lo)/bin)))]++);
    const mx=Math.max(1,...bins); ctx.globalAlpha=row.dim?.35:1; ctx.fillStyle=row.col;
    bins.forEach((c,b)=>{ if(!c) return; const h=Math.max(2,(ph-6)*c/mx); ctx.fillRect(Math.round(X(lo+b*bin))+1, Math.round(top+ph-h), Math.max(1,Math.round(bw)-1), Math.round(h)); });
    ctx.strokeStyle=ink; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(L,top+ph+.5); ctx.lineTo(Wd-Rm,top+ph+.5); ctx.stroke();
    const n=row.vals.length, mean=n?row.vals.reduce((a,b)=>a+b,0)/n:NaN, sd=n>1?Math.sqrt(row.vals.reduce((a,v)=>a+(v-mean)**2,0)/(n-1)):NaN;
    if(n){ ctx.fillStyle=row.col; ctx.beginPath(); ctx.moveTo(X(mean),top+ph+2); ctx.lineTo(X(mean)-6,top+ph+10); ctx.lineTo(X(mean)+6,top+ph+10); ctx.closePath(); ctx.fill(); }
    ctx.textAlign="left"; ctx.fillStyle=ink; ctx.fillText(row.name,6,top+ph/2-8);
    ctx.fillStyle=muted; ctx.fillText(n?"avg "+mean.toFixed(1)+"%":"no estimate",6,top+ph/2+9);
    ctx.globalAlpha=1; return {mean,sd,n}; });
  ctx.strokeStyle=ink; ctx.lineWidth=2; ctx.setLineDash([5,4]); ctx.beginPath(); ctx.moveTo(X(truth),T-6); ctx.lineTo(X(truth),Hd-B+4); ctx.stroke(); ctx.setLineDash([]);
  const rt=X(truth)>Wd-90; ctx.fillStyle=ink; ctx.textAlign=rt?"right":"left"; ctx.fillText("truth "+truth.toFixed(1)+"%",X(truth)+(rt?-6:6),T-10);
  ctx.textAlign="center"; ctx.fillStyle=muted; const step=Wd<520?20:10;
  for(let v=lo;v<=hi;v+=step){ ctx.fillRect(X(v)-1,Hd-B+6,2,5); ctx.fillText(v+"%",X(v),Hd-B+20); }
  return out;
}
/* ---- end shared kit ---- */
