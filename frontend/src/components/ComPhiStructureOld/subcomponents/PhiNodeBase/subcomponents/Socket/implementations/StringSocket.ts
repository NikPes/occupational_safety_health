// subcomponents/Socket/implementations/StringSocket.ts
import * as PIXI from 'pixi.js';
import { BaseSocket } from '../BaseSocket';
import { SocketDefinition } from '../types/socketTypes';

export class StringSocket extends BaseSocket {
    private valueText: PIXI.Text | null = null;
    private background: PIXI.Graphics | null = null;
    private maxLength: number = 255;

    constructor(definition: SocketDefinition) {
        super(definition);
        this.createUI();
    }

    createUI(): PIXI.Container {
        this.background = new PIXI.Graphics();
        this.background.roundRect(0, 0, 150, 30, 5);
        this.background.fill({ color: 0xffffff, alpha: 0.9 });
        this.background.stroke({ width: 1, color: 0x10B981 });

        this.valueText = new PIXI.Text('', {
            fontSize: 12,
            fill: 0x000000,
            fontFamily: 'Arial'
        });
        this.valueText.x = 10;
        this.valueText.y = 8;

        this.connector.x = 160;
        this.connector.y = 15;

        this.uiContainer.addChild(this.background);
        this.uiContainer.addChild(this.valueText);
        this.uiContainer.addChild(this.connector);

        this.setupInteractions();

        return this.uiContainer;
    }

    validate(value: any): boolean {
        return typeof value === 'string' && value.length <= this.maxLength;
    }

    serialize(): any {
        return this.value;
    }

    deserialize(data: any): void {
        this.setValue(String(data));
    }

    protected updateUI(): void {
        if (this.valueText && this.value !== undefined) {
            this.valueText.text = this.value || '';
        }
    }

    private setupInteractions(): void {
        if (!this.background) return;

        this.background.eventMode = 'static';
        this.background.cursor = 'text';

        this.background.on('pointerdown', () => {
            this.showTextInputDialog();
        });
    }

    private showTextInputDialog(): void {
        const input = prompt('Введите текст:', this.value || '');
        if (input !== null) {
            this.setValue(input);
        }
    }

    public setMaxLength(length: number): void {
        this.maxLength = length;
    }

    public destroy(): void {
        if (this.valueText) {
            this.valueText.destroy();
        }
        if (this.background) {
            this.background.destroy();
        }
        super.destroy();
    }
}