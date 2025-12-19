// src/shared/utils/TextFactory.ts
import { Text, TextStyle } from 'pixi.js';
import { ButtonStyleManager } from '../../subcomponents/PhiChoiceScreen/layers/services/ButtonStyleManager';

export interface TextConfig {
  content: string;
  theme?: 'dark' | 'light';
  fontSize?: number;
  maxWidth?: number;
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter';
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  fontFamily?: string;
}

export class TextFactory {
  static createButtonText(config: TextConfig): Text {
    const theme = config.theme || 'dark';
    const themeColors = ButtonStyleManager.getTheme(theme);

    const fontSize = config.fontSize || 14;
    const maxWidth = config.maxWidth || 200;

    return new Text({
      text: config.content,
      style: new TextStyle({
        fontFamily: config.fontFamily || 'Arial, sans-serif',
        fontSize,
        fill: themeColors.textColor, // Используем тему
        fontWeight: config.fontWeight || 'bold',
        align: config.align || 'center',
        wordWrap: true,
        wordWrapWidth: maxWidth,
        letterSpacing: config.letterSpacing || 0.2,
      }),
      resolution: 2
    });
  }

  static createTitleText(content: string, theme: 'dark' | 'light' = 'dark'): Text {
    const themeColors = ButtonStyleManager.getTheme(theme);

    return new Text({
      text: content,
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fill: themeColors.textColor,
        fontWeight: 'bold',
        align: 'center',
      }),
      resolution: 2
    });
  }

  static createLabelText(content: string, theme: 'dark' | 'light' = 'dark'): Text {
    const themeColors = ButtonStyleManager.getTheme(theme);

    return new Text({
      text: content,
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        fill: themeColors.textColor,
        fontWeight: 'normal',
        align: 'left',
      }),
      resolution: 2
    });
  }
}