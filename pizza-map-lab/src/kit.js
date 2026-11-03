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
/* ---- end shared kit ---- */
