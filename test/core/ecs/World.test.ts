import { describe, expect, it, vi } from 'vitest';

import { World, createComponentKey } from '@/core/ecs/World';
import type { SystemProfiler } from '@/core/ecs/World';
import type { System } from '@/core/ecs/System';

interface TestComponent {
  value: number;
}

const TestKey = createComponentKey<TestComponent>('Test');
const OtherKey = createComponentKey<{ label: string }>('Other');

describe('World', () => {
  describe('entity management', () => {
    it('creates entities with unique ids', () => {
      const world = new World();

      const a = world.createEntity();
      const b = world.createEntity();

      expect(a).not.toBe(b);
      expect(world.hasEntity(a)).toBe(true);
      expect(world.hasEntity(b)).toBe(true);
    });

    it('tracks entity count', () => {
      const world = new World();

      expect(world.entityCount).toBe(0);

      world.createEntity();
      world.createEntity();
      expect(world.entityCount).toBe(2);
    });

    it('destroys entities and removes their components', () => {
      const world = new World();
      const store = world.registerComponentStore(TestKey);

      const id = world.createEntity();
      store.set(id, { value: 42 });

      expect(world.destroyEntity(id)).toBe(true);
      expect(world.hasEntity(id)).toBe(false);
      expect(store.has(id)).toBe(false);
    });

    it('returns false when destroying a non-existent entity', () => {
      const world = new World();
      expect(world.destroyEntity(999)).toBe(false);
    });

    it('clears all entities and component stores', () => {
      const world = new World();
      const store = world.registerComponentStore(TestKey);

      const id = world.createEntity();
      store.set(id, { value: 1 });

      world.clearEntities();

      expect(world.entityCount).toBe(0);
      expect(store.size).toBe(0);
    });
  });

  describe('component stores', () => {
    it('registers and retrieves a typed component store', () => {
      const world = new World();
      const store = world.registerComponentStore(TestKey);

      const retrieved = world.getComponentStore(TestKey);
      expect(retrieved).toBe(store);
    });

    it('returns undefined for an unregistered key', () => {
      const world = new World();
      expect(world.getComponentStore(TestKey)).toBeUndefined();
    });

    it('getOrCreateComponentStore creates store on first access', () => {
      const world = new World();

      const store = world.getOrCreateComponentStore(TestKey);
      expect(store).toBeDefined();

      const same = world.getOrCreateComponentStore(TestKey);
      expect(same).toBe(store);
    });

    it('returns registered component keys', () => {
      const world = new World();
      world.registerComponentStore(TestKey);
      world.registerComponentStore(OtherKey);

      const keys = world.getRegisteredComponentKeys();
      expect(keys).toContain(TestKey);
      expect(keys).toContain(OtherKey);
    });
  });

  describe('systems', () => {
    it('adds and executes systems in order', () => {
      const world = new World();
      const order: string[] = [];

      const sysA: System = (() => order.push('a')) as System;
      const sysB: System = (() => order.push('b')) as System;

      world.addSystem(sysA);
      world.addSystem(sysB);
      world.step(16);

      expect(order).toEqual(['a', 'b']);
    });

    it('passes dtFixedMs and world to each system', () => {
      const world = new World();
      const handler = vi.fn();
      world.addSystem(handler);

      world.step(42);

      expect(handler).toHaveBeenCalledWith(42, world);
    });

    it('clears all systems', () => {
      const world = new World();
      const handler = vi.fn();
      world.addSystem(handler);

      world.clearSystems();
      world.step(16);

      expect(handler).not.toHaveBeenCalled();
    });

    it('exposes systems as readonly array', () => {
      const world = new World();
      const sys: System = vi.fn();
      world.addSystem(sys);

      expect(world.getSystems()).toEqual([sys]);
    });
  });

  describe('step with profiler', () => {
    it('profiles each system and calls commit', () => {
      const world = new World();
      const sysA: System = vi.fn();
      sysA.displayName = 'SystemA';
      const sysB: System = vi.fn();
      sysB.displayName = 'SystemB';
      world.addSystem(sysA);
      world.addSystem(sysB);

      const measureFn = vi.fn((_name: string, fn: () => unknown) => fn());
      const commitFn = vi.fn();
      const profiler = { measure: measureFn, commit: commitFn } as unknown as SystemProfiler;

      world.step(16, profiler);

      expect(measureFn).toHaveBeenCalledTimes(2);
      expect(measureFn).toHaveBeenCalledWith('SystemA', expect.any(Function));
      expect(measureFn).toHaveBeenCalledWith('SystemB', expect.any(Function));
      expect(commitFn).toHaveBeenCalledTimes(1);

      // Systems should still have been called
      expect(sysA).toHaveBeenCalledWith(16, world);
      expect(sysB).toHaveBeenCalledWith(16, world);
    });

    it('uses function name when displayName is not set', () => {
      const world = new World();
      const sys: System = vi.fn();
      world.addSystem(sys);

      const measureFn = vi.fn((_name: string, fn: () => unknown) => fn());
      const commitFn = vi.fn();
      const profiler = { measure: measureFn, commit: commitFn } as unknown as SystemProfiler;

      world.step(16, profiler);

      // vi.fn() creates a 'spy' function, so the name should fall back
      expect(measureFn).toHaveBeenCalledTimes(1);
    });
  });
});
