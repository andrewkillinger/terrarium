import type { EntityId } from '@/core/ecs/EntityId';
import type { System } from '@/core/ecs/System';
import type { Lifetime } from '@/core/ecs/components/Lifetime';
import { LifetimeKey } from '@/core/ecs/components/Lifetime';
import type { Position } from '@/core/ecs/components/Position';
import { PositionKey } from '@/core/ecs/components/Position';
import type { RenderDot } from '@/core/ecs/components/RenderDot';
import { RenderDotKey } from '@/core/ecs/components/RenderDot';
import type { RenderLabel } from '@/core/ecs/components/RenderLabel';
import { RenderLabelKey } from '@/core/ecs/components/RenderLabel';

export type SpawnRequest =
  | {
      kind: 'dot';
      x: number;
      y: number;
      radius?: number;
      color?: number;
      ttl?: number;
    }
  | {
      kind: 'label';
      x: number;
      y: number;
      text: string;
      size?: number;
      color?: number;
      ttl?: number;
    };

const spawnQueue: SpawnRequest[] = [];
const trackedEntities = new Set<EntityId>();
let despawnAllRequested = false;

export function queueSpawn(request: SpawnRequest): void {
  spawnQueue.push(request);
}

export function queueDespawnAll(): void {
  spawnQueue.length = 0;
  despawnAllRequested = true;
}

function normalizeLifetime(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isFinite(value)) {
    return undefined;
  }

  const clamped = Math.max(0, Math.floor(value));
  return Number.isFinite(clamped) ? clamped : undefined;
}

export const spawningSystem: System = ((dt, world) => {
  void dt;

  for (const entityId of Array.from(trackedEntities)) {
    if (!world.hasEntity(entityId)) {
      trackedEntities.delete(entityId);
    }
  }

  if (despawnAllRequested) {
    for (const entityId of Array.from(trackedEntities)) {
      world.destroyEntity(entityId);
    }
    trackedEntities.clear();
    despawnAllRequested = false;
  }

  if (spawnQueue.length === 0) {
    return;
  }

  const positionStore = world.getComponentStore<Position>(PositionKey);
  if (!positionStore) {
    spawnQueue.length = 0;
    return;
  }

  const dotStore = world.getComponentStore<RenderDot>(RenderDotKey);
  const labelStore = world.getComponentStore<RenderLabel>(RenderLabelKey);
  const lifetimeStore = world.getComponentStore<Lifetime>(LifetimeKey);

  while (spawnQueue.length > 0) {
    const request = spawnQueue.shift()!;

    if (request.kind === 'dot' && !dotStore) {
      continue;
    }

    if (request.kind === 'label' && !labelStore) {
      continue;
    }

    const entityId = world.createEntity();
    trackedEntities.add(entityId);

    positionStore.set(entityId, { x: request.x, y: request.y });

    if (request.kind === 'dot') {
      dotStore?.set(entityId, {
        radius: request.radius ?? 1,
        color: request.color,
      });
    } else {
      labelStore?.set(entityId, {
        text: request.text,
        size: request.size,
        color: request.color,
      });
    }

    const lifetime = normalizeLifetime(request.ttl);
    if (lifetime !== undefined && lifetimeStore) {
      lifetimeStore.set(entityId, { ticksToLive: lifetime });
    }
  }
}) as System;

spawningSystem.displayName = 'Sim::Spawning';
