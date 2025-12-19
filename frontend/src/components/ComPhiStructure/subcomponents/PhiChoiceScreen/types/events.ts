// subcomponents/PhiChoiceScreen/types/events.ts

/**
 * ChoiceEvents - события экрана выбора режима (только для root)
 */
export interface ChoiceEvents {
    // Состояние экрана
    'choice:shown': {};
    'choice:hidden': {};

    // Взаимодействие с кнопками
    'choice:button-hover': {
        buttonId: 'node' | 'scheme';
    };

    'choice:button-hover-end': {
        buttonId: 'node' | 'scheme';
    };

    'choice:button-click': {
        buttonId: 'node' | 'scheme';
    };

    // Анимации
    'choice:animation-started': {
        animation: string;
    };

    'choice:animation-ended': {
        animation: string;
    };
}