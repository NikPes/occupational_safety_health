// src/components/ComPhiStructure/hooks/useZoomPan.ts
import { useState, useCallback, useRef, useEffect } from 'react';

interface UseZoomPanReturn {
  scale: number;
  position: { x: number; y: number };
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  panTo: (x: number, y: number) => void;
  handleWheel: (event: React.WheelEvent) => void;
  handleMouseDown: (event: React.MouseEvent) => void;
  isDragging: boolean;
}

export const useZoomPan = (): UseZoomPanReturn => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const lastMousePos = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Масштабирование колесиком мыши с фокусом на курсоре
  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const delta = -event.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.1, scale * (1 + delta)), 3);

    // Получаем позицию курсора относительно canvas
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Вычисляем мировые координаты курсора до масштабирования
    const worldX = (mouseX - position.x) / scale;
    const worldY = (mouseY - position.y) / scale;

    // Вычисляем новые координаты для сохранения позиции курсора
    const newX = mouseX - worldX * newScale;
    const newY = mouseY - worldY * newScale;

    setScale(newScale);
    setPosition({ x: newX, y: newY });
  }, [scale, position]);

  // Начало перетаскивания (pan)
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return;

    setIsDragging(true);
    lastMousePos.current = { x: event.clientX, y: event.clientY };
    (event.currentTarget as HTMLElement).style.cursor = 'grabbing';

    // Сохраняем ссылку на canvas
    canvasRef.current = event.currentTarget as HTMLDivElement;
  }, []);

  // Обработка перемещения мыши для pan
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = event.clientX - lastMousePos.current.x;
    const deltaY = event.clientY - lastMousePos.current.y;

    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    lastMousePos.current = { x: event.clientX, y: event.clientY };
  }, [isDragging]);

  // Завершение перетаскивания
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
  }, [isDragging]);

  // Глобальные обработчики мыши
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Предотвращаем выделение текста при перетаскивании
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Точечный zoom к центру
  const zoomIn = useCallback(() => {
    const newScale = Math.min(scale + 0.2, 3);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const worldX = (centerX - position.x) / scale;
      const worldY = (centerY - position.y) / scale;

      const newX = centerX - worldX * newScale;
      const newY = centerY - worldY * newScale;

      setScale(newScale);
      setPosition({ x: newX, y: newY });
    } else {
      setScale(newScale);
    }
  }, [scale, position]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(scale - 0.2, 0.1);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const worldX = (centerX - position.x) / scale;
      const worldY = (centerY - position.y) / scale;

      const newX = centerX - worldX * newScale;
      const newY = centerY - worldY * newScale;

      setScale(newScale);
      setPosition({ x: newX, y: newY });
    } else {
      setScale(newScale);
    }
  }, [scale, position]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const panTo = useCallback((x: number, y: number) => {
    setPosition({ x: -x * scale, y: -y * scale });
  }, [scale]);

  // Функция для преобразования экранных координат в мировые
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - position.x) / scale,
      y: (screenY - position.y) / scale
    };
  }, [scale, position]);

  // Функция для преобразования мировых координат в экранные
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    return {
      x: worldX * scale + position.x,
      y: worldY * scale + position.y
    };
  }, [scale, position]);

  return {
    scale,
    position,
    zoomIn,
    zoomOut,
    resetZoom,
    panTo,
    handleWheel,
    handleMouseDown,
    isDragging
  };
};