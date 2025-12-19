// UILayer/components/Slider.ts
import * as PIXI from 'pixi.js';

export class Slider {
    public container: PIXI.Container;
    private track: PIXI.Graphics;
    private thumb: PIXI.Graphics;
    private value: number;
    private min: number;
    private max: number;
    private onChange: (value: number) => void;
    private isDragging: boolean = false;

    constructor(x: number, y: number, width: number, height: number, min: number, max: number, initialValue: number, onChange: (value: number) => void) {
        this.container = new PIXI.Container();
        this.container.x = x;
        this.container.y = y;
        this.min = min;
        this.max = max;
        this.value = initialValue;
        this.onChange = onChange;

        this.track = new PIXI.Graphics();
        this.thumb = new PIXI.Graphics();

        this.createTrack(width, height);
        this.createThumb(height);
        this.updateVisuals();

        this.setupInteractivity();
    }

    private createTrack(width: number, height: number): void {
        this.track.rect(0, 0, width, height);
        this.track.fill({ color: 0x444444 });
        this.track.roundRect(0, 0, width, height, height / 2);
        this.container.addChild(this.track);
    }

    private createThumb(height: number): void {
        const thumbSize = height * 1.5;
        this.thumb.rect(0, 0, thumbSize, thumbSize);
        this.thumb.fill({ color: 0x2196F3 });
        this.thumb.circle(thumbSize / 2, thumbSize / 2, thumbSize / 2);
        this.thumb.y = -thumbSize * 0.25;
        this.container.addChild(this.thumb);
    }

    private updateVisuals(): void {
        const width = this.track.width;
        const percentage = (this.value - this.min) / (this.max - this.min);

        // Активная часть трека
        this.track.clear();
        this.track.roundRect(0, 0, width, this.track.height, this.track.height / 2);
        this.track.fill({ color: 0x444444 });

        this.track.roundRect(0, 0, width * percentage, this.track.height, this.track.height / 2);
        this.track.fill({ color: 0x4CAF50, alpha: 0.6 });

        // Позиция ползунка
        this.thumb.x = width * percentage - this.thumb.width / 2;
    }

    private setupInteractivity(): void {
        this.container.eventMode = 'static';
        this.container.cursor = 'pointer';

        this.container.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            this.isDragging = true;
            this.onDrag(event);
        });

        this.container.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
            if (this.isDragging) {
                this.onDrag(event);
            }
        });

        this.container.on('pointerup', () => {
            this.isDragging = false;
        });

        this.container.on('pointerupoutside', () => {
            this.isDragging = false;
        });
    }

    private onDrag(event: PIXI.FederatedPointerEvent): void {
        const localPos = this.container.toLocal(event.global);
        const width = this.track.width;

        let percentage = localPos.x / width;
        percentage = Math.max(0, Math.min(1, percentage));

        this.value = this.min + percentage * (this.max - this.min);
        this.value = Math.round(this.value); // Целые значения

        this.updateVisuals();
        this.onChange(this.value);
    }

    public setValue(value: number): void {
        this.value = Math.max(this.min, Math.min(this.max, value));
        this.updateVisuals();
    }

    public getValue(): number {
        return this.value;
    }
}