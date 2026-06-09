export class EventBus {
    constructor() {
        this.handlers = new Map();
    }

    on(event, handler) {
        if (!this.handlers.has(event)) this.handlers.set(event, new Set());
        this.handlers.get(event).add(handler);
        return () => this.off(event, handler);
    }

    off(event, handler) {
        const set = this.handlers.get(event);
        if (set) set.delete(handler);
    }

    emit(event, payload) {
        const set = this.handlers.get(event);
        if (set) {
            for (const h of set) {
                try { h(payload); } catch (e) { console.error(e); }
            }
        }
    }

    clear() {
        this.handlers.clear();
    }
}
