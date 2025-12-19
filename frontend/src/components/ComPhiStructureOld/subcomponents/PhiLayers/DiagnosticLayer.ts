// Layers/DiagnosticLayer.ts
import * as PIXI from 'pixi.js';
import { DiagnosticManager } from './utils/DiagnosticManager';
import { DebugData } from './utils/DiagnosticManager';

export class DiagnosticLayer {
    public container: PIXI.Container;
    private app: PIXI.Application;
    private diagnosticManager: DiagnosticManager;
    private debugData: DebugData | null = null;
    private debugTexts: Map<string, PIXI.Text> = new Map();
    private isVisible: boolean = false;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.diagnosticManager = DiagnosticManager.getInstance();
        this.container = new PIXI.Container();

        this.setupDiagnosticUpdates();
    }

    private setupDiagnosticUpdates(): void {
        setInterval(() => {
            this.updateDiagnosticData();
        }, 100);
    }

    private updateDiagnosticData(): void {
        const settings = this.diagnosticManager.getSettings();

        if (!settings.showDiagnostics && this.isVisible) {
            this.hideDiagnostics();
            return;
        }

        if (settings.showDiagnostics && !this.isVisible) {
            this.showDiagnostics();
        }

        if (settings.showDiagnostics) {
            this.debugData = this.diagnosticManager.getCurrentData();
            this.updateDiagnosticDisplay();
        }
    }

    private showDiagnostics(): void {
        this.isVisible = true;
        this.container.visible = true;
        this.createDiagnosticElements();
    }

    private hideDiagnostics(): void {
        this.isVisible = false;
        this.container.visible = false;
        this.clearDiagnosticElements();
    }

    private createDiagnosticElements(): void {
        this.clearDiagnosticElements();

        const settings = this.diagnosticManager.getSettings();

        // ✅ ПЕРЕМЕЩАЕМ В НИЖНЮЮ ЧАСТЬ ЭКРАНА ПО ЦЕНТРУ
        const startY = this.app.screen.height - 350; // Отступ снизу
        const centerX = this.app.screen.width / 2;
        let yOffset = startY;

        // FPS - всегда показываем если диагностика включена
        this.createDebugText('fps', 'FPS: 0', centerX - 150, yOffset);
        yOffset += 20;

        // Остальные переменные в зависимости от настроек
        if (settings.monitoredVariables.has('mousePosition')) {
            this.createDebugText('mouse', 'Мышь: (0, 0)', centerX - 150, yOffset);
            yOffset += 20;
        }

        if (settings.monitoredVariables.has('transform')) {
            this.createDebugText('transform', 'Transform: pos(0,0) scale(1.00)', centerX - 150, yOffset);
            yOffset += 20;
        }

        if (settings.monitoredVariables.has('activeNode')) {
            this.createDebugText('node', 'Нод: нет', centerX - 150, yOffset);
            yOffset += 20;
        }

        if (settings.monitoredVariables.has('dragState')) {
            this.createDebugText('drag', 'Перетаскивание: idle', centerX - 150, yOffset);
            yOffset += 20;
        }

        // ✅ НОВЫЕ ДАННЫЕ ДЛЯ АНАЛИЗА СЕТКИ
        this.createDebugText('grid', 'Сетка: mode=lines theme=dark', centerX - 150, yOffset);
        yOffset += 20;

        this.createDebugText('viewport', 'Viewport: world(0,0)-(0,0)', centerX - 150, yOffset);
        yOffset += 20;

        this.createDebugText('background', 'Background: children=0', centerX - 150, yOffset);
        yOffset += 20;

        // Информация о координатах - более компактно
        this.createDebugText('coords', 'Координаты: screen/canvas/world', centerX - 150, yOffset);
    }

    private createDebugText(key: string, initialText: string, x: number, y: number): void {
        const text = new PIXI.Text({
            text: initialText,
            style: new PIXI.TextStyle({
                fontSize: 12,
                fill: 0x00FF00,
                fontFamily: 'Arial',
                stroke: 0x000000
            })
        });
        text.x = x;
        text.y = y;

        this.debugTexts.set(key, text);
        this.container.addChild(text);
    }

    private updateDiagnosticDisplay(): void {
        if (!this.debugData) return;

        const settings = this.diagnosticManager.getSettings();

        // Обновляем FPS
        if (this.debugTexts.has('fps')) {
            const fpsText = this.debugTexts.get('fps')!;
            fpsText.text = `FPS: ${this.debugData.fps}`;

            // Цвет в зависимости от FPS
            let fillColor = 0x00FF00;
            if (this.debugData.fps < 30) {
                fillColor = 0xFF4444;
            } else if (this.debugData.fps < 50) {
                fillColor = 0xFFAA00;
            }

            // ✅ ОБНОВЛЯЕМ СТИЛЬ ПРАВИЛЬНО
            fpsText.style = new PIXI.TextStyle({
                ...fpsText.style,
                fill: fillColor
            });
        }

        // ✅ НОВЫЕ ДАННЫЕ ДЛЯ АНАЛИЗА СЕТКИ
        if (this.debugTexts.has('grid')) {
            const gridText = this.debugTexts.get('grid')!;
            const gridInfo = this.debugData.gridInfo;
            if (gridInfo) {
                gridText.text = `Сетка: mode=${gridInfo.mode} theme=${gridInfo.theme} visible=${gridInfo.visible}`;
            } else {
                gridText.text = 'Сетка: нет данных';
            }
        }

        if (this.debugTexts.has('viewport')) {
            const viewportText = this.debugTexts.get('viewport')!;
            const viewportInfo = this.debugData.viewportInfo;
            if (viewportInfo) {
                viewportText.text = `Viewport: world(${Math.round(viewportInfo.worldLeft)},${Math.round(viewportInfo.worldTop)})-(${Math.round(viewportInfo.worldRight)},${Math.round(viewportInfo.worldBottom)})`;
            } else {
                viewportText.text = 'Viewport: нет данных';
            }
        }

        if (this.debugTexts.has('background')) {
            const backgroundText = this.debugTexts.get('background')!;
            const backgroundInfo = this.debugData.backgroundInfo;
            if (backgroundInfo) {
                backgroundText.text = `Background: children=${backgroundInfo.childrenCount} bounds=(${Math.round(backgroundInfo.bounds?.width || 0)}x${Math.round(backgroundInfo.bounds?.height || 0)})`;
            } else {
                backgroundText.text = 'Background: нет данных';
            }
        }

        // Обновляем позицию мыши
        if (settings.monitoredVariables.has('mousePosition') && this.debugTexts.has('mouse')) {
            const mouseText = this.debugTexts.get('mouse')!;
            const mouse = this.debugData.mousePosition;
            mouseText.text = `Мышь: canvas(${Math.round(mouse.canvas.x)}, ${Math.round(mouse.canvas.y)}) world(${Math.round(mouse.world.x)}, ${Math.round(mouse.world.y)})`;
        }

        // Обновляем transform
        if (settings.monitoredVariables.has('transform') && this.debugTexts.has('transform')) {
            const transformText = this.debugTexts.get('transform')!;
            const transform = this.debugData.transform;
            transformText.text = `Transform: pos(${Math.round(transform.position.x)}, ${Math.round(transform.position.y)}) scale(${transform.scale.toFixed(2)})`;
        }

        // Обновляем активный нод
        if (settings.monitoredVariables.has('activeNode') && this.debugTexts.has('node')) {
            const nodeText = this.debugTexts.get('node')!;
            if (this.debugData.activeNode) {
                const node = this.debugData.activeNode;
                nodeText.text = `Нод: ${node.title} world(${Math.round(node.world.x)}, ${Math.round(node.world.y)})`;
            } else {
                nodeText.text = 'Нод: нет';
            }
        }

        // Обновляем состояние перетаскивания
        if (settings.monitoredVariables.has('dragState') && this.debugTexts.has('drag')) {
            const dragText = this.debugTexts.get('drag')!;
            dragText.text = `Перетаскивание: ${this.debugData.dragState}`;
        }

        // Обновляем информацию о координатах
        if (this.debugTexts.has('coords')) {
            const coordsText = this.debugTexts.get('coords')!;
            coordsText.text = this.formatCoordinateInfo();
        }
    }

    private formatCoordinateInfo(): string {
        if (!this.debugData) return 'Координаты: screen/canvas/world';

        const mouse = this.debugData.mousePosition;
        const transform = this.debugData.transform;

        return `Координаты:\n` +
               `Screen: (${Math.round(mouse.canvas.x)}, ${Math.round(mouse.canvas.y)})\n` +
               `World: (${Math.round(mouse.world.x)}, ${Math.round(mouse.world.y)})\n` +
               `Transform: (${Math.round(transform.position.x)}, ${Math.round(transform.position.y)}) scale${transform.scale.toFixed(2)}`;
    }

    private clearDiagnosticElements(): void {
        this.debugTexts.forEach(text => {
            this.container.removeChild(text);
        });
        this.debugTexts.clear();
    }

    public resize(width: number, height: number): void {
        // ✅ ПЕРЕСЧИТЫВАЕМ ПОЗИЦИИ ПРИ РЕСАЙЗЕ
        this.clearDiagnosticElements();
        if (this.isVisible) {
            this.createDiagnosticElements();
        }
    }

    public destroy(): void {
        this.clearDiagnosticElements();
        this.container.destroy({ children: true });
    }
}