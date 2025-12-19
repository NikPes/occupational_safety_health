import { Application, Container } from 'pixi.js';
import { EventBusService } from '../../core/services/EventBusService';
import { CoordinateService } from '../../core/services/CoordinateService';
import { CoreEvents } from '../../core/types/events';
import { Viewport } from '../../core/types/coordinates';

export interface IContainer {
  /**
   * Инициализация контейнера
   */
  initialize(): Promise<void>;

  /**
   * Показ контейнера
   */
  show(): void;

  /**
   * Скрытие контейнера
   */
  hide(): void;

  /**
   * Изменение размеров контейнера
   */
  resize(width: number, height: number): void;

  /**
   * Обновление настроек
   */
  updateSettings(settings: any): void;

  /**
   * Уничтожение контейнера
   */
  destroy(): void;

  /**
   * Обработчик изменения viewport (опционально)
   */
  onViewportChange?(viewport: Viewport): void;
}

/**
 * Базовый абстрактный класс для всех контейнеров
 * Интегрирован с мировой системой координат
 */
export abstract class BaseContainer implements IContainer {
  protected app: Application;
  protected eventBus: EventBusService<CoreEvents>;
  protected coordinateService: CoordinateService;
  protected rootContainer: Container;
  protected isVisible: boolean = false;
  protected isInitialized: boolean = false;

  constructor(
    app: Application,
    eventBus: EventBusService<CoreEvents>,
    coordinateService: CoordinateService // НОВОЕ
  ) {
    this.app = app;
    this.eventBus = eventBus;
    this.coordinateService = coordinateService;

    // Создаем корневой контейнер
    this.rootContainer = new Container();

    // Настраиваем преобразование координат для контейнера
    this.setupContainerTransform();

    // Добавляем на сцену
    this.app.stage.addChild(this.rootContainer);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Инициализация слоев
    await this.initializeLayers();

    this.isInitialized = true;
  }

  show(): void {
    if (!this.isInitialized) {
      console.warn('Контейнер не инициализирован');
      return;
    }

    this.rootContainer.visible = true;
    this.isVisible = true;
    this.onShow();
  }

  hide(): void {
    this.rootContainer.visible = false;
    this.isVisible = false;
    this.onHide();
  }

  resize(width: number, height: number): void {
    this.onResize(width, height);
  }

  updateSettings(settings: any): void {
    this.onSettingsUpdate(settings);
  }

  destroy(): void {
    this.onDestroy();
    this.app.stage.removeChild(this.rootContainer);
    this.rootContainer.destroy({ children: true });
  }

  /**
   * Настройка преобразования координат для корневого контейнера
   * Чтобы все дочерние элементы работали в мировых координатах
   */
  private setupContainerTransform(): void {
    // Получаем текущий viewport
    const viewport = this.coordinateService.getViewport();

    // Устанавливаем позицию контейнера (центр мировых координат)
    // Дальнейшие преобразования делаются через координатный сервис
    this.rootContainer.position.set(
      this.coordinateService.worldToScreen(0, 0).x,
      this.coordinateService.worldToScreen(0, 0).y
    );

    // Масштабируем под текущий viewport
    this.rootContainer.scale.set(viewport.scale);
  }

  /**
   * Обновить трансформацию контейнера при изменении viewport
   * Вызывается из ContainerFactory при событии viewport-changed
   */
  onViewportChange(viewport: Viewport): void {
    // 1. Обновляем позицию (центр мировых координат)
    this.rootContainer.position.set(
      this.coordinateService.worldToScreen(0, 0).x,
      this.coordinateService.worldToScreen(0, 0).y
    );

    // 2. Обновляем масштаб
    this.rootContainer.scale.set(viewport.scale);

    // 3. Вызываем кастомную логику наследника
    if (this.handleViewportChange) {
      this.handleViewportChange(viewport);
    }
  }

  /**
   * Защищенный метод для кастомной обработки viewport в наследниках
   */
  protected handleViewportChange?(viewport: Viewport): void;

  // Абстрактные методы для реализации в наследниках
  protected abstract initializeLayers(): Promise<void>;
  protected abstract onShow(): void;
  protected abstract onHide(): void;
  protected abstract onResize(width: number, height: number): void;
  protected abstract onSettingsUpdate(settings: any): void;
  protected abstract onDestroy(): void;
}