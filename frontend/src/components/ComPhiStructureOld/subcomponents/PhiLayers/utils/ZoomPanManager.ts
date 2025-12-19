import * as PIXI from 'pixi.js';
import { CoordinateSystem } from '../../../utils/CoordinateSystem';

export class ZoomPanManager {
    private isPanning: boolean = false;
    private lastMousePosition: PIXI.Point = new PIXI.Point();
    private minScale: number = 0.1;
    private maxScale: number = 3;
    private onTransformChange?: (transform: any) => void;
    private dragDropManagerRef: any = null;

    constructor(
        private transformContainer: PIXI.Container,
        private coordinateSystem: CoordinateSystem
    ) {
        this.setupEventListeners();
    }

    public setDragDropManager(dragDropManager: any): void {
        this.dragDropManagerRef = dragDropManager;
    }

    private isNodeBeingDragged(): boolean {
        return this.dragDropManagerRef ? this.dragDropManagerRef.isDraggingNode() : false;
    }

    private setupEventListeners(): void {
        this.transformContainer.eventMode = 'static';
        this.transformContainer.hitArea = new PIXI.Rectangle(-10000, -10000, 20000, 20000);

        // Pan workspace
        this.transformContainer.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            if (event.target !== this.transformContainer || this.isNodeBeingDragged()) {
                return;
            }

            this.isPanning = true;
            this.lastMousePosition.set(event.global.x, event.global.y);
            this.transformContainer.cursor = 'grabbing';

            const worldMouseCoordinate = this.coordinateSystem.canvasToWorld(event.global.x, event.global.y);
            const currentScale = this.coordinateSystem.getCurrentScale();
            const zoomScale = currentScale * 100;

            console.log('🧭 PAN START - Coordinates:', {
                currentMouseCoordinate: {
                    x: Math.round(event.global.x * 100) / 100,
                    y: Math.round(event.global.y * 100) / 100
                },
                worldMouseCoordinate: {
                    x: Math.round(worldMouseCoordinate.x * 100) / 100,
                    y: Math.round(worldMouseCoordinate.y * 100) / 100
                },
                zoomScale: `${zoomScale.toFixed(1)}%`,
                transformPosition: {
                    x: Math.round(this.transformContainer.x * 100) / 100,
                    y: Math.round(this.transformContainer.y * 100) / 100
                }
            });
        });

        this.transformContainer.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
            if (this.isPanning) {
                const deltaX = event.global.x - this.lastMousePosition.x;
                const deltaY = event.global.y - this.lastMousePosition.y;

                this.transformContainer.x += deltaX;
                this.transformContainer.y += deltaY;

                this.lastMousePosition.set(event.global.x, event.global.y);
                this.notifyTransformChange();
            }
        });

        this.transformContainer.on('pointerup', () => {
            if (!this.isPanning) return;

            this.isPanning = false;
            this.transformContainer.cursor = 'grab';

            const currentScale = this.coordinateSystem.getCurrentScale();
            const zoomScale = currentScale * 100;

            console.log('🧭 PAN END - Final Transform:', {
                transformPosition: {
                    x: Math.round(this.transformContainer.x * 100) / 100,
                    y: Math.round(this.transformContainer.y * 100) / 100
                },
                zoomScale: `${zoomScale.toFixed(1)}%`
            });
            console.log('---');
        });

        this.transformContainer.on('pointerupoutside', () => {
            this.isPanning = false;
            this.transformContainer.cursor = 'grab';
        });

        // Zoom колесиком мыши - ТЕПЕРЬ ИСПОЛЬЗУЕМ CoordinateSystem
        this.transformContainer.on('wheel', (event: WheelEvent) => {
            event.preventDefault();

            const canvasCoords = this.coordinateSystem.getCanvasFromWheelEvent(event);

            console.log('🔍 ZoomPanManager: ZOOM', {
                oldScale: this.coordinateSystem.getCurrentScale(),
                deltaY: event.deltaY,
                canvasX: canvasCoords.x,
                canvasY: canvasCoords.y
            });

            // ✅ ВСЯ ЛОГИКА ЗУМА ПЕРЕМЕЩЕНА В CoordinateSystem
            this.coordinateSystem.applyZoom(
                event.deltaY,
                canvasCoords.x,
                canvasCoords.y,
                this.minScale,
                this.maxScale
            );

            console.log('🎯 ZoomPanManager: new transform', {
                x: Math.round(this.transformContainer.x * 100) / 100,
                y: Math.round(this.transformContainer.y * 100) / 100,
                scale: this.coordinateSystem.getCurrentScale()
            });

            this.notifyTransformChange();
        });
    }

    public setOnTransformChange(callback: (transform: any) => void) {
        console.log('🎯 ZoomPanManager: setOnTransformChange called', {
            callbackExists: !!callback,
            zoomPanManager: this,
            hasOnTransformChange: !!this.onTransformChange
        });
        this.onTransformChange = callback;
    }

    private notifyTransformChange() {
        console.log('🎯 ZoomPanManager: notifyTransformChange called', {
            hasCallback: !!this.onTransformChange,
            callbackType: typeof this.onTransformChange,
            transform: {
                scale: this.coordinateSystem.getCurrentScale(),
                position: { x: this.transformContainer.x, y: this.transformContainer.y }
            }
        });

        if (this.onTransformChange) {
            console.log('🎯 Calling onTransformChange callback...');
            this.onTransformChange({
                scale: this.coordinateSystem.getCurrentScale(),
                position: { x: this.transformContainer.x, y: this.transformContainer.y }
            });
            console.log('🎯 Callback executed');
        } else {
            console.warn('🎯 No onTransformChange callback registered!');
        }
    }

    public resetView(): void {
        this.transformContainer.position.set(0, 0);
        this.transformContainer.scale.set(1);
        this.notifyTransformChange();
    }

    public setScale(scale: number): void {
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, scale));
        this.transformContainer.scale.set(newScale);
        this.notifyTransformChange();
    }

    public getScale(): number {
        return this.coordinateSystem.getCurrentScale();
    }

    public getTransformContainer(): PIXI.Container {
        return this.transformContainer;
    }

    public getCurrentTransform() {
        return {
            scale: this.coordinateSystem.getCurrentScale(),
            position: {
                x: this.transformContainer.x,
                y: this.transformContainer.y
            }
        };
    }

    public destroy(): void {
        this.transformContainer.removeAllListeners();
    }
}