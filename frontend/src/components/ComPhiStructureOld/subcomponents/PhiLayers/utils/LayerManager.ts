import * as PIXI from 'pixi.js';
import { BackgroundLayer } from '../BackgroundLayer';
import { NodesLayer } from '../NodesLayer';
import { ConnectionsLayer } from '../ConnectionsLayer';
import { UILayer } from '../UILayer';
import { OverlayLayer } from '../OverlayLayer';
import { ToolbarLayer } from '../ToolbarLayer';
import { DiagnosticLayer } from '../DiagnosticLayer';
import { ThemeMode, GridMode } from '../../PhiConstructSpace/types';
import { PhiNodeBase } from '../../PhiNodeBase/PhiNodeBase';
import type { NodeSettingsData } from '../../PhiNodeBase/subcomponents/PhiNodeSettings/types/types';
import { DragDropManager } from '../utils/DragDropManager';
import { ZoomPanManager } from '../utils/ZoomPanManager';
import { CoordinateSystem } from '../../../utils/CoordinateSystem';
import { DiagnosticManager } from '../utils/DiagnosticManager';
import { DebugPanel } from '../layers/DebugPanel';

export class LayerManager {
    public backgroundLayer: BackgroundLayer;
    public nodesLayer: NodesLayer;
    public connectionsLayer: ConnectionsLayer;
    public toolbarLayer: ToolbarLayer;
    public diagnosticLayer: DiagnosticLayer;
    public uiLayer: UILayer;
    public overlayLayer: OverlayLayer;
    public zoomPanManager: ZoomPanManager;
    public dragDropManager: DragDropManager;
    public coordinateSystem: CoordinateSystem;
    public debugPanel: DebugPanel;
    public diagnosticManager: DiagnosticManager;

    private app: PIXI.Application;
    private blurFilter: PIXI.BlurFilter | null = null;
    private layersToBlur: PIXI.Container[] = [];
    private transformContainer: PIXI.Container;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.transformContainer = new PIXI.Container();

        // ✅ СОЗДАЕМ ЕДИНУЮ СИСТЕМУ КООРДИНАТ ПЕРВОЙ
        console.log('🏗️ LayerManager: Creating CoordinateSystem...');
        this.coordinateSystem = new CoordinateSystem(app.canvas, this.transformContainer);

        // ✅ СОЗДАЕМ МЕНЕДЖЕРЫ С ПЕРЕДАЧЕЙ СИСТЕМЫ КООРДИНАТ
        this.dragDropManager = new DragDropManager(this.app.stage, this.coordinateSystem);
        this.zoomPanManager = new ZoomPanManager(this.transformContainer, this.coordinateSystem);

        // ✅ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: УСТАНАВЛИВАЕМ СВЯЗЬ МЕЖДУ МЕНЕДЖЕРАМИ
        this.zoomPanManager.setDragDropManager(this.dragDropManager);

        // ✅ ИНИЦИАЛИЗАЦИЯ СЛОЕВ (после создания менеджеров)
        console.log('🏗️ LayerManager: Creating BackgroundLayer with CoordinateSystem...');
        this.backgroundLayer = new BackgroundLayer(app, this.coordinateSystem, this.transformContainer);
        this.nodesLayer = new NodesLayer(app, this.dragDropManager);
        this.connectionsLayer = new ConnectionsLayer();
        this.diagnosticLayer = new DiagnosticLayer(app);

        console.log('🏗️ LayerManager: Created BackgroundLayer instance:', {
            instance: this.backgroundLayer,
            hasUpdateMethod: !!this.backgroundLayer?.update,
            container: this.backgroundLayer?.container,
            containerChildren: this.backgroundLayer?.container.children.length
        });

        // ✅ ИНИЦИАЛИЗИРУЕМ В ПРАВИЛЬНОМ ПОРЯДКЕ
        this.diagnosticManager = DiagnosticManager.getInstance();

        this.coordinateSystem = new CoordinateSystem(app.canvas, this.transformContainer);

        this.backgroundLayer = new BackgroundLayer(app, this.coordinateSystem, this.transformContainer);

        // ✅ ИНИЦИАЛИЗИРУЕМ DEBUG PANEL (БЕЗ КОЛБЭКА - теперь управление через DiagnosticManager)
        this.debugPanel = new DebugPanel(app, 'dark');

        // ✅ ПЕРЕДАЕМ СИСТЕМУ КООРДИНАТ В NODES LAYER
        this.nodesLayer.setCoordinateSystem(this.coordinateSystem);

        // ✅ ПОДПИСЫВАЕМСЯ НА ИЗМЕНЕНИЯ ТРАНСФОРМАЦИЙ ДЛЯ ОБНОВЛЕНИЯ ПОЗИЦИЙ НОДОВ
        this.zoomPanManager.setOnTransformChange(() => {
            console.log('🏗️ LayerManager: Transform change callback - DETAILED DIAGNOSTICS', {
                // ✅ ПРОВЕРЯЕМ ВСЕ КРИТИЧЕСКИЕ КОМПОНЕНТЫ
                hasBackgroundLayer: !!this.backgroundLayer,
                backgroundLayerInstance: this.backgroundLayer,
                backgroundLayerContainer: this.backgroundLayer?.container,
                hasUpdateMethod: !!this.backgroundLayer?.update,
                updateMethodType: typeof this.backgroundLayer?.update,

                // ✅ ПРОВЕРЯЕМ ДРУГИЕ КОМПОНЕНТЫ
                hasNodesLayer: !!this.nodesLayer,
                hasUpdateAllNodesPositions: !!this.nodesLayer?.updateAllNodesPositions,

                // ✅ ПРОВЕРЯЕМ ТЕКУЩЕЕ СОСТОЯНИЕ
                transformContainer: {
                    x: this.transformContainer.x,
                    y: this.transformContainer.y,
                    scale: this.transformContainer.scale.x
                }
            });

            // ✅ ПРОВЕРЯЕМ ВЫЗОВ update() С ОБРАБОТКОЙ ОШИБОК
            if (this.backgroundLayer && typeof this.backgroundLayer.update === 'function') {
                console.log('🏗️ Calling backgroundLayer.update()...');
                try {
                    this.backgroundLayer.update();
                    console.log('🏗️ backgroundLayer.update() completed successfully');
                } catch (error) {
                    console.error('🏗️ Error calling backgroundLayer.update():', error);
                }
            } else {
                console.error('🏗️ CANNOT CALL backgroundLayer.update() - CRITICAL ISSUE', {
                    backgroundLayerExists: !!this.backgroundLayer,
                    updateMethodExists: !!this.backgroundLayer?.update,
                    updateMethodType: typeof this.backgroundLayer?.update
                });

                // ✅ АВАРИЙНЫЙ ВАРИАНТ: ПРЯМОЙ ВЫЗОВ createGrid
                if (this.backgroundLayer && typeof this.backgroundLayer.createGrid === 'function') {
                    console.log('🏗️ Emergency: Calling createGrid() directly');
                    this.backgroundLayer.createGrid();
                }
            }

            // ✅ ВЫЗЫВАЕМ ОБНОВЛЕНИЕ НОДОВ
            if (this.nodesLayer && typeof this.nodesLayer.updateAllNodesPositions === 'function') {
                this.nodesLayer.updateAllNodesPositions();
            }

            if (this.backgroundLayer) {
                console.log('💥 DIRECT backgroundLayer.update() CALL');
                this.backgroundLayer.update();
            }

        });

        // Колбэк для добавления нода
        this.toolbarLayer = new ToolbarLayer(app, () => {
            const worldX = Math.random() * 2000 - 1000;
            const worldY = Math.random() * 2000 - 1000;
            this.createNode('New Node', worldX, worldY, () => {
                const nodes = this.getAllNodes();
                const lastNode = nodes[nodes.length - 1];
                if (lastNode) {
                    this.openNodeSettings(lastNode, () => {}, () => {});
                }
            });
        });

        // ✅ РЕГИСТРИРУЕМ КОЛБЭК ДЛЯ WORKSPACE SETTINGS ПОСЛЕ СОЗДАНИЯ
        this.toolbarLayer.setOnWorkspaceSettingsCallback(() => {
            this.openWorkspaceSettings(
                (data) => console.log('Save workspace:', data),
                () => console.log('Close workspace settings')
            );
        });

        this.uiLayer = new UILayer(app);
        this.overlayLayer = new OverlayLayer(app);

        this.setupLayers();
    }

    private setupLayers(): void {
        console.log('🏗️ LayerManager: Setting up layers...');

        // Очищаем stage на всякий случай
        this.app.stage.removeChildren();

        // 1. Transform container (zoom/pan применяется здесь) - САМЫЙ НИЖНИЙ СЛОЙ
        this.app.stage.addChild(this.transformContainer);

        // 1.1. BackgroundLayer - ПЕРВЫМ в transformContainer (самый нижний)
        this.transformContainer.addChild(this.backgroundLayer.container);

        // 1.2. Остальные слои поверх фона
        this.transformContainer.addChild(this.connectionsLayer.container);
        this.transformContainer.addChild(this.nodesLayer.container);

        // 2. Diagnostic layer - поверх нодов, но под UI
        this.app.stage.addChild(this.diagnosticLayer.container);

        // 3. Верхние слои - фиксированные, не масштабируются
        this.app.stage.addChild(this.toolbarLayer.container);
        this.app.stage.addChild(this.uiLayer.container);
        this.app.stage.addChild(this.overlayLayer.container);

        // ✅ ДИАГНОСТИКА: проверяем порядок и видимость
        // ✅ ПРОВЕРКА ПОЗИЦИЙ И ВИДИМОСТИ
        console.log('🏗️ LayerManager: Final setup check', {
            stageChildren: this.app.stage.children.length,
            transformChildren: this.transformContainer.children.length,
            backgroundLayer: {
                inTransform: this.transformContainer.children.includes(this.backgroundLayer.container),
                position: { x: this.backgroundLayer.container.x, y: this.backgroundLayer.container.y },
                scale: { x: this.backgroundLayer.container.scale.x, y: this.backgroundLayer.container.scale.y },
                visible: this.backgroundLayer.container.visible,
                alpha: this.backgroundLayer.container.alpha
            },
            transformContainer: {
                position: { x: this.transformContainer.x, y: this.transformContainer.y },
                scale: { x: this.transformContainer.scale.x, y: this.transformContainer.scale.y }
            }
        });

        // ✅ ПРОВЕРКА ЧЕРЕЗ PIXI
        setTimeout(() => {
            const backgroundBounds = this.backgroundLayer.container.getBounds();
            console.log('🏗️ BackgroundLayer bounds after setup:', backgroundBounds);
        }, 200);

        // Слои для размытия
        this.layersToBlur = [
            this.backgroundLayer.container,
            this.nodesLayer.container,
            this.connectionsLayer.container,
            this.diagnosticLayer.container
        ];
    }

    // ===== УПРАВЛЕНИЕ РАЗМЫТИЕМ =====

    public applySelectiveBlur(): void {
        console.log('🔹 Applying selective blur to background layers');

        this.blurFilter = new PIXI.BlurFilter({ strength: 2 });

        // Применяем размытие только к нижним слоям
        this.layersToBlur.forEach(layer => {
            layer.filters = [this.blurFilter!];
        });

        // Верхние слои (UI) остаются четкими
        this.toolbarLayer.container.filters = [];
        this.uiLayer.container.filters = [];
        this.overlayLayer.container.filters = [];

        // Управляем интерактивностью
        this.disableBackgroundInteractivity();
    }

    public removeSelectiveBlur(): void {
        console.log('🔧 LayerManager: Removing selective blur');

        if (!this.blurFilter) {
            console.log('🔧 LayerManager: No blur filter to remove');
            return;
        }

        // Убираем размытие со всех слоев
        this.layersToBlur.forEach(layer => {
            layer.filters = [];
        });

        this.blurFilter = null;
        this.enableBackgroundInteractivity();

        console.log('🔧 LayerManager: Selective blur removed successfully');
    }

    private disableBackgroundInteractivity(): void {
        // Отключаем интерактивность нижних слоев
        this.backgroundLayer.container.eventMode = 'none';
        this.nodesLayer.container.eventMode = 'none';
        this.connectionsLayer.container.eventMode = 'none';
        this.transformContainer.eventMode = 'none';

        // Оставляем активными верхние слои
        this.toolbarLayer.container.eventMode = 'static';
        this.uiLayer.container.eventMode = 'static';
        this.overlayLayer.container.eventMode = 'static';
    }

    private enableBackgroundInteractivity(): void {
        // Восстанавливаем интерактивность всех слоев
        this.backgroundLayer.container.eventMode = 'static';
        this.nodesLayer.container.eventMode = 'static';
        this.connectionsLayer.container.eventMode = 'static';
        this.transformContainer.eventMode = 'static';
        this.diagnosticLayer.container.eventMode = 'static';
        this.toolbarLayer.container.eventMode = 'static';
        this.uiLayer.container.eventMode = 'static';
        this.overlayLayer.container.eventMode = 'static';
    }

    // ===== УПРАВЛЕНИЕ ПАНЕЛЯМИ =====

    public async openNodeSettings(node: PhiNodeBase, onSave: (data: NodeSettingsData) => void, onClose: () => void): Promise<void> {
        this.applySelectiveBlur();
        await this.uiLayer.openNodeSettings(node, onSave, onClose);
    }

    public async openWorkspaceSettings(onSave: (data: any) => void, onClose: () => void): Promise<void> {
        console.log('🔧 LayerManager: Opening workspace settings...');
        this.applySelectiveBlur();
        await this.uiLayer.openWorkspaceSettings(onSave, () => {
            // ✅ ВЫЗЫВАЕМ removeSelectiveBlur ПРИ ЗАКРЫТИИ ПАНЕЛИ
            this.removeSelectiveBlur();
            onClose();
        });
    }

    public async openAppearanceSettings(onSettingsChange: (settings: any) => void, onClose: () => void): Promise<void> {
        this.applySelectiveBlur();
        await this.uiLayer.openAppearanceSettings(onSettingsChange, onClose);
    }

    public async openToolsPanel(onClose: () => void): Promise<void> {
        this.applySelectiveBlur();
        await this.uiLayer.openToolsPanel(onClose);
    }

    public closeAllPanels(): void {
        console.log('🔧 LayerManager: Closing all panels...');
        this.uiLayer.destroy();
        this.removeSelectiveBlur(); // ✅ ГАРАНТИРУЕМ СНЯТИЕ РАЗМЫТИЯ
    }

    public isPanelOpen(): boolean {
        return this.uiLayer.getActivePanel() !== null;
    }

    // ===== ОСНОВНЫЕ МЕТОДЫ =====

    public setTheme(theme: ThemeMode): void {
        this.backgroundLayer.setTheme(theme);
        this.nodesLayer.setTheme(theme);
        this.uiLayer.setTheme(theme);

        this.app.renderer.background.color = theme === 'dark' ? 0x1a1a1a : 0xf0f0f0;
    }

    public setGridMode(mode: GridMode): void {
        this.backgroundLayer.setGridMode(mode);
    }

    public async createNode(title: string, worldX: number, worldY: number, // ✅ Изменяем на мировые координаты
                            onRequestSettings: () => void): Promise<PhiNodeBase> {
        try {
            const node = await this.nodesLayer.createNode(title, worldX, worldY, onRequestSettings);
            return node;
        } catch (error) {
            console.error('Error creating node:', error);
            throw error;
        }
    }

    public startTitleEditing(node: PhiNodeBase, onFinish: (save: boolean, newTitle?: string) => void): void {
        this.overlayLayer.startTitleEditing(node, onFinish);
    }

    public resize(width: number, height: number): void {
        this.backgroundLayer.resize(width, height);
        this.nodesLayer.resize(width, height);
        this.connectionsLayer.resize(width, height);
        this.diagnosticLayer.resize(width, height);
        this.toolbarLayer.resize(width, height);
        this.uiLayer.resize(width, height);
        this.overlayLayer.resize(width, height);

        this.app.stage.hitArea = new PIXI.Rectangle(0, 0, width, height);
    }

    public getTransformContainer(): PIXI.Container {
        return this.transformContainer;
    }

    public getAllNodes(): PhiNodeBase[] {
        return this.nodesLayer.getAllNodes();
    }

    public destroy(): void {
        this.closeAllPanels();

        // Уничтожаем менеджеры
        this.dragDropManager.destroy();
        this.zoomPanManager.destroy();

        // Уничтожаем слои
        this.backgroundLayer.container.destroy();
        this.nodesLayer.destroy();
        this.connectionsLayer.destroy();
        this.toolbarLayer.destroy();
        this.diagnosticLayer.destroy();
        this.uiLayer.destroy();
        this.overlayLayer.destroy();
    }
}