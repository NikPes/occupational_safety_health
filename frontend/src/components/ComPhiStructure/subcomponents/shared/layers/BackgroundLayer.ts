import { Container, Graphics } from 'pixi.js';
import { EventBusService } from '../../../core/services/EventBusService';
import { CoordinateService } from '../../../core/services/CoordinateService';
import { Viewport } from '../../../core/types/coordinates';
import { CoreEvents } from '../../../core/types/events';
import { UserSettings } from '../../../core/types/settings';

export class BackgroundLayer {
  public container: Container;
  private background: Graphics;
  private coordinateService: CoordinateService;
  private currentTheme: 'dark' | 'light';
  private gridSize = 100; // Размер ячейки сетки в мировых единицах

  constructor(
    parentContainer: Container,
    eventBus: EventBusService<CoreEvents>,
    initialSettings: UserSettings,
    coordinateService: CoordinateService
  ) {
    this.container = new Container();
    parentContainer.addChild(this.container);

    this.background = new Graphics();
    this.container.addChild(this.background);

    this.coordinateService = coordinateService;
    this.currentTheme = initialSettings.theme;

    // Подписки на события
    eventBus.on('theme-changed', (data: { theme: 'dark' | 'light' }) => {
      this.setTheme(data.theme);
    });

    // Рисуем начальный фон
    this.drawBackground();
  }

  /**
   * Отрисовка фона только для видимой области + запас
   */
  private drawBackground(): void {
    this.background.clear();

    const color = this.currentTheme === 'dark' ? 0x1a1a1a : 0xf5f5f5;

    // Получаем видимую область мира
    const visibleBounds = this.coordinateService.getVisibleWorldBounds();

    // Добавляем запас (1000 мировых единиц во все стороны)
    const padding = 1000; // Мировых единиц
    const worldX = visibleBounds.left - padding;
    const worldY = visibleBounds.top - padding;
    const worldWidth = (visibleBounds.right - visibleBounds.left) + padding * 2;
    const worldHeight = (visibleBounds.bottom - visibleBounds.top) + padding * 2;

    // Конвертируем в экранные координаты
    const topLeft = this.coordinateService.worldToScreen(worldX, worldY);
    const bottomRight = this.coordinateService.worldToScreen(
      worldX + worldWidth,
      worldY + worldHeight
    );

    const screenWidth = bottomRight.x - topLeft.x;
    const screenHeight = bottomRight.y - topLeft.y;

    // Отрисовываем фон
    this.background
      .rect(topLeft.x, topLeft.y, screenWidth, screenHeight)
      .fill(color);

    // Отладочная сетка
    if (process.env.NODE_ENV === 'development') {
      this.drawGrid(worldX, worldY, worldWidth, worldHeight);
    }
  }

  /**
   * Отрисовка сетки только для указанной области
   */
  private drawGrid(
    worldX: number,
    worldY: number,
    worldWidth: number,
    worldHeight: number
  ): void {
    const lineColor = this.currentTheme === 'dark' ? 0x333333 : 0xdddddd;

    // Выравниваем начало и конец по размеру сетки
    const startX = Math.floor(worldX / this.gridSize) * this.gridSize;
    const startY = Math.floor(worldY / this.gridSize) * this.gridSize;
    const endX = Math.ceil((worldX + worldWidth) / this.gridSize) * this.gridSize;
    const endY = Math.ceil((worldY + worldHeight) / this.gridSize) * this.gridSize;

    // Вертикальные линии
    for (let x = startX; x <= endX; x += this.gridSize) {
      const start = this.coordinateService.worldToScreen(x, worldY);
      const end = this.coordinateService.worldToScreen(x, worldY + worldHeight);

      this.background
        .moveTo(start.x, start.y)
        .lineTo(end.x, end.y)
        .stroke({ width: 1, color: lineColor });
    }

    // Горизонтальные линии
    for (let y = startY; y <= endY; y += this.gridSize) {
      const start = this.coordinateService.worldToScreen(worldX, y);
      const end = this.coordinateService.worldToScreen(worldX + worldWidth, y);

      this.background
        .moveTo(start.x, start.y)
        .lineTo(end.x, end.y)
        .stroke({ width: 1, color: lineColor });
    }

    // Опционально: отрисовка осей координат
    this.drawAxes();
  }

  /**
   * Отрисовка осей X и Y
   */
  private drawAxes(): void {
    const axisColor = this.currentTheme === 'dark' ? 0x666666 : 0xaaaaaa;

    // Ось X (горизонтальная линия на y=0)
    const xStart = this.coordinateService.worldToScreen(-10000, 0);
    const xEnd = this.coordinateService.worldToScreen(10000, 0);

    this.background
      .moveTo(xStart.x, xStart.y)
      .lineTo(xEnd.x, xEnd.y)
      .stroke({ width: 2, color: axisColor });

    // Ось Y (вертикальная линия на x=0)
    const yStart = this.coordinateService.worldToScreen(0, -10000);
    const yEnd = this.coordinateService.worldToScreen(0, 10000);

    this.background
      .moveTo(yStart.x, yStart.y)
      .lineTo(yEnd.x, yEnd.y)
      .stroke({ width: 2, color: axisColor });
  }

  /**
   * Обработчик изменения viewport
   */
  onViewportChange(viewport: Viewport): void {
    // ПЕРЕРИСОВЫВАЕМ только когда viewport изменился
    this.drawBackground();
  }

  public setTheme(theme: 'dark' | 'light'): void {
    if (this.currentTheme !== theme) {
      this.currentTheme = theme;
      this.drawBackground();
    }
  }

  public show(): void {
    this.container.visible = true;
  }

  public hide(): void {
    this.container.visible = false;
  }

  /**
   * Ресайз фона
   */
  public resize(width: number, height: number): void {
    // Размеры управляются через мировые координаты
    this.drawBackground();
  }

  public updateSettings(settings: UserSettings): void {
    this.setTheme(settings.theme);
  }

  public destroy(): void {
    this.background.destroy();
    this.container.destroy({ children: true });
  }
}