import * as PIXI from 'pixi.js';
import { SocketManager } from '../Socket/SocketManager';
import { BaseSocket } from '../Socket/BaseSocket';
import socketAddSvg from './assets/socket_add.svg';

export interface BodyOptions {
    width: number;
    height: number;
    color: number;
    onAddInputSocket?: () => void;
    onAddOutputSocket?: () => void;
    app: PIXI.Application;
}

export class PhiNodeBody {
    public container: PIXI.Container;
    public background!: PIXI.Graphics;
    public inputSocketButton!: PIXI.Sprite | PIXI.Graphics;
    public outputSocketButton!: PIXI.Sprite | PIXI.Graphics;
    public contentContainer: PIXI.Container;

    public inputSockets: BaseSocket[] = [];
    public outputSockets: BaseSocket[] = [];

    private options: BodyOptions;
    private isMinimized: boolean = false;
    private originalHeight: number;
    private originalContentHeight: number;
    private animation: ((ticker: PIXI.Ticker) => void) | null = null;
    private socketAddTexture: PIXI.Texture | null = null;

    constructor(options: BodyOptions) {
        this.options = options;
        this.originalHeight = options.height;
        this.originalContentHeight = options.height - 40;
        this.container = new PIXI.Container();
        this.contentContainer = new PIXI.Container();
        this.createBody();
    }

    private async createBody(): Promise<void> {
        this.background = new PIXI.Graphics();
        this.drawBackground();
        this.container.addChild(this.background);

        await this.loadSocketAddTexture();

        this.container.addChild(this.contentContainer);

        this.createInputSocketButton();
        this.createOutputSocketButton();
    }

    private async loadSocketAddTexture(): Promise<void> {
        try {
            this.socketAddTexture = await PIXI.Assets.load(socketAddSvg);
        } catch (error) {
            console.warn('Failed to load socket_add texture:', error);
        }
    }

    private createInputSocketButton(): void {
        if (this.socketAddTexture) {
            this.inputSocketButton = new PIXI.Sprite(this.socketAddTexture);
        } else {
            const graphics = new PIXI.Graphics();
            graphics.beginFill(0x3B82F6, 0.8);
            graphics.drawCircle(0, 0, 8);
            graphics.endFill();

            graphics.beginFill(0xffffff);
            graphics.drawRect(-2, -6, 4, 12);
            graphics.drawRect(-6, -2, 12, 4);
            graphics.endFill();

            this.inputSocketButton = graphics;
        }

        this.inputSocketButton.x = 10;
        this.inputSocketButton.y = 10;
        this.inputSocketButton.width = 16;
        this.inputSocketButton.height = 16;
        this.inputSocketButton.eventMode = 'static';
        this.inputSocketButton.cursor = 'pointer';

        this.inputSocketButton.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            event.stopPropagation();
            if (this.options.onAddInputSocket) {
                this.options.onAddInputSocket();
            }
        });

        this.container.addChild(this.inputSocketButton);
    }

    private createOutputSocketButton(): void {
        if (this.socketAddTexture) {
            this.outputSocketButton = new PIXI.Sprite(this.socketAddTexture);
        } else {
            const graphics = new PIXI.Graphics();
            graphics.beginFill(0x10B981, 0.8);
            graphics.drawCircle(0, 0, 8);
            graphics.endFill();

            graphics.beginFill(0xffffff);
            graphics.drawRect(-2, -6, 4, 12);
            graphics.drawRect(-6, -2, 12, 4);
            graphics.endFill();

            this.outputSocketButton = graphics;
        }

        this.outputSocketButton.x = this.options.width - 26;
        this.outputSocketButton.y = 10;
        this.outputSocketButton.width = 16;
        this.outputSocketButton.height = 16;
        this.outputSocketButton.eventMode = 'static';
        this.outputSocketButton.cursor = 'pointer';

        this.outputSocketButton.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            event.stopPropagation();
            if (this.options.onAddOutputSocket) {
                this.options.onAddOutputSocket();
            }
        });

        this.container.addChild(this.outputSocketButton);
    }

    public setMinimized(minimized: boolean): void {
        if (this.isMinimized === minimized) return;

        this.isMinimized = minimized;

        if (this.animation) {
            this.options.app.ticker.remove(this.animation);
        }

        const targetHeight = minimized ? 0 : this.originalHeight;
        const duration = 300;
        const startTime = Date.now();
        const startHeight = this.options.height;

        this.animation = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeProgress = progress < 0.5
                ? 2 * progress * progress
                : -1 + (4 - 2 * progress) * progress;

            const newHeight = startHeight + (targetHeight - startHeight) * easeProgress;
            this.setHeight(newHeight);

            if (progress === 1) {
                if (this.animation) {
                    this.options.app.ticker.remove(this.animation);
                }
                this.animation = null;

                this.contentContainer.visible = !minimized;
                this.inputSocketButton.visible = !minimized;
                this.outputSocketButton.visible = !minimized;
            }
        };

        this.options.app.ticker.add(this.animation);
    }

    public async addInputSocket(typeKey: string, name: string): Promise<BaseSocket> {
        if (!SocketManager.getIsInitialized()) {
            await SocketManager.initialize();
        }

        const socket = SocketManager.createSocket(typeKey, name);
        this.positionInputSocket(socket, this.inputSockets.length);

        this.inputSockets.push(socket);
        this.contentContainer.addChild(socket.uiContainer);

        return socket;
    }

    public async addOutputSocket(typeKey: string, name: string): Promise<BaseSocket> {
        if (!SocketManager.getIsInitialized()) {
            await SocketManager.initialize();
        }

        const socket = SocketManager.createSocket(typeKey, name);
        this.positionOutputSocket(socket, this.outputSockets.length);

        this.outputSockets.push(socket);
        this.contentContainer.addChild(socket.uiContainer);

        return socket;
    }

    private positionInputSocket(socket: BaseSocket, index: number): void {
        const yPosition = 50 + index * 40;
        socket.setPosition(10, yPosition);
    }

    private positionOutputSocket(socket: BaseSocket, index: number): void {
        const yPosition = 50 + index * 40;
        socket.setPosition(this.options.width - socket.uiContainer.width - 10, yPosition);
    }

    public setWidth(width: number): void {
        this.options.width = width;
        this.updateLayout();
    }

    public setHeight(height: number): void {
        this.options.height = height;
        this.updateLayout();
    }

    private drawBackground(): void {
        this.background.clear();
        this.background.roundRect(0, 0, this.options.width, this.options.height, 5);
        this.background.fill({ color: this.options.color, alpha: 0.9 });
    }

    private updateLayout(): void {
        this.drawBackground();
        this.outputSocketButton.x = this.options.width - 26;

        this.outputSockets.forEach((socket, index) => {
            this.positionOutputSocket(socket, index);
        });
    }

    public getIsMinimized(): boolean {
        return this.isMinimized;
    }

    public getOriginalHeight(): number {
        return this.originalHeight;
    }

    public destroy(): void {
        if (this.animation) {
            this.options.app.ticker.remove(this.animation);
            this.animation = null;
        }

        this.inputSockets.forEach(socket => socket.destroy());
        this.outputSockets.forEach(socket => socket.destroy());
        this.container.destroy({ children: true });
    }
}