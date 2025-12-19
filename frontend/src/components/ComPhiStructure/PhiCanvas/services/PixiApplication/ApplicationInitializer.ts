import { Application } from 'pixi.js';
import { CoordinateService } from '../../../core/services/CoordinateService';
import { UserSettings } from '../../../core/types/settings';

/**
 * Ответственность: Создание и настройка PixiJS Application с учетом мировой системы координат
 */
export class ApplicationInitializer {
  constructor(
    private readonly canvasContainer: HTMLDivElement,
    private readonly userSettings: UserSettings,
    private readonly coordinateService: CoordinateService
  ) {}

  async createApp(width?: number, height?: number): Promise<Application> {
    console.log('ApplicationInitializer.createApp() с системой координат');

    // Используем переданные размеры или берем из CoordinateService
    const finalWidth = width || 800;
    const finalHeight = height || 450;

    console.log(`📐 Создание Pixi Application ${finalWidth}x${finalHeight}`);

    // Создаем пустое приложение
    const app = new Application();

    try {
      // Инициализируем с реальными размерами (не aspect-ratio!)
      await app.init({
        width: finalWidth,
        height: finalHeight,
        backgroundColor: this.getBackgroundColor(),
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        // НЕ используем resizeTo - мы сами управляем ресайзом через coordinateService
      });

      console.log('✅ Pixi Application инициализирован');
      console.log('📍 Canvas создан:', app.canvas ? 'да' : 'нет');

      // Добавляем canvas в контейнер
      const existingCanvas = this.canvasContainer.querySelector('canvas');
      if (!existingCanvas && app.canvas) {
        this.canvasContainer.appendChild(app.canvas as HTMLCanvasElement);
        console.log('📍 Canvas добавлен в контейнер');
      } else if (existingCanvas) {
        console.log('ℹ️ Canvas уже существует в контейнере');
      } else {
        throw new Error('PixiJS не создал canvas элемент');
      }

      // Настраиваем стили canvas
      if (app.canvas) {
        const canvas = app.canvas as HTMLCanvasElement;

        // Блочное отображение и растягивание на 100%
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        // Отладочная рамка (зеленая для успешной инициализации)
        canvas.style.border = '2px solid #00ff00';
        canvas.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
      }

      return app;
    } catch (error) {
      console.error('❌ Ошибка в ApplicationInitializer.createApp():', error);
      throw error;
    }
  }

  /**
   * Ресайз Pixi renderer с учетом мировых координат
   */
  resize(app: Application, width: number, height: number): void {
    if (!app.renderer) {
      console.warn('⚠️ Попытка ресайза неинициализированного renderer');
      return;
    }

    console.log(`📏 Ресайз renderer: ${width}x${height}`);

    // 1. Ресайз рендерера Pixi (физические пиксели)
    app.renderer.resize(width, height);

    // 2. CoordinateService уже обновлен на уровне выше
    // 3. Все контейнеры получат событие viewport-changed для пересчета позиций
  }

  /**
   * Цвет фона в зависимости от темы
   */
  private getBackgroundColor(): number {
    return this.userSettings.theme === 'dark' ? 0x1a1a1a : 0xf5f5f5;
  }
}