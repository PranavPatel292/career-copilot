import { EventEmitter } from "node:events";
import type { DocumentLifecycleEvent, EventBus } from "../../ports/EventBus.js";

const CHANNEL = "document-lifecycle";

export class InProcessEventBus implements EventBus {
  private emitter = new EventEmitter();

  constructor() {
    // Each open SSE connection adds one listener; default cap of 10
    // would log MaxListenersExceededWarning past that, so disable it.
    this.emitter.setMaxListeners(0);
  }

  emit(event: DocumentLifecycleEvent): void {
    this.emitter.emit(CHANNEL, event);
  }

  subscribe(listener: (event: DocumentLifecycleEvent) => void): () => void {
    this.emitter.on(CHANNEL, listener);
    return () => this.emitter.off(CHANNEL, listener);
  }
}
