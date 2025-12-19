import { useEffect, useRef, useState, useCallback } from 'react';
import { PixiApplication } from '../services/PixiApplication';
import { eventBusManager } from '../../core/services/EventBusManager';
import { CoordinateService } from '../../core/services/CoordinateService';
import { CanvasMode } from '../types/types';

interface UsePixiInitializationProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  userSettings: any;
  userStatus: string;
  token: string;
  currentMode: CanvasMode;
  setCurrentMode: (mode: CanvasMode) => void;
}

export const usePixiInitialization = ({
  containerRef,
  userSettings,
  userStatus,
  token,
  currentMode,
  setCurrentMode
}: UsePixiInitializationProps) => {
  const pixiAppRef = useRef<PixiApplication | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const initializationStartedRef = useRef(false);

  // Используем eventBusManager (маленькая буква)
  const canvasBus = eventBusManager.getCanvasBus();
  const coordinateService = CoordinateService.getInstance();

  // 1. Инициализация PixiJS (только один раз!)
  useEffect(() => {
    if (!containerRef.current ||
        pixiAppRef.current ||
        isInitializing ||
        initializationStartedRef.current) {
      return;
    }

    initializationStartedRef.current = true;
    console.log('🚀 Начало инициализации PixiJS с системой координат');

    const initPixi = async () => {
      setIsInitializing(true);
      setInitError(null);

      try {
        const container = containerRef.current!;
        const initialWidth = container.clientWidth;
        const initialHeight = container.clientHeight;

        console.log(`📐 Исходные размеры контейнера: ${initialWidth}x${initialHeight}`);

        coordinateService.updateCanvasSize(initialWidth, initialHeight);
        const viewport = coordinateService.getViewport();
        console.log('📍 Начальный viewport:', viewport);

        const pixiApp = new PixiApplication(
          container,
          userSettings,
          userStatus,
          token,
          coordinateService
        );

        pixiAppRef.current = pixiApp;

        console.log('⚙️ Инициализация PixiApplication...');
        await pixiApp.initialize();

        const canvas = container.querySelector('canvas');
        if (!canvas) {
          throw new Error('Canvas не был создан PixiJS');
        }

        console.log('✅ PixiJS приложение инициализировано');
        console.log(`📐 Canvas размеры: ${canvas.width}x${canvas.height}`);

        canvas.style.border = '1px solid #333';
        canvas.style.boxShadow = 'none';

        if (currentMode !== 'none') {
          console.log(`🎮 Установка начального режима: ${currentMode}`);
          pixiApp.setMode(currentMode);
        }

      } catch (error) {
        console.error('❌ Ошибка инициализации PixiJS:', error);
        setInitError(error as Error);
        initializationStartedRef.current = false;
      } finally {
        setIsInitializing(false);
      }
    };

    initPixi();

    return () => {
      console.log('🧹 Cleanup PixiApplication');
      if (pixiAppRef.current) {
        try {
          pixiAppRef.current.destroy();
        } catch (error) {
          console.error('Ошибка при уничтожении PixiApplication:', error);
        }
        pixiAppRef.current = null;
      }
    };
  }, []);

  // 2. Подписка на события выбора режима (только для root)
  useEffect(() => {
    if (userStatus !== 'root') return;

    const unsubscribe = canvasBus.on(
      'canvas:mode-selected',
      (data: { mode: CanvasMode }) => {
        if (data.mode === 'node' || data.mode === 'scheme') {
          setCurrentMode(data.mode);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userStatus, setCurrentMode, canvasBus]);

  // 3. Подписка на события ресайза canvas
  useEffect(() => {
    // Используем eventBusManager (маленькая буква)
    const coreBus = eventBusManager.getCoreBus();

    const unsubscribe = coreBus.on(
      'canvas-resized',
      (data: { width: number; height: number }) => {
        console.log(`📏 Canvas ресайз: ${data.width}x${data.height}`);

        coordinateService.updateCanvasSize(data.width, data.height);

        if (pixiAppRef.current) {
          pixiAppRef.current.resize(data.width, data.height);
        }

        canvasBus.emit('viewport-changed', coordinateService.getViewport());
      }
    );

    return () => {
      unsubscribe();
    };
  }, [coordinateService]);

  // 4. Обновление режима в PixiJS при изменении currentMode
  useEffect(() => {
    if (!pixiAppRef.current || currentMode === 'none') return;

    console.log(`🔄 Обновление режима на: ${currentMode}`);
    try {
      pixiAppRef.current.setMode(currentMode);
    } catch (error) {
      console.error('Ошибка при установке режима:', error);
    }
  }, [currentMode]);

  // 5. Функция ресайза (теперь не используется напрямую)
  const resize = useCallback((width: number, height: number) => {
    console.log('⚠️ resize() вызывается напрямую - используйте canvas-resized событие');
    if (pixiAppRef.current) {
      pixiAppRef.current.resize(width, height);
    }
  }, []);

  return {
    resize,
    isInitializing,
    initError
  };
};