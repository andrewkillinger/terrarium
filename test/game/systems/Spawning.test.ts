import { describe, expect, it, beforeEach } from 'vitest';

import { World } from '@/core/ecs/World';
import { PositionKey } from '@/core/ecs/components/Position';
import { RenderDotKey } from '@/core/ecs/components/RenderDot';
import { RenderLabelKey } from '@/core/ecs/components/RenderLabel';
import { LifetimeKey } from '@/core/ecs/components/Lifetime';
import { createSpawningSystem } from '@/game/systems/Spawning';
import { garbageCollectSystem } from '@/game/systems/GarbageCollect';

describe('Spawning system', () => {
  let world: World;
  let spawning: ReturnType<typeof createSpawningSystem>;

  beforeEach(() => {
    world = new World();
    world.registerComponentStore(PositionKey);
    world.registerComponentStore(RenderDotKey);
    world.registerComponentStore(RenderLabelKey);
    world.registerComponentStore(LifetimeKey);
    spawning = createSpawningSystem();
  });

  it('creates entities with expected components from spawn requests', () => {
    spawning.queueSpawn({ kind: 'dot', x: 10, y: 12, radius: 5, color: 0x123456, ttl: 3 });

    spawning.system(16, world);

    const positionStore = world.getComponentStore(PositionKey)!;
    const dotStore = world.getComponentStore(RenderDotKey)!;
    const lifetimeStore = world.getComponentStore(LifetimeKey)!;

    const entries = Array.from(positionStore.entries());
    expect(entries).toHaveLength(1);

    const [entityId, position] = entries[0];
    expect(position).toEqual({ x: 10, y: 12 });
    expect(dotStore.get(entityId)).toEqual({ radius: 5, color: 0x123456 });
    expect(lifetimeStore.get(entityId)).toEqual({ ticksToLive: 3 });
  });

  it('removes entities after their lifetime expires', () => {
    spawning.queueSpawn({
      kind: 'label',
      x: 4,
      y: 6,
      text: 'hi',
      size: 10,
      color: 0xabcdef,
      ttl: 2,
    });

    spawning.system(16, world);
    const positionStore = world.getComponentStore(PositionKey)!;
    const labelStore = world.getComponentStore(RenderLabelKey)!;

    const entries = Array.from(labelStore.entries());
    expect(entries).toHaveLength(1);
    const [entityId, label] = entries[0];
    expect(label).toEqual({ text: 'hi', size: 10, color: 0xabcdef });
    expect(positionStore.get(entityId)).toEqual({ x: 4, y: 6 });

    // First tick after spawn - lifetime should decrement but entity remains.
    spawning.system(16, world);
    garbageCollectSystem(16, world);
    expect(world.entityCount).toBe(1);

    // Second tick after spawn - entity should still exist (lifetime reaches zero).
    spawning.system(16, world);
    garbageCollectSystem(16, world);
    expect(world.entityCount).toBe(1);

    // Third tick - lifetime expired, entity removed.
    spawning.system(16, world);
    garbageCollectSystem(16, world);
    expect(world.entityCount).toBe(0);

    expect(labelStore.size).toBe(0);
  });
});
