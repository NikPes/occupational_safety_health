import * as PIXI from 'pixi.js';

export interface NodeSettingsData {
    nodeId?: string;
    title: string;
    componentKey: string;
    position: { x: number; y: number };
    data: Record<string, any>;
    controls: ControlConfig[];
}

export interface ControlConfig {
    type: 'text' | 'number' | 'color' | 'dropdown' | 'checkbox'; // ← Убираем 'slider' и 'textarea'
    key: string;
    label: string;
    defaultValue: any;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
}

export interface PhiNodeSettingsOptions {
    app: PIXI.Application;
    node: any;
    theme: 'dark' | 'light';
    initialData: NodeSettingsData;
    onSave: (data: NodeSettingsData) => Promise<void>;
    onClose: () => void;
}