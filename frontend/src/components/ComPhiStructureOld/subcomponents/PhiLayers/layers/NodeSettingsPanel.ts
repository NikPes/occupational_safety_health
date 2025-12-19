import * as PIXI from 'pixi.js';
import { PhiNodeBase } from '../../PhiNodeBase/PhiNodeBase';
import { ThemeMode } from '../../../types/commonTypes';
import { NodeSettingsData, ControlConfig } from '../../PhiNodeBase/subcomponents/PhiNodeSettings/types/types';

export class NodeSettingsPanel {
    public container: PIXI.Container;
    public initializationPromise: Promise<void>;
    private app: PIXI.Application;
    private node: PhiNodeBase;
    private theme: ThemeMode;
    private panelWidth: number;
    private panelHeight: number;
    private background!: PIXI.Graphics;
    private nodeData: NodeSettingsData;
    private onSave: (data: NodeSettingsData) => void;
    private onClose: () => void;

    constructor(
        app: PIXI.Application,
        node: PhiNodeBase,
        theme: ThemeMode,
        initialData: NodeSettingsData,
        onSave: (data: NodeSettingsData) => void,
        onClose: () => void
    ) {
        this.app = app;
        this.node = node;
        this.theme = theme;
        this.nodeData = initialData;
        this.onSave = onSave;
        this.onClose = onClose;
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

        // Темно-синий полупрозрачный фон
        const darkBlueColor = 0x0A1A2A;
        this.background.rect(0, 0, this.panelWidth, this.panelHeight);
        this.background.fill({ color: darkBlueColor, alpha: 0.85 });

        // Неоновая линия слева
        const neonBlueColor = 0x00BFFF;
        const lineWidth = 3;
        this.background.rect(0, 0, lineWidth, this.panelHeight);
        this.background.fill({ color: neonBlueColor, alpha: 0.9 });

        this.container.addChild(this.background);
    }

    private createContent(): void {
        // Заголовок
        const titleText = new PIXI.Text({
            text: 'Настройки нода',
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

        // Контентная область
        this.createControls();
    }

    private createControls(): void {
        // Здесь будет создание элементов управления для настроек нода
        // Аналогично предыдущей реализации, но без HTML overlay
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