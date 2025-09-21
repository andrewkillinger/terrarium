import { describe, expect, it, beforeEach } from 'vitest';

import { World } from '@/core/ecs/World';
import { PositionKey, type Position } from '@/core/ecs/components/Position';
import { RenderDotKey, type RenderDot } from '@/core/ecs/components/RenderDot';
import { RenderLabelKey, type RenderLabel } from '@/core/ecs/components/RenderLabel';
import { LifetimeKey, type Lifetime } from '@/core/ecs/components/Lifetime';
import { queueSpawn, spawningSystem } from '@/game/systems/Spawning';
import { garbageCollectSystem } from '@/game/systems/GarbageCollect';

describe('Spawning system', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
    world.registerComponentStore(PositionKey);
    world.registerComponentStore(RenderDotKey);
    world.registerComponentStore(RenderLabelKey);
    world.registerComponentStore(LifetimeKey);
  });

  it('creates entities with expected components from spawn requests', () => {
    queueSpawn({ kind: 'dot', x: 10, y: 12, radius: 5, color: 0x123456, ttl: 3 });

    spawningSystem(16, world);

    const positionStore = world.getComponentStore<Position>(PositionKey)!;
    const dotStore = world.getComponentStore<RenderDot>(RenderDotKey)!;
    const lifetimeStore = world.getComponentStore<Lifetime>(LifetimeKey)!;

    const entries = Array.from(positionStore.entries());
    expect(entries).toHaveLength(1);

    const [entityId, position] = entries[0];
    expect(position).toEqual({ x: 10, y: 12 });
    expect(dotStore.get(entityId)).toEqual({ radius: 5, color: 0x123456 });
    expect(lifetimeStore.get(entityId)).toEqual({ ticksToLive: 3 });
  });

  it('removes entities after their lifetime expires', () => {
    queueSpawn({ kind: 'label', x: 4, y: 6, text: 'hi', size: 10, color: 0xabcdef, ttl: 2 });

    spawningSystem(16, world);
    let positionStore = world.getComponentStore<Position>(PositionKey)!;
    let labelStore = world.getComponentStore<RenderLabel>(RenderLabelKey)!;

    const entries = Array.from(labelStore.entries());
    expect(entries).toHaveLength(1);
    const [entityId, label] = entries[0];
    expect(label).toEqual({ text: 'hi', size: 10, color: 0xabcdef });
    expect(positionStore.get(entityId)).toEqual({ x: 4, y: 6 });

    // First tick after spawn - lifetime should decrement but entity remains.
    spawningSystem(16, world);
    garbageCollectSystem(16, world);
    expect(world.entityCount).toBe(1);

    // Second tick after spawn - entity should still exist (lifetime reaches zero).
    spawningSystem(16, world);
    garbageCollectSystem(16, world);
    expect(world.entityCount).toBe(1);

    // Third tick - lifetime expired, entity removed.
    spawningSystem(16, world);
    garbageCollectSystem(16, world);
    expect(world.entityCount).toBe(0);

    labelStore = world.getComponentStore<RenderLabel>(RenderLabelKey)!;
    expect(labelStore.size()).toBe(0);
  });
});
