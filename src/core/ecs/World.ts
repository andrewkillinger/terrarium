import { ComponentStore } from '@/core/ecs/ComponentStore';
import type { EntityId } from '@/core/ecs/EntityId';
import { createEntityIdGenerator } from '@/core/ecs/EntityId';
import type { System } from '@/core/ecs/System';

export type ComponentKey = string | symbol;

export class World {
  private readonly entities = new Set<EntityId>();
  private readonly componentStores = new Map<ComponentKey, ComponentStore<unknown>>();
  private readonly systems: System[] = [];
  private readonly generateEntityId = createEntityIdGenerator();

  createEntity(): EntityId {
    const entityId = this.generateEntityId.next();
    this.entities.add(entityId);
    return entityId;
  }

  destroyEntity(entityId: EntityId): boolean {
    const removed = this.entities.delete(entityId);
    if (!removed) {
      return false;
    }

    for (const store of this.componentStores.values()) {
      store.delete(entityId);
    }

    return true;
  }

  hasEntity(entityId: EntityId): boolean {
    return this.entities.has(entityId);
  }

  get entityCount(): number {
    return this.entities.size;
  }

  clearEntities(): void {
    this.entities.clear();
    for (const store of this.componentStores.values()) {
      store.clear();
    }
    this.generateEntityId.reset();
  }

  registerComponentStore<T>(
    key: ComponentKey,
    store: ComponentStore<T> = new ComponentStore<T>(),
  ): ComponentStore<T> {
    this.componentStores.set(key, store as ComponentStore<unknown>);
    return store;
  }

  getComponentStore<T>(key: ComponentKey): ComponentStore<T> | undefined {
    return this.componentStores.get(key) as ComponentStore<T> | undefined;
  }

  getOrCreateComponentStore<T>(key: ComponentKey): ComponentStore<T> {
    const existing = this.getComponentStore<T>(key);
    if (existing) {
      return existing;
    }

    return this.registerComponentStore<T>(key);
  }

  getRegisteredComponentKeys(): ComponentKey[] {
    return Array.from(this.componentStores.keys());
  }

  addSystem(system: System): void {
    this.systems.push(system);
  }

  clearSystems(): void {
    this.systems.length = 0;
  }

  getSystems(): ReadonlyArray<System> {
    return this.systems;
  }

  step(dtFixedMs: number): void {
    for (const system of this.systems) {
      system(dtFixedMs, this);
    }
  }
}
