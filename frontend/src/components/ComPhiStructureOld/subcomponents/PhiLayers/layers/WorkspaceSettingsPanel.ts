// UILayer/WorkspaceSettingsPanel.ts
import * as PIXI from 'pixi.js';
import { ThemeMode } from '../../../types/commonTypes';
import { DebugPanel } from './DebugPanel';
import closeIcon from './assets/close_save.svg';

export interface WorkspaceSettings {
    name: string;
    description: string;
    autoSave: boolean;
    version: string;
}

export class WorkspaceSettingsPanel {
    public container: PIXI.Container;
    public initializationPromise: Promise<void>;
    private app: PIXI.Application;
    private theme: ThemeMode;
    private panelWidth: number;
    private panelHeight: number;
    private background!: PIXI.Graphics;
    private closeButton!: PIXI.Sprite;
    private activeTab: 'workspace' | 'debug' = 'workspace';
    private debugPanel: DebugPanel | null = null;
    private contentContainer: PIXI.Container;
    private onClose: () => void;
    private textures: Map<string, PIXI.Texture> = new Map();

    constructor(app: PIXI.Application, theme: ThemeMode, onSave: (settings: WorkspaceSettings) => void, onClose: () => void) {
        this.app = app;
        this.theme = theme;
        this.onClose = onClose;
        this.panelWidth = this.app.screen.width / 3;
        this.panelHeight = this.app.screen.height;

        this.container = new PIXI.Container();
        this.contentContainer = new PIXI.Container();
        this.initializationPromise = this.createPanel();
    }

    private async createPanel(): Promise<void> {
        await this.loadTextures();
        this.createBackground();
        this.createTabs();
        this.createCloseButton();
        this.createContent();
        this.container.addChild(this.contentContainer);
    }

    private async loadTextures(): Promise<void> {
        try {
            // ✅ ЗАГРУЖАЕМ ИКОНКУ КАК В ToolbarLayer
            const texture = await PIXI.Assets.load(closeIcon);
            this.textures.set('close', texture);
        } catch (error) {
            console.error('Failed to load close icon:', error);
        }
    }

    private createBackground(): void {
        this.background = new PIXI.Graphics();

        const darkBlueColor = 0x0A1A2A;
        this.background.rect(0, 0, this.panelWidth, this.panelHeight);
        this.background.fill({ color: darkBlueColor, alpha: 0.85 });

        const neonGreenColor = 0x00FF7F;
        const lineWidth = 3;
        this.background.rect(0, 0, lineWidth, this.panelHeight);
        this.background.fill({ color: neonGreenColor, alpha: 0.9 });

        this.container.addChild(this.background);
    }

    private createCloseButton(): void {
        const texture = this.textures.get('close');

        if (!texture) {
            console.warn('Close texture not found, using fallback');
            this.createFallbackCloseButton();
            return;
        }

        this.closeButton = new PIXI.Sprite(texture);
        this.closeButton.x = this.panelWidth - 35;
        this.closeButton.y = 15;
        this.closeButton.width = 20;
        this.closeButton.height = 20;
        this.closeButton.eventMode = 'static';
        this.closeButton.cursor = 'pointer';

        // ✅ ВЫСОКИЙ Z-INDEX - ДОБАВЛЯЕМ В КОНЕЦ (ПОВЕРХ ВСЕГО)
        this.container.addChild(this.closeButton);

        // Сохраняем исходные параметры в замыкании
        const originalWidth = 20;
        const originalHeight = 20;
        const originalX = this.panelWidth - 35;
        const originalY = 15;

        // Плавное увеличение при наведении
        this.closeButton.on('pointerover', () => {
            this.closeButton.width = originalWidth * 1.2;
            this.closeButton.height = originalHeight * 1.2;
            this.closeButton.x = originalX - (originalWidth * 0.1);
            this.closeButton.y = originalY - (originalHeight * 0.1);
        });

        // Плавное возвращение к исходному размеру
        this.closeButton.on('pointerout', () => {
            this.closeButton.width = originalWidth;
            this.closeButton.height = originalHeight;
            this.closeButton.x = originalX;
            this.closeButton.y = originalY;
        });

        this.closeButton.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            // ✅ ОСТАНАВЛИВАЕМ ПРОПАГАЦИЮ СОБЫТИЯ
            event.stopPropagation();

            // Легкое уменьшение при клике
            this.closeButton.width = originalWidth * 0.95;
            this.closeButton.height = originalHeight * 0.95;
            this.closeButton.x = originalX + (originalWidth * 0.025);
            this.closeButton.y = originalY + (originalHeight * 0.025);

            console.log('🔴 Close button clicked');
            this.onClose();
        });

        this.closeButton.on('pointerup', (event: PIXI.FederatedPointerEvent) => {
            event.stopPropagation();

            // Возврат к размеру при наведении
            this.closeButton.width = originalWidth * 1.2;
            this.closeButton.height = originalHeight * 1.2;
            this.closeButton.x = originalX - (originalWidth * 0.1);
            this.closeButton.y = originalY - (originalHeight * 0.1);
        });

        this.closeButton.on('pointerupoutside', () => {
            // Если курсор ушел за пределы кнопки
            this.closeButton.width = originalWidth;
            this.closeButton.height = originalHeight;
            this.closeButton.x = originalX;
            this.closeButton.y = originalY;
        });
    }

    private createFallbackCloseButton(): void {
        const graphics = new PIXI.Graphics();
        graphics.rect(0, 0, 20, 20);
        graphics.fill({ color: 0xFF4444, alpha: 0.8 });

        // Рисуем крестик
        graphics.moveTo(5, 5);
        graphics.lineTo(15, 15);
        graphics.stroke({ width: 2, color: 0xFFFFFF });
        graphics.moveTo(15, 5);
        graphics.lineTo(5, 15);
        graphics.stroke({ width: 2, color: 0xFFFFFF });

        this.closeButton = new PIXI.Sprite();
        this.closeButton.texture = this.app.renderer.generateTexture(graphics);
        this.closeButton.x = this.panelWidth - 35;
        this.closeButton.y = 15;
        this.closeButton.width = 20;
        this.closeButton.height = 20;
        this.closeButton.eventMode = 'static';
        this.closeButton.cursor = 'pointer';

        // ✅ ВЫСОКИЙ Z-INDEX
        this.container.addChild(this.closeButton);

        const originalWidth = 20;
        const originalHeight = 20;
        const originalX = this.panelWidth - 35;
        const originalY = 15;

        this.closeButton.on('pointerover', () => {
            this.closeButton.width = originalWidth * 1.2;
            this.closeButton.height = originalHeight * 1.2;
            this.closeButton.x = originalX - (originalWidth * 0.1);
            this.closeButton.y = originalY - (originalHeight * 0.1);
        });

        this.closeButton.on('pointerout', () => {
            this.closeButton.width = originalWidth;
            this.closeButton.height = originalHeight;
            this.closeButton.x = originalX;
            this.closeButton.y = originalY;
        });

        this.closeButton.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            // ✅ ОСТАНАВЛИВАЕМ ПРОПАГАЦИЮ
            event.stopPropagation();

            this.closeButton.width = originalWidth * 0.95;
            this.closeButton.height = originalHeight * 0.95;
            this.closeButton.x = originalX + (originalWidth * 0.025);
            this.closeButton.y = originalY + (originalHeight * 0.025);

            console.log('🔴 Fallback close button clicked');
            this.onClose();
        });

        this.closeButton.on('pointerup', (event: PIXI.FederatedPointerEvent) => {
            event.stopPropagation();

            this.closeButton.width = originalWidth * 1.2;
            this.closeButton.height = originalHeight * 1.2;
            this.closeButton.x = originalX - (originalWidth * 0.1);
            this.closeButton.y = originalY - (originalHeight * 0.1);
        });

        this.closeButton.on('pointerupoutside', () => {
            this.closeButton.width = originalWidth;
            this.closeButton.height = originalHeight;
            this.closeButton.x = originalX;
            this.closeButton.y = originalY;
        });
    }

    private createTabs(): void {
        const tabHeight = 40;

        // Вкладка "Настройки схемы"
        const workspaceTab = this.createTab('Настройки схемы', 0, tabHeight, () => this.switchTab('workspace'));

        // Вкладка "Отладка"
        const debugTab = this.createTab('Отладка', this.panelWidth / 2, tabHeight, () => this.switchTab('debug'));

        this.container.addChild(workspaceTab.background, workspaceTab.text);
        this.container.addChild(debugTab.background, debugTab.text);
    }

    private createTab(label: string, x: number, height: number, onClick: () => void): { background: PIXI.Graphics, text: PIXI.Text } {
        const tabWidth = this.panelWidth / 2;
        const background = new PIXI.Graphics();

        const isActive = (label === 'Настройки схемы' && this.activeTab === 'workspace') ||
                        (label === 'Отладка' && this.activeTab === 'debug');

        // Фон вкладки
        background.rect(x, 0, tabWidth, height);
        background.fill({
            color: isActive ? 0x1E3A5F : 0x0A1A2A,
            alpha: 0.9
        });

        // Нижняя граница для активной вкладки
        if (isActive) {
            background.rect(x, height - 3, tabWidth, 3);
            background.fill({ color: 0x00FF7F, alpha: 0.9 });
        }

        background.eventMode = 'static';
        background.cursor = 'pointer';
        background.on('pointerdown', onClick);

        // Текст вкладки
        const text = new PIXI.Text({
            text: label,
            style: new PIXI.TextStyle({
                fontSize: 14,
                fill: 0xFFFFFF,
                fontFamily: 'Arial'
            })
        });
        text.x = x + (tabWidth - text.width) / 2;
        text.y = (height - text.height) / 2;

        return { background, text };
    }

    private switchTab(tab: 'workspace' | 'debug'): void {
        if (this.activeTab === tab) return;

        this.activeTab = tab;
        this.updateContent();
    }

    private createContent(): void {
        this.updateContent();
    }

    private updateContent(): void {
        // Очищаем старый контент (кроме фона, кнопки закрытия и вкладок)
        const childrenToKeep = this.container.children.filter(child =>
            child === this.background ||
            child === this.closeButton || // ✅ СОХРАНЯЕМ КНОПКУ ЗАКРЫТИЯ
            (child instanceof PIXI.Graphics && child.width === this.panelWidth / 2) // Вкладки
        );

        this.container.removeChildren();
        childrenToKeep.forEach(child => this.container.addChild(child));

        // ✅ ПЕРЕДОБАВЛЯЕМ КНОПКУ ЗАКРЫТИЯ В КОНЕЦ (ПОВЕРХ)
        if (this.closeButton) {
            this.container.addChild(this.closeButton);
        }

        // Очищаем contentContainer
        this.contentContainer.removeChildren();

        // Уничтожаем старую DebugPanel если была
        if (this.debugPanel) {
            this.debugPanel.destroy();
            this.debugPanel = null;
        }

        // Добавляем контент в зависимости от активной вкладки
        if (this.activeTab === 'workspace') {
            this.createWorkspaceContent();
        } else {
            this.createDebugContent();
        }

        this.container.addChild(this.contentContainer);
    }

    private createWorkspaceContent(): void {
        const titleText = new PIXI.Text({
            text: 'Настройки схемы',
            style: new PIXI.TextStyle({
                fontSize: 18,
                fill: 0xffffff,
                fontFamily: 'Arial',
                fontWeight: 'bold'
            })
        });
        titleText.x = 20;
        titleText.y = 60;
        this.contentContainer.addChild(titleText);

        // Элементы управления для настроек схемы
        this.createWorkspaceControls();
    }

    private createDebugContent(): void {
        // Создаем DebugPanel и добавляем ее контент
        this.debugPanel = new DebugPanel(this.app, this.theme);
        this.debugPanel.container.y = 40; // Смещаем ниже вкладок
        this.contentContainer.addChild(this.debugPanel.container);
    }

    private createWorkspaceControls(): void {
        // TODO: Реализовать элементы управления workspace
        // Временный текст
        const placeholderText = new PIXI.Text({
            text: 'Настройки схемы будут здесь',
            style: new PIXI.TextStyle({
                fontSize: 14,
                fill: 0x888888,
                fontFamily: 'Arial'
            })
        });
        placeholderText.x = 20;
        placeholderText.y = 100;
        this.contentContainer.addChild(placeholderText);
    }

    public resize(width: number, height: number): void {
        this.panelWidth = width / 3;
        this.panelHeight = height;

        // Обновляем фон
        this.background.clear();
        this.createBackground();

        // Обновляем позицию кнопки закрытия
        this.closeButton.x = this.panelWidth - 35;

        // Обновляем вкладки
        this.updateTabs();

        // Обновляем контент
        this.updateContent();

        // Обновляем DebugPanel если активна
        if (this.debugPanel) {
            this.debugPanel.resize(width, height);
        }
    }

    private updateTabs(): void {
        // Удаляем старые вкладки
        const oldTabs = this.container.children.filter(child =>
            child instanceof PIXI.Graphics && child.width === this.panelWidth / 2
        );
        oldTabs.forEach(tab => this.container.removeChild(tab));

        // Создаем новые вкладки
        this.createTabs();
    }

    public destroy(): void {
        if (this.debugPanel) {
            this.debugPanel.destroy();
        }
        this.textures.clear();
        this.container.destroy({ children: true });
    }
}