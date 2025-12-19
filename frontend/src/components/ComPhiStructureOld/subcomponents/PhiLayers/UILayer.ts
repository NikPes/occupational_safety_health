import * as PIXI from 'pixi.js';
import { NodeSettingsPanel } from './layers/NodeSettingsPanel';
import { WorkspaceSettingsPanel } from './layers/WorkspaceSettingsPanel';
import { AppearancePanel } from './layers/AppearancePanel';
import { ToolsPanel } from './layers/ToolsPanel';
import { PhiNodeBase } from '../PhiNodeBase/PhiNodeBase';
import type { NodeSettingsData } from '../PhiNodeBase/subcomponents/PhiNodeSettings/types/types';
import { ThemeMode } from '../PhiConstructSpace/types';

export type PanelType = 'node-settings' | 'workspace-settings' | 'appearance' | 'tools' | null;

export class UILayer {
    public container: PIXI.Container;
    private app: PIXI.Application;
    private currentTheme: ThemeMode = 'dark';
    private activePanel: PanelType = null;
    private currentPanel: NodeSettingsPanel | WorkspaceSettingsPanel | AppearancePanel | ToolsPanel | null = null;
    private blurFilter: PIXI.BlurFilter | null = null;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.container = new PIXI.Container();
    }

    public async openNodeSettings(node: PhiNodeBase, onSave: (data: NodeSettingsData) => void, onClose: () => void): Promise<void> {
        await this.openPanel('node-settings', { node, onSave, onClose });
    }

    public async openWorkspaceSettings(onSave: (data: any) => void, onClose: () => void): Promise<void> {
        await this.openPanel('workspace-settings', { onSave, onClose });
    }

    public async openAppearanceSettings(onSettingsChange: (settings: any) => void, onClose: () => void): Promise<void> {
        await this.openPanel('appearance', { onSettingsChange, onClose });
    }

    public async openToolsPanel(onClose: () => void): Promise<void> {
        await this.openPanel('tools', { onClose });
    }

    private async openPanel(panelType: PanelType, options: any): Promise<void> {
        // Закрываем текущую панель
        this.closeCurrentPanel();

        this.activePanel = panelType;

        switch (panelType) {
            case 'node-settings':
                this.currentPanel = new NodeSettingsPanel(
                    this.app,
                    options.node,
                    this.currentTheme,
                    options.initialData || await this.fetchNodeSettings(options.node),
                    options.onSave,
                    () => this.closePanel(options.onClose)
                );
                break;

            case 'workspace-settings':
                this.currentPanel = new WorkspaceSettingsPanel(
                    this.app,
                    this.currentTheme,
                    options.onSave,
                    () => this.closePanel(options.onClose)
                );
                break;

            case 'appearance':
                this.currentPanel = new AppearancePanel(
                    this.app,
                    this.currentTheme,
                    options.onSettingsChange,
                    () => this.closePanel(options.onClose)
                );
                break;

            case 'tools':
                this.currentPanel = new ToolsPanel(
                    this.app,
                    this.currentTheme,
                    () => this.closePanel(options.onClose)
                );
                break;
        }

        if (this.currentPanel) {
            await this.currentPanel.initializationPromise;
            const targetX = this.app.screen.width - this.currentPanel.container.width;

            // Устанавливаем финальную позицию и прозрачность
            this.currentPanel.container.x = targetX;
            this.currentPanel.container.alpha = 0;

            this.container.addChild(this.currentPanel.container);
            this.animatePanelFadeIn();
        }
    }

    private animatePanelFadeIn(): void {
        if (!this.currentPanel) return;

        const duration = 300;
        const startTime = Date.now();

        // Убираем размытие с самой панели
        this.currentPanel.container.filters = [];

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Плавное появление от прозрачного к полупрозрачному
            this.currentPanel!.container.alpha = progress * 0.95;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    private closeCurrentPanel(): void {
        if (this.currentPanel) {
            this.currentPanel.destroy();
            this.currentPanel = null;
        }
        this.activePanel = null;
    }

    private closePanel(onClose: () => void): void {
        this.closeCurrentPanel();
        onClose();
    }

    private async fetchNodeSettings(node: PhiNodeBase): Promise<NodeSettingsData> {
        // Временная заглушка - возвращаем базовые настройки
        return {
            title: node.getTitle(),
            componentKey: 'default',
            position: { x: node.node.x, y: node.node.y },
            data: {},
            controls: [
                {
                    type: 'text',
                    key: 'name',
                    label: 'Название нода',
                    defaultValue: node.getTitle()
                },
                {
                    type: 'color',
                    key: 'backgroundColor',
                    label: 'Цвет фона',
                    defaultValue: '#3B82F6'
                }
            ]
        };
    }

    public applyBlurEffect(): void {
        // Размытие применяется только к этому слою через LayerManager
        this.blurFilter = new PIXI.BlurFilter({ strength: 2 });
        this.container.filters = [this.blurFilter];
    }

    public removeBlurEffect(): void {
        this.container.filters = [];
        this.blurFilter = null;
    }

    public resize(width: number, height: number): void {
        if (this.currentPanel) {
            this.currentPanel.resize(width, height);
            this.currentPanel.container.x = width - this.currentPanel.container.width;
        }
    }

    public setTheme(theme: ThemeMode): void {
        this.currentTheme = theme;
    }

    public getActivePanel(): PanelType {
        return this.activePanel;
    }

    public destroy(): void {
        this.closeCurrentPanel();
        this.container.removeChildren();
    }
}