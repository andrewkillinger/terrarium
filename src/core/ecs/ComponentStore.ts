import type { EntityId } from '@/core/ecs/EntityId';

export class ComponentStore<T> implements Iterable<[EntityId, T]> {
  private readonly components = new Map<EntityId, T>();

  set(entityId: EntityId, component: T): void {
    this.components.set(entityId, component);
  }

  get(entityId: EntityId): T | undefined {
    return this.components.get(entityId);
  }

  has(entityId: EntityId): boolean {
    return this.components.has(entityId);
  }

  delete(entityId: EntityId): boolean {
    return this.components.delete(entityId);
  }

  clear(): void {
    this.components.clear();
  }

  get size(): number {
    return this.components.size;
  }

  keys(): IterableIterator<EntityId> {
    return this.components.keys();
  }

  values(): IterableIterator<T> {
    return this.components.values();
  }

  entries(): IterableIterator<[EntityId, T]> {
    return this.components.entries();
  }

  forEach(callback: (component: T, entityId: EntityId) => void): void {
    this.components.forEach((component, entityId) => callback(component, entityId));
  }

  [Symbol.iterator](): IterableIterator<[EntityId, T]> {
    return this.components[Symbol.iterator]();
  }
}
