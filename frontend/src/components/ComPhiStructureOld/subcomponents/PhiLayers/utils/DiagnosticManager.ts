// utils/DiagnosticManager.ts
import * as PIXI from 'pixi.js';
import { CoordinateSystem } from '../../../utils/CoordinateSystem';
import { BackgroundLayer } from '../BackgroundLayer';
import { GridMode } from '../../PhiConstructSpace/types';

export interface Point {
    x: number;
    y: number;
}

export interface TransformState {
    position: Point;
    scale: number;
}

export interface MouseState {
    canvas: Point;
    world: Point;
}

export interface NodeState {
    world: Point;
    canvas: Point;
    title: string;
}

export interface ViewportInfo {
    worldLeft: number;
    worldTop: number;
    worldRight: number;
    worldBottom: number;
}

export interface BackgroundInfo {
    childrenCount: number;
    bounds?: { width: number; height: number };
}

export interface GridInfo {
    mode: string;
    theme: string;
    visible: boolean;
}

export interface DebugData {
    mousePosition: MouseState;
    activeNode: NodeState | null;
    transform: TransformState;
    dragState: string;
    fps: number;
    timestamp: number;

    gridInfo?: GridInfo;
    viewportInfo?: ViewportInfo;
    backgroundInfo?: BackgroundInfo;
}

export interface DebugSettings {
    showGrid: boolean;
    showDiagnostics: boolean;
    monitoredVariables: Set<string>;
    saveToFile: boolean;
    frameRate: number; // Каждый N-ый кадр сохранять
    throttleRate: number; // Частота обновления UI (мс)
}

export class DiagnosticManager {
    private static instance: DiagnosticManager;

    // Состояние отладки
    private settings: DebugSettings = {
        showGrid: false,
        showDiagnostics: false,
        monitoredVariables: new Set(),
        saveToFile: false,
        frameRate: 5,
        throttleRate: 100
    };

    // Текущие данные
    private currentData: DebugData = {
        mousePosition: { canvas: { x: 0, y: 0 }, world: { x: 0, y: 0 } },
        activeNode: null,
        transform: { position: { x: 0, y: 0 }, scale: 1 },
        dragState: 'idle',
        fps: 0,
        timestamp: 0
    };

    // Для throttling
    private lastUIUpdate: number = 0;
    private lastSaveFrame: number = 0;
    private frameCount: number = 0;
    private lastFpsUpdate: number = 0;

    // Накопленные данные для сохранения
    private savedData: DebugData[] = [];

    // Внешние зависимости
    private app: PIXI.Application | null = null;
    private transformContainer: PIXI.Container | null = null;
    private getActiveNodeCallback: (() => any) | null = null;
    private coordinateSystem: CoordinateSystem | null = null;
    private backgroundLayer: BackgroundLayer | null = null;

    private constructor() {
        this.setupFPSCounter();
    }

    public static getInstance(): DiagnosticManager {
        if (!DiagnosticManager.instance) {
            DiagnosticManager.instance = new DiagnosticManager();
        }
        return DiagnosticManager.instance;
    }

    // Инициализация внешних зависимостей
    public initialize(
        app: PIXI.Application,
        transformContainer: PIXI.Container,
        getActiveNodeCallback: () => any,
        coordinateSystem?: CoordinateSystem,
        backgroundLayer?: BackgroundLayer
    ): void {
        this.app = app;
        this.transformContainer = transformContainer;
        this.getActiveNodeCallback = getActiveNodeCallback;
        this.coordinateSystem = coordinateSystem || null;
        this.backgroundLayer = backgroundLayer || null;
    }

    // Установка зависимостей по отдельности
    public setCoordinateSystem(coordinateSystem: CoordinateSystem): void {
        this.coordinateSystem = coordinateSystem;
    }

    public setBackgroundLayer(backgroundLayer: BackgroundLayer): void {
        this.backgroundLayer = backgroundLayer;
    }

    // Основной метод обновления, вызывается каждый кадр
    public update(): void {
        const now = performance.now();
        this.frameCount++;

        // Всегда обновляем FPS и базовые данные
        this.updateFPS(now);
        this.updateMousePosition();
        this.updateTransform();
        this.updateActiveNode();
        this.updateDragState();

        // Обновляем данные о сетке и viewport
        this.updateGridInfo();
        this.updateViewportInfo();
        this.updateBackgroundInfo();

        // Throttling для UI обновления
        if (now - this.lastUIUpdate >= this.settings.throttleRate) {
            this.lastUIUpdate = now;
            this.currentData.timestamp = now;
            this.notifyUIUpdate();
        }

        // Логика сохранения в файл
        if (this.settings.saveToFile && this.settings.frameRate > 0) {
            if (this.frameCount - this.lastSaveFrame >= this.settings.frameRate) {
                this.lastSaveFrame = this.frameCount;
                this.savedData.push({ ...this.currentData });
            }
        }
    }

    private updateGridInfo(): void {
        if (this.backgroundLayer) {
            try {
                // ✅ ИСПОЛЬЗУЕМ РЕАЛЬНЫЕ ДАННЫЕ ИЗ BACKGROUND LAYER
                this.currentData.gridInfo = {
                    mode: this.backgroundLayer.getGridMode(),
                    theme: this.backgroundLayer.getTheme(),
                    visible: this.backgroundLayer.isGridVisible()
                };
            } catch (error) {
                console.warn('Error updating grid info:', error);
                this.currentData.gridInfo = undefined;
            }
        } else {
            this.currentData.gridInfo = undefined;
        }
    }

    private updateViewportInfo(): void {
        if (this.coordinateSystem && this.app) {
            try {
                const screenWidth = this.app.screen.width;
                const screenHeight = this.app.screen.height;

                // Преобразуем углы экрана в мировые координаты
                const topLeft = this.coordinateSystem.canvasToWorld(0, 0);
                const bottomRight = this.coordinateSystem.canvasToWorld(screenWidth, screenHeight);

                this.currentData.viewportInfo = {
                    worldLeft: topLeft.x,
                    worldTop: topLeft.y,
                    worldRight: bottomRight.x,
                    worldBottom: bottomRight.y
                };
            } catch (error) {
                console.warn('Error updating viewport info:', error);
                this.currentData.viewportInfo = undefined;
            }
        } else {
            this.currentData.viewportInfo = undefined;
        }
    }

    private updateBackgroundInfo(): void {
        if (this.backgroundLayer) {
            try {
                const container = this.backgroundLayer.container;
                const bounds = container.getBounds();

                this.currentData.backgroundInfo = {
                    childrenCount: container.children.length,
                    bounds: {
                        width: bounds.width,
                        height: bounds.height
                    }
                };
            } catch (error) {
                console.warn('Error updating background info:', error);
                this.currentData.backgroundInfo = undefined;
            }
        } else {
            this.currentData.backgroundInfo = undefined;
        }
    }

    private updateFPS(now: number): void {
        if (now - this.lastFpsUpdate >= 1000) {
            this.currentData.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    private updateMousePosition(): void {
        if (!this.app) return;

        const mouse = this.app.renderer.events.pointer;
        if (!mouse.global) return;

        this.currentData.mousePosition.canvas = {
            x: mouse.global.x,
            y: mouse.global.y
        };

        // Конвертация в мировые координаты
        if (this.coordinateSystem) {
            try {
                const worldPos = this.coordinateSystem.canvasToWorld(mouse.global.x, mouse.global.y);
                this.currentData.mousePosition.world = { x: worldPos.x, y: worldPos.y };
            } catch (error) {
                console.warn('Error converting mouse to world coordinates:', error);
                this.currentData.mousePosition.world = { x: 0, y: 0 };
            }
        } else if (this.transformContainer) {
            // Fallback: используем старую логику если coordinateSystem не доступен
            const worldPos = this.screenToWorld(mouse.global.x, mouse.global.y);
            this.currentData.mousePosition.world = worldPos;
        } else {
            this.currentData.mousePosition.world = { x: 0, y: 0 };
        }
    }

    private updateTransform(): void {
        if (this.transformContainer) {
            this.currentData.transform = {
                position: {
                    x: this.transformContainer.position.x,
                    y: this.transformContainer.position.y
                },
                scale: this.transformContainer.scale.x
            };
        }
    }

    private updateActiveNode(): void {
        if (this.getActiveNodeCallback) {
            try {
                const activeNode = this.getActiveNodeCallback();
                if (activeNode) {
                    this.currentData.activeNode = {
                        world: {
                            x: activeNode.worldX || 0,
                            y: activeNode.worldY || 0
                        },
                        canvas: this.worldToScreen(activeNode.worldX || 0, activeNode.worldY || 0),
                        title: activeNode.getTitle?.() || 'Unknown'
                    };
                } else {
                    this.currentData.activeNode = null;
                }
            } catch (error) {
                console.warn('Error updating active node:', error);
                this.currentData.activeNode = null;
            }
        } else {
            this.currentData.activeNode = null;
        }
    }

    private updateDragState(): void {
        // TODO: Интегрировать с DragDropManager
        this.currentData.dragState = 'idle'; // Временная заглушка
    }

    private screenToWorld(screenX: number, screenY: number): Point {
        if (!this.transformContainer) return { x: screenX, y: screenY };

        return {
            x: (screenX - this.transformContainer.position.x) / this.transformContainer.scale.x,
            y: (screenY - this.transformContainer.position.y) / this.transformContainer.scale.y
        };
    }

    private worldToScreen(worldX: number, worldY: number): Point {
        if (!this.transformContainer) return { x: worldX, y: worldY };

        return {
            x: worldX * this.transformContainer.scale.x + this.transformContainer.position.x,
            y: worldY * this.transformContainer.scale.y + this.transformContainer.position.y
        };
    }

    private setupFPSCounter(): void {
        // FPS считается в updateFPS
    }

    private notifyUIUpdate(): void {
        // TODO: Реализовать систему событий для обновления UI
        // Пока что UI обновляется через прямой вызов getCurrentData()
    }

    // Public API для получения данных
    public getCurrentData(): DebugData {
        return { ...this.currentData };
    }

    public getSettings(): DebugSettings {
        return { ...this.settings };
    }

    public updateSettings(newSettings: Partial<DebugSettings>): void {
        const oldShowGrid = this.settings.showGrid;
        this.settings = { ...this.settings, ...newSettings };

        // ✅ ИСПРАВЛЯЕМ ОШИБКУ TYPESCRIPT - ПРОВЕРЯЕМ НАЛИЧИЕ СВОЙСТВА
        if (newSettings.hasOwnProperty('showGrid') && newSettings.showGrid !== undefined) {
            this.handleGridSettingChange(newSettings.showGrid);
        }

        // Специальная обработка для monitoredVariables
        if (newSettings.monitoredVariables) {
            this.settings.monitoredVariables = new Set(newSettings.monitoredVariables);
        }
    }

    private handleGridSettingChange(showGrid: boolean): void {
        console.log('🔧 DiagnosticManager: Grid setting changed', { showGrid });

        if (this.backgroundLayer) {
            const gridMode: GridMode = showGrid ? 'lines' : 'none';
            this.backgroundLayer.setGridMode(gridMode);

            // ✅ СРАЗУ ОБНОВЛЯЕМ ДАННЫЕ О СЕТКЕ
            this.updateGridInfo();
        } else {
            console.warn('🔧 DiagnosticManager: No backgroundLayer reference to control grid');
        }
    }

    // Сохранение данных в файл
    public saveToFile(): void {
        if (this.savedData.length === 0) {
            console.warn('No debug data to save');
            return;
        }

        const timestamp = new Date().toLocaleTimeString('ru-RU').replace(/:/g, '.');
        const filename = `pixijs_debug_${timestamp}.txt`;

        const content = this.formatDebugData();
        this.downloadFile(filename, content);

        console.log(`Debug data saved to ${filename}`);
        this.savedData = []; // Очищаем после сохранения
    }

    private formatDebugData(): string {
        let content = `PixiJS Debug Data - ${new Date().toLocaleString('ru-RU')}\n`;
        content += `Total frames: ${this.savedData.length}\n\n`;

        this.savedData.forEach((data, index) => {
            content += `Frame ${index + 1} (${new Date(data.timestamp).toLocaleTimeString('ru-RU')}):\n`;

            if (this.settings.monitoredVariables.has('mousePosition')) {
                content += `  Mouse: canvas(${Math.round(data.mousePosition.canvas.x)}, ${Math.round(data.mousePosition.canvas.y)}) world(${Math.round(data.mousePosition.world.x)}, ${Math.round(data.mousePosition.world.y)})\n`;
            }

            if (this.settings.monitoredVariables.has('transform')) {
                content += `  Transform: pos(${Math.round(data.transform.position.x)}, ${Math.round(data.transform.position.y)}) scale(${data.transform.scale.toFixed(2)})\n`;
            }

            if (this.settings.monitoredVariables.has('fps')) {
                content += `  FPS: ${data.fps}\n`;
            }

            if (data.gridInfo) {
                content += `  Grid: mode=${data.gridInfo.mode} theme=${data.gridInfo.theme} visible=${data.gridInfo.visible}\n`;
            }

            if (data.viewportInfo) {
                content += `  Viewport: world(${Math.round(data.viewportInfo.worldLeft)},${Math.round(data.viewportInfo.worldTop)})-(${Math.round(data.viewportInfo.worldRight)},${Math.round(data.viewportInfo.worldBottom)})\n`;
            }

            if (data.backgroundInfo) {
                content += `  Background: children=${data.backgroundInfo.childrenCount} bounds=(${Math.round(data.backgroundInfo.bounds?.width || 0)}x${Math.round(data.backgroundInfo.bounds?.height || 0)})\n`;
            }

            content += '\n';
        });

        return content;
    }

    private downloadFile(filename: string, content: string): void {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        URL.revokeObjectURL(url);
    }

    // Очистка
    public clearSavedData(): void {
        this.savedData = [];
    }

    public destroy(): void {
        this.savedData = [];
        this.app = null;
        this.transformContainer = null;
        this.getActiveNodeCallback = null;
        this.coordinateSystem = null;
        this.backgroundLayer = null;
    }
}