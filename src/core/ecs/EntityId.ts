export type EntityId = number;

export interface EntityIdGenerator {
  next(): EntityId;
  reset(next?: EntityId): void;
  peek(): EntityId;
}

export function createEntityIdGenerator(start: EntityId = 0): EntityIdGenerator {
  let current: EntityId = start;

  return {
    next(): EntityId {
      current += 1;
      return current;
    },
    reset(next: EntityId = 0): void {
      current = next;
    },
    peek(): EntityId {
      return current + 1;
    },
  };
}
