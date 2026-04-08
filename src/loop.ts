import { MAX_TICKS_PER_FRAME, TICK_HZ } from './config';

export type LoopHooks = {
  tick: () => void;
  render: (fps: number) => void;
  isPaused: () => boolean;
  speedMultiplier: () => number;
};

// Fixed-step accumulator driven by requestAnimationFrame.
// - `tick()` runs at a stable 60 Hz (times speedMultiplier)
// - `render()` runs once per RAF frame
// - If the tab lags, ticks catch up up to MAX_TICKS_PER_FRAME per frame
//   (prevents death spirals if we fall behind).
export function startLoop(hooks: LoopHooks): () => void {
  const stepMs = 1000 / TICK_HZ;
  let last = performance.now();
  let accum = 0;
  let running = true;

  // FPS estimator (EMA over last 30 frames).
  let fpsEma = 60;
  let lastFrame = last;

  const frame = (now: number): void => {
    if (!running) return;
    const dt = Math.min(now - last, 250); // clamp tab-hidden spikes
    last = now;

    const frameDt = now - lastFrame || 16.7;
    lastFrame = now;
    const instFps = 1000 / frameDt;
    fpsEma = fpsEma * 0.9 + instFps * 0.1;

    if (!hooks.isPaused()) {
      accum += dt * hooks.speedMultiplier();
      let ticks = 0;
      while (accum >= stepMs && ticks < MAX_TICKS_PER_FRAME) {
        hooks.tick();
        accum -= stepMs;
        ticks++;
      }
      if (accum > stepMs * MAX_TICKS_PER_FRAME) {
        accum = 0; // give up catching up
      }
    } else {
      accum = 0;
    }

    hooks.render(fpsEma);
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);

  return () => {
    running = false;
  };
}
