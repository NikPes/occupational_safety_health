import * as PIXI from 'pixi.js';
import { PhiNodeBase } from '../PhiNodeBase/PhiNodeBase';
import { ThemeMode } from '../PhiConstructSpace/types';
import { DragDropManager } from './utils/DragDropManager';
import { CoordinateSystem } from '../../utils/CoordinateSystem';

export class NodesLayer {
    public container: PIXI.Container;
    private nodes: PhiNodeBase[] = [];
    private app: PIXI.Application;
    private currentTheme: ThemeMode = 'dark';
    private dragDropManager!: DragDropManager;
    private coordinateSystem?: CoordinateSystem;

    constructor(app: PIXI.Application, dragDropManager: DragDropManager) {
        this.app = app;
        this.dragDropManager = dragDropManager;
        this.container = new PIXI.Container();
    }

    // ✅ Метод для установки системы координат
    public setCoordinateSystem(coordinateSystem: CoordinateSystem): void {
        this.coordinateSystem = coordinateSystem;

        // Обновляем позиции всех существующих нодов
        this.nodes.forEach(node => {
            node.setCoordinateSystem(coordinateSystem);
            node.updateVisualPosition();
        });
    }

    public async createNode(title: string, worldX: number, worldY: number,
                            onRequestSettings: () => void): Promise<PhiNodeBase> {
        const nodeBase = new PhiNodeBase({
            title,
            width: 300,
            height: 200,
            theme: this.currentTheme,
            onRequestSettings,
            app: this.app,
            worldX, // ✅ Передаем мировые координаты
            worldY
        });

        // ✅ Устанавливаем систему координат для нода
        if (this.coordinateSystem) {
            nodeBase.setCoordinateSystem(this.coordinateSystem);
        }

        // ✅ Позиция устанавливается автоматически через updateVisualPosition в конструкторе PhiNodeBase

        // Устанавливаем ссылку на nodeBase для доступа
        (nodeBase.node as any).nodeBase = nodeBase;

        // НАСТРАИВАЕМ ОБРАБОТЧИКИ ПЕРЕТАСКИВАНИЯ
        this.setupNodeDragHandlers(nodeBase);

        this.container.addChild(nodeBase.node);
        this.nodes.push(nodeBase);

        return nodeBase;
    }

    private async setupNodeDragHandlers(node: PhiNodeBase): Promise<void> {
        const header = node.getHeader();
        if (!header) {
            console.error('❌ Node header not found!');
            return;
        }

        // ЖДЕМ инициализацию заголовка
        if (header.waitForInitialization) {
            await header.waitForInitialization();
        }

        // Теперь moveIcon должен быть доступен
        const moveIcon = header.getMoveIcon();

        if (moveIcon) {
            // Убираем старые обработчики
            moveIcon.removeAllListeners();
            moveIcon.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
                this.dragDropManager.startNodeDrag(node, event);
                event.stopPropagation();
            });

            moveIcon.on('pointerover', () => {
                moveIcon.alpha = 0.7;
            });

            moveIcon.on('pointerout', () => {
                moveIcon.alpha = 1.0;
            });
        } else {
            console.error('❌ Move icon still not found after wait');
        }
    }

    public setTheme(theme: ThemeMode): void {
        this.currentTheme = theme;
        this.nodes.forEach(node => {
            // TODO: Добавить метод setTheme в PhiNodeBase
        });
    }

    // ✅ Метод для обновления позиций всех нодов (при изменении зума/панорамирования)
    public updateAllNodesPositions(): void {
        this.nodes.forEach(node => {
            node.updateVisualPosition();
        });
    }

    public resize(width: number, height: number): void {
        // Логика ресайза для слоя нодов (если нужна)
        console.log('NodesLayer resized:', width, height);
    }

    public getAllNodes(): PhiNodeBase[] {
        return this.nodes;
    }

    public getNodeAt(x: number, y: number): PhiNodeBase | null {
        // ✅ ВАЖНО: здесь x, y - это канвасные координаты?
        // Если да, то нужно преобразовать в мировые для проверки bounds
        return this.nodes.find(node => {
            const bounds = node.node.getBounds();
            return x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height;
        }) || null;
    }

    public removeNode(node: PhiNodeBase): void {
        const index = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
            this.container.removeChild(node.node);
            node.destroy();
        }
    }

    public destroy(): void {
        this.nodes.forEach(node => node.destroy());
        this.nodes = [];
        this.container.removeChildren();
    }
}