import * as PIXI from 'pixi.js';
import { ThemeMode, GridMode } from '../../PhiConstructSpace/types';

export interface AppearanceSettings {
    theme: ThemeMode;
    gridMode: GridMode;
    gridSize: number;
    gridColor: number;
}

export class AppearancePanel {
    public container: PIXI.Container;
    public initializationPromise: Promise<void>;
    private app: PIXI.Application;
    private theme: ThemeMode;
    private panelWidth: number;
    private panelHeight: number;
    private background!: PIXI.Graphics;
    private onSettingsChange: (settings: AppearanceSettings) => void;

    constructor(app: PIXI.Application, theme: ThemeMode, onSettingsChange: (settings: AppearanceSettings) => void, onClose: () => void) {
        this.app = app;
        this.theme = theme;
        this.onSettingsChange = onSettingsChange;
        this.panelWidth = this.app.screen.width / 3;
        this.panelHeight = this.app.screen.height;

        this.container = new PIXI.Container();
        this.initializationPromise = this.createPanel();
    }

    private async createPanel(): Promise<void> {
        this.createBackground();
        this.createContent();
    }

    private createBackground(): void {
        this.background = new PIXI.Graphics();

        const darkBlueColor = 0x0A1A2A;
        this.background.rect(0, 0, this.panelWidth, this.panelHeight);
        this.background.fill({ color: darkBlueColor, alpha: 0.85 });

        const neonPurpleColor = 0x9370DB;
        const lineWidth = 3;
        this.background.rect(0, 0, lineWidth, this.panelHeight);
        this.background.fill({ color: neonPurpleColor, alpha: 0.9 });

        this.container.addChild(this.background);
    }

    private createContent(): void {
        const titleText = new PIXI.Text({
            text: 'Внешний вид',
            style: {
                fontSize: 18,
                fill: 0xffffff,
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }
        });
        titleText.x = 20;
        titleText.y = 20;
        this.container.addChild(titleText);

        this.createAppearanceControls();
    }

    private createAppearanceControls(): void {
        // Переключатель темы (dark/light)
        // Выбор режима сетки (lines/dots/none)
        // Настройка размера сетки
        // Выбор цвета сетки
    }

    public resize(width: number, height: number): void {
        this.panelWidth = width / 3;
        this.panelHeight = height;

        this.background.clear();
        this.createBackground();
    }

    public destroy(): void {
        this.container.destroy({ children: true });
    }
}