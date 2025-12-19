// PhiCanvas/utils/renderNoAccess.tsx
import React from 'react';

/**
 * Рендерит компонент "Нет доступа"
 */
export const renderNoAccess = (className?: string) => (
  <div className={`phi-canvas-container no-access ${className || ''}`}>
    <div className="phi-canvas-message">
      <h3>Нет доступа к редактору</h3>
      <p>Обратитесь к администратору для получения прав</p>
    </div>
  </div>
);