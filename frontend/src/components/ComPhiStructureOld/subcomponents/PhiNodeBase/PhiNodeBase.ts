import * as PIXI from 'pixi.js';
import { PhiNodeHeader } from './subcomponents/Header/PhiNodeHeader';
import { PhiNodeBody } from './subcomponents/Body/PhiNodeBody';
import { PhiNodeFooter } from './subcomponents/Footer/PhiNodeFooter';
import { BaseSocket } from './subcomponents/Socket/BaseSocket';
import { CoordinateSystem } from '../../utils/CoordinateSystem'; // Добавляем импорт

export interface NodeOptions {
    title?: string;
    width?: number;
    height?: number;
    theme?: 'dark' | 'light';
    onRequestEditTitle?: () => void;
    onRequestSettings?: () => void;
    app: PIXI.Application;
    worldX?: number; // ✅ Добавляем мировые координаты
    worldY?: number;
}

export class PhiNodeBase {
    public node: PIXI.Container;
    public header!: PhiNodeHeader;
    public body!: PhiNodeBody;
    public footer!: PhiNodeFooter;

    // ✅ Добавляем мировые координаты
    public worldX: number;
    public worldY: number;

    private options: NodeOptions;
    private headerHeight: number = 30;
    private footerHeight: number = 25;
    private originalBodyHeight: number = 0;
    private originalHeight: number = 0;
    private isMinimized: boolean = false;
    private nodeId!: string;
    private coordinateSystem?: CoordinateSystem; // ✅ Для обновления позиции

    constructor(options: NodeOptions) {
        this.options = {
            title: 'PhiNodeBase',
            width: 300,
            height: 200,
            theme: 'dark',
            worldX: 0, // ✅ Значения по умолчанию
            worldY: 0,
            ...options
        };

        // ✅ Инициализируем мировые координаты
        this.worldX = this.options.worldX!;
        this.worldY = this.options.worldY!;

        this.originalHeight = this.options.height!;
        this.node = new PIXI.Container();
        this.nodeId = this.generateNodeId();

        this.createNode();
    }

    // ✅ Метод для установки системы координат
    public setCoordinateSystem(coordinateSystem: CoordinateSystem): void {
        this.coordinateSystem = coordinateSystem;
        this.updateVisualPosition(); // Обновляем позицию при первой установке
    }

    // ✅ Обновляет визуальную позицию на основе мировых координат
    public updateVisualPosition(): void {
        if (!this.coordinateSystem) {
            console.warn('CoordinateSystem not set for node', this.nodeId);
            return;
        }

        const canvasPos = this.coordinateSystem.worldToCanvas(this.worldX, this.worldY);
        this.node.x = canvasPos.x;
        this.node.y = canvasPos.y;
    }

    // ✅ Устанавливает мировые координаты и обновляет визуальную позицию
    public setWorldPosition(worldX: number, worldY: number): void {
        this.worldX = worldX;
        this.worldY = worldY;
        this.updateVisualPosition();
    }

    // ✅ Получает текущие мировые координаты
    public getWorldPosition(): { x: number; y: number } {
        return { x: this.worldX, y: this.worldY };
    }

    private generateNodeId(): string {
        return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    public isDragging(): boolean {
        // TODO: Реализовать проверку состояния перетаскивания
        // Временная заглушка
        return false;
    }

    public getNodeId(): string {
        return this.nodeId;
    }

    public setNodeId(id: string): void {
        this.nodeId = id;
    }

    private createNode(): void {
        const themeColor = this.options.theme === 'dark' ? 0x2a2a2a : 0xdddddd;
        const bodyColor = this.options.theme === 'dark' ? 0x333333 : 0xeeeeee;

        this.header = new PhiNodeHeader({
            title: this.options.title!,
            width: this.options.width!,
            height: this.headerHeight,
            color: themeColor,
            onMinimize: () => this.minimize(),
            onMaximize: () => this.maximize(),
            onEdit: () => {
                if (this.options.onRequestEditTitle) {
                    this.options.onRequestEditTitle();
                }
            },
            onRequestSettings: () => {
                if (this.options.onRequestSettings) {
                    this.options.onRequestSettings();
                }
            },
        });
        this.node.addChild(this.header.container);

        const bodyHeight = this.options.height! - this.headerHeight - this.footerHeight;
        this.originalBodyHeight = bodyHeight;
        this.body = new PhiNodeBody({
            width: this.options.width!,
            height: bodyHeight,
            color: bodyColor,
            app: this.options.app,
            onAddInputSocket: () => this.addInputSocket('integer', `input_${this.body.inputSockets.length + 1}`),
            onAddOutputSocket: () => this.addOutputSocket('integer', `output_${this.body.outputSockets.length + 1}`)
        });
        this.body.container.y = this.headerHeight;
        this.node.addChild(this.body.container);

        this.footer = new PhiNodeFooter({
            width: this.options.width!,
            height: this.footerHeight,
            color: themeColor,
            status: 'Ready'
        });
        this.footer.container.y = this.headerHeight + bodyHeight;
        this.node.addChild(this.footer.container);

        this.node.eventMode = 'static';
        this.node.cursor = 'auto';
    }

    public getHeader(): PhiNodeHeader | null {
        return this.header || null;
    }

    public getFooter(): PhiNodeFooter | null {
        return this.footer || null;
    }

    public setDraggingStatus(dragging: boolean): void {
        if (this.footer) {
            this.footer.setStatus(dragging ? 'Dragging...' : 'Ready');
        }
    }

    private minimize(): void {
        if (this.isMinimized) return;

        this.isMinimized = true;
        this.body.setMinimized(true);
        this.footer.setStatus('Minimized');
        this.header.toggleMinimized();
    }

    private maximize(): void {
        if (!this.isMinimized) return;

        this.isMinimized = false;
        this.body.setMinimized(false);
        this.footer.setStatus('Ready');
        this.header.toggleMinimized();
    }

    private async addInputSocket(typeKey: string, name: string): Promise<void> {
        try {
            const socket = await this.body.addInputSocket(typeKey, name);
            this.footer.setStatus(`Added input: ${name}`);

            if (!this.isMinimized) {
                this.updateBodySize();
            }
        } catch (error) {
            console.error('Failed to add input socket:', error);
            this.footer.setStatus('Error adding input');
        }
    }

    private async addOutputSocket(typeKey: string, name: string): Promise<void> {
        try {
            const socket = await this.body.addOutputSocket(typeKey, name);
            this.footer.setStatus(`Added output: ${name}`);

            if (!this.isMinimized) {
                this.updateBodySize();
            }
        } catch (error) {
            console.error('Failed to add output socket:', error);
            this.footer.setStatus('Error adding output');
        }
    }

    private updateBodySize(): void {
        const minBodyHeight = 100;
        const socketHeight = Math.max(this.body.inputSockets.length, this.body.outputSockets.length) * 40 + 60;
        const newBodyHeight = Math.max(minBodyHeight, socketHeight);

        if (newBodyHeight !== this.originalBodyHeight) {
            this.originalBodyHeight = newBodyHeight;
            const totalHeight = this.headerHeight + newBodyHeight + this.footerHeight;
            this.setSize(this.options.width!, totalHeight);
        }
    }

    public getTitle(): string {
        return this.header.getTitle();
    }

    public setTitle(title: string): void {
        this.header.setTitle(title);
        this.footer.setStatus(`Renamed to: ${title}`);
    }

    public setSize(width: number, height: number): void {
        this.options.width = width;
        this.options.height = height;

        this.header.setWidth(width);

        if (!this.isMinimized) {
            const bodyHeight = height - this.headerHeight - this.footerHeight;
            this.body.setWidth(width);
            this.body.setHeight(bodyHeight);
            this.originalBodyHeight = bodyHeight;
        }

        this.footer.setWidth(width);
        this.footer.container.y = this.headerHeight + (this.isMinimized ? 0 : this.originalBodyHeight);
    }

    public getGlobalPosition(): PIXI.Point {
        return this.node.getGlobalPosition();
    }

    public getIsMinimized(): boolean {
        return this.isMinimized;
    }

    public getInputSockets(): BaseSocket[] {
        return this.body.inputSockets;
    }

    public getOutputSockets(): BaseSocket[] {
        return this.body.outputSockets;
    }

    public destroy(): void {
        this.header.destroy();
        this.body.destroy();
        this.footer.destroy();
        this.node.destroy({ children: true });
    }
}