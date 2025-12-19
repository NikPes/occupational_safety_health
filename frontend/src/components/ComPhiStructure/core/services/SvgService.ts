// 📁 core/services/SvgService.ts
import { Sprite, Assets } from 'pixi.js';
import { ButtonVariant, ColorElement } from '../../subcomponents/PhiChoiceScreen/layers/services/ButtonTypes';

/**
 * Сервис для работы с SVG изображениями и цветами кнопок
 */
export class SvgService {
  /**
   * Получает цвет для элемента кнопки в зависимости от темы и типа
   * @param theme Тема ('dark' | 'light')
   * @param variant Тип кнопки (primary, neutral, positive, negative)
   * @param element Элемент ('icon' - иконка, 'text' - текст)
   * @returns HEX цвет в формате строки (#FFFFFF)
   */
  static getColorForButton(
    theme: 'dark' | 'light',
    variant: ButtonVariant,
    element: ColorElement
  ): string {
    // Базовые цвета для светлой темы
    const lightThemeColors = {
      primary: { icon: '#2196F3', text: '#000000' },     // Синий иконка, черный текст
      neutral: { icon: '#9E9E9E', text: '#000000' },     // Серый иконка, черный текст
      positive: { icon: '#4CAF50', text: '#000000' },    // Зеленый иконка, черный текст
      negative: { icon: '#F44336', text: '#000000' },    // Красный иконка, черный текст
    };

    // Базовые цвета для темной темы (немного светлее)
    const darkThemeColors = {
      primary: { icon: '#64B5F6', text: '#FFFFFF' },     // Светло-синий иконка, белый текст
      neutral: { icon: '#BDBDBD', text: '#FFFFFF' },     // Светло-серый иконка, белый текст
      positive: { icon: '#81C784', text: '#FFFFFF' },    // Светло-зеленый иконка, белый текст
      negative: { icon: '#E57373', text: '#FFFFFF' },    // Светло-красный иконка, белый текст
    };

    const colors = theme === 'dark' ? darkThemeColors : lightThemeColors;
    return colors[variant][element];
  }

  /**
   * Перекрашивает SVG и создает спрайт
   * @param svgContent Содержимое SVG файла как строка
   * @param theme Тема ('dark' | 'light')
   * @param variant Тип кнопки
   * @param scale Масштаб спрайта (опционально)
   * @returns Спрайт PixiJS
   */
  static async recolorSvgToSprite(
      svgContent: string,
      theme: 'dark' | 'light',
      variant: ButtonVariant,
      scale?: number
  ): Promise<Sprite> {
    try {
      const iconColor = this.getColorForButton(theme, variant, 'icon');

      // Удаляем русские комментарии
      const cleanedSvg = svgContent.replace(/<!--[\s\S]*?-->/g, '');

      // Простая перекраска
      const recoloredSvg = cleanedSvg
          .replace(/fill="#000000"/gi, `fill="${iconColor}"`)
          .replace(/stroke="#000000"/gi, `stroke="${iconColor}"`);

      // Используем encodeURIComponent для безопасной кодировки
      const encodedSvg = encodeURIComponent(recoloredSvg);
      const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

      // Загружаем текстуру
      const texture = await Assets.load(svgDataUrl);

      // Создаем спрайт
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);

      if (scale !== undefined) {
        sprite.scale.set(scale);
      }

      return sprite;

    } catch (error) {
      console.error('Ошибка создания SVG спрайта:', error);
      return this.createFallbackSprite(theme, variant);
    }
  }

  static async recolorSvgToSpriteSimple(
    svgContent: string,
    theme: 'dark' | 'light',
    variant: ButtonVariant,
    scale?: number
  ): Promise<Sprite> {
    const iconColor = this.getColorForButton(theme, variant, 'icon');
    const recoloredSvg = svgContent
      .replace(/fill="#000000"/g, `fill="${iconColor}"`)
      .replace(/stroke="#000000"/g, `stroke="${iconColor}"`);

    // Используем base64 вместо URL encode
    const base64Svg = btoa(recoloredSvg);
    const svgDataUrl = `data:image/svg+xml;base64,${base64Svg}`;

    const texture = await Assets.load(svgDataUrl);
    const sprite = Sprite.from(texture);
    sprite.anchor.set(0.5);

    if (scale !== undefined) {
      sprite.scale.set(scale);
    }

    return sprite;
  }

  /**
   * Перекрашивает SVG, заменяя черный цвет (#000000) на указанный
   * @private
   */
  private static recolorSvg(svgContent: string, newColor: string): string {
    // Простая замена черного цвета на новый
    // TODO: Возможно расширить для других форматов цвета
    return svgContent.replace(/#000000/g, newColor);
  }

  /**
   * Создает fallback спрайт (простой круг) при ошибке
   * @private
   */
  private static createFallbackSprite(theme: 'dark' | 'light', variant: ButtonVariant): Sprite {
    const iconColor = this.getColorForButton(theme, variant, 'icon');
    const size = 64;

    const svgContent = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" 
            fill="${iconColor}" stroke="#000" stroke-width="2"/>
  </svg>`;

    // Безопасное кодирование
    const encodedSvg = encodeURIComponent(svgContent);
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

    const sprite = Sprite.from(svgDataUrl);
    sprite.anchor.set(0.5);
    return sprite;
  }
}