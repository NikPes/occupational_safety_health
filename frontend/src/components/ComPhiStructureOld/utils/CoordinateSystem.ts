// CoordinateSystem.ts - ПРАВИЛЬНАЯ РЕАЛИЗАЦИЯ
import * as PIXI from 'pixi.js';

export class CoordinateSystem {
    private canvas: HTMLCanvasElement;
    private transformContainer: PIXI.Container;

    constructor(canvas: HTMLCanvasElement, transformContainer: PIXI.Container) {
        this.canvas = canvas;
        this.transformContainer = transformContainer;
    }

    public applyZoom(
        deltaY: number,
        canvasX: number,
        canvasY: number,
        minScale: number = 0.1,
        maxScale: number = 3
    ): void {
        const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
        const currentScale = this.transformContainer.scale.x;
        const newScale = Math.max(minScale, Math.min(maxScale, currentScale * zoomFactor));

        // Получаем мировую позицию курсора
        const worldPos = this.canvasToWorld(canvasX, canvasY);

        // Применяем новый scale
        this.transformContainer.scale.set(newScale);

        // Корректируем позицию чтобы zoom был относительно курсора
        const newCanvasPos = this.worldToCanvas(worldPos.x, worldPos.y);
        this.transformContainer.x += canvasX - newCanvasPos.x;
        this.transformContainer.y += canvasY - newCanvasPos.y;
    }

    public getCurrentScale(): number {
        return this.transformContainer.scale.x;
    }

    public getCurrentPosition(): PIXI.Point {
        return new PIXI.Point(this.transformContainer.x, this.transformContainer.y);
    }

    // Canvas → World coordinates
    public canvasToWorld(canvasX: number, canvasY: number): PIXI.Point {
        // ✅ ПРАВИЛЬНОЕ ПРЕОБРАЗОВАНИЕ с учетом scale и position
        const point = new PIXI.Point(canvasX, canvasY);

        // Вычитаем позицию контейнера и делим на scale
        point.x = (point.x - this.transformContainer.x) / this.transformContainer.scale.x;
        point.y = (point.y - this.transformContainer.y) / this.transformContainer.scale.y;

        return point;
    }

    public worldToCanvas(worldX: number, worldY: number): PIXI.Point {
        // ✅ ПРАВИЛЬНОЕ ПРЕОБРАЗОВАНИЕ: умножаем на scale и добавляем позицию
        const point = new PIXI.Point(worldX, worldY);

        point.x = (point.x * this.transformContainer.scale.x) + this.transformContainer.x;
        point.y = (point.y * this.transformContainer.scale.y) + this.transformContainer.y;

        return point;
    }

    public getCurrentTransform() {
        return {
            scale: this.transformContainer.scale.x,
            position: { x: this.transformContainer.x, y: this.transformContainer.y }
        };
    }

    public getCanvasFromWheelEvent(event: WheelEvent): PIXI.Point {
        const rect = this.canvas.getBoundingClientRect();
        return new PIXI.Point(
            event.clientX - rect.left,
            event.clientY - rect.top
        );
    }
}