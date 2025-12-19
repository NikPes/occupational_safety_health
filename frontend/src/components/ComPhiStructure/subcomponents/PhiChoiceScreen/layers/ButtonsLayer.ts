// src/subcomponents/PhiChoiceScreen/layers/ButtonsLayer.ts
import { Container } from 'pixi.js';
import { CoordinateService } from '../../../core/services/CoordinateService';
import { Viewport } from '../../../core/types/coordinates';
import { ButtonFactory } from './services/ButtonFactory';
import ButNodeSvg from '../assets/ButNode.svg';
import ButSchemasSvg from '../assets/ButSchemas.svg';
import { ButtonStyleManager } from './services/ButtonStyleManager';
import { ButtonAnimator } from './services/ButtonAnimator';

export class ButtonsLayer {
  public container: Container;
  private buttons: Container[] = [];
  private readonly theme: 'dark' | 'light';

  constructor(
      parentContainer: Container,
      coordinateService: CoordinateService,
      theme: 'dark' | 'light'
  ) {
    console.log('Создаю TButtonsLayer...');

    this.theme = theme; // ⬅️ Сохраняем
    this.container = new Container();
    parentContainer.addChild(this.container);

    ButtonStyleManager.updateSvgPaths(ButNodeSvg, ButSchemasSvg);

    // Асинхронно создаем кнопки и добавляем обработчики
    this.createButtons(coordinateService).then(() => {
      this.setupButtonEventListeners();
    });
  }

  private async createButtons(coordinateService: CoordinateService): Promise<void> {
    try {
      const buttonTypes = ButtonStyleManager.getAllButtonTypes();

      for (const buttonType of buttonTypes) {
      const config = ButtonStyleManager.getButtonConfig(buttonType);
      const buttonTheme = ButtonStyleManager.getTheme(this.theme);

      const button = await ButtonFactory.createButton(
          config,
          buttonTheme,
          this.theme
      );

      this.buttons.push(button);
      this.container.addChild(button);
    }

      this.updateButtonPositions(coordinateService);
      console.log('Кнопки созданы');

    } catch (error) {
      console.error('Ошибка создания кнопок:', error);
      this.createFallbackButtons(coordinateService);
    }
  }

  private setupButtonEventListeners(): void {
    if (this.buttons.length < 2) return;

    const nodeButton = this.buttons[0];
    const schemeButton = this.buttons[1];

    // Для nodeButton
    let nodeMouseDown = false;

    nodeButton.on('pointerover', () => {
      console.log('Hover на кнопку node');
      ButtonAnimator.animateHover(nodeButton, true, this.theme);
    });

    nodeButton.on('pointerout', () => {
      ButtonAnimator.animateHover(nodeButton, false, this.theme);
    });

    nodeButton.on('pointerdown', () => {
      console.log('Нажата кнопка: Редактор нодов');
      nodeMouseDown = true;
      ButtonAnimator.animateClick(nodeButton, true, this.theme); // Нажатие
    });

    nodeButton.on('pointerup', () => {
      nodeMouseDown = false;
      ButtonAnimator.animateClick(nodeButton, false, this.theme); // Отпускание
    });

    nodeButton.on('pointerupoutside', () => {
      nodeMouseDown = false;
      ButtonAnimator.animateClick(nodeButton, false, this.theme); // Отпустили вне кнопки
    });

    // Для schemeButton
    let schemeMouseDown = false;

    schemeButton.on('pointerover', () => {
      ButtonAnimator.animateHover(schemeButton, true, this.theme);
    });

    schemeButton.on('pointerout', () => {
      ButtonAnimator.animateHover(schemeButton, false, this.theme);
    });

    schemeButton.on('pointerdown', () => {
      console.log('Нажата кнопка: Редактор схем');
      schemeMouseDown = true;
      ButtonAnimator.animateClick(schemeButton, true, this.theme);
    });

    schemeButton.on('pointerup', () => {
      schemeMouseDown = false;
      ButtonAnimator.animateClick(schemeButton, false, this.theme);
    });

    schemeButton.on('pointerupoutside', () => {
      schemeMouseDown = false;
      ButtonAnimator.animateClick(schemeButton, false, this.theme);
    });
  }

  private createFallbackButtons(coordinateService: CoordinateService): void {
    console.log('Создаю fallback кнопки без SVG...');

    // Получаем конфиги
    const nodeConfig = ButtonStyleManager.getButtonConfig('node');
    const schemeConfig = ButtonStyleManager.getButtonConfig('scheme');

    const nodeButton = ButtonFactory.createButtonSync({
      label: 'Редактор нодов',
      type: 'node',
      width: nodeConfig.width,
      height: nodeConfig.height
    });

    const schemeButton = ButtonFactory.createButtonSync({
      label: 'Редактор схем',
      type: 'scheme',
      width: schemeConfig.width,
      height: schemeConfig.height
    });

    this.buttons.push(nodeButton, schemeButton);
    this.container.addChild(nodeButton, schemeButton);
    this.updateButtonPositions(coordinateService);

    nodeButton.on('pointerdown', () => console.log('Нажата (fallback): Редактор нодов'));
    schemeButton.on('pointerdown', () => console.log('Нажата (fallback): Редактор схем'));
  }

  private updateButtonPositions(coordinateService: CoordinateService): void {
    if (this.buttons.length < 2) return;

    // Мировые координаты как в оригинале
    const positions = [
      { x: 400, y: 150 },  // Левая кнопка (node)
      { x: 500, y: 350 }  // Правая кнопка (scheme)
    ];

    const viewportScale = coordinateService.getScale();

    this.buttons.forEach((button, index) => {
        const worldPos = positions[index];
        const screenPos = coordinateService.worldToScreen(worldPos.x, worldPos.y);

        // 1. Сначала обновляем baseScale
        (button as any).baseScale = viewportScale;

        // 2. Вычисляем итоговый масштаб с учетом текущих состояний
        const isHovering = (button as any).isHovering || false;
        const clickMultiplier = (button as any).clickMultiplier || 1.0;
        const hoverMultiplier = isHovering ? 1.05 : 1.0;
        const totalScale = viewportScale * hoverMultiplier * clickMultiplier;

        // 3. Устанавливаем позицию и масштаб
        button.position.set(screenPos.x, screenPos.y);
        button.scale.set(totalScale, totalScale);
    });
  }

  onViewportChange(viewport: Viewport, coordinateService: CoordinateService): void {
    console.log('TButtonsLayer: viewport изменен');
    this.updateButtonPositions(coordinateService); // Все обновления здесь
  }

  public show(): void {
    this.container.visible = true;
  }

  public hide(): void {
    this.container.visible = false;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}