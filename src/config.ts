// Grid + display config. Tweak here to rebalance perf vs resolution.
export const GRID_W = 320;
export const GRID_H = 200;
export const CELL_COUNT = GRID_W * GRID_H;

// How many CSS pixels a single cell occupies at 1x. The renderer will also
// dynamically rescale the canvas to fill the viewport while keeping an
// integer upscale factor for crisp pixels.
export const CELL_SIZE = 3;

// Fixed simulation rate. The RAF loop accumulates delta and may run multiple
// ticks per frame if the display lags (capped to MAX_TICKS_PER_FRAME).
export const TICK_HZ = 60;
export const MAX_TICKS_PER_FRAME = 4;

// Bit flags on Grid.flags.
export const FLAG_MOVED = 1 << 0;
export const FLAG_BURNING = 1 << 1;

// Ambient temperature (°C).
export const AMBIENT_TEMP = 20;

// Physically-packed temp range for the Int16Array.
export const TEMP_MIN = -200;
export const TEMP_MAX = 3000;
