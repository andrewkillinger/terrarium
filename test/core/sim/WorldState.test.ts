import { describe, expect, it } from 'vitest';

import {
  WORLD_STATE_VERSION,
  deserializeWorldState,
  serializeWorldState,
  type WorldState,
} from '@/core/sim/WorldState';

const createState = (): WorldState => ({
  version: WORLD_STATE_VERSION,
  tick: 12,
  entities: [1, 2, 3],
  components: [
    {
      key: 'position',
      values: [
        [1, { x: 1, y: 1 }],
        [2, { x: 2, y: 3 }],
      ],
    },
    {
      key: 'energy',
      values: [
        [1, { value: 10 }],
        [3, { value: 15 }],
      ],
    },
  ],
});

describe('WorldState', () => {
  it('serializes and deserializes world state', () => {
    const original = createState();
    const serialized = serializeWorldState(original);
    const restored = deserializeWorldState(serialized);

    expect(restored).toEqual(original);
  });
});
