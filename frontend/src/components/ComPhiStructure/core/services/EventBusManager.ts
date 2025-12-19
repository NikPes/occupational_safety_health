// core/services/EventBusManager.ts - ПОЛНАЯ ВЕРСИЯ
import { EventBusService } from './EventBusService';
import { CoreEvents } from '../types/events';
import { CanvasEvents } from '../../PhiCanvas/types/events';
import { ChoiceEvents } from '../../subcomponents/PhiChoiceScreen/types/events';

export class EventBusManager {
    private static instance: EventBusManager;
    private buses: Map<string, EventBusService<any>> = new Map();

    private constructor() {
        this.initializeBuses();
    }

    static getInstance(): EventBusManager {
        if (!EventBusManager.instance) {
            EventBusManager.instance = new EventBusManager();
        }
        return EventBusManager.instance;
    }

    private initializeBuses(): void {
        this.buses.set('core', new EventBusService<CoreEvents>());
        this.buses.set('canvas', new EventBusService<CanvasEvents>());
        this.buses.set('choice', new EventBusService<ChoiceEvents>());
        console.log('EventBusManager инициализирован');
    }

    getCoreBus(): EventBusService<CoreEvents> {
        return this.buses.get('core')!;
    }

    getCanvasBus(): EventBusService<CanvasEvents> {
        return this.buses.get('canvas')!;
    }

    getChoiceBus(): EventBusService<ChoiceEvents> {
        return this.buses.get('choice')!;
    }

    getBus<T extends Record<string, any>>(name: string): EventBusService<T> | undefined {
        return this.buses.get(name) as EventBusService<T> | undefined;
    }

    setDebugForAll(enabled: boolean): void {
        this.buses.forEach(bus => bus.setDebug(enabled));
    }

    clearAllSubscriptions(): void {
        this.buses.forEach(bus => bus.clearAll());
    }
}

// Экспортируем глобальный инстанс
export const eventBusManager = EventBusManager.getInstance();