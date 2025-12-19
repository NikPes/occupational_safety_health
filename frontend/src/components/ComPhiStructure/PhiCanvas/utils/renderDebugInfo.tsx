// PhiCanvas/utils/renderDebugInfo.tsx
import React from 'react';

/**
 * Рендерит отладочную информацию
 */
interface DebugInfoProps {
  userStatus: string;
  currentMode: string;
  width: number;
  height: number;
}

export const renderDebugInfo = ({
  userStatus,
  currentMode,
  width,
  height
}: DebugInfoProps) => (
  <div className="phi-canvas-debug">
    {userStatus === 'root'
      ? `Режим: ${currentMode}`
      : `Режим: ${userStatus} → ${currentMode}`
    } | {width}×{height}
  </div>
);