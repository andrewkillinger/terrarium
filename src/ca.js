(function(){
const M={EMPTY:0,SAND:1,WATER:2,STONE:3,SOIL:4,SEED:5,PLANT:6,FIRE:7};
const colors=[[34,34,34,255],[194,178,128,255],[64,64,255,255],[100,100,100,255],[80,50,20,255],[150,100,50,255],[34,139,34,255],[255,80,0,255]];
let w,h,grid,next,ctx,img,data,stats=new Uint32Array(8);
function idx(x,y){return x+y*w}
function initCA(canvas,width,height){w=width;h=height;ctx=canvas.getContext('2d');canvas.width=w;canvas.height=h;img=ctx.createImageData(w,h);data=img.data;grid=new Uint8Array(w*h);next=new Uint8Array(w*h);for(let x=0;x<w;x++)grid[idx(x,h-1)]=M.SOIL}
function swap(){let t=grid;grid=next;next=t}
function hasN(i,m){let x=i%w,y=(i/w)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy){let nx=x+dx,ny=y+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h&&grid[idx(nx,ny)]===m)return true}return false}
function stepCA(dt){stats.fill(0);next.set(grid);for(let y=h-1;y>=0;--y){for(let x=0;x<w;++x){let i=idx(x,y),c=grid[i];stats[c]++;switch(c){case M.SAND:{if(y+1<h){let b=grid[idx(x,y+1)];if(b===M.EMPTY||b===M.WATER){next[i]=b;next[idx(x,y+1)]=M.SAND;break}let dir=Math.random()<.5?-1:1;if(x+dir>=0&&x+dir<w&&grid[idx(x+dir,y+1)]===M.EMPTY){next[i]=M.EMPTY;next[idx(x+dir,y+1)]=M.SAND}}}break;case M.WATER:{if(y+1<h&&grid[idx(x,y+1)]===M.EMPTY){next[i]=M.EMPTY;next[idx(x,y+1)]=M.WATER;break}let dir=Math.random()<.5?-1:1;if(x+dir>=0&&x+dir<w&&grid[idx(x+dir,y)]===M.EMPTY){next[i]=M.EMPTY;next[idx(x+dir,y)]=M.WATER}if(hasN(i,M.FIRE)&&Math.random()<.01)next[i]=M.EMPTY}break;case M.FIRE:{if(Math.random()<.05){next[i]=M.STONE;break}for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy){let nx=x+dx,ny=y+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h){let n=grid[idx(nx,ny)];if(n===M.PLANT||n===M.SOIL)next[idx(nx,ny)]=M.FIRE;if(n===M.WATER)next[i]=M.EMPTY}}if(Math.random()<.02)next[i]=M.EMPTY}break;case M.SEED:{if(y+1<h&&grid[idx(x,y+1)]===M.SOIL){if(hasN(i,M.WATER)&&Math.random()<.01)next[i]=M.PLANT}else if(y+1<h&&grid[idx(x,y+1)]===M.EMPTY){next[i]=M.EMPTY;next[idx(x,y+1)]=M.SEED}}break;case M.PLANT:{if(hasN(i,M.FIRE))next[i]=M.FIRE;else if(Math.random()<.005){let dir=Math.random()<.5?-1:1;if(x+dir>=0&&x+dir<w&&grid[idx(x+dir,y)]===M.EMPTY)next[idx(x+dir,y)]=M.SEED}}break}}}
swap();for(let i=0;i<grid.length;i++){let c=colors[grid[i]],di=i*4;data[di]=c[0];data[di+1]=c[1];data[di+2]=c[2];data[di+3]=c[3]}ctx.putImageData(img,0,0)}
function paint(x,y,m,r){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){let nx=x+dx,ny=y+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h&&dx*dx+dy*dy<=r*r)grid[idx(nx,ny)]=m}}
function getStats(){return{empty:stats[0],sand:stats[1],water:stats[2],stone:stats[3],soil:stats[4],seed:stats[5],plant:stats[6],fire:stats[7]}}
window.ca={Materials:M,initCA,stepCA,paint,getStats,sample:(x,y)=>grid[idx(x,y)]}
})();
