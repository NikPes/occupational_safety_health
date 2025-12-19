// UILayer/DebugPanel.ts
import * as PIXI from 'pixi.js';
import { ThemeMode } from '../../../types/commonTypes';
import { DiagnosticManager } from '../utils/DiagnosticManager';
import { DebugSettings } from '../utils/DiagnosticManager';
import { ToggleSwitch } from './components/ToggleSwitch';
import { Slider } from './components/Slider';

export class DebugPanel {
    public container: PIXI.Container;
    private app: PIXI.Application;
    private theme: ThemeMode;
    private panelWidth: number;
    private panelHeight: number;
    private background!: PIXI.Graphics;
    private diagnosticManager: DiagnosticManager;
    private contentContainer: PIXI.Container;
    private controls: Map<string, ToggleSwitch | Slider> = new Map();

    constructor(app: PIXI.Application, theme: ThemeMode) {
        this.app = app;
        this.theme = theme;
        this.panelWidth = this.app.screen.width / 3;
        this.panelHeight = this.app.screen.height;
        this.diagnosticManager = DiagnosticManager.getInstance();

        this.container = new PIXI.Container();
        this.contentContainer = new PIXI.Container();

        this.createPanel();
    }

    private createPanel(): void {
        this.createBackground();
        this.createHeader();
        this.createControls();
        this.container.addChild(this.contentContainer);
    }

    private createBackground(): void {
        this.background = new PIXI.Graphics();
        const darkBlueColor = 0x0A1A2A;
        this.background.rect(0, 0, this.panelWidth, this.panelHeight);
        this.background.fill({ color: darkBlueColor, alpha: 0.85 });

        const neonBlueColor = 0x00BFFF;
        const lineWidth = 3;
        this.background.rect(0, 0, lineWidth, this.panelHeight);
        this.background.fill({ color: neonBlueColor, alpha: 0.9 });

        this.container.addChild(this.background);
    }

    private createHeader(): void {
        const titleText = new PIXI.Text({
            text: 'Панель отладки',
            style: {
                fontSize: 18,
                fill: 0xffffff,
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }
        });
        titleText.x = 20;
        titleText.y = 20;
        this.contentContainer.addChild(titleText);
    }

    private createControls(): void {
        let yOffset = 60;
        const settings = this.diagnosticManager.getSettings();

        // Секция: Визуальная отладка
        yOffset = this.createSection('Визуальная отладка', yOffset);
        yOffset = this.createToggle('Показать сетку', 'showGrid', settings.showGrid, yOffset);
        yOffset = this.createToggle('Показать диагностику', 'showDiagnostics', settings.showDiagnostics, yOffset);

        // Секция: Мониторинг переменных
        yOffset = this.createSection('Мониторинг переменных', yOffset + 10);
        const variables = [
            { key: 'mousePosition', label: 'Координаты мыши' },
            { key: 'activeNode', label: 'Позиция активного нода' },
            { key: 'transform', label: 'Transform сцены' },
            { key: 'dragState', label: 'Состояние перетаскивания' },
            { key: 'fps', label: 'FPS' }
        ];

        variables.forEach(variable => {
            const isMonitored = settings.monitoredVariables.has(variable.key);
            yOffset = this.createVariableToggle(variable.label, variable.key, isMonitored, yOffset);
        });

        // Секция: Сохранение данных
        yOffset = this.createSection('Сохранение данных', yOffset + 10);
        yOffset = this.createToggle('Сохранять в файл', 'saveToFile', settings.saveToFile, yOffset);
        yOffset = this.createSlider('Частота кадров', 'frameRate', 1, 60, settings.frameRate, yOffset);
        yOffset = this.createSlider('Частота обновления UI (мс)', 'throttleRate', 16, 1000, settings.throttleRate, yOffset);

        // Кнопка сохранения
        yOffset = this.createSaveButton(yOffset + 10);
    }

    private createSection(title: string, y: number): number {
        const sectionText = new PIXI.Text({
            text: title,
            style: {
                fontSize: 14,
                fill: 0x00BFFF,
                fontFamily: 'Arial',
                fontWeight: 'bold'
            }
        });
        sectionText.x = 20;
        sectionText.y = y;
        this.contentContainer.addChild(sectionText);

        // Разделительная линия
        const line = new PIXI.Graphics();
        line.rect(20, y + 25, this.panelWidth - 40, 1);
        line.fill({ color: 0x00BFFF, alpha: 0.3 });
        this.contentContainer.addChild(line);

        return y + 35;
    }

    private createToggle(label: string, settingKey: keyof DebugSettings, initialValue: boolean, y: number): number {
        const toggle = new ToggleSwitch(
            this.panelWidth - 70,
            y,
            50,
            20,
            initialValue,
            (value: boolean) => {
                // ✅ ВСЕ УПРАВЛЕНИЕ ЧЕРЕЗ DIAGNOSTIC MANAGER
                this.diagnosticManager.updateSettings({ [settingKey]: value });
            }
        );

        this.contentContainer.addChild(toggle.container);
        this.controls.set(settingKey, toggle);

        return y + 30;
    }

    private createVariableToggle(label: string, variableKey: string, isMonitored: boolean, y: number): number {
        const toggle = new ToggleSwitch(
            20,
            y,
            40,
            16,
            isMonitored,
            (value: boolean) => {
                const settings = this.diagnosticManager.getSettings();
                const newVariables = new Set(settings.monitoredVariables);

                if (value) {
                    newVariables.add(variableKey);
                } else {
                    newVariables.delete(variableKey);
                }

                this.diagnosticManager.updateSettings({ monitoredVariables: newVariables });
            }
        );

        const labelText = new PIXI.Text({
            text: label,
            style: {
                fontSize: 12,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        labelText.x = 70;
        labelText.y = y;

        this.contentContainer.addChild(toggle.container, labelText);
        this.controls.set(`var_${variableKey}`, toggle);

        return y + 25;
    }

    private createSlider(label: string, settingKey: keyof DebugSettings, min: number, max: number, initialValue: number, y: number): number {
        const labelText = new PIXI.Text({
            text: `${label}: ${initialValue}`,
            style: {
                fontSize: 12,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        labelText.x = 20;
        labelText.y = y;
        this.contentContainer.addChild(labelText);

        const slider = new Slider(
            20,
            y + 20,
            this.panelWidth - 60,
            8,
            min,
            max,
            initialValue,
            (value: number) => {
                labelText.text = `${label}: ${value}`;
                this.diagnosticManager.updateSettings({ [settingKey]: value });
            }
        );

        this.contentContainer.addChild(slider.container);
        this.controls.set(settingKey, slider);

        return y + 45;
    }

    private createSaveButton(y: number): number {
        const button = new PIXI.Graphics();
        button.rect(20, y, 120, 30);
        button.fill({ color: 0x00BFFF, alpha: 0.7 });

        const buttonText = new PIXI.Text({
            text: 'Сохранить данные',
            style: {
                fontSize: 12,
                fill: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        buttonText.x = 20 + (120 - buttonText.width) / 2;
        buttonText.y = y + (30 - buttonText.height) / 2;

        button.eventMode = 'static';
        button.cursor = 'pointer';
        button.on('pointerdown', () => {
            this.diagnosticManager.saveToFile();
        });

        this.contentContainer.addChild(button, buttonText);
        return y + 40;
    }

    public resize(width: number, height: number): void {
        this.panelWidth = width / 3;
        this.panelHeight = height;

        this.background.clear();
        this.createBackground();

        // TODO: Пересчитать позиции контролов при ресайзе
    }

    public destroy(): void {
        this.controls.clear();
        this.container.destroy({ children: true });
    }
}