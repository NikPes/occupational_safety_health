import * as PIXI from 'pixi.js';
import { PhiNodeBase } from '../PhiNodeBase/PhiNodeBase';

export class OverlayLayer {
    public container: PIXI.Container;
    private editInput: HTMLInputElement | null = null;
    private editOverlay: PIXI.Graphics | null = null;
    private blurFilter: PIXI.BlurFilter | null = null;
    private originalFilters: readonly PIXI.Filter[] = [];
    private app: PIXI.Application;
    private titleEditContainer: PIXI.Container | null = null;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.container = new PIXI.Container();
    }

    public startTitleEditing(node: PhiNodeBase, onFinish: (save: boolean, newTitle?: string) => void): void {
        if (this.editInput) return;

        const nodePos = node.getGlobalPosition();
        const headerHeight = 30;
        const inputHeightValue = 24;

        this.createEditInput(nodePos.x, nodePos.y + headerHeight + 5, inputHeightValue, node.getTitle(), onFinish);
        this.createEditEffects(nodePos.x, nodePos.y + headerHeight + 5, inputHeightValue);
        this.disableInteractivity();
    }

    private createEditInput(x: number, y: number, inputHeight: number, currentTitle: string, onFinish: (save: boolean, newTitle?: string) => void): void {
        this.editInput = document.createElement('input');
        this.editInput.type = 'text';
        this.editInput.value = currentTitle || 'Phi Node';
        this.editInput.style.position = 'fixed';
        this.editInput.style.left = `${x}px`;
        this.editInput.style.top = `${y}px`;
        this.editInput.style.width = '200px';
        this.editInput.style.height = `${inputHeight}px`;
        this.editInput.style.fontSize = '14px';
        this.editInput.style.fontFamily = 'Arial, sans-serif';
        this.editInput.style.background = 'transparent';
        this.editInput.style.border = 'none';
        this.editInput.style.outline = 'none';
        this.editInput.style.color = '#ffffff';
        this.editInput.style.caretColor = '#ffffff';
        this.editInput.style.opacity = '1';
        this.editInput.style.zIndex = '10000';
        this.editInput.style.padding = '0 8px';
        this.editInput.style.boxSizing = 'border-box';

        this.editInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                this.finishTitleEditing(true, onFinish);
            } else if (e.key === 'Escape') {
                this.finishTitleEditing(false, onFinish);
            }
        };

        this.editInput.onblur = () => {
            this.finishTitleEditing(false, onFinish);
        };

        document.body.appendChild(this.editInput);
        this.editInput.focus();
        this.editInput.select();
    }

    private createEditEffects(x: number, y: number, inputHeight: number): void {
        this.originalFilters = this.app.stage.filters || [];
        this.blurFilter = new PIXI.BlurFilter({ strength: 2 });
        this.app.stage.filters = [...this.originalFilters, this.blurFilter];

        this.editOverlay = new PIXI.Graphics();
        this.editOverlay.fill({ color: 0x2a2a2a, alpha: 0.9 });
        this.editOverlay.stroke({ width: 2, color: 0x3B82F6, alpha: 0.8 });
        this.editOverlay.roundRect(x - 5, y - 5, 210, 34, 6);
        this.container.addChild(this.editOverlay);
    }

    private finishTitleEditing(save: boolean, onFinish: (save: boolean, newTitle?: string) => void): void {
        const newTitle = save && this.editInput ? this.editInput.value.trim() : undefined;

        if (this.editInput) {
            document.body.removeChild(this.editInput);
            this.editInput = null;
        }

        this.app.stage.filters = [...this.originalFilters];
        this.blurFilter = null;

        if (this.editOverlay) {
            this.container.removeChild(this.editOverlay);
            this.editOverlay.destroy();
            this.editOverlay = null;
        }

        this.enableInteractivity();
        onFinish(save, newTitle);
    }

    private disableInteractivity(): void {
        this.app.stage.eventMode = 'none';
    }

    private enableInteractivity(): void {
        this.app.stage.eventMode = 'static';
    }

    public destroy(): void {
        if (this.editInput) {
            document.body.removeChild(this.editInput);
            this.editInput = null;
        }
        this.container.removeChildren();
    }

    public resize(width: number, height: number): void {
        // Логика ресайза для оверлейного слоя
        // Например, reposition редактирования названия
        if (this.titleEditContainer) {
            // Центрирование контейнера редактирования
            this.titleEditContainer.x = width / 2;
            this.titleEditContainer.y = height / 2;
        }
    }
}