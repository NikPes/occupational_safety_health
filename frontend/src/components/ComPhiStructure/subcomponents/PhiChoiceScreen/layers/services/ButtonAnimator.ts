// src/subcomponents/PhiChoiceScreen/layers/services/ButtonAnimator.ts
import { Container, Graphics, Ticker } from 'pixi.js';
import { ButtonStyleManager } from './ButtonStyleManager';

export class ButtonAnimator {
  private static readonly ANIMATION_DURATION = 300;
  private static ticker: Ticker | null = null;
  private static animations: Array<{
    container: Container;
    background: Graphics;
    startScale: { x: number; y: number };
    targetScale: { x: number; y: number };
    startColor: number;
    targetColor: number;
    strokeColor: number;
    startTime: number;
  }> = [];

  /**
   * Плавная анимация наведения на кнопку
   */
  static animateHover(
      container: Container,
      isHovering: boolean,
      theme: 'dark' | 'light',
  ): void {
    // Сохраняем состояние hover
    (container as any).isHovering = isHovering;

    const background = container.children.find(
        child => (child as any).isButtonBackground === true
    ) as Graphics | undefined;

    if (!background) return;

    const themeColors = ButtonStyleManager.getTheme(theme);

    // Получаем базовый масштаб (от viewport) или 1.0 по умолчанию
    const baseScale = (container as any).baseScale || 1.0;

    // Целевые множители
    const hoverMultiplier = isHovering ? 1.05 : 1.0;
    const clickMultiplier = (container as any).clickMultiplier || 1.0;

    // Целевой масштаб = базовый × hover × click
    const targetScale = baseScale * hoverMultiplier * clickMultiplier;
    const targetColor = isHovering
        ? ButtonStyleManager.getHoverColor(theme) // 50% между фоном и текстом
        : themeColors.backgroundColor;

    // Удаляем старую анимацию для этой кнопки
    this.animations = this.animations.filter(a => a.container !== container);

    // Добавляем новую анимацию
    this.animations.push({
      container,
      background,
      startScale: { x: container.scale.x, y: container.scale.y },
      targetScale: { x: targetScale, y: targetScale },
      startColor: this.extractCurrentColor(background, container, theme),
      targetColor,
      strokeColor: themeColors.textColor,
      startTime: Date.now(),
    });

    this.startTicker();
  }

  /**
   * Извлекает текущий цвет фона
   */
  private static extractCurrentColor(graphics: Graphics, container: Container, theme: 'dark' | 'light'): number {
    // Сохраняем цвет в graphics при каждой отрисовке
    return (graphics as any).lastFillColor || ButtonStyleManager.getTheme(theme).backgroundColor;
  }

  /**
   * Обновляет фон с указанным цветом
   */
  private static updateBackground(graphics: Graphics, fillColor: number, strokeColor: number, container: Container): void {
    const width = (container as any).buttonWidth || 300;
    const height = (container as any).buttonHeight || 80;
    const radius = (container as any).buttonRadius || height / 2;

    graphics.clear();
    graphics.roundRect(-width/2, -height/2, width, height, radius);
    graphics.fill({ color: fillColor });
    graphics.stroke({ width: 2, color: strokeColor }); // Всегда рисуем границу

    // Сохраняем оба цвета
    (graphics as any).lastFillColor = fillColor;
    (graphics as any).lastStrokeColor = strokeColor;
  }

  /**
   * Интерполяция цвета
   */
  private static interpolateColor(start: number, end: number, progress: number): number {
    const startR = (start >> 16) & 255;
    const startG = (start >> 8) & 255;
    const startB = start & 255;

    const endR = (end >> 16) & 255;
    const endG = (end >> 8) & 255;
    const endB = end & 255;

    const r = Math.round(startR + (endR - startR) * progress);
    const g = Math.round(startG + (endG - startG) * progress);
    const b = Math.round(startB + (endB - startB) * progress);

    return (r << 16) + (g << 8) + b;
  }

  /**
   * Запускает тикер анимаций
   */
  private static startTicker(): void {
    if (this.ticker) return;

    this.ticker = new Ticker();
    this.ticker.add(() => {
      const now = Date.now();
      let needsCleanup = false;

      for (let i = this.animations.length - 1; i >= 0; i--) {
        const anim = this.animations[i];
        const elapsed = now - anim.startTime;
        const progress = Math.min(elapsed / this.ANIMATION_DURATION, 1);

        // Easing функция
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // Интерполяция масштаба
        const currentScaleX = anim.startScale.x + (anim.targetScale.x - anim.startScale.x) * easeProgress;
        const currentScaleY = anim.startScale.y + (anim.targetScale.y - anim.startScale.y) * easeProgress;
        anim.container.scale.set(currentScaleX, currentScaleY);

        // Интерполяция цвета
        const currentColor = this.interpolateColor(anim.startColor, anim.targetColor, easeProgress);
        this.updateBackground(anim.background, currentColor, anim.strokeColor, anim.container);

        // Удаляем завершенные анимации
        if (progress >= 1) {
          this.animations.splice(i, 1);
          needsCleanup = true;
        }
      }

      // Останавливаем тикер если анимаций нет
      if (needsCleanup && this.animations.length === 0 && this.ticker) {
        this.ticker.stop();
        this.ticker = null;
      }
    });

    this.ticker.start();
  }

  /**
   * Анимация нажатия на кнопку
   */
  static animateClick(container: Container, isPressed: boolean, theme: 'dark' | 'light'): void {
    // Сохраняем состояние нажатия
    (container as any).clickMultiplier = isPressed ? 0.95 : 1.0;

    const background = container.children.find(
        child => (child as any).isButtonBackground === true
    ) as Graphics | undefined;

    if (!background) return;

    // Получаем текущий цвет границы ИЗ ФОНА или из темы
    const strokeColor = (background as any).lastStrokeColor ||
        ButtonStyleManager.getTheme(theme).textColor;

    // Получаем базовый масштаб
    const baseScale = (container as any).baseScale || 1.0;
    const isHovering = (container as any).isHovering || false;

    // Вычисляем целевой масштаб
    const hoverMultiplier = isHovering ? 1.05 : 1.0;
    const clickMultiplier = isPressed ? 0.95 : 1.0;
    const targetScale = baseScale * hoverMultiplier * clickMultiplier;

    // Получаем текущий цвет фона с учетом темы
    const currentColor = this.extractCurrentColor(background, container, theme);

    // Удаляем старую анимацию для этой кнопки
    this.animations = this.animations.filter(animation => animation.container !== container);

    // Добавляем новую анимацию с ПРАВИЛЬНЫМ strokeColor
    this.animations.push({
      container: container,
      background: background,
      startScale: { x: container.scale.x, y: container.scale.y },
      targetScale: { x: targetScale, y: targetScale },
      startColor: currentColor,
      targetColor: currentColor, // Цвет не меняем при клике
      strokeColor: strokeColor,  // Важно: передаем цвет границы
      startTime: Date.now(),
    });

    this.startTicker();
  }

  static updateBaseScale(container: Container, viewportScale: number): void {
    (container as any).baseScale = viewportScale;

    // Немедленно обновляем масштаб с учетом текущих множителей
    const isHovering = (container as any).isHovering || false;
    const clickMultiplier = (container as any).clickMultiplier || 1.0;
    const hoverMultiplier = isHovering ? 1.05 : 1.0;

    const targetScale = viewportScale * hoverMultiplier * clickMultiplier;
    container.scale.set(targetScale, targetScale);
  }

  /**
   * Анимация выбора кнопки
   */
  static animateSelect(container: Container, isSelected: boolean): void {
    if (isSelected) {
      container.scale.set(1.1);
    } else {
      container.scale.set(1.0);
    }
  }
}