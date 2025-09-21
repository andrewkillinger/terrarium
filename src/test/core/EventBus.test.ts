import { describe, expect, it, vi } from 'vitest';

import { EventBus } from '@/core/services/EventBus';

interface TestEvents extends Record<string, unknown> {
  'foo:event': number;
  'bar:event': void;
}

describe('EventBus', () => {
  it('registers and emits events', () => {
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();

    bus.on('foo:event', handler);
    bus.emit('foo:event', 42);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(42);
  });

  it('supports one-time listeners', () => {
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();

    bus.once('foo:event', handler);
    bus.emit('foo:event', 1);
    bus.emit('foo:event', 2);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(1);
  });

  it('clears listeners', () => {
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();

    bus.on('foo:event', handler);
    bus.clear();
    bus.emit('foo:event', 99);

    expect(handler).not.toHaveBeenCalled();
  });

  it('handles void payload events', () => {
    const bus = new EventBus<TestEvents>();
    const handler = vi.fn();

    bus.on('bar:event', handler);
    bus.emit('bar:event', undefined);

    expect(handler).toHaveBeenCalledOnce();
  });
});
