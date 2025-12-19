import * as PIXI from 'pixi.js';
import { ThemeMode } from '../../../types/commonTypes';

export interface ToolConfig {
    name: string;
    description: string;
    icon: string;
    category: string;
}

export class ToolsPanel {
    public container: PIXI.Container;
    public initializationPromise: Promise<void>;
    private app: PIXI.Application;
    private theme: ThemeMode;
    private panelWidth: number;
    private panelHeight: number;
    private background!: PIXI.Graphics;

    constructor(app: PIXI.Application, theme: ThemeMode, onClose: () => void) {
        this.app = app;
        this.theme = theme;
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

        const neonOrangeColor = 0xFFA500;
        const lineWidth = 3;
        this.background.rect(0, 0, lineWidth, this.panelHeight);
        this.background.fill({ color: neonOrangeColor, alpha: 0.9 });

        this.container.addChild(this.background);
    }

    private createContent(): void {
        const titleText = new PIXI.Text({
            text: 'Инструменты',
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

        this.createToolsGrid();
    }

    private createToolsGrid(): void {
        const tools: ToolConfig[] = [
            {
                name: 'Выравнивание',
                description: 'Автоматическое выравнивание нодов',
                icon: '📐',
                category: 'layout'
            },
            {
                name: 'Группировка',
                description: 'Объединение нодов в группы',
                icon: '👥',
                category: 'organization'
            },
            {
                name: 'Статистика',
                description: 'Анализ схемы',
                icon: '📊',
                category: 'analysis'
            },
            {
                name: 'Экспорт',
                description: 'Экспорт в различные форматы',
                icon: '📤',
                category: 'export'
            }
        ];

        // Создаем сетку инструментов
        tools.forEach((tool, index) => {
            this.createToolButton(tool, index);
        });
    }

    private createToolButton(tool: ToolConfig, index: number): void {
        const button = new PIXI.Graphics();
        const x = 20 + (index % 2) * 150;
        const y = 60 + Math.floor(index / 2) * 80;

        button.rect(0, 0, 140, 70);
        button.fill({ color: 0x1E3A5F, alpha: 0.8 });
        button.stroke({ width: 1, color: 0x3B82F6 });
        button.x = x;
        button.y = y;
        button.eventMode = 'static';
        button.cursor = 'pointer';

        const iconText = new PIXI.Text({
            text: tool.icon,
            style: { fontSize: 20, fill: 0xffffff }
        });
        iconText.x = 10;
        iconText.y = 10;
        button.addChild(iconText);

        const nameText = new PIXI.Text({
            text: tool.name,
            style: { fontSize: 12, fill: 0xffffff, fontWeight: 'bold' }
        });
        nameText.x = 40;
        nameText.y = 10;
        button.addChild(nameText);

        const descText = new PIXI.Text({
            text: tool.description,
            style: { fontSize: 10, fill: 0xcccccc, wordWrap: true, wordWrapWidth: 100 }
        });
        descText.x = 40;
        descText.y = 30;
        button.addChild(descText);

        button.on('pointerdown', () => {
            console.log(`🛠️ Tool selected: ${tool.name}`);
        });

        this.container.addChild(button);
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