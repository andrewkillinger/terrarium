// Small deterministic PRNG used by the world so that tests are reproducible
// and no rule calls Math.random() directly.
export type Rng = {
  next(): number; // [0, 1)
  int(n: number): number; // integer in [0, n)
  chance(p: number): boolean; // true with probability p
  sign(): number; // -1 or +1
  seed(s: number): void;
};

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(n) {
      return (next() * n) | 0;
    },
    chance(p) {
      return next() < p;
    },
    sign() {
      return next() < 0.5 ? -1 : 1;
    },
    seed(s) {
      a = s >>> 0;
    },
  };
}
