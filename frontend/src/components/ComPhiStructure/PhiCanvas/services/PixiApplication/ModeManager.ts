import { EventBusService } from '../../../core/services/EventBusService';
import { CanvasEvents } from '../../types/events';
import { BaseContainer } from '../../types/containerInterface';
import { ContainerFactory } from './ContainerFactory';
import { ContainerMode } from '../../types/types';

/**
 * Ответственность: Управление переключением режимов
 */
export class ModeManager {
  private currentMode: ContainerMode | null = null;

  constructor(
    private readonly canvasBus: EventBusService<CanvasEvents>,
    private readonly containerFactory: ContainerFactory
  ) {}

  setMode(mode: 'choice' | 'node' | 'scheme' | 'none'): void {
    if (mode === this.currentMode) return;

    if (mode === 'none') {
      this.hideCurrent();
      this.currentMode = null;
      this.canvasBus.emit('canvas:state-changed', { state: 'hidden' });
      return;
    }

    // TypeScript знает, что mode !== 'none' здесь
    const containerMode: ContainerMode = mode;
    const newContainer = this.containerFactory.getContainer(containerMode);
    if (!newContainer) {
      console.warn(`Контейнер для режима ${containerMode} не найден`);
      this.canvasBus.emit('canvas:mode-error', {
        mode: containerMode,
        message: 'Container not found'
      });
      return;
    }

    this.hideCurrent();
    newContainer.show();
    this.currentMode = containerMode;

    this.canvasBus.emit('canvas:mode-changed', { mode: containerMode });
    this.canvasBus.emit('canvas:state-changed', { state: 'active' });
    console.log(`Режим изменен на: ${containerMode}`);
  }

  private hideCurrent(): void {
    if (this.currentMode) {
      const currentContainer = this.containerFactory.getContainer(this.currentMode);
      currentContainer?.hide();
    }
  }

  getCurrentMode(): ContainerMode | null {
    return this.currentMode;
  }
}