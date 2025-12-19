// PhiCanvas/PhiCanvas.tsx
import React, { useState, useEffect } from 'react';
import { useContainerResize } from './utils/useContainerResize';
import { usePixiInitialization } from './utils/usePixiInitialization';
import { getCanvasMode } from './utils/getCanvasMode';
import { renderNoAccess } from './utils/renderNoAccess';
import { renderDebugInfo } from './utils/renderDebugInfo';
import { CanvasMode } from './types/types';
import './PhiCanvas.css';
import { UserSettings } from '../core/types/settings';

interface PhiCanvasProps {
  userStatus: 'root' | 'admin' | 'user';
  userSettings: UserSettings;
  token: string;
  className?: string;
}

/**
 * PhiCanvas - главный компонент управления графическим редактором
 *
 * Основные задачи:
 * 1. Определение режима работы по статусу пользователя
 * 2. Инициализация и управление PixiJS приложением
 * 3. Обработка ресайза с сохранением пропорций 16:9
 * 4. Отображение интерфейса выбора режима (для root)
 *
 * Архитектура:
 * - root: choice → node-editor или scheme-editor
 * - admin: сразу scheme-editor
 * - user: сообщение "Нет доступа"
 */
const PhiCanvas: React.FC<PhiCanvasProps> = ({
  userStatus,
  userSettings,
  token,
  className
}) => {
  // 1. Управление ресайзом контейнера
  const { containerRef, size } = useContainerResize();

  // 2. Определение и управление режимом
  const { initialMode } = getCanvasMode(userStatus);
  const [currentMode, setCurrentMode] = useState<CanvasMode>(initialMode);

  // 3. Инициализация PixiJS
  const { resize, isInitializing, initError } = usePixiInitialization({
    containerRef,
    userSettings,
    userStatus,
    token,
    currentMode,
    setCurrentMode
  });

  // 4. Обновление размеров PixiJS при изменении size
  useEffect(() => {
    if (size.width && size.height) {
      resize(size.width, size.height);
    }
  }, [size, resize]);

  // 5. Если у пользователя нет доступа
  if (userStatus === 'user') {
    return renderNoAccess(className);
  }

  // 6. Отображение состояния загрузки - НЕ МЕНЯЕМ КОНТЕЙНЕР!
  if (isInitializing || initError) {
    return (
      <div className={`phi-canvas-container ${className || ''}`}>
        {/* ОДИН И ТОТ ЖЕ КОНТЕЙНЕР! */}
        <div
          ref={containerRef}
          className="phi-canvas-wrapper"
          style={{
            position: 'relative',
            display: 'block',
            width: size.width || 800,
            height: size.height || 450
          }}
        />

        {/* Overlay поверх canvas */}
        <div className="phi-canvas-overlay">
          {isInitializing ? (
            <div className="phi-canvas-loading">
              Инициализация графического редактора...
            </div>
          ) : (
            <div className="phi-canvas-error">
              <h3>Ошибка инициализации</h3>
              <p>{initError?.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="phi-canvas-retry"
              >
                Перезагрузить
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 7. Основной рендер
  return (
    <div className={`phi-canvas-container ${className || ''}`}>
      {/* Контейнер для PixiJS canvas - ТОТ ЖЕ САМЫЙ! */}
      <div
        ref={containerRef}
        className="phi-canvas-wrapper"
        style={{
          position: 'relative',
          display: 'block'
        }}
      />
    </div>
  );
};

export { PhiCanvas };
export type { PhiCanvasProps };