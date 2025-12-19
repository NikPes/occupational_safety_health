import * as PIXI from 'pixi.js';
import { PhiNodeBase } from '../../PhiNodeBase/PhiNodeBase';
import { CoordinateSystem } from '../../../utils/CoordinateSystem';

export class DragDropManager {
    private activeNode: PhiNodeBase | null = null;
    private dragOffset: PIXI.Point = new PIXI.Point(0, 0);
    private isDragging: boolean = false;
    private coordinateSystem: CoordinateSystem;

    // Для оптимизации
    private lastUpdateTime: number = 0;
    private updateThreshold: number = 16;

    constructor(private stage: PIXI.Container, coordinateSystem: CoordinateSystem) {
        this.coordinateSystem = coordinateSystem;
        this.setupGlobalEventListeners();
    }

    private setupGlobalEventListeners(): void {
        this.stage.eventMode = 'static';
        this.stage.hitArea = new PIXI.Rectangle(-50000, -50000, 100000, 100000);

        this.stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
            this.handlePointerMove(event);
        });

        this.stage.on('pointerup', () => this.handlePointerUp());
        this.stage.on('pointerupoutside', () => this.handlePointerUp());
    }

    public startNodeDrag(node: PhiNodeBase, event: PIXI.FederatedPointerEvent): void {
        // ✅ БЛОКИРУЕМ распространение события
        event.stopPropagation();

        this.activeNode = node;
        this.isDragging = true;
        this.lastUpdateTime = performance.now();

        // ✅ ИСПРАВЛЕНИЕ: используем КАНВАСНЫЕ координаты для расчета offset
        const currentMouseCoordinate = new PIXI.Point(event.global.x, event.global.y);

        // Получаем КАНВАСНЫЕ координаты нода (уже с учетом трансформаций)
        const nodeCanvasPos = this.coordinateSystem.worldToCanvas(
            node.getWorldPosition().x,
            node.getWorldPosition().y
        );

        // ✅ Offset в КАНВАСНЫХ координатах
        this.dragOffset.set(
            currentMouseCoordinate.x - nodeCanvasPos.x,
            currentMouseCoordinate.y - nodeCanvasPos.y
        );

        const zoomScale = this.coordinateSystem.getCurrentTransform().scale * 100;

        // ✅ ИСПРАВЛЕНИЕ: используем canvasToWorld вместо screenToWorld
        const worldMouseCoordinate = this.coordinateSystem.canvasToWorld(event.global.x, event.global.y);

        const currentNodeCoordinate = new PIXI.Point(node.node.x, node.node.y);
        const worldNodeCoordinate = node.getWorldPosition();

        // ✅ ДИАГНОСТИКА с реальными числами
        console.log('🚀 DRAG START - Coordinates:', {
            currentMouseCoordinate: {
                x: Math.round(currentMouseCoordinate.x * 100) / 100,
                y: Math.round(currentMouseCoordinate.y * 100) / 100
            },
            worldMouseCoordinate: {
                x: Math.round(worldMouseCoordinate.x * 100) / 100,
                y: Math.round(worldMouseCoordinate.y * 100) / 100
            },
            nodeCanvasPos: {
                x: Math.round(nodeCanvasPos.x * 100) / 100,
                y: Math.round(nodeCanvasPos.y * 100) / 100
            },
            zoomScale: `${zoomScale.toFixed(1)}%`,
            currentNodeCoordinate: {
                x: Math.round(currentNodeCoordinate.x * 100) / 100,
                y: Math.round(currentNodeCoordinate.y * 100) / 100
            },
            worldNodeCoordinate: {
                x: Math.round(worldNodeCoordinate.x * 100) / 100,
                y: Math.round(worldNodeCoordinate.y * 100) / 100
            },
            dragOffset: {
                x: Math.round(this.dragOffset.x * 100) / 100,
                y: Math.round(this.dragOffset.y * 100) / 100
            }
        });

        if (node.setDraggingStatus) {
            node.setDraggingStatus(true);
        }

        this.stage.cursor = 'grabbing';
    }

    private handlePointerMove(event: PIXI.FederatedPointerEvent): void {
        if (!this.isDragging || !this.activeNode) return;

        const now = performance.now();
        if (now - this.lastUpdateTime < this.updateThreshold) return;
        this.lastUpdateTime = now;

        // ✅ ИСПРАВЛЕНИЕ: используем canvasToWorld для консистентности
        const currentMouseCoordinate = new PIXI.Point(event.global.x, event.global.y);

        // Вычисляем новую КАНВАСНУЮ позицию нода
        const newCanvasX = currentMouseCoordinate.x - this.dragOffset.x;
        const newCanvasY = currentMouseCoordinate.y - this.dragOffset.y;

        // ✅ ИСПРАВЛЕНИЕ: используем canvasToWorld вместо прямой математики
        const newWorldPos = this.coordinateSystem.canvasToWorld(newCanvasX, newCanvasY);

        // Устанавливаем новую позицию в МИРОВЫХ координатах
        this.activeNode.setWorldPosition(newWorldPos.x, newWorldPos.y);

        this.updateNodeConnections();
    }

    private handlePointerUp(): void {
        if (!this.isDragging || !this.activeNode) return;

        // Получаем все координаты для диагностики окончания
        const worldNodeCoordinate = this.activeNode.getWorldPosition();
        const currentNodeCoordinate = new PIXI.Point(this.activeNode.node.x, this.activeNode.node.y);
        const zoomScale = this.coordinateSystem.getCurrentTransform().scale * 100;

        console.log('🛑 DRAG END - Final Node Position:', {
            worldNodeCoordinate: {
                x: Math.round(worldNodeCoordinate.x * 100) / 100,
                y: Math.round(worldNodeCoordinate.y * 100) / 100
            },
            currentNodeCoordinate: {
                x: Math.round(currentNodeCoordinate.x * 100) / 100,
                y: Math.round(currentNodeCoordinate.y * 100) / 100
            },
            zoomScale: `${zoomScale.toFixed(1)}%`
        });
        console.log('---');

        if (this.activeNode.setDraggingStatus) {
            this.activeNode.setDraggingStatus(false);
        }

        this.activeNode = null;
        this.isDragging = false;
        this.dragOffset.set(0, 0);
        this.stage.cursor = 'default';
    }

    private updateNodeConnections(): void {
        if (this.activeNode && (this.activeNode as any).updateConnections) {
            (this.activeNode as any).updateConnections();
        }
    }

    public getActiveNode(): PhiNodeBase | null {
        return this.activeNode;
    }

    public isDraggingNode(): boolean {
        return this.isDragging;
    }

    public cancelDrag(): void {
        if (this.isDragging && this.activeNode) {
            console.log('🚫 DRAG CANCELLED');

            if (this.activeNode.setDraggingStatus) {
                this.activeNode.setDraggingStatus(false);
            }

            this.activeNode = null;
            this.isDragging = false;
            this.dragOffset.set(0, 0);
            this.stage.cursor = 'default';
        }
    }

    public destroy(): void {
        this.cancelDrag();
        this.stage.removeAllListeners();
    }
}