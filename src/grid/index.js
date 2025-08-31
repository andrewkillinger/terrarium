const { Graphics } = PIXI;

const WIDTH = 128;
const HEIGHT = 72;
const CELL = 4;
const colors = { 1:0xC2B280, 2:0x4060FF, 3:0x888888, 4:0xFF8000 };

export function createGrid(app) {
  const data = new Uint8Array(WIDTH * HEIGHT);
  const gfx = new Graphics();
  app.stage.addChild(gfx);

  function paint(x, y, type) {
    if(x<0||y<0||x>=WIDTH||y>=HEIGHT) return;
    data[x + y*WIDTH] = type;
  }

  function update() {
    for(let y=HEIGHT-2; y>=0; y--) {
      for(let x=0; x<WIDTH; x++) {
        const i = x + y*WIDTH;
        const cell = data[i];
        if(cell===1) { // sand
          const below = i + WIDTH;
          if(data[below]===0) { data[below]=1; data[i]=0; }
          else {
            const left = below-1;
            const right = below+1;
            if(data[left]===0) { data[left]=1; data[i]=0; }
            else if(data[right]===0) { data[right]=1; data[i]=0; }
          }
        } else if(cell===2) { // water
          const below = i + WIDTH;
          if(data[below]===0) { data[below]=2; data[i]=0; }
          else {
            const dir = Math.random()<0.5?-1:1;
            const side = i + dir;
            if(data[side]===0) { data[side]=2; data[i]=0; }
          }
        } else if(cell===4) { // fire
          if(Math.random()<0.02) data[i]=0;
          [i-1,i+1,i-WIDTH,i+WIDTH].forEach(n=>{
            if(data[n]===1||data[n]===2) data[n]=4;
          });
        }
      }
    }
  }

  function render() {
    gfx.clear();
    for(let y=0; y<HEIGHT; y++) {
      for(let x=0; x<WIDTH; x++) {
        const cell = data[x + y*WIDTH];
        if(cell>0) {
          gfx.beginFill(colors[cell]);
          gfx.drawRect(x*CELL, y*CELL, CELL, CELL);
          gfx.endFill();
        }
      }
    }
  }

  return {data, paint, update, render, cellSize:CELL, graphics:gfx};
}
