import type { EventEnvelope } from './types.js';

type Handler = (event: EventEnvelope) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, Set<Handler>>();
  on(type: string, handler: Handler) { if(!this.handlers.has(type)) this.handlers.set(type,new Set()); this.handlers.get(type)!.add(handler); return () => this.handlers.get(type)?.delete(handler); }
  async emit(event: EventEnvelope) { await Promise.all([...(this.handlers.get(event.type) ?? [])].map(h=>h(event))); }
}

export class ProactiveEngine {
  constructor(private readonly bus: EventBus) {}
  watch(type: string, predicate: (event: EventEnvelope)=>boolean, notify: (event:EventEnvelope)=>Promise<void>) {
    return this.bus.on(type, async event => { if(predicate(event)) await notify(event); });
  }
}
