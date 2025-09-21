import { describe, expect, it } from 'vitest';

import { ComponentStore } from '@/core/ecs/ComponentStore';

const createStore = () => new ComponentStore<{ name: string }>();

describe('ComponentStore', () => {
  it('stores and retrieves components', () => {
    const store = createStore();
    store.set(1, { name: 'alpha' });
    store.set(2, { name: 'beta' });

    expect(store.get(1)).toEqual({ name: 'alpha' });
    expect(store.get(2)).toEqual({ name: 'beta' });
    expect(store.get(3)).toBeUndefined();
  });

  it('tracks entity membership', () => {
    const store = createStore();
    store.set(5, { name: 'delta' });

    expect(store.has(5)).toBe(true);
    expect(store.has(6)).toBe(false);

    store.delete(5);
    expect(store.has(5)).toBe(false);
  });

  it('supports iteration over entries', () => {
    const store = createStore();
    store.set(1, { name: 'a' });
    store.set(2, { name: 'b' });
    store.set(3, { name: 'c' });

    const entries = Array.from(store.entries());

    expect(entries).toEqual([
      [1, { name: 'a' }],
      [2, { name: 'b' }],
      [3, { name: 'c' }],
    ]);
  });

  it('allows deletion while iterating', () => {
    const store = createStore();
    store.set(1, { name: 'keeper' });
    store.set(2, { name: 'remove-me' });

    for (const [entityId] of store) {
      if (entityId === 2) {
        store.delete(entityId);
      }
    }

    expect(Array.from(store.keys())).toEqual([1]);
  });
});
