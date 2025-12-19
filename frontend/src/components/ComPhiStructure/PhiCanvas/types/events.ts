// PhiCanvas/types/events.ts

import { ContainerMode, CanvasMode } from './types';
import { Viewport } from '../../core/types/coordinates';

/**
 * CanvasEvents - события управления канвасом и режимами
 */

export interface CanvasEvents {
  // События управления режимами
  'canvas:mode-selected': { mode: CanvasMode };
  'canvas:mode-changed': { mode: ContainerMode };

  // Жизненный цикл
  'canvas:initialized': { timestamp: number };
  'canvas:destroyed': { timestamp: number };

  // Ошибки
  'canvas:error': { error: Error | string };
  'canvas:mode-error': { mode: string; message: string };

  // Инструменты
  'canvas:tool-changed': { tool: string };

  // Канвас скрыт/показан
  'canvas:state-changed': { state: 'active' | 'hidden' };

  // НОВОЕ: Изменение viewport (масштаб/панорама/ресайз)
  'viewport-changed': Viewport;
}