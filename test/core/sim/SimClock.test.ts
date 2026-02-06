import { describe, expect, it, vi } from 'vitest';

import { SimClock } from '@/core/sim/SimClock';
import { EventBus } from '@/core/services/EventBus';
import type { CoreEvents } from '@/core/types';

const createClock = (options?: { fixedDeltaMs?: number; maxStepsPerFrame?: number }) => {
  const handler = vi.fn();
  const bus = new EventBus<CoreEvents>();
  const clock = new SimClock(handler, options, bus);
  return { handler, bus, clock };
};

describe('SimClock', () => {
  describe('advance', () => {
    it('calls step handler for each fixed step consumed', () => {
      const { handler, clock } = createClock({ fixedDeltaMs: 100 });

      const steps = clock.advance(250);

      expect(steps).toBe(2);
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith(100);
    });

    it('accumulates remainder across frames', () => {
      const { handler, clock } = createClock({ fixedDeltaMs: 100 });

      clock.advance(50);
      expect(handler).not.toHaveBeenCalled();

      clock.advance(60);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('returns 0 when paused', () => {
      const { handler, clock } = createClock({ fixedDeltaMs: 100 });

      clock.pause();
      const steps = clock.advance(500);

      expect(steps).toBe(0);
      expect(handler).not.toHaveBeenCalled();
    });

    it('returns 0 for non-finite delta', () => {
      const { handler, clock } = createClock({ fixedDeltaMs: 100 });

      expect(clock.advance(NaN)).toBe(0);
      expect(clock.advance(Infinity)).toBe(0);
      expect(handler).not.toHaveBeenCalled();
    });

    it('clamps to maxStepsPerFrame and discards excess accumulator', () => {
      const { handler, clock } = createClock({
        fixedDeltaMs: 100,
        maxStepsPerFrame: 3,
      });

      const steps = clock.advance(1000);

      expect(steps).toBe(3);
      expect(handler).toHaveBeenCalledTimes(3);

      // Excess accumulator was discarded — next small advance should not trigger a step
      const nextSteps = clock.advance(50);
      expect(nextSteps).toBe(0);
    });
  });

  describe('tick tracking', () => {
    it('increments tick and elapsed time per step', () => {
      const { clock } = createClock({ fixedDeltaMs: 100 });

      clock.advance(300);

      expect(clock.tick).toBe(3);
      expect(clock.time).toBe(300);
    });

    it('reports delta from options', () => {
      const { clock } = createClock({ fixedDeltaMs: 50 });
      expect(clock.delta).toBe(50);
    });
  });

  describe('pause / resume / toggle', () => {
    it('starts unpaused', () => {
      const { clock } = createClock();
      expect(clock.isPaused).toBe(false);
    });

    it('pause sets isPaused and emits state', () => {
      const { bus, clock } = createClock();
      const stateHandler = vi.fn();
      bus.on('sim:state', stateHandler);

      clock.pause();
      expect(clock.isPaused).toBe(true);
      expect(stateHandler).toHaveBeenCalledWith(expect.objectContaining({ paused: true }));
    });

    it('pause is idempotent', () => {
      const { bus, clock } = createClock();
      const stateHandler = vi.fn();
      bus.on('sim:state', stateHandler);

      clock.pause();
      clock.pause();
      expect(stateHandler).toHaveBeenCalledTimes(1);
    });

    it('resume unpauses and emits state', () => {
      const { bus, clock } = createClock();
      const stateHandler = vi.fn();
      bus.on('sim:state', stateHandler);

      clock.pause();
      stateHandler.mockClear();

      clock.resume();
      expect(clock.isPaused).toBe(false);
      expect(stateHandler).toHaveBeenCalledWith(expect.objectContaining({ paused: false }));
    });

    it('resume is idempotent', () => {
      const { bus, clock } = createClock();
      const stateHandler = vi.fn();
      bus.on('sim:state', stateHandler);

      clock.resume();
      expect(stateHandler).not.toHaveBeenCalled();
    });

    it('toggle flips paused state', () => {
      const { clock } = createClock();

      clock.toggle();
      expect(clock.isPaused).toBe(true);

      clock.toggle();
      expect(clock.isPaused).toBe(false);
    });
  });

  describe('stepOnce', () => {
    it('executes a single step regardless of pause state', () => {
      const { handler, clock } = createClock({ fixedDeltaMs: 100 });

      clock.pause();
      clock.stepOnce();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(100);
      expect(clock.tick).toBe(1);
    });
  });

  describe('reset', () => {
    it('resets tick, time, and emits state + tick events', () => {
      const { bus, clock } = createClock({ fixedDeltaMs: 100 });
      const tickHandler = vi.fn();
      const stateHandler = vi.fn();
      bus.on('sim:tick', tickHandler);
      bus.on('sim:state', stateHandler);

      clock.advance(300);
      tickHandler.mockClear();
      stateHandler.mockClear();

      clock.reset();

      expect(clock.tick).toBe(0);
      expect(clock.time).toBe(0);
      expect(stateHandler).toHaveBeenCalledWith(expect.objectContaining({ tick: 0, elapsedMs: 0 }));
      expect(tickHandler).toHaveBeenCalledWith(expect.objectContaining({ tick: 0, deltaMs: 0 }));
    });
  });

  describe('event emission', () => {
    it('emits sim:tick for each step with correct payload', () => {
      const { bus, clock } = createClock({ fixedDeltaMs: 100 });
      const tickHandler = vi.fn();
      bus.on('sim:tick', tickHandler);

      clock.advance(200);

      expect(tickHandler).toHaveBeenCalledTimes(2);
      expect(tickHandler).toHaveBeenNthCalledWith(1, {
        tick: 1,
        elapsedMs: 100,
        deltaMs: 100,
      });
      expect(tickHandler).toHaveBeenNthCalledWith(2, {
        tick: 2,
        elapsedMs: 200,
        deltaMs: 100,
      });
    });
  });
});
