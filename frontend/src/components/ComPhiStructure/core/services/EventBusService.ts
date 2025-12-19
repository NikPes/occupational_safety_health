// core/services/EventBusService.ts

/**
 * Generic EventBus - работает с ЛЮБЫМ типом событий
 *
 * @template T - интерфейс событий (например: CoreEvents, CanvasEvents)
 *
 * Пример:
 * const bus = new EventBusService<CoreEvents>();
 * bus.emit('theme-changed', { theme: 'dark' });
 */
export class EventBusService<T extends Record<string, any>> {
    private subscribers: Map<keyof T, Set<(data: any) => void>>;
    private debugMode: boolean;

    constructor() {
        this.subscribers = new Map();
        this.debugMode = false;
    }

    emit<K extends keyof T>(event: K, data: T[K]): void {
        if (this.debugMode) {
            console.log(`🎯 ${String(event)}:`, data);
        }

        const callbacks = this.subscribers.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Ошибка в "${String(event)}":`, error);
                }
            });
        }
    }

    on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new Set());
        }

        const callbacks = this.subscribers.get(event)!;
        callbacks.add(callback);

        return () => {
            this.off(event, callback);
        };
    }

    off<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
        const callbacks = this.subscribers.get(event);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.subscribers.delete(event);
            }
        }
    }

    once<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
        const onceCallback: (data: T[K]) => void = (data) => {
            this.off(event, onceCallback);
            callback(data);
        };
        return this.on(event, onceCallback);
    }

    setDebug(enabled: boolean): void {
        this.debugMode = enabled;
        console.log(`🔍 EventBus debug: ${enabled ? 'ON' : 'OFF'}`);
    }

    clearAll(): void {
        this.subscribers.clear();
        console.log('🧹 EventBus cleared');
    }
}