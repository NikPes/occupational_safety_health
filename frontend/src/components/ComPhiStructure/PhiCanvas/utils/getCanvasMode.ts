// PhiCanvas/utils/getCanvasMode.ts
import { CanvasMode } from '../types/types';

/**
 * Определяет начальный режим и отладочную информацию
 */
export const getCanvasMode = (
  userStatus: string,
  currentMode?: CanvasMode
) => {
  // Определяем начальный режим
  const getInitialMode = (): CanvasMode => {
    switch (userStatus) {
      case 'root': return 'choice';
      case 'admin': return 'scheme';
      case 'user': return 'none';
      default: return 'choice';
    }
  };

  const initialMode = getInitialMode();

  // Формируем отладочную информацию
  const debugInfo = userStatus === 'root'
    ? `Режим: ${currentMode || initialMode}`
    : `Режим: ${userStatus} → ${currentMode || initialMode}`;

  return { initialMode, debugInfo };
};