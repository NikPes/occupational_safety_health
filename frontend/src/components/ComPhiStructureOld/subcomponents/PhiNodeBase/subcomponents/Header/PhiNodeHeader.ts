import * as PIXI from 'pixi.js';
import moveSvg from './assets/move.svg';
import settingsSvg from './assets/settings.svg';
import toggleSvg from './assets/minimize_maximize_dark.svg';

export interface HeaderOptions {
    title: string;
    width: number;
    height: number;
    color: number;
    onMinimize?: () => void;
    onMaximize?: () => void;
    onEdit?: () => void;
    onRequestSettings?: () => void;
}

export class PhiNodeHeader {
    public container: PIXI.Container;
    public background!: PIXI.Graphics;
    public titleText!: PIXI.Text;
    public moveIcon: PIXI.Sprite | PIXI.Graphics | null = null; // Инициализируем null
    public settingsIcon!: PIXI.Sprite | PIXI.Graphics;
    public toggleIcon!: PIXI.Sprite | PIXI.Graphics;

    private options: HeaderOptions;
    private isMinimized: boolean = false;
    private moveIconTexture: PIXI.Texture | null = null;
    private settingsIconTexture: PIXI.Texture | null = null;
    private toggleIconTexture: PIXI.Texture | null = null;
    private initializationPromise: Promise<void>;

    constructor(options: HeaderOptions) {
        this.options = options;
        this.container = new PIXI.Container();
        this.initializationPromise = this.createHeader();
        this.container.eventMode = 'static';
        this.container.cursor = 'auto';
    }

    public async waitForInitialization(): Promise<void> {
        return this.initializationPromise;
    }

    private async createHeader(): Promise<void> {
        this.background = new PIXI.Graphics();
        this.drawBackground();
        this.container.addChild(this.background);

        await this.loadIconTextures();

        this.createMoveIcon();
        this.createTitleText();
        this.createSettingsIcon();
        this.createToggleIcon();
    }

    private async loadIconTextures(): Promise<void> {
        try {
            this.moveIconTexture = await PIXI.Assets.load(moveSvg);
            this.settingsIconTexture = await PIXI.Assets.load(settingsSvg);
            this.toggleIconTexture = await PIXI.Assets.load(toggleSvg);
        } catch (error) {
            console.warn('Failed to load icon textures, using fallback graphics:', error);
        }
    }

    private createMoveIcon(): void {
        if (this.moveIconTexture) {
            this.moveIcon = new PIXI.Sprite(this.moveIconTexture);
        } else {
            const graphics = new PIXI.Graphics();
            graphics.rect(0, 0, 16, 16);
            graphics.fill({ color: 0xffffff, alpha: 0.8 });
            this.moveIcon = graphics;
        }

        this.moveIcon.x = 10;
        this.moveIcon.y = 7;
        this.moveIcon.width = 16;
        this.moveIcon.height = 16;
        this.moveIcon.eventMode = 'static';
        this.moveIcon.cursor = 'grab';

        // УБИРАЕМ старые обработчики - они будут в NodesLayer
        this.moveIcon.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            event.stopPropagation();
            this.moveIcon!.cursor = 'grabbing';
        });

        this.moveIcon.on('pointerup', (event: PIXI.FederatedPointerEvent) => {
            event.stopPropagation();
            this.moveIcon!.cursor = 'grab';
        });

        this.moveIcon.on('pointerupoutside', (event: PIXI.FederatedPointerEvent) => {
            this.moveIcon!.cursor = 'grab';
        });

        this.container.addChild(this.moveIcon);
    }

    private createTitleText(): void {
        this.titleText = new PIXI.Text({
            text: this.options.title,
            style: {
                fontSize: 12,
                fill: 0xffffff,
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }
        });

        this.titleText.x = 40; // Фиксированная позиция после иконки
        this.titleText.y = 8;
        this.titleText.eventMode = 'none';

        this.container.addChild(this.titleText);
    }

    private createSettingsIcon(): void {
        if (this.settingsIconTexture) {
            this.settingsIcon = new PIXI.Sprite(this.settingsIconTexture);
        } else {
            const graphics = new PIXI.Graphics();
            graphics.circle(8, 8, 6);
            graphics.fill({ color: 0xffffff, alpha: 0.8 });
            this.settingsIcon = graphics;
        }

        this.settingsIcon.x = this.options.width - 50;
        this.settingsIcon.y = 7;
        this.settingsIcon.width = 16;
        this.settingsIcon.height = 16;
        this.settingsIcon.eventMode = 'static';
        this.settingsIcon.cursor = 'pointer';

        this.settingsIcon.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            console.log('🔧 Settings icon clicked');

            if (this.options.onRequestSettings) {
                this.options.onRequestSettings();
            }
        });

        this.container.addChild(this.settingsIcon);
    }

    private createToggleIcon(): void {
        if (this.toggleIconTexture) {
            this.toggleIcon = new PIXI.Sprite(this.toggleIconTexture);
        } else {
            const graphics = new PIXI.Graphics();
            this.updateToggleIconGraphics(graphics);
            this.toggleIcon = graphics;
        }

        this.toggleIcon.x = this.options.width - 25;
        this.toggleIcon.y = 7;
        this.toggleIcon.width = 16;
        this.toggleIcon.height = 16;
        this.toggleIcon.eventMode = 'static';
        this.toggleIcon.cursor = 'pointer';

        this.toggleIcon.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            this.isMinimized = !this.isMinimized;
            this.updateToggleIcon();

            if (this.isMinimized && this.options.onMinimize) {
                this.options.onMinimize();
            } else if (!this.isMinimized && this.options.onMaximize) {
                this.options.onMaximize();
            }
        });

        this.container.addChild(this.toggleIcon);
    }

    private updateToggleIcon(): void {
        if (!this.toggleIconTexture && this.toggleIcon instanceof PIXI.Graphics) {
            this.updateToggleIconGraphics(this.toggleIcon);
        }
    }

    private updateToggleIconGraphics(graphics: PIXI.Graphics): void {
        graphics.clear();

        if (this.isMinimized) {
            graphics.rect(4, 4, 8, 8);
            graphics.fill({ color: 0xffffff, alpha: 0.8 });
        } else {
            graphics.rect(4, 7, 8, 2);
            graphics.fill({ color: 0xffffff, alpha: 0.8 });
        }
    }

    private drawBackground(): void {
        this.background.clear();
        this.background.roundRect(0, 0, this.options.width, this.options.height, 5);
        this.background.fill({ color: this.options.color, alpha: 0.95 });
    }

    public getTitle(): string {
        if (this.titleText && this.titleText.text) {
            return this.titleText.text;
        }
        return 'Untitled Node';
    }

    public setTitle(title: string): void {
        this.titleText.text = title;
    }

    public setWidth(width: number): void {
        this.options.width = width;
        this.updateLayout();
    }

    public toggleMinimized(): void {
        this.isMinimized = !this.isMinimized;
        this.updateToggleIcon();
    }

    private updateLayout(): void {
        this.drawBackground();
        this.settingsIcon.x = this.options.width - 50;
        this.toggleIcon.x = this.options.width - 25;
    }

    public getMoveIcon(): PIXI.Sprite | PIXI.Graphics | null {
        return this.moveIcon;
    }

    public destroy(): void {
        this.container.destroy({ children: true });
    }
}