import type { CoreEvents, EventMap } from '@/core/types';

type EventHandler<T> = [T] extends [void] ? () => void : (payload: T) => void;

type ListenerRegistry<TEvents extends EventMap> = {
  [K in keyof TEvents]?: Set<EventHandler<TEvents[K]>>;
};

export class EventBus<TEvents extends EventMap> {
  private readonly listeners: ListenerRegistry<TEvents> = {};

  on<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): () => void {
    const handlers = (this.listeners[event] ??= new Set<EventHandler<TEvents[K]>>());
    handlers.add(handler);
    return () => this.off(event, handler);
  }

  once<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): () => void {
    const wrapped: EventHandler<TEvents[K]> = ((payload: TEvents[K]) => {
      this.off(event, wrapped);
      (handler as (value: TEvents[K]) => void)(payload);
    }) as EventHandler<TEvents[K]>;

    this.on(event, wrapped);
    return () => this.off(event, wrapped);
  }

  off<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void {
    const handlers = this.listeners[event];
    if (!handlers) {
      return;
    }

    handlers.delete(handler);

    if (handlers.size === 0) {
      delete this.listeners[event];
    }
  }

  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    const handlers = this.listeners[event];
    if (!handlers) {
      return;
    }

    handlers.forEach((handler) => {
      (handler as (value: TEvents[K]) => void)(payload);
    });
  }

  clear(): void {
    (Object.keys(this.listeners) as Array<keyof TEvents>).forEach((event) => {
      this.listeners[event]?.clear();
      delete this.listeners[event];
    });
  }
}

export const eventBus = new EventBus<CoreEvents>();
