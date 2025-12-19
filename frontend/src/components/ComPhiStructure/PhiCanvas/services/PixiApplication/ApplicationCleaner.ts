import { Application } from 'pixi.js';
import { EventBusService } from '../../../core/services/EventBusService';
import { CoreEvents } from '../../../core/types/events';
import { CanvasEvents } from '../../types/events';
import { ContainerFactory } from './ContainerFactory';

/**
 * Ответственность: Безопасное уничтожение приложения
 */
export class ApplicationCleaner {
  constructor(
    private readonly coreBus: EventBusService<CoreEvents>,
    private readonly canvasBus: EventBusService<CanvasEvents>,
    private readonly containerFactory: ContainerFactory
  ) {}

    destroy(app?: Application): void {
        console.log('Уничтожение PixiApplication...');

        // 1. Уничтожить все контейнеры (если есть)
        this.containerFactory.destroyAll();

        // 2. Очистить все подписки на события
        this.coreBus.clearAll();
        this.canvasBus.clearAll();

        // 3. Уничтожить PixiJS приложение (если есть)
        if (app && typeof app.destroy === 'function') {
            try {
                app.destroy(true, {
                    children: true,
                    texture: true,
                    context: true
                });
            } catch (error) {
                console.error('Error destroying PixiJS app:', error);
            }
        }

        // 4. Удалить canvas из DOM (если есть)
        const canvas = app?.canvas as HTMLCanvasElement | null;
        if (canvas?.parentNode) {
            try {
                canvas.parentNode.removeChild(canvas);
            } catch (error) {
                console.error('Error removing canvas from DOM:', error);
            }
        }

        // 5. Уведомить об уничтожении
        this.canvasBus.emit('canvas:destroyed', {
            timestamp: Date.now()
        });

        console.log('PixiApplication уничтожен');
    }
}