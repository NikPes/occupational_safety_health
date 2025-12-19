import * as PIXI from 'pixi.js';
import { ThemeMode, GridMode } from './types';
import { LayerManager } from '../PhiLayers/utils/LayerManager';
import { ZoomPanManager } from '../PhiLayers/utils/ZoomPanManager';
import { DragDropManager } from '../PhiLayers/utils/DragDropManager';
import { DiagnosticManager } from '../PhiLayers/utils/DiagnosticManager';
import type { NodeSettingsData } from '../PhiNodeBase/subcomponents/PhiNodeSettings/types/types';

export class PhiConstructSpaceView {
    public app!: PIXI.Application;
    public layerManager!: LayerManager;
    public zoomPanManager!: ZoomPanManager;
    public dragDropManager!: DragDropManager;
    public diagnosticManager!: DiagnosticManager;

    private currentTheme: ThemeMode = 'dark';
    private currentGridMode: GridMode = 'lines';
    private initializationPromise!: Promise<void>;
    private isInitialized = false;
    private static instance: PhiConstructSpaceView | null = null;

    constructor() {
        // ✅ ПРОВЕРКА НА УЖЕ СУЩЕСТВУЮЩИЙ ЭКЗЕМПЛЯР
        if (PhiConstructSpaceView.instance) {
            return PhiConstructSpaceView.instance;
        }

        this.app = new PIXI.Application();
        this.initializationPromise = this.initializeApp();
        PhiConstructSpaceView.instance = this; // ✅ СОХРАНЯЕМ ЭКЗЕМПЛЯР
    }

    // Добавляем методы для получения текущих трансформаций
    public getCurrentTransform() {
        if (this.layerManager && this.layerManager.zoomPanManager) {
            return this.layerManager.zoomPanManager.getCurrentTransform();
        }
        return { scale: 1, position: { x: 0, y: 0 } };
    }

    // Метод для подписки на изменения трансформаций
    public reactonTransformChange(callback: (transform: any) => void) {
        if (this.layerManager && this.layerManager.zoomPanManager) {
            this.layerManager.zoomPanManager.setOnTransformChange(callback);
        }
    }

    public async waitForInitialization(): Promise<void> {
        return this.initializationPromise;
    }

    public getIsInitialized(): boolean {
        return this.isInitialized;
    }

    private async initializeApp(): Promise<void> {
        try {
            await this.app.init({
                width: window.innerWidth,
                height: window.innerHeight,
                backgroundColor: this.currentTheme === 'dark' ? 0x1a1a1a : 0xf0f0f0,
                backgroundAlpha: 1,
                antialias: true,
                autoDensity: true,
                resolution: window.devicePixelRatio || 1,
            });

            this.diagnosticManager = DiagnosticManager.getInstance();

            // Даем время на инициализацию
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!this.app.stage) {
                throw new Error('PixiJS stage not initialized');
            }

            // ✅ УПРОЩЕННОЕ СОЗДАНИЕ: ТОЛЬКО LayerManager
            this.layerManager = new LayerManager(this.app);

            // ✅ ПОЛУЧАЕМ МЕНЕДЖЕРЫ ИЗ LayerManager
            this.dragDropManager = this.layerManager.dragDropManager;
            this.zoomPanManager = this.layerManager.zoomPanManager;

            // ✅ ИНИЦИАЛИЗИРУЕМ DIAGNOSTIC MANAGER С ДАННЫМИ
            this.diagnosticManager.initialize(
                this.app,
                this.layerManager.getTransformContainer(),
                () => this.getActiveNode(),
                this.layerManager.coordinateSystem,     // ✅ ДОБАВЛЯЕМ coordinateSystem
                this.layerManager.backgroundLayer      // ✅ ДОБАВЛЯЕМ backgroundLayer
            );

            // ✅ ДОБАВЛЯЕМ ОБНОВЛЕНИЕ В ГЛАВНЫЙ ЦИКЛ
            this.setupDiagnosticUpdate();


            // Создаем начальный нод только после полной инициализации
            await this.createInitialNode();

            this.setupEventListeners();
            this.isInitialized = true;

            console.log('✅ PhiConstructSpaceView initialized successfully');

        } catch (error) {
            console.error('Failed to initialize PixiJS application:', error);
            this.createFallbackScene();
            this.isInitialized = true;
        }
    }

    // ✅ МЕТОД ДЛЯ ПОЛУЧЕНИЯ АКТИВНОГО НОДА
    private getActiveNode(): any {
        // TODO: Реализовать логику получения активного нода
        // Пока возвращаем первый нод или null
        const nodes = this.layerManager?.getAllNodes();
        return nodes && nodes.length > 0 ? nodes[0] : null;
    }

    // ✅ НАСТРОЙКА ОБНОВЛЕНИЯ ДИАГНОСТИКИ В ГЛАВНОМ ЦИКЛЕ
    private setupDiagnosticUpdate(): void {
        this.app.ticker.add(() => {
            this.diagnosticManager.update();
        });
    }

    private async createInitialNode(): Promise<void> {
        try {
            // ✅ ИСПРАВЛЕНИЕ: создаем нод в мировых координатах (0, 0) вместо canvas координат
            const node = await this.layerManager.createNode(
                'Phi Node',
                0, // worldX - центр мировых координат
                0, // worldY - центр мировых координат
                () => this.openNodeSettings()
            );
            console.log('✅ Initial node created at world position (0, 0):', node.getTitle());
        } catch (error) {
            console.error('Failed to create initial node:', error);
        }
    }

    private setupEventListeners(): void {
        // Глобальная обработка Escape для закрытия панелей
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.layerManager.isPanelOpen()) {
                this.layerManager.closeAllPanels();
            }
        });
    }

    private startTitleEditing(): void {
        const nodes = this.layerManager.getAllNodes();
        if (nodes.length > 0) {
            this.layerManager.startTitleEditing(nodes[0], (save, newTitle) => {
                if (save && newTitle) {
                    nodes[0].setTitle(newTitle);
                }
            });
        }
    }

    private async openNodeSettings(): Promise<void> {
        const nodes = this.layerManager.getAllNodes();
        if (nodes.length > 0) {
            await this.layerManager.openNodeSettings(
                nodes[0],
                (data) => this.saveNodeSettings(data),
                () => this.closeNodeSettings()
            );
        }
    }

    private async saveNodeSettings(data: NodeSettingsData): Promise<void> {
        try {
            const token = localStorage.getItem('authToken') || (window as any).authToken;
            const response = await fetch('/WorkOST/phi_node', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving node settings:', error);
            throw error;
        }
    }

    private closeNodeSettings(): void {
        // Закрытие обрабатывается в LayerManager
    }

    private createFallbackScene(): void {
        if (!this.app.stage) return;

        const text = new PIXI.Text({
            text: 'Phi Construct Space\nClick settings icon to edit node title',
            style: {
                fontSize: 16,
                fill: 0xffffff,
                align: 'center'
            }
        });
        text.anchor.set(0.5);
        text.x = this.app.screen.width / 2;
        text.y = this.app.screen.height / 2;
        this.app.stage.addChild(text);
    }

    // ===== ПУБЛИЧНЫЕ МЕТОДЫ =====

    public setTheme(theme: ThemeMode): void {
        this.currentTheme = theme;
        this.layerManager.setTheme(theme);
    }

    public setGridMode(mode: GridMode): void {
        this.currentGridMode = mode;
        this.layerManager.setGridMode(mode);
    }

    public resize(width: number, height: number): void {
        if (this.app?.renderer && this.layerManager) {
            this.app.renderer.resize(width, height);
            this.layerManager.resize(width, height);
            this.app.renderer.render(this.app.stage);
        }
    }

    public addNode(): void {
        // ✅ ИСПРАВЛЕНИЕ: создаем ноды в случайных мировых координатах
        const worldX = Math.random() * 2000 - 1000; // от -1000 до 1000
        const worldY = Math.random() * 2000 - 1000;

        this.layerManager.createNode(
            'New Node',
            worldX, // мировые координаты
            worldY,
            () => this.openNodeSettings()
        );
    }

    public openWorkspaceSettings(): void {
        this.layerManager.openWorkspaceSettings(
            (data) => console.log('Save workspace:', data),
            () => console.log('Close workspace settings')
        );
    }

    public openAppearanceSettings(): void {
        this.layerManager.openAppearanceSettings(
            (settings) => {
                this.setTheme(settings.theme);
                this.setGridMode(settings.gridMode);
            },
            () => console.log('Close appearance settings')
        );
    }

    public getTitle(): string {
        const nodes = this.layerManager.getAllNodes();
        return nodes.length > 0 ? nodes[0].getTitle() : 'Phi Node';
    }

    public async safeDestroy(): Promise<void> {
        try {
            // Останавливаем диагностику
            if (this.diagnosticManager) {
                this.diagnosticManager.destroy();
            }

            if (this.layerManager) {
                this.layerManager.destroy();
            }

            if (this.app.stage) {
                this.app.stage.removeChildren();
            }

            if (this.app.renderer) {
                this.app.renderer.destroy();
            }

            this.isInitialized = false;
            PhiConstructSpaceView.instance = null;

            console.log('✅ PhiConstructSpaceView destroyed successfully');
        } catch (error) {
            console.warn('Error during safe destroy:', error);
        }
    }
}