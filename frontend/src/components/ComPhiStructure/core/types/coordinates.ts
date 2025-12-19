/**
 * Типы для системы координат Phi Editor
 *
 * Две системы координат:
 * 1. World (мир) - абсолютные координаты нодов в графе
 * 2. Screen (экран) - пиксели на канвасе
 *
 * Преобразования: Screen ↔ World через viewport
 */

export interface Point {
    x: number;
    y: number;
}

export interface Viewport {
    /** Центр viewport в мировых координатах */
    center: Point;
    /** Масштаб: 1.0 = 100%, 0.5 = 50%, 2.0 = 200% */
    scale: number;
    /** Размер области просмотра в пикселях */
    width: number;
    height: number;
}

export interface CoordinateTransforms {
    /** Преобразовать экранные координаты в мировые */
    screenToWorld(screenX: number, screenY: number): Point;
    /** Преобразовать мировые координаты в экранные */
    worldToScreen(worldX: number, worldY: number): Point;
    /** Установить новый viewport */
    setViewport(centerX: number, centerY: number, scale: number): void;
    /** Получить текущий viewport */
    getViewport(): Viewport;
}