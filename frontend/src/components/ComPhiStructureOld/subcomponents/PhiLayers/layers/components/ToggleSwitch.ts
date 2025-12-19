// UILayer/components/ToggleSwitch.ts
import * as PIXI from 'pixi.js';

export class ToggleSwitch {
    public container: PIXI.Container;
    private background: PIXI.Graphics;
    private thumb: PIXI.Graphics;
    private isOn: boolean;
    private onChange: (isOn: boolean) => void;

    constructor(x: number, y: number, width: number, height: number, initialValue: boolean, onChange: (isOn: boolean) => void) {
        this.container = new PIXI.Container();
        this.container.x = x;
        this.container.y = y;
        this.isOn = initialValue;
        this.onChange = onChange;

        this.background = new PIXI.Graphics();
        this.thumb = new PIXI.Graphics();

        this.createBackground(width, height);
        this.createThumb(width, height);
        this.updateVisuals();

        this.setupInteractivity();
    }

    private createBackground(width: number, height: number): void {
        this.background.rect(0, 0, width, height);
        this.background.fill({ color: 0x666666 });
        this.background.roundRect(0, 0, width, height, height / 2);
        this.container.addChild(this.background);
    }

    private createThumb(width: number, height: number): void {
        const thumbSize = height * 0.8;
        const margin = (height - thumbSize) / 2;

        this.thumb.rect(0, 0, thumbSize, thumbSize);
        this.thumb.fill({ color: 0xffffff });
        this.thumb.circle(thumbSize / 2, thumbSize / 2, thumbSize / 2);
        this.thumb.y = margin;
        this.container.addChild(this.thumb);
    }

    private updateVisuals(): void {
        const width = this.background.width;
        const height = this.background.height;
        const thumbSize = height * 0.8;
        const margin = (height - thumbSize) / 2;

        // Фон
        this.background.clear();
        this.background.roundRect(0, 0, width, height, height / 2);
        this.background.fill({
            color: this.isOn ? 0x4CAF50 : 0x666666,
            alpha: this.isOn ? 0.8 : 0.6
        });

        // Ползунок
        this.thumb.x = this.isOn ? width - thumbSize - margin : margin;
    }

    private setupInteractivity(): void {
        this.container.eventMode = 'static';
        this.container.cursor = 'pointer';

        this.container.on('pointerdown', () => {
            this.toggle();
        });
    }

    private toggle(): void {
        this.isOn = !this.isOn;
        this.updateVisuals();
        this.onChange(this.isOn);
    }

    public setValue(value: boolean): void {
        if (this.isOn !== value) {
            this.isOn = value;
            this.updateVisuals();
        }
    }

    public getValue(): boolean {
        return this.isOn;
    }
}