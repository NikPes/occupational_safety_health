// subcomponents/Socket/BaseSocket.ts
import * as PIXI from 'pixi.js';
import { SocketDefinition, SocketVisualProps } from './types/socketTypes';

export abstract class BaseSocket {
    public id: string;
    public name: string;
    public typeKey: string;
    public compatibleWith: string[];
    public visualProps: SocketVisualProps;
    public description?: string;

    public value: any;
    public uiContainer: PIXI.Container;
    public connector: PIXI.Graphics;
    public position: { x: number; y: number };

    constructor(definition: SocketDefinition) {
        this.id = definition.id;
        this.name = definition.name;
        this.typeKey = definition.typeKey;
        this.compatibleWith = definition.compatibleWith;
        this.visualProps = definition.visualProps;
        this.description = definition.description;

        this.uiContainer = new PIXI.Container();
        this.connector = this.createConnector();
        this.position = { x: 0, y: 0 };
    }

    // Абстрактные методы, которые должны реализовать конкретные сокеты
    abstract createUI(): PIXI.Container;
    abstract validate(value: any): boolean;
    abstract serialize(): any;
    abstract deserialize(data: any): void;

    // Создание графического коннектора
    protected createConnector(): PIXI.Graphics {
        const connector = new PIXI.Graphics();
        connector.circle(0, 0, 6);
        connector.fill({ color: this.visualProps.color });
        connector.stroke({ width: 2, color: 0xffffff });
        connector.eventMode = 'static';
        connector.cursor = 'pointer';

        return connector;
    }

    // Проверка совместимости с другим сокетом
    public isCompatibleWith(otherSocket: BaseSocket): boolean {
        return this.compatibleWith.includes(otherSocket.typeKey);
    }

    // Получение позиции коннектора
    public getConnectorPosition(): PIXI.Point {
        return new PIXI.Point(
            this.uiContainer.x + this.connector.x,
            this.uiContainer.y + this.connector.y
        );
    }

    // Установка позиции сокета
    public setPosition(x: number, y: number): void {
        this.position = { x, y };
        this.uiContainer.x = x;
        this.uiContainer.y = y;
    }

    // Обновление значения
    public setValue(value: any): void {
        if (this.validate(value)) {
            this.value = value;
            this.updateUI();
        }
    }

    // Обновление UI при изменении значения
    protected abstract updateUI(): void;

    // Очистка ресурсов
    public destroy(): void {
        this.uiContainer.destroy({ children: true });
        this.connector.destroy();
    }
}