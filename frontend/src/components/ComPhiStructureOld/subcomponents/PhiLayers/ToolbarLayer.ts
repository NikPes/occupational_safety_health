import * as PIXI from 'pixi.js';
import addNodeIcon from './layers/assets/create_node.svg';
import deleteIcon from './layers/assets/trash.svg';
import workspaceSettingsIcon from './layers/assets/schemes_tools.svg';
import appearanceIcon from './layers/assets/theme_tools.svg';
import toolsIcon from './layers/assets/extend_tools.svg';

export interface ToolbarButton {
    id: string;
    icon: string;
    tooltip: string;
    position: { x: number; y: number };
    onClick: () => void;
}

export class ToolbarLayer {
    public container: PIXI.Container;
    private buttons: Map<string, PIXI.Sprite> = new Map();
    private app: PIXI.Application;
    private textures: Map<string, PIXI.Texture> = new Map();
    private onAddNodeCallback: (() => void) | null = null;
    private onWorkspaceSettingsCallback: (() => void) | null = null;

    constructor(app: PIXI.Application, onAddNodeCallback?: () => void,
                onWorkspaceSettingsCallback?: () => void) {
        this.app = app;
        this.onAddNodeCallback = onAddNodeCallback || null;
        this.onWorkspaceSettingsCallback = onWorkspaceSettingsCallback || null;
        this.container = new PIXI.Container();
        this.loadTextures().then(() => this.createToolbar());
    }

    private async loadTextures(): Promise<void> {
        const icons = {
            'delete': deleteIcon,
            'add-node': addNodeIcon,
            'workspace-settings': workspaceSettingsIcon,
            'tools': toolsIcon,
            'appearance': appearanceIcon
        };

        for (const [id, svgPath] of Object.entries(icons)) {
            const texture = await PIXI.Assets.load(svgPath);
            this.textures.set(id, texture);
        }
    }

    private createToolbar(): void {
        const toolbarWidth = 60;
        const toolbarBackground = new PIXI.Graphics();
        toolbarBackground.rect(0, 0, toolbarWidth, this.app.screen.height);
        toolbarBackground.fill({ color: 0x2a2a2a, alpha: 0.9 });
        this.container.addChild(toolbarBackground);

        this.createButtons();
    }

    private createButtons(): void {
        const buttonSize = 40;
        const margin = 10;
        const startY = 20;

        const buttons: ToolbarButton[] = [
            {
                id: 'delete',
                icon: 'delete',
                tooltip: 'Удалить нод',
                position: { x: margin, y: startY },
                onClick: () => this.onDelete()
            },
            {
                id: 'add-node',
                icon: 'add-node',
                tooltip: 'Добавить нод',
                position: { x: margin, y: startY + (buttonSize + margin) * 2 },
                onClick: () => this.onAddNode()
            },
            {
                id: 'workspace-settings',
                icon: 'workspace-settings',
                tooltip: 'Настройки схемы',
                position: { x: margin, y: startY + (buttonSize + margin) * 3 },
                onClick: () => this.onWorkspaceSettings()
            },
            {
                id: 'tools',
                icon: 'tools',
                tooltip: 'Инструменты',
                position: { x: margin, y: startY + (buttonSize + margin) * 4 },
                onClick: () => this.onTools()
            },
            {
                id: 'appearance',
                icon: 'appearance',
                tooltip: 'Внешний вид',
                position: { x: margin, y: this.app.screen.height - (buttonSize + margin) * 2 },
                onClick: () => this.onAppearance()
            }
        ];

        buttons.forEach(buttonConfig => {
            this.createButton(buttonConfig, buttonSize);
        });
    }

    private createButton(config: ToolbarButton, size: number): void {
        const texture = this.textures.get(config.icon);
        if (!texture) {
            console.warn(`Texture not found for icon: ${config.icon}`);
            return;
        }

        const button = new PIXI.Sprite(texture);
        button.x = config.position.x;
        button.y = config.position.y;
        button.width = size;
        button.height = size;
        button.eventMode = 'static';
        button.cursor = 'pointer';

        // Сохраняем исходные параметры в замыкании
        const originalWidth = size;
        const originalHeight = size;
        const originalX = config.position.x;
        const originalY = config.position.y;

        // Плавное увеличение при наведении
        button.on('pointerover', () => {
            // Плавное увеличение на 10%
            button.width = originalWidth * 1.2;
            button.height = originalHeight * 1.2;

            // Центрируем увеличенную иконку
            button.x = originalX - (originalWidth * 0.1);
            button.y = originalY - (originalHeight * 0.1);
        });

        // Плавное возвращение к исходному размеру
        button.on('pointerout', () => {
            button.width = originalWidth;
            button.height = originalHeight;
            button.x = originalX;
            button.y = originalY;
        });

        button.on('pointerdown', () => {
            // Легкое уменьшение при клике
            button.width = originalWidth * 0.95;
            button.height = originalHeight * 0.95;
            button.x = originalX + (originalWidth * 0.025);
            button.y = originalY + (originalHeight * 0.025);

            config.onClick();
        });

        button.on('pointerup', () => {
            // Возврат к размеру при наведении
            button.width = originalWidth * 1.2;
            button.height = originalHeight * 1.2;
            button.x = originalX - (originalWidth * 0.1);
            button.y = originalY - (originalHeight * 0.1);
        });

        button.on('pointerupoutside', () => {
            // Если курсор ушел за пределы кнопки
            button.width = originalWidth;
            button.height = originalHeight;
            button.x = originalX;
            button.y = originalY;
        });

        this.buttons.set(config.id, button);
        this.container.addChild(button);
    }

    private onAddNode(): void {
        if (this.onAddNodeCallback) {
            this.onAddNodeCallback();
        }
    }

    private onDelete(): void {
        console.log('🗑️ Delete clicked');
    }

    // ✅ ДОБАВЛЯЕМ МЕТОД ДЛЯ РЕГИСТРАЦИИ КОЛБЭКА
    public setOnWorkspaceSettingsCallback(callback: () => void): void {
        this.onWorkspaceSettingsCallback = callback;
    }

    private onWorkspaceSettings(): void {
        console.log('⚙️ Workspace settings clicked');
        if (this.onWorkspaceSettingsCallback) {
            this.onWorkspaceSettingsCallback(); // ✅ ВЫЗЫВАЕМ КОЛБЭК
        }
    }

    private onAppearance(): void {
        console.log('🎨 Appearance clicked');
    }

    private onTools(): void {
        console.log('🛠️ Tools clicked');
    }



    public resize(width: number, height: number): void {
        if (this.container.children.length > 0) {
            const background = this.container.getChildAt(0) as PIXI.Graphics;
            if (background) {
                background.clear();
                background.rect(0, 0, 60, height);
                background.fill({ color: 0x2a2a2a, alpha: 0.9 });
            }
        } else {
            // Если background не существует, создаем его
            const toolbarBackground = new PIXI.Graphics();
            toolbarBackground.rect(0, 0, 60, height);
            toolbarBackground.fill({ color: 0x2a2a2a, alpha: 0.9 });
            this.container.addChild(toolbarBackground);
        }

        // Обновляем позиции кнопок при ресайзе
        const buttonSize = 40;
        const margin = 10;
        const startY = 20;

        const newPositions = {
            'delete': { x: margin, y: startY },
            'add-node': { x: margin, y: startY + (buttonSize + margin) * 2 },
            'workspace-settings': { x: margin, y: startY + (buttonSize + margin) * 3 },
            'tools': { x: margin, y: startY + (buttonSize + margin) * 4 },
            'appearance': { x: margin, y: height - (buttonSize + margin) * 2 }
        };

        // Просто обновляем позиции - обработчики будут использовать новые значения из замыкания
        this.buttons.forEach((button, id) => {
            const newPos = newPositions[id as keyof typeof newPositions];
            if (newPos) {
                button.x = newPos.x;
                button.y = newPos.y;
            }
        });
    }

    public destroy(): void {
        this.buttons.clear();
        this.textures.clear();
        this.container.destroy({ children: true });
    }
}