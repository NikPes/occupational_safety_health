import * as PIXI from 'pixi.js';

export class ConnectionsLayer {
    public container: PIXI.Container;

    constructor() {
        this.container = new PIXI.Container();
    }

    public resize(width: number, height: number): void {
        // Базовая реализация ресайза
        console.log('ConnectionsLayer resized:', width, height);
    }

    // Добавим пустой метод для совместимости
    public destroy(): void {
        this.container.destroy({ children: true });
    }
}