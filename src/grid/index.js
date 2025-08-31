export class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.front = new Array(width * height).fill(null);
    this.back = new Array(width * height).fill(null);
    this.waterCount = 0;
  }
  index(x, y) { return y * this.width + x; }
  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.width && y < this.height; }
  get(x, y) { return this.front[this.index(x, y)]; }
  set(x, y, mat) {
    const i = this.index(x, y);
    this.front[i] = mat;
    this.back[i] = mat;
  }
  swap() { [this.front, this.back] = [this.back, this.front]; }
  tryMove(x, y, dx, dy) {
    const nx = x + dx, ny = y + dy;
    if (!this.inBounds(nx, ny)) return false;
    const ni = this.index(nx, ny);
    if (this.front[ni] == null) {
      this.back[ni] = this.front[this.index(x, y)];
      this.back[this.index(x, y)] = null;
      return true;
    }
    return false;
  }
  update(materials) {
    this.waterCount = 0;
    const w = this.width, h = this.height;
    for (let y = h - 1; y >= 0; y--) {
      for (let x = 0; x < w; x++) {
        const i = this.index(x, y);
        const mat = this.front[i];
        this.back[i] = mat;
        if (mat === 'SAND') {
          if (this.tryMove(x, y, 0, 1)) continue;
          if (this.tryMove(x, y, -1, 1)) continue;
          if (this.tryMove(x, y, 1, 1)) continue;
        } else if (mat === 'WATER') {
          this.waterCount++;
          if (this.tryMove(x, y, 0, 1)) continue;
          const dir = Math.random() < 0.5 ? -1 : 1;
          if (this.tryMove(x, y, dir, 0)) continue;
          if (this.tryMove(x, y, -dir, 0)) continue;
        } else if (mat === 'FIRE') {
          const dirs = [[0,1],[1,0],[-1,0],[0,-1]];
          for (const [dx, dy] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (this.inBounds(nx, ny)) {
              const t = this.get(nx, ny);
              if (t === 'SEED' || t === 'PLANT' || t === 'SAND') {
                this.back[this.index(nx, ny)] = 'FIRE';
              }
            }
          }
          if (Math.random() < 0.02) this.back[i] = 'SOIL';
        }
      }
    }
    this.swap();
  }
}
