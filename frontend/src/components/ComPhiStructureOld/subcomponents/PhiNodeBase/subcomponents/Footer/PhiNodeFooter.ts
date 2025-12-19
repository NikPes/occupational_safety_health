import * as PIXI from 'pixi.js';

export interface FooterOptions {
    width: number;
    height: number;
    color: number;
    status?: string;
}

export class PhiNodeFooter {
    public container: PIXI.Container;
    public background!: PIXI.Graphics;
    public statusText!: PIXI.Text;

    private options: FooterOptions;

    constructor(options: FooterOptions) {
        this.options = options;
        this.container = new PIXI.Container();
        this.createFooter();
    }

    private createFooter(): void {
        // Фон футера
        this.background = new PIXI.Graphics();
        this.background.roundRect(0, 0, this.options.width, this.options.height, 5);
        this.background.fill({ color: this.options.color, alpha: 0.95 });
        this.container.addChild(this.background);

        // Текст статуса
        this.statusText = new PIXI.Text({
            text: this.options.status || 'Ready',
            style: {
                fontSize: 10,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        this.statusText.x = 10;
        this.statusText.y = 5;
        this.container.addChild(this.statusText);
    }

    public setStatus(status: string): void {
        this.statusText.text = status;
    }

    public setWidth(width: number): void {
        this.options.width = width;
        this.updateLayout();
    }

    private updateLayout(): void {
        this.background.clear();
        this.background.roundRect(0, 0, this.options.width, this.options.height, 5);
        this.background.fill({ color: this.options.color, alpha: 0.95 });
    }

    public destroy(): void {
        this.container.destroy({ children: true });
    }
}