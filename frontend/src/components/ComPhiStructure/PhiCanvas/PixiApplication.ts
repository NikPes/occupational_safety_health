import { Application } from 'pixi.js';
import { EventBusService } from '../core/services/EventBusService';
import { eventBusManager } from '../core/services/EventBusManager';
import { CoordinateService } from '../core/services/CoordinateService';
import { CoreEvents } from '../core/types/events';
import { CanvasEvents } from './types/events';
import { ContainerMode } from './types/types';
import { UserSettings } from '../core/types/settings';

import { ApplicationInitializer } from './services/PixiApplication/ApplicationInitializer';
import { ModeManager } from './services/PixiApplication/ModeManager';
import { EventHandler } from './services/PixiApplication/EventHandler';
import { ContainerFactory } from './services/PixiApplication/ContainerFactory';
import { ApplicationCleaner } from './services/PixiApplication/ApplicationCleaner';
import { MouseService } from './services/PixiApplication/MouseService';

/**
 * PixiApplication - тонкий фасад над специализированными сервисами
 * Интегрирует CoordinateService для мировой системы координат
 */
export class PixiApplication {
  public app!: Application;
  public readonly coreBus: EventBusService<CoreEvents>;
  public readonly canvasBus: EventBusService<CanvasEvents>;
  public readonly coordinateService: CoordinateService;
  private mouseService!: MouseService;

  private readonly initializer: ApplicationInitializer;
  private readonly modeManager: ModeManager;
  private readonly eventHandler: EventHandler;
  private readonly containerFactory: ContainerFactory;
  private readonly cleaner: ApplicationCleaner;

  private isDestroyed = false;
  private isInitializing = false;

  constructor(
    canvasContainer: HTMLDivElement,
    userSettings: UserSettings,
    userStatus: string,
    token: string,
    coordinateService?: CoordinateService
  ) {
    this.coordinateService = coordinateService || CoordinateService.getInstance();
    this.coreBus = eventBusManager.getCoreBus();
    this.canvasBus = eventBusManager.getCanvasBus();

    this.initializer = new ApplicationInitializer(
      canvasContainer,
      userSettings,
      this.coordinateService
    );

    this.containerFactory = new ContainerFactory(
      this.coreBus,
      this.canvasBus,
      userSettings,
      userStatus,
      token,
      this.coordinateService
    );

    this.modeManager = new ModeManager(
      this.canvasBus,
      this.containerFactory
    );

    this.eventHandler = new EventHandler(
      this.coreBus,
      this.canvasBus,
      this.containerFactory,
      userSettings,
      this.coordinateService
    );

    this.cleaner = new ApplicationCleaner(
      this.coreBus,
      this.canvasBus,
      this.containerFactory
    );
  }

  public async initialize(): Promise<void> {
    if (this.isDestroyed) throw new Error('Application is destroyed');
    if (this.isInitializing) return;

    this.isInitializing = true;

    try {
      const canvasSize = this.coordinateService.getCanvasSize();
      this.app = await this.initializer.createApp(canvasSize.width, canvasSize.height);

      // Инициализируем MouseService ДО контейнеров
      this.mouseService = new MouseService(this.app, this.coreBus);
      console.log('✅ MouseService инициализирован');

      await this.containerFactory.createContainers(this.app);

      this.eventHandler.setup();

      this.canvasBus.emit('canvas:initialized', {
        timestamp: Date.now()
      });

      console.log('🎯 PixiApplication полностью инициализирован');
      console.log(`🌍 Мировая система: ${canvasSize.width}x${canvasSize.height}`);
      console.log(`🔍 Начальный масштаб: ${this.coordinateService.getScale().toFixed(2)}x`);
    } catch (error) {
      console.error('Failed to initialize PixiApplication:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  public setMode(mode: 'choice' | 'node' | 'scheme' | 'none'): void {
    if (this.isDestroyed || !this.app) return;
    this.modeManager.setMode(mode);
  }

  public resize(width: number, height: number): void {
    if (this.isDestroyed || !this.app) return;

    console.log(`📏 PixiApplication.resize(${width}, ${height})`);

    this.initializer.resize(this.app, width, height);
    this.canvasBus.emit('viewport-changed', this.coordinateService.getViewport());
  }

  public getCurrentMode(): ContainerMode | null {
    return this.modeManager.getCurrentMode();
  }

  public destroy(): void {
    if (this.isDestroyed) return;

    console.log('🧹 Уничтожение PixiApplication...');

    if (this.mouseService) {
      this.mouseService.destroy();
      console.log('✅ MouseService уничтожен');
    }

    this.cleaner.destroy(this.app);
    this.isDestroyed = true;

    console.log('✅ PixiApplication уничтожен');
  }
}