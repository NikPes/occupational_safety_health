// src/subcomponents/PhiChoiceScreen/layers/services/ButtonBackground.ts
import { Graphics } from 'pixi.js';

/**
 * Кастомный класс для фона кнопки с поддержкой перерисовки
 * Не хранит размеры - только умеет менять цвет с анимацией
 */
export class ButtonBackground extends Graphics {
  private currentColor: number;

  constructor(width: number, height: number, initialColor: number) {
    super();
    this.currentColor = initialColor;

    // Рисуем начальную фигуру
    this.drawBackground(width, height);
  }

  /**
   * Отрисовка фона кнопки (капсула) от центра
   */
  private drawBackground(width: number, height: number): void {
    this.clear();
    const radius = height / 2;

    // Рисуем скругленный прямоугольник (капсулу) от центра
    this.fill(this.currentColor);
    this.roundRect(-width/2, -height/2, width, height, radius);
  }

  /**
   * Обновляет цвет фона с перерисовкой
   * @param newColor Новый цвет в формате числа (0xFFFFFF)
   * @param width Ширина для перерисовки
   * @param height Высота для перерисовки
   */
  updateColor(newColor: number, width: number, height: number): void {
    if (this.currentColor === newColor) return;

    this.currentColor = newColor;
    this.drawBackground(width, height);
  }

  /**
   * Плавное изменение цвета с анимацией
   * @param targetColor Целевой цвет
   * @param width Ширина для перерисовки
   * @param height Высота для перерисовки
   * @param duration Длительность анимации в мс
   */
  animateColor(
    targetColor: number,
    width: number,
    height: number,
    duration: number = 300
  ): Promise<void> {
    return new Promise((resolve) => {
      if (this.currentColor === targetColor) {
        resolve();
        return;
      }

      const startColor = this.currentColor;
      const startTime = Date.now();

      // Разбираем цвета на компоненты
      const startR = (startColor >> 16) & 255;
      const startG = (startColor >> 8) & 255;
      const startB = startColor & 255;

      const targetR = (targetColor >> 16) & 255;
      const targetG = (targetColor >> 8) & 255;
      const targetB = targetColor & 255;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Линейная интерполяция
        const r = Math.round(startR + (targetR - startR) * progress);
        const g = Math.round(startG + (targetG - startG) * progress);
        const b = Math.round(startB + (targetB - startB) * progress);

        const interpolatedColor = (r << 16) + (g << 8) + b;

        // Обновляем цвет с перерисовкой
        this.updateColor(interpolatedColor, width, height);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Получить текущий цвет
   */
  getCurrentColor(): number {
    return this.currentColor;
  }
}