// subcomponents/Socket/implementations/NumberSocket.ts
import * as PIXI from 'pixi.js';
import { BaseSocket } from '../BaseSocket';
import { SocketDefinition } from '../types/socketTypes';

export class NumberSocket extends BaseSocket {
    private valueText: PIXI.Text | null = null;
    private background: PIXI.Graphics | null = null;
    private minValue: number = -Infinity;
    private maxValue: number = Infinity;

    constructor(definition: SocketDefinition) {
        super(definition);
        this.createUI();
    }

    createUI(): PIXI.Container {
        // Создаем фон
        this.background = new PIXI.Graphics();
        this.background.roundRect(0, 0, 120, 30, 5);
        this.background.fill({ color: 0xffffff, alpha: 0.9 });
        this.background.stroke({ width: 1, color: 0x3B82F6 });

        // Текстовое поле для значения
        this.valueText = new PIXI.Text('0', {
            fontSize: 12,
            fill: 0x000000,
            fontFamily: 'Arial'
        });
        this.valueText.x = 10;
        this.valueText.y = 8;

        // Позиционируем коннектор
        this.connector.x = 130;
        this.connector.y = 15;

        // Добавляем все в контейнер
        this.uiContainer.addChild(this.background);
        this.uiContainer.addChild(this.valueText);
        this.uiContainer.addChild(this.connector);

        // Добавляем обработчики событий
        this.setupInteractions();

        return this.uiContainer;
    }

    validate(value: any): boolean {
        const num = Number(value);
        return !isNaN(num) && num >= this.minValue && num <= this.maxValue;
    }

    serialize(): any {
        return this.value;
    }

    deserialize(data: any): void {
        this.setValue(Number(data));
    }

    protected updateUI(): void {
        if (this.valueText && this.value !== undefined) {
            this.valueText.text = String(this.value);
        }
    }

    private setupInteractions(): void {
        if (!this.background) return;

        this.background.eventMode = 'static';
        this.background.cursor = 'pointer';

        this.background.on('pointerdown', (event) => {
            this.showNumberInputDialog();
        });
    }

    private showNumberInputDialog(): void {
        const input = prompt('Введите число:', String(this.value || 0));
        if (input !== null) {
            const num = Number(input);
            if (this.validate(num)) {
                this.setValue(num);
            } else {
                alert('Неверное числовое значение');
            }
        }
    }

    // Установка ограничений
    public setConstraints(min: number, max: number): void {
        this.minValue = min;
        this.maxValue = max;
    }

    // Очистка ресурсов
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