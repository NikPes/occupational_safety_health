import { Application } from 'pixi.js';
import { EventBusService } from '../../../core/services/EventBusService';
import { CoordinateService } from '../../../core/services/CoordinateService';
import { CoreEvents } from '../../../core/types/events';
import { CanvasEvents } from '../../types/events';
import { BaseContainer } from '../../types/containerInterface';
import { eventBusManager } from '../../../core/services/EventBusManager';
import { PhiChoiceContainer } from '../../../subcomponents/PhiChoiceScreen/PhiChoiceContainer';
import { UserSettings } from '../../../core/types/settings';

/**
 * Ответственность: Создание контейнеров с передачей CoordinateService
 */
export class ContainerFactory {
  private containers: Map<string, BaseContainer> = new Map();
  private readonly choiceBus: EventBusService<any>;

  constructor(
    private readonly coreBus: EventBusService<CoreEvents>,
    private readonly canvasBus: EventBusService<CanvasEvents>,
    private readonly userSettings: UserSettings,
    private readonly userStatus: string,
    private readonly token: string,
    private readonly coordinateService: CoordinateService
  ) {
    this.choiceBus = eventBusManager.getChoiceBus();
  }

  async createContainers(app: Application): Promise<void> {
    console.log('ContainerFactory: создание контейнеров с системой координат');

    if (this.userStatus === 'root') {
      await this.createRootContainers(app);
    } else if (this.userStatus === 'admin') {
      await this.createAdminContainers(app);
    }

    // Подписываем все контейнеры на изменение viewport
    this.setupViewportListeners();
  }

  private async createRootContainers(app: Application): Promise<void> {
    const choiceContainer = new PhiChoiceContainer(
      app,
      this.coreBus,
      this.choiceBus,
      this.userSettings,
      this.coordinateService
    );

    await choiceContainer.initialize();
    this.containers.set('choice', choiceContainer);

    // TODO: NodeEditorContainer с CoordinateService
    // TODO: SchemeContainer с CoordinateService

    console.log('✅ Root контейнеры созданы (choice)');
  }

  private async createAdminContainers(app: Application): Promise<void> {
    // TODO: Только SchemeContainer с CoordinateService
    console.log('Admin containers (пока не реализованы)');
  }

  /**
   * Подписка всех контейнеров на изменение viewport
   */
  private setupViewportListeners(): void {
    const unsubscribe = this.canvasBus.on('viewport-changed', (viewport) => {
      console.log('🔄 ContainerFactory: получен viewport-changed');

      this.containers.forEach(container => {
        if (container.onViewportChange) {
          container.onViewportChange(viewport);
        }
      });
    });

    // Сохраняем отписку для cleanup
    this.containers.set('__viewport_unsubscribe', {
      destroy: () => unsubscribe()
    } as any);
  }

  getContainer(mode: string): BaseContainer | undefined {
    return this.containers.get(mode);
  }

  getAllContainers(): BaseContainer[] {
    // Фильтруем служебные контейнеры
    return Array.from(this.containers.entries())
      .filter(([key]) => !key.startsWith('__'))
      .map(([, container]) => container);
  }

  destroyAll(): void {
    this.containers.forEach((container, key) => {
      if (!key.startsWith('__')) {
        container.destroy();
      }
    });
    this.containers.clear();
  }
}