// src/subcomponents/PhiChoiceScreen/layers/services/ButtonFactory.ts
import { Container, Graphics, Text, TextStyle } from 'pixi.js';

import { ButtonConfig, ButtonTheme } from './ButtonTypes';
import { ButtonStyleManager} from "./ButtonStyleManager";
import { SvgService } from '../../../../core/services/SvgService';
import { TextFactory } from '../../../../core/services/TextFactory';

export class ButtonFactory {
    /**
     * Создание кнопки с SVG иконкой
     */
    static async createButton(
        config: ButtonConfig,
        theme: ButtonTheme,
        currentTheme: 'dark' | 'light'
    ): Promise<Container> {
        const width = config.width;
        const height = config.height;
        const radius = height / 2;

        const container = new Container();

        // 1. Фон
        const background = new Graphics();
        background.roundRect(-width/2, -height/2, width, height, radius);
        background.fill({ color: theme.backgroundColor });
        background.stroke({
            width: 2,
            color: theme.textColor
        });

        // МЕТКИ для анимаций
        (background as any).isButtonBackground = true;
        (background as any).lastFillColor = theme.backgroundColor;
        (background as any).lastStrokeColor = theme.textColor;

        // ИНИЦИАЛИЗАЦИЯ свойств контейнера
        (container as any).baseScale = 1.0;           // Базовый масштаб
        (container as any).isHovering = false;        // Состояние hover
        (container as any).clickMultiplier = 1.0;     // Множитель клика
        (container as any).originalColor = theme.backgroundColor; // Исходный цвет

        (container as any).buttonWidth = width;
        (container as any).buttonHeight = height;
        (container as any).buttonRadius = radius;

        // 2. SVG иконка через SvgService
        let icon: Container;
        try {
            // Перекрашиваем SVG в цвет текста
            const response = await fetch(config.svgPath);
            if (!response.ok) throw new Error(`Failed to load SVG: ${config.svgPath}`);
            const svgContent = await response.text();

            // Создаем спрайт с перекрашенной SVG
            const sprite = await SvgService.recolorSvgToSprite(
                svgContent,
                currentTheme,
                config.variant,
                0.65
            );

            // Масштабируем под высоту кнопки
            const targetHeight = height * 0.5;
            const scale = targetHeight / (sprite.height / sprite.scale.y);
            sprite.scale.set(scale);

            icon = new Container();
            icon.addChild(sprite);

        } catch (error) {
            console.error('Ошибка загрузки SVG:', error);
            // Fallback иконка в цвет текста
            icon = this.createFallbackIcon(theme);
        }

        // 3. Текст - используем цвет из темы
        const optimalFontSize = Math.max(
            Math.round(height * 0.175), // 12px для 40px
            7 // минимум
        );
        const maxTextWidth = width * 0.7;

        const text = TextFactory.createButtonText({
            content: config.label,
            theme: currentTheme,
            fontSize: optimalFontSize,
            maxWidth: maxTextWidth,
        });
        text.anchor.set(0.5);
        text.position.set(0, 0);
        text.roundPixels = true;

        // 4. Позиционирование - иконка левее
        const iconOffsetX = -width / 2 + (width * 0.13); // 13% от ширины от левого края
        const textOffsetX = width * 0.05; // 5% от центра вправо

        icon.position.set(iconOffsetX, 0);
        text.position.set(textOffsetX, 0);

        // 5. Собираем
        container.addChild(background);
        container.addChild(icon);
        container.addChild(text);

        // 6. Интерактивность
        container.eventMode = 'static';
        container.cursor = 'pointer';

        return container;
    }


    private static createFallbackIcon(theme: ButtonTheme): Container {
        const container = new Container();

        const graphics = new Graphics();
        graphics.circle(0, 0, 15);
        graphics.fill({ color: theme.textColor }); // Используем цвет текста
        graphics.stroke({
            width: 1,
            color: theme.textColor // ⬅️ Используем цвет текста из темы
        });

        container.addChild(graphics);
        return container;
    }

    static createButtonSync(config: {
        label: string;
        type: 'node' | 'scheme';
        width?: number;
        height?: number;
        theme?: 'dark' | 'light'; // ⬅️ ДОБАВЛЯЕМ опциональную тему
    }): Container {
        const width = config.width ?? 100;
        const height = config.height ?? 40;
        const radius = height / 2;

        const container = new Container();

        // ⬇️ ИСПРАВЛЯЕМ: получаем тему из конфига или используем 'dark' по умолчанию
        const currentTheme = config.theme || 'dark';
        const themeColors = ButtonStyleManager.getTheme(currentTheme); // ⬅️ Берем из StyleManager

        const background = new Graphics();
        background.roundRect(-width/2, -height/2, width, height, radius);
        background.fill({ color: themeColors.backgroundColor }); // ✅ Используем тему
        background.stroke({
            width: 2,
            color: themeColors.textColor // ✅ Используем тему для stroke
        });

        const optimalFontSize = Math.max(Math.round(height * 0.175), 7);
        const maxTextWidth = width * 0.7;

        const text = TextFactory.createButtonText({
            content: config.label,
            theme: currentTheme,
            fontSize: optimalFontSize,
            maxWidth: maxTextWidth,
        });
        text.anchor.set(0.5);
        text.position.set(0, 0);
        text.roundPixels = true;

        container.addChild(background);
        container.addChild(text);
        container.eventMode = 'static';
        container.cursor = 'pointer';

        return container;
    }

}