import { Application, FederatedPointerEvent, FederatedWheelEvent } from 'pixi.js';
import { EventBusService } from '../../../core/services/EventBusService';
import { CoreEvents } from '../../../core/types/events';

/**
 * MouseService - преобразует события PixiJS v8 в CoreEvents
 */
export class MouseService {
  private isMouseDown = false;
  private lastMousePosition = { x: 0, y: 0 };

  constructor(
    private readonly app: Application,
    private readonly coreBus: EventBusService<CoreEvents>
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const canvas = this.app.canvas as HTMLCanvasElement;
    if (!canvas) return;

    // Используем глобальную сцену для событий
    const stage = this.app.stage;

    // Pointer события PixiJS v8
    stage.on('pointerdown', (event: FederatedPointerEvent) => {
      const { x, y } = this.getCanvasCoordinates(event);
      this.isMouseDown = true;
      this.lastMousePosition = { x, y };

      this.coreBus.emit('mouse-down', {
        x,
        y,
        button: event.button,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey
      });
    });

    stage.on('pointermove', (event: FederatedPointerEvent) => {
      const { x, y } = this.getCanvasCoordinates(event);
      this.lastMousePosition = { x, y };

      this.coreBus.emit('mouse-move', {
        x,
        y,
        buttons: event.buttons
      });
    });

    stage.on('pointerup', (event: FederatedPointerEvent) => {
      const { x, y } = this.getCanvasCoordinates(event);
      this.isMouseDown = false;

      this.coreBus.emit('mouse-up', {
        x,
        y,
        button: event.button
      });
    });

    stage.on('pointerupoutside', (event: FederatedPointerEvent) => {
      const { x, y } = this.getCanvasCoordinates(event);
      this.isMouseDown = false;

      this.coreBus.emit('mouse-up', {
        x,
        y,
        button: event.button
      });
    });

    // Wheel событие
    stage.on('wheel', (event: FederatedWheelEvent) => {
      const { x, y } = this.getCanvasCoordinates(event);

      this.coreBus.emit('wheel', {
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        deltaZ: event.deltaZ
      });
    });

    // Включаем интерактивность сцены
    stage.eventMode = 'static';
    stage.hitArea = this.app.screen;

    console.log('✅ MouseService: обработчики событий установлены');
  }

  /**
   * Получение координат относительно canvas (в пикселях)
   */
  private getCanvasCoordinates(event: FederatedPointerEvent | FederatedWheelEvent): { x: number; y: number } {
    // В PixiJS v8 координаты уже относительны canvas
    const canvas = this.app.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  /**
   * Получить текущую позицию курсора (для зума)
   */
  getCurrentMousePosition(): { x: number; y: number } {
    return { ...this.lastMousePosition };
  }

  destroy(): void {
    const stage = this.app.stage;

    // Удаляем все обработчики
    stage.off('pointerdown');
    stage.off('pointermove');
    stage.off('pointerup');
    stage.off('pointerupoutside');
    stage.off('wheel');

    // Выключаем интерактивность
    stage.eventMode = 'auto';

    console.log('✅ MouseService: обработчики удалены');
  }
}