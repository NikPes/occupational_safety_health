// core/types/events.ts

/**
 * CoreEvents - общие события системы, доступные всем модулям
 */
export interface CoreEvents {
    // Сырые события ввода
    'mouse-down': {
        x: number;
        y: number;
        button: number;
        shiftKey: boolean;
        ctrlKey: boolean;
    };

    'mouse-move': {
        x: number;
        y: number;
        buttons: number;
    };

    'mouse-up': {
        x: number;
        y: number;
        button: number;
    };

    'wheel': {
        deltaX: number;
        deltaY: number;
        deltaZ: number;
    };

    // Системные события
    'canvas-resized': {
        width: number;
        height: number;
    };

    'theme-changed': {
        theme: 'dark' | 'light';
    };

    // Режимы отладки
    'debug-mode-changed': {
        enabled: boolean;
    };
}