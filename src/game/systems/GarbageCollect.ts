import type { EntityId } from '@/core/ecs/EntityId';
import type { System } from '@/core/ecs/System';
import type { Lifetime } from '@/core/ecs/components/Lifetime';
import { LifetimeKey } from '@/core/ecs/components/Lifetime';

export const garbageCollectSystem: System = ((dt, world) => {
  void dt;

  const lifetimeStore = world.getComponentStore<Lifetime>(LifetimeKey);
  if (!lifetimeStore) {
    return;
  }

  const entitiesToRemove: EntityId[] = [];

  for (const [entityId, lifetime] of lifetimeStore) {
    if (lifetime.ticksToLive <= 0) {
      entitiesToRemove.push(entityId);
      continue;
    }

    const nextTicks = lifetime.ticksToLive - 1;
    lifetimeStore.set(entityId, { ticksToLive: nextTicks });
  }

  for (const entityId of entitiesToRemove) {
    world.destroyEntity(entityId);
  }
}) as System;

garbageCollectSystem.displayName = 'Sim::GarbageCollect';
