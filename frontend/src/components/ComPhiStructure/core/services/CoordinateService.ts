import { Point, Viewport } from '../types/coordinates';

/**
 * CoordinateService - сервис преобразования координат с сохранением пропорций мира
 * При несовпадении пропорций canvas и мира показываем часть мира (без искажений)
 */
export class CoordinateService {
    private viewport: Viewport;
    private static instance: CoordinateService | null = null;

    public static getInstance(): CoordinateService {
        if (!CoordinateService.instance) {
            CoordinateService.instance = new CoordinateService();
        }
        return CoordinateService.instance;
    }

    private constructor() {
        this.viewport = {
            center: { x: 0, y: 0 },
            scale: 1.0,
            width: 0,
            height: 0,
        };
    }

    /**
     * Преобразование экранных координат в мировые
     */
    screenToWorld(screenX: number, screenY: number): Point {
        const centerX = this.viewport.width / 2;
        const centerY = this.viewport.height / 2;

        const worldX = (screenX - centerX) / this.viewport.scale + this.viewport.center.x;
        const worldY = (screenY - centerY) / this.viewport.scale + this.viewport.center.y;

        return { x: worldX, y: worldY };
    }

    /**
     * Преобразование мировых координат в экранные
     */
    worldToScreen(worldX: number, worldY: number): Point {
        const centerX = this.viewport.width / 2;
        const centerY = this.viewport.height / 2;

        const screenX = (worldX - this.viewport.center.x) * this.viewport.scale + centerX;
        const screenY = (worldY - this.viewport.center.y) * this.viewport.scale + centerY;

        return { x: screenX, y: screenY };
    }

    /**
     * Установить новый viewport
     */
    setViewport(centerX: number, centerY: number, scale: number): void {
        this.viewport.center = { x: centerX, y: centerY };
        this.viewport.scale = scale;
    }

    /**
     * Изменить масштаб с фиксацией точки на экране (zoom относительно курсора)
     */
    zoomAroundPoint(newScale: number, fixedScreenX: number, fixedScreenY: number): void {
        const worldPoint = this.screenToWorld(fixedScreenX, fixedScreenY);
        const oldScale = this.viewport.scale;
        this.viewport.scale = newScale;

        const newScreenPoint = this.worldToScreen(worldPoint.x, worldPoint.y);
        const deltaX = fixedScreenX - newScreenPoint.x;
        const deltaY = fixedScreenY - newScreenPoint.y;

        const centerDeltaX = deltaX / newScale;
        const centerDeltaY = deltaY / newScale;

        this.viewport.center.x -= centerDeltaX;
        this.viewport.center.y -= centerDeltaY;
    }

    /**
     * Обновить размер canvas и настроить viewport для мира 1600x700
     * Если пропорции не совпадают - показываем часть мира (без искажений)
     */
    updateCanvasSize(width: number, height: number): void {
        this.viewport.width = width;
        this.viewport.height = height;

        // Только при первой инициализации настраиваем viewport
        if (this.viewport.scale === 1.0 && this.viewport.center.x === 0 && this.viewport.center.y === 0) {
            this.fitWorldToCanvas(width, height);
        }
    }

    /**
     * Настроить viewport для мира 1600x700 с сохранением пропорций
     */
    private fitWorldToCanvas(canvasWidth: number, canvasHeight: number): void {
        const worldWidth = 1600;
        const worldHeight = 700;

        const worldAspect = worldWidth / worldHeight;
        const canvasAspect = canvasWidth / canvasHeight;

        // Выбираем масштаб по более ограничивающей оси
        let scale, centerX, centerY;

        if (canvasAspect > worldAspect) {
            // Canvas шире мира - ограничение по высоте, видим всю высоту мира
            scale = canvasHeight / worldHeight;
            // Центр по ширине мира
            centerX = worldWidth / 2;
            centerY = worldHeight / 2;
        } else {
            // Canvas уже мира - ограничение по ширине, видим всю ширину мира
            scale = canvasWidth / worldWidth;
            // Центр по высоте мира
            centerX = worldWidth / 2;
            centerY = worldHeight / 2;
        }

        this.viewport.center = { x: centerX, y: centerY };
        this.viewport.scale = scale;
    }

    /**
     * Получить текущий viewport
     */
    getViewport(): Viewport {
        return { ...this.viewport };
    }

    getScale(): number {
        return this.viewport.scale;
    }

    getCenter(): Point {
        return { ...this.viewport.center };
    }

    getCanvasSize(): { width: number; height: number } {
        return { width: this.viewport.width, height: this.viewport.height };
    }

    /**
     * Получить видимую область мира в мировых координатах
     */
    getVisibleWorldBounds(): { left: number; top: number; right: number; bottom: number } {
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.viewport.width, this.viewport.height);

        return {
            left: topLeft.x,
            top: topLeft.y,
            right: bottomRight.x,
            bottom: bottomRight.y
        };
    }
}