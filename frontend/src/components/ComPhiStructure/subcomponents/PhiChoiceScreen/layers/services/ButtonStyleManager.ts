// src/subcomponents/PhiChoiceScreen/layers/services/ButtonStyleManager.ts
import { ButtonConfig, ButtonTheme, ThemeColors, ButtonType, ButtonVariant } from './ButtonTypes';

export class ButtonStyleManager {
  private static readonly THEMES: ThemeColors = {
    dark: {
      backgroundColor: 0x1A1A1A,     // Темно-серый фон кнопки
      textColor: 0xFFFFFF,           // Белый текст
    },
    light: {
      backgroundColor: 0xD0D0D0,     // Светло-серый фон кнопки
      textColor: 0x000000,           // Черный текст
    }
  };

  private static readonly BUTTON_CONFIGS: Record<ButtonType, ButtonConfig> = {
    node: {
      id: 'node',
      label: 'Редактор нодов',
      width: 400,
      height: 100,
      svgPath: '', // Заполнится из импорта
      variant: 'primary' as ButtonVariant
    },
    scheme: {
      id: 'scheme',
      label: 'Редактор схем',
      width: 400,
      height: 100,
      svgPath: '', // Заполнится из импорта
      variant: 'primary' as ButtonVariant
    }
  };

  // Промежуточный цвет для hover анимации (50% между фоном и текстом)
  static getHoverColor(theme: 'dark' | 'light'): number {
    const themeColors = this.THEMES[theme];

    const bg = this.hexToRgb(themeColors.backgroundColor);
    const text = this.hexToRgb(themeColors.textColor);
    const intensity = 0.1;

    // intensity = 0 → фон, 1 → текст, 0.5 → 50%, 0.25 → 25%
    const r = Math.round(bg.r + (text.r - bg.r) * intensity);
    const g = Math.round(bg.g + (text.g - bg.g) * intensity);
    const b = Math.round(bg.b + (text.b - bg.b) * intensity);

    return this.rgbToHex(r, g, b);
  }

  static getButtonConfig(type: ButtonType): ButtonConfig {
    return { ...this.BUTTON_CONFIGS[type] }; // Возвращаем копию
  }

  static getTheme(theme: 'dark' | 'light'): ButtonTheme {
    return this.THEMES[theme];
  }

  static getAllButtonTypes(): ButtonType[] {
    return Object.keys(this.BUTTON_CONFIGS) as ButtonType[];
  }

  // Обновить SVG пути после импорта
  static updateSvgPaths(nodeSvgPath: string, schemeSvgPath: string): void {
    this.BUTTON_CONFIGS.node.svgPath = nodeSvgPath;
    this.BUTTON_CONFIGS.scheme.svgPath = schemeSvgPath;
  }

  private static hexToRgb(hex: number): { r: number; g: number; b: number } {
    return {
      r: (hex >> 16) & 255,
      g: (hex >> 8) & 255,
      b: hex & 255
    };
  }

  private static rgbToHex(r: number, g: number, b: number): number {
    return (r << 16) + (g << 8) + b;
  }
}