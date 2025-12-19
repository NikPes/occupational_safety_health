// src/subcomponents/PhiChoiceScreen/PhiChoiceContainer.ts
import { Application, Container } from 'pixi.js';
import { EventBusService } from '../../core/services/EventBusService';
import { CoordinateService } from '../../core/services/CoordinateService';
import { CoreEvents } from '../../core/types/events';
import { UserSettings } from '../../core/types/settings';
import { BaseContainer } from '../../PhiCanvas/types/containerInterface';
import { Viewport } from '../../core/types/coordinates';
import { BackgroundLayer } from '../shared/layers/BackgroundLayer';
import { ButtonsLayer } from './layers/ButtonsLayer';

export interface ChoiceEvents {
  'choice:shown': {};
  'choice:hidden': {};
  'choice:button-click': { buttonId: string };
}

export class PhiChoiceContainer extends BaseContainer {
  private backgroundLayer: BackgroundLayer;
  private buttonsLayer: ButtonsLayer;

  constructor(
    app: Application,
    coreBus: EventBusService<CoreEvents>,
    choiceBus: EventBusService<ChoiceEvents>,
    userSettings: UserSettings,
    coordinateService: CoordinateService
  ) {
    super(app, coreBus, coordinateService);

    // 1. Фон
    this.backgroundLayer = new BackgroundLayer(
      this.rootContainer,
      this.eventBus,
      userSettings,
      coordinateService
    );

    // 2. Кнопки - создаем отдельный контейнер для кнопок ПОВЕРХ фона
    const buttonsContainer = new Container();
    this.rootContainer.addChild(buttonsContainer);
    this.buttonsLayer = new ButtonsLayer(
        buttonsContainer,
        coordinateService,
        userSettings.theme
    );

    console.log('TChoiceContainer создан');
  }

  protected async initializeLayers(): Promise<void> {
    console.log('TChoiceContainer: initializeLayers()');

    const canvasSize = this.coordinateService.getCanvasSize();
    if (canvasSize.width > 0 && canvasSize.height > 0) {
      this.backgroundLayer.resize(canvasSize.width, canvasSize.height);
    }

    this.isInitialized = true;
  }

  protected onShow(): void {
    console.log('TChoiceContainer показан');
    this.backgroundLayer.show();
    this.buttonsLayer.show();
  }

  protected onHide(): void {
    console.log('TChoiceContainer скрыт');
    this.backgroundLayer.hide();
    this.buttonsLayer.hide();
  }

  protected onResize(width: number, height: number): void {
    console.log(`TChoiceContainer ресайз: ${width}x${height}`);
    this.backgroundLayer.resize(width, height);
  }

  onViewportChange(viewport: Viewport): void {
    console.log('TChoiceContainer: viewport изменен');

    // 1. Фон
    if (this.backgroundLayer.onViewportChange) {
      this.backgroundLayer.onViewportChange(viewport);
    }

    // 2. Кнопки
    if (this.buttonsLayer.onViewportChange) {
      this.buttonsLayer.onViewportChange(viewport, this.coordinateService);
    }
  }

  protected onSettingsUpdate(settings: UserSettings): void {
    console.log('TChoiceContainer: настройки обновлены');
    this.backgroundLayer.updateSettings(settings);
  }

  protected onDestroy(): void {
    console.log('Уничтожаю TChoiceContainer...');
    this.backgroundLayer.destroy();
    this.buttonsLayer.destroy();
    console.log('TChoiceContainer уничтожен');
  }
}