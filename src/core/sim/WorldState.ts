import type { EntityId } from '@/core/ecs/EntityId';

export interface ComponentState<T = unknown> {
  key: string;
  values: Array<[EntityId, T]>;
}

export interface WorldState {
  version: string;
  tick: number;
  entities: EntityId[];
  components: ComponentState[];
}

export const WORLD_STATE_VERSION = '0.1.0';

export function createEmptyWorldState(): WorldState {
  return {
    version: WORLD_STATE_VERSION,
    tick: 0,
    entities: [],
    components: [],
  };
}

export function serializeWorldState(state: WorldState): string {
  return JSON.stringify(state);
}

export function deserializeWorldState(serialized: string): WorldState {
  const raw = JSON.parse(serialized) as WorldState;

  return {
    version: raw.version,
    tick: raw.tick,
    entities: raw.entities.map((entity) => normalizeEntityId(entity)),
    components: raw.components.map((component) => ({
      key: component.key,
      values: component.values.map(([entity, value]) => [normalizeEntityId(entity), value]),
    })),
  };
}

const normalizeEntityId = (value: unknown): EntityId => Number(value);
