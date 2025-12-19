import * as PIXI from 'pixi.js';
import { PhiNodeBase } from '../../PhiNodeBase';
import { ThemeMode } from '../../../../types/commonTypes';
import {
    NodeSettingsData,
    ControlConfig,
    PhiNodeSettingsOptions
} from './types/types';
import floppyBadgedSvg from './assets/floppy-badged.svg';
import closeSaveSvg from './assets/close_save.svg';

export class PhiNodeSettingsPanel {
    public container: PIXI.Container;
    public initializationPromise: Promise<void>;
    private app: PIXI.Application;
    private node: PhiNodeBase;
    private theme: ThemeMode;
    private panelWidth: number;
    private panelHeight: number;

    // Графика
    private background!: PIXI.Graphics;
    private headerBackground!: PIXI.Graphics;
    private titleText!: PIXI.Text;
    private saveButton!: PIXI.Container;
    private closeButton!: PIXI.Container;

    // Иконки
    private saveIconTexture: PIXI.Texture | null = null;
    private closeIconTexture: PIXI.Texture | null = null;

    // HTML элементы (будут создаваться динамически)
    private htmlOverlay: HTMLDivElement | null = null;

    // Колбэки
    private onSave: (data: NodeSettingsData) => void;
    private onClose: () => void;

    // Данные
    private nodeData: NodeSettingsData;

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

        // Размеры панели (1/3 ширины, полная высота)
        this.panelWidth = this.app.screen.width / 3;
        this.panelHeight = this.app.screen.height;

        this.container = new PIXI.Container();
        this.createPanel();
        this.initializationPromise = this.createPanel();
    }

    private async createPanel(): Promise<void> {
        await this.loadIcons();
        this.createBackground();
        this.createHeader();
        this.createContentArea();
        this.createHTMLControls();
    }



    private async loadIcons(): Promise<void> {
        try {
            this.saveIconTexture = await PIXI.Assets.load(floppyBadgedSvg);
            this.closeIconTexture = await PIXI.Assets.load(closeSaveSvg);
        } catch (error) {
            console.warn('Failed to load settings panel icons:', error);
            this.createFallbackIcons();
        }
    }

    private createFallbackIcons(): void {
        // Fallback иконки
        const saveGraphics = new PIXI.Graphics();
        saveGraphics.rect(0, 0, 20, 20);
        saveGraphics.fill({ color: 0x3B82F6 });
        this.saveIconTexture = this.app.renderer.generateTexture(saveGraphics);

        const closeGraphics = new PIXI.Graphics();
        closeGraphics.circle(10, 10, 10);
        closeGraphics.fill({ color: 0xEF4444 });
        this.closeIconTexture = this.app.renderer.generateTexture(closeGraphics);
    }

    private createBackground(): void {
        this.background = new PIXI.Graphics();

        // Логируем размеры и позицию
        console.log('📐 Panel dimensions:', {
            width: this.panelWidth,
            height: this.panelHeight,
            screenWidth: this.app.screen.width,
            screenHeight: this.app.screen.height,
            position: { x: this.container.x, y: this.container.y }
        });

        // 1. ТЕМНО-СИНИЙ ПОЛУПРОЗРАЧНЫЙ ФОН
        const darkBlueColor = 0x0A1A2A; // Темно-синий
        this.background.rect(0, 0, this.panelWidth, this.panelHeight);
        this.background.fill({ color: darkBlueColor, alpha: 0.85 }); // Высокая прозрачность

        // 2. НЕОНОВАЯ ЛИНИЯ СЛЕВА
        const neonBlueColor = 0x00BFFF; // Яркий неоново-синий
        const lineWidth = 3;

        // Основная линия
        this.background.rect(0, 0, lineWidth, this.panelHeight);
        this.background.fill({ color: neonBlueColor, alpha: 0.9 });

        // Эффект свечения (более прозрачная широкая полоса)
        this.background.rect(-5, 0, 10, this.panelHeight);
        this.background.fill({ color: neonBlueColor, alpha: 0.3 });

        // 3. ЗАГОЛОВОК ПАНЕЛИ (темнее)
        this.headerBackground = new PIXI.Graphics();
        const headerDarkBlue = 0x081420; // Еще темнее синий
        this.headerBackground.rect(0, 0, this.panelWidth, 50);
        this.headerBackground.fill({ color: headerDarkBlue, alpha: 0.9 });

        // 4. ОБЛАСТЬ КОНТЕНТА
        const contentX = 20;
        const contentY = 70;
        const contentWidth = this.panelWidth - 40;
        const contentHeight = this.panelHeight - 90;

        // Полупрозрачная темно-синяя область
        this.background.rect(contentX, contentY, contentWidth, contentHeight);
        this.background.fill({ color: darkBlueColor, alpha: 0.7 });

        // Тонкая рамка неонового цвета
        this.background.rect(contentX, contentY, contentWidth, contentHeight);
        this.background.stroke({
            width: 1,
            color: neonBlueColor,
            alpha: 0.6
        });

        console.log('✅ Dark blue background with neon line created');
        console.log('📍 Content area:', {
            x: contentX,
            y: contentY,
            width: contentWidth,
            height: contentHeight
        });

        this.container.addChild(this.background);
        this.container.addChild(this.headerBackground);
    }

    private createHeader(): void {
        // Фон заголовка
        this.headerBackground = new PIXI.Graphics();
        const headerColor = this.theme === 'dark' ? 0x1a1a1a : 0xf0f0f0;

        this.headerBackground.rect(0, 0, this.panelWidth, 50);
        this.headerBackground.fill({ color: headerColor, alpha: 0.95 });
        this.container.addChild(this.headerBackground);

        // Заголовок
        this.titleText = new PIXI.Text({
            text: 'Настройки нода',
            style: {
                fontSize: 16,
                fill: this.theme === 'dark' ? 0xffffff : 0x000000,
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }
        });
        this.titleText.x = 20;
        this.titleText.y = 15;
        this.container.addChild(this.titleText);

        // Кнопка сохранения
        this.createSaveButton();

        // Кнопка закрытия
        this.createCloseButton();
    }

    private createSaveButton(): void {
        this.saveButton = new PIXI.Container();

        // Иконка
        const saveIcon = this.saveIconTexture
            ? new PIXI.Sprite(this.saveIconTexture)
            : this.createFallbackSaveIcon();

        saveIcon.width = 20;
        saveIcon.height = 20;
        saveIcon.x = this.panelWidth - 90; // Правее
        saveIcon.y = 15;

        // Текст
        const saveText = new PIXI.Text({
            text: 'Сохранить',
            style: {
                fontSize: 12,
                fill: this.theme === 'dark' ? 0xffffff : 0x000000,
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }
        });
        saveText.x = saveIcon.x + saveIcon.width + 8;
        saveText.y = 15;

        this.saveButton.addChild(saveIcon);
        this.saveButton.addChild(saveText);
        this.saveButton.eventMode = 'static';
        this.saveButton.cursor = 'pointer';
        this.saveButton.zIndex = 10;

        this.saveButton.on('pointerdown', () => {
            console.log('💾 Save button clicked');
            this.saveSettings();
        });

        this.container.addChild(this.saveButton);
    }

    private createCloseButton(): void {
        this.closeButton = new PIXI.Container();

        const closeIcon = this.closeIconTexture
            ? new PIXI.Sprite(this.closeIconTexture)
            : this.createFallbackCloseIcon();

        closeIcon.width = 20;
        closeIcon.height = 20;
        closeIcon.x = this.panelWidth - 30;
        closeIcon.y = 15;

        this.closeButton.addChild(closeIcon);
        this.closeButton.eventMode = 'static';
        this.closeButton.cursor = 'pointer';
        this.closeButton.zIndex = 10;

        this.closeButton.on('pointerdown', () => {
            console.log('❌ Close button clicked');
            this.closePanel(false);
        });

        this.container.addChild(this.closeButton);
    }

    private createFallbackSaveIcon(): PIXI.Graphics {
        const graphics = new PIXI.Graphics();
        graphics.rect(0, 0, 20, 20);
        graphics.fill({ color: 0x3B82F6 });
        return graphics;
    }

    private createFallbackCloseIcon(): PIXI.Graphics {
        const graphics = new PIXI.Graphics();
        graphics.circle(10, 10, 10);
        graphics.fill({ color: 0xEF4444 });
        return graphics;
    }

    private createContentArea(): void {
        // Здесь будет область для контента
        // Фактическое содержимое будет в HTML overlay
    }

    private createHTMLControls(): void {
        console.log('🌐 Creating HTML overlay controls...');

        if (this.htmlOverlay) {
            document.body.removeChild(this.htmlOverlay);
        }

        this.htmlOverlay = document.createElement('div');
        this.htmlOverlay.style.position = 'fixed';
        this.htmlOverlay.style.right = '0';
        this.htmlOverlay.style.top = '0';
        this.htmlOverlay.style.width = `${this.panelWidth}px`;
        this.htmlOverlay.style.height = `${this.panelHeight}px`;
        this.htmlOverlay.style.pointerEvents = 'auto';
        this.htmlOverlay.style.zIndex = '10001';
        this.htmlOverlay.style.overflowY = 'auto';
        this.htmlOverlay.style.background = 'transparent';

        // Контейнер для контента (совпадает с canvas областью)
        const contentContainer = document.createElement('div');
        contentContainer.style.position = 'absolute';
        contentContainer.style.left = '20px';
        contentContainer.style.top = '70px';
        contentContainer.style.width = `${this.panelWidth - 40}px`;
        contentContainer.style.height = `${this.panelHeight - 90}px`;
        contentContainer.style.padding = '20px';
        contentContainer.style.background = 'transparent';
        contentContainer.style.boxSizing = 'border-box';

        // Создаем элементы управления
        this.nodeData.controls.forEach(control => {
            this.createControlElement(control, contentContainer);
        });

        this.htmlOverlay.appendChild(contentContainer);
        document.body.appendChild(this.htmlOverlay);

        console.log('✅ HTML overlay positioned correctly');
    }

    private createControlElement(control: ControlConfig, container: HTMLElement): void {
        const controlDiv = document.createElement('div');
        controlDiv.style.marginBottom = '15px';

        const label = document.createElement('label');
        label.textContent = control.label;
        label.style.display = 'block';
        label.style.color = this.theme === 'dark' ? '#ffffff' : '#000000';
        label.style.marginBottom = '5px';
        label.style.fontSize = '14px';
        label.style.fontFamily = 'Arial, sans-serif';
        label.style.fontWeight = '500';

        let input: HTMLInputElement | HTMLSelectElement;

        switch (control.type) {
            case 'dropdown':
                const select = document.createElement('select');
                control.options?.forEach(option => {
                    const optionElem = document.createElement('option');
                    optionElem.value = option;
                    optionElem.textContent = option;
                    select.appendChild(optionElem);
                });
                select.value = this.nodeData.data[control.key] || control.defaultValue;
                input = select;
                break;

            case 'checkbox':
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = this.nodeData.data[control.key] || control.defaultValue;
                input = checkbox;
                break;

            default:
                const textInput = document.createElement('input');
                textInput.type = control.type;
                textInput.value = this.nodeData.data[control.key] || control.defaultValue;
                input = textInput;
        }

        input.style.width = '100%';
        input.style.background = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        input.style.border = '1px solid rgba(59, 130, 246, 0.5)';
        input.style.borderRadius = '4px';
        input.style.padding = '8px 12px';
        input.style.color = this.theme === 'dark' ? '#ffffff' : '#000000';
        input.style.fontSize = '14px';
        input.style.fontFamily = 'Arial, sans-serif';
        input.style.outline = 'none';
        input.style.transition = 'border-color 0.2s ease';

        input.addEventListener('focus', () => {
            input.style.borderColor = '#3B82F6';
        });

        input.addEventListener('blur', () => {
            input.style.borderColor = 'rgba(59, 130, 246, 0.5)';
        });

        input.addEventListener('change', (e) => {
            this.nodeData.data[control.key] =
                control.type === 'checkbox'
                    ? (e.target as HTMLInputElement).checked
                    : (e.target as HTMLInputElement).value;
        });

        controlDiv.appendChild(label);
        controlDiv.appendChild(input);
        container.appendChild(controlDiv);
    }

    private async saveSettings(): Promise<void> {
        try {
            await this.onSave(this.nodeData);
            this.closePanel(true);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    public closePanel(save: boolean): void {
        if (this.htmlOverlay) {
            document.body.removeChild(this.htmlOverlay);
            this.htmlOverlay = null;
        }

        this.container.destroy({ children: true });
        this.onClose();

        if (save) {
            // Данные уже сохранены через onSave
        }
    }

    public resize(width: number, height: number): void {
        this.panelWidth = width / 3;
        this.panelHeight = height;

        // Обновляем размеры панели
        this.background.clear();
        const bgColor = this.theme === 'dark' ? 0x2a2a2a : 0xffffff;
        const borderColor = this.theme === 'dark' ? 0x3B82F6 : 0x2563EB;

        this.background.roundRect(0, 0, this.panelWidth, this.panelHeight, 0);
        this.background.fill({ color: bgColor, alpha: 0.8 });

        this.background.roundRect(10, 60, this.panelWidth - 20, this.panelHeight - 70, 8);
        this.background.fill({ color: bgColor, alpha: 0.9 });

        this.background.stroke({ width: 2, color: borderColor, alpha: 0.3 });

        // Обновляем позиции кнопок
        if (this.saveButton && this.saveButton.children[0]) {
            this.saveButton.children[0].x = this.panelWidth - 80;
        }
        if (this.closeButton && this.closeButton.children[0]) {
            this.closeButton.children[0].x = this.panelWidth - 30;
        }

        // Обновляем HTML overlay
        if (this.htmlOverlay) {
            this.htmlOverlay.style.width = `${this.panelWidth}px`;
            this.htmlOverlay.style.height = `${this.panelHeight}px`;
        }
    }

    public destroy(): void {
        this.closePanel(false);
    }
}