// BackgroundLayer.ts - ДОБАВЛЯЕМ ЛОГИ И ЯРКИЙ ЦВЕТ
import * as PIXI from 'pixi.js';
import { ThemeMode, GridMode } from '../PhiConstructSpace/types';
import { CoordinateSystem } from '../../utils/CoordinateSystem';

export class BackgroundLayer {
    public container: PIXI.Container;
    private currentTheme: ThemeMode = 'dark';
    private currentGridMode: GridMode = 'lines';
    private app: PIXI.Application;
    private coordinateSystem: CoordinateSystem;
    private transformContainer: PIXI.Container;

    constructor(app: PIXI.Application, coordinateSystem: CoordinateSystem, transformContainer: PIXI.Container) {
        this.app = app;
        this.coordinateSystem = coordinateSystem;
        this.transformContainer = transformContainer; // ✅ СОХРАНЯЕМ
        this.container = new PIXI.Container();

        console.log('🎨 BackgroundLayer: Constructor called', {
            hasCoordinateSystem: !!coordinateSystem,
            hasTransformContainer: !!this.transformContainer,
            screenSize: { width: app.screen.width, height: app.screen.height },
            transformContainer: {
                position: { x: this.transformContainer.x, y: this.transformContainer.y },
                scale: { x: this.transformContainer.scale.x, y: this.transformContainer.scale.y }
            }
        });

        this.createGrid();
    }

    public setTheme(theme: ThemeMode): void {
        console.log('🎨 BackgroundLayer: setTheme called', { theme });
        this.currentTheme = theme;
        this.createGrid();
    }

    public setGridMode(mode: GridMode): void {
        console.log('🎨 BackgroundLayer: setGridMode called', { mode });
        this.currentGridMode = mode;
        this.createGrid();
    }

    // ✅ ДОБАВЛЯЕМ ГЕТТЕРЫ ДЛЯ ДИАГНОСТИКИ
    public getGridMode(): string {
        return this.currentGridMode;
    }

    public getTheme(): string {
        return this.currentTheme;
    }

    public isGridVisible(): boolean {
        return this.currentGridMode !== 'none';
    }

    public resize(width: number, height: number): void {
        console.log('🎨 BackgroundLayer: resize called', { width, height });
        this.createGrid();
    }

    public update(): void {
        console.log('🎨 BackgroundLayer: update called (transform changed)', {
            currentGridMode: this.currentGridMode,
            containerChildren: this.container.children.length,
            timestamp: Date.now()
        });

        // ✅ ПРОВЕРЯЕМ ВЫЗОВ createGrid()
        console.log('🎨 Calling createGrid() from update...');
        this.createGrid();
        console.log('🎨 createGrid() completed');
    }

    public createGrid(): void {
        console.log('🎨 BackgroundLayer: createGrid START', {
            mode: this.currentGridMode,
            theme: this.currentTheme
        });

        // ✅ ТЕСТ: Проверяем преобразование координат
        const testWorldPoint = { x: 100, y: 100 };
        const testCanvasPoint = this.coordinateSystem.worldToCanvas(testWorldPoint.x, testWorldPoint.y);
        console.log('🎨 Coordinate test - World (100,100) → Canvas:', testCanvasPoint);

        this.container.removeChildren();

        // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ЕСЛИ РЕЖИМ 'none' - ВЫХОДИМ РАНЬШЕ
        if (this.currentGridMode === 'none') {
            console.log('🎨 BackgroundLayer: Grid mode is "none" - skipping grid creation');
            console.log('🎨 BackgroundLayer: createGrid END - no grid created');
            return;
        }

        const grid = new PIXI.Graphics();
        const gridSize = 100;

        // ✅ ЯРКИЙ ЦВЕТ ДЛЯ ТЕСТИРОВАНИЯ
        const GRID_COLOR = 0x32CD32; // LimeGreen
        const GRID_ALPHA = 0.8;

        if (this.currentGridMode === 'lines') {
            console.log('🎨 Drawing LINE grid with color:', GRID_COLOR.toString(16));
            this.drawLineGrid(grid, gridSize, GRID_COLOR, GRID_ALPHA);
        } else if (this.currentGridMode === 'dots') {
            console.log('🎨 Drawing DOT grid with color:', GRID_COLOR.toString(16));
            this.drawDotGrid(grid, gridSize, GRID_COLOR, GRID_ALPHA);
        }

        this.container.addChild(grid);

        console.log('🎨 BackgroundLayer: createGrid END - grid added to container', {
            containerChildren: this.container.children.length,
            gridBounds: grid.getBounds()
        });
    }

    private drawLineGrid(grid: PIXI.Graphics, gridSize: number, color: number, alpha: number): void {
        grid.stroke({
            width: 2,
            color: color,
            alpha: alpha
        });

        const viewportBounds = this.getViewportWorldBounds();
        console.log('🎨 Line Grid Viewport (World):', viewportBounds);

        // Вертикальные линии
        const startX = Math.floor(viewportBounds.left / gridSize) * gridSize;
        const endX = Math.ceil(viewportBounds.right / gridSize) * gridSize;

        for (let x = startX; x <= endX; x += gridSize) {
            const startCanvas = this.coordinateSystem.worldToCanvas(x, viewportBounds.top);
            const endCanvas = this.coordinateSystem.worldToCanvas(x, viewportBounds.bottom);

            grid.moveTo(startCanvas.x, startCanvas.y);
            grid.lineTo(endCanvas.x, endCanvas.y);
        }

        // Горизонтальные линии
        const startY = Math.floor(viewportBounds.top / gridSize) * gridSize;
        const endY = Math.ceil(viewportBounds.bottom / gridSize) * gridSize;

        for (let y = startY; y <= endY; y += gridSize) {
            const startCanvas = this.coordinateSystem.worldToCanvas(viewportBounds.left, y);
            const endCanvas = this.coordinateSystem.worldToCanvas(viewportBounds.right, y);

            grid.moveTo(startCanvas.x, startCanvas.y);
            grid.lineTo(endCanvas.x, endCanvas.y);
        }

        // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ВЫЗЫВАЕМ stroke() ДЛЯ ОТРИСОВКИ
        grid.stroke();
    }

    private drawDotGrid(grid: PIXI.Graphics, gridSize: number, color: number, alpha: number): void {
        grid.fill({
            color: color,
            alpha: alpha
        });

        const viewportBounds = this.getViewportWorldBounds();
        console.log('🎨 Dot Grid Viewport (World):', viewportBounds);

        const startX = Math.floor(viewportBounds.left / gridSize) * gridSize;
        const endX = Math.ceil(viewportBounds.right / gridSize) * gridSize;
        const startY = Math.floor(viewportBounds.top / gridSize) * gridSize;
        const endY = Math.ceil(viewportBounds.bottom / gridSize) * gridSize;

        let dotCount = 0;
        for (let x = startX; x <= endX; x += gridSize) {
            for (let y = startY; y <= endY; y += gridSize) {
                const canvasPos = this.coordinateSystem.worldToCanvas(x, y);
                grid.circle(canvasPos.x, canvasPos.y, 3);
                dotCount++;
            }
        }

        console.log('🎨 Created', dotCount, 'dots');

        // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ВЫЗЫВАЕМ fill() ДЛЯ ОТРИСОВКИ
        grid.fill();
    }

// ✅ МЕТОД ДЛЯ ПОЛУЧЕНИЯ ВИДИМОЙ ОБЛАСТИ В МИРОВЫХ КООРДИНАТАХ
    private getViewportWorldBounds(): { left: number; top: number; right: number; bottom: number } {
        const screenWidth = this.app.screen.width;
        const screenHeight = this.app.screen.height;

        console.log('🎨 getViewportWorldBounds: screen size', { screenWidth, screenHeight });

        // ✅ ИСПОЛЬЗУЕМ CoordinateSystem ДЛЯ ПРЕОБРАЗОВАНИЯ ВСЕХ УГЛОВ
        const topLeft = this.coordinateSystem.canvasToWorld(0, 0);
        const topRight = this.coordinateSystem.canvasToWorld(screenWidth, 0);
        const bottomLeft = this.coordinateSystem.canvasToWorld(0, screenHeight);
        const bottomRight = this.coordinateSystem.canvasToWorld(screenWidth, screenHeight);

        console.log('🎨 Canvas Corners → World:', {
            'topLeft(0,0)': { x: Math.round(topLeft.x), y: Math.round(topLeft.y) },
            'topRight(screen,0)': { x: Math.round(topRight.x), y: Math.round(topRight.y) },
            'bottomLeft(0,screen)': { x: Math.round(bottomLeft.x), y: Math.round(bottomLeft.y) },
            'bottomRight(screen,screen)': { x: Math.round(bottomRight.x), y: Math.round(bottomRight.y) }
        });

        const bounds = {
            left: Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x),
            top: Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y),
            right: Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x),
            bottom: Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y)
        };

        console.log('🎨 Viewport World Bounds:', bounds);
        return bounds;
    }
}