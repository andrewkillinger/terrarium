import { ComponentStore } from '@/core/ecs/ComponentStore';
import type { EntityId } from '@/core/ecs/EntityId';
import { createEntityIdGenerator } from '@/core/ecs/EntityId';
import type { System } from '@/core/ecs/System';

/**
 * A branded component key that carries the component type `T`.
 * Use `createComponentKey<T>(description)` to create one.
 */
export type ComponentKey<T = unknown> = symbol & { readonly __componentType?: T };

export function createComponentKey<T>(description: string): ComponentKey<T> {
  return Symbol(description) as ComponentKey<T>;
}

export interface SystemProfiler {
  measure<T>(name: string, fn: () => T): T;
  commit(): void;
}

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
    key: ComponentKey<T>,
    store: ComponentStore<T> = new ComponentStore<T>(),
  ): ComponentStore<T> {
    this.componentStores.set(key, store as ComponentStore<unknown>);
    return store;
  }

  getComponentStore<T>(key: ComponentKey<T>): ComponentStore<T> | undefined {
    return this.componentStores.get(key) as ComponentStore<T> | undefined;
  }

  getOrCreateComponentStore<T>(key: ComponentKey<T>): ComponentStore<T> {
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

  step(dtFixedMs: number, profiler?: SystemProfiler): void {
    if (profiler) {
      for (const system of this.systems) {
        const name = system.displayName ?? system.name ?? 'System';
        profiler.measure(name, () => {
          system(dtFixedMs, this);
        });
      }
      profiler.commit();
    } else {
      for (const system of this.systems) {
        system(dtFixedMs, this);
      }
    }
  }
}
