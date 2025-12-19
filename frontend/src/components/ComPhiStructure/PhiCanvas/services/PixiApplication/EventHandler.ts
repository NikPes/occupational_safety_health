import { EventBusService } from '../../../core/services/EventBusService';
import { CoordinateService } from '../../../core/services/CoordinateService';
import { CoreEvents } from '../../../core/types/events';
import { CanvasEvents } from '../../types/events';
import { ContainerFactory } from './ContainerFactory';
import { CanvasMode } from '../../types/types';
import { UserSettings } from '../../../core/types/settings';

/**
 * Ответственность: Подписка и обработка событий EventBus
 * Включая взаимодействия мыши (зум/панорама)
 */
export class EventHandler {
  private onModeSelected?: (mode: CanvasMode) => void;
  private coordinateService: CoordinateService;
  private isPanning = false;
  private panStart = { x: 0, y: 0 };
  private panStartCenter = { x: 0, y: 0 };
  private lastMousePosition = { x: 0, y: 0 }; // Храним последнюю позицию для зума

  constructor(
    private readonly coreBus: EventBusService<CoreEvents>,
    private readonly canvasBus: EventBusService<CanvasEvents>,
    private readonly containerFactory: ContainerFactory,
    private readonly userSettings: UserSettings,
    coordinateService: CoordinateService
  ) {
    this.coordinateService = coordinateService;
  }

  setup(onModeSelected?: (mode: CanvasMode) => void): void {
    this.onModeSelected = onModeSelected;
    this.setupCoreEvents();
    this.setupCanvasEvents();
    this.setupMouseInteractions();
  }

  private setupCoreEvents(): void {
    this.coreBus.on('theme-changed', this.handleThemeChange.bind(this));
  }

  private setupCanvasEvents(): void {
    this.canvasBus.on('canvas:mode-selected', (data) => {
      this.onModeSelected?.(data.mode);
    });
  }

  /**
   * Настройка обработки мыши для зума и панорамирования
   */
  private setupMouseInteractions(): void {
    // Zoom колесиком мыши
    this.coreBus.on('wheel', (data) => {
      this.handleMouseWheel(data);
    });

    // Сохраняем последнюю позицию мыши для зума
    this.coreBus.on('mouse-move', (data) => {
      this.lastMousePosition = { x: data.x, y: data.y };
      this.handleMouseMove(data);
    });

    // Pan (перетаскивание)
    this.coreBus.on('mouse-down', (data) => {
      if (data.button === 0) {
        this.handleMouseDown(data);
      }
    });

    this.coreBus.on('mouse-up', (data) => {
      if (data.button === 0) {
        this.handleMouseUp(data);
      }
    });
  }

  private handleMouseWheel(data: CoreEvents['wheel']): void {
    // Используем последнюю позицию мыши для зума относительно курсора
    const mouseX = this.lastMousePosition.x;
    const mouseY = this.lastMousePosition.y;

    // Масштабируем только по deltaY (вертикальное колесо)
    const zoomDelta = -data.deltaY * 0.001;
    const currentScale = this.coordinateService.getScale();
    const newScale = Math.max(0.1, Math.min(10, currentScale * (1 + zoomDelta)));

    // Если масштаб не изменился, выходим
    if (Math.abs(newScale - currentScale) < 0.001) return;

    // Zoom относительно курсора
    this.coordinateService.zoomAroundPoint(newScale, mouseX, mouseY);

    // Уведомляем об изменении viewport
    this.canvasBus.emit('viewport-changed', this.coordinateService.getViewport());

    console.log(`🔍 Zoom: ${currentScale.toFixed(2)} → ${newScale.toFixed(2)}`);
  }

  private handleMouseDown(data: CoreEvents['mouse-down']): void {
    if (data.button === 0) {
      this.isPanning = true;
      this.panStart = { x: data.x, y: data.y };
      this.panStartCenter = this.coordinateService.getCenter();
    }
  }

  private handleMouseMove(data: CoreEvents['mouse-move']): void {
    if (this.isPanning && (data.buttons & 1) === 1) {
      // Рассчитываем смещение в мировых координатах
      const deltaX = data.x - this.panStart.x;
      const deltaY = data.y - this.panStart.y;

      const scale = this.coordinateService.getScale();
      const worldDeltaX = deltaX / scale;
      const worldDeltaY = deltaY / scale;

      // Новый центр viewport
      const newCenterX = this.panStartCenter.x - worldDeltaX;
      const newCenterY = this.panStartCenter.y - worldDeltaY;

      // Обновляем viewport
      this.coordinateService.setViewport(
        newCenterX,
        newCenterY,
        scale
      );

      // Уведомляем об изменении
      this.canvasBus.emit('viewport-changed', this.coordinateService.getViewport());
    }
  }

  private handleMouseUp(data: CoreEvents['mouse-up']): void {
    if (data.button === 0) {
      this.isPanning = false;
    }
  }

  private handleThemeChange(data: CoreEvents['theme-changed']): void {
    this.userSettings.theme = data.theme;
    this.containerFactory.getAllContainers().forEach(container => {
      container.updateSettings?.(this.userSettings);
    });
  }

  private handleModeSelected(data: CanvasEvents['canvas:mode-selected']): void {
    console.log('Режим выбран:', data.mode);
  }

  cleanup(): void {
    this.coreBus.clearAll();
    this.canvasBus.clearAll();
  }
}