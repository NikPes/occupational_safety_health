import { useEffect, useRef, useState, useCallback } from 'react';
import { ContainerSize } from '../types/types';
import { eventBusManager } from '../../core/services/EventBusManager';

/**
 * Хук для ОТСЛЕЖИВАНИЯ размеров контейнера с CSS aspect-ratio
 * Не управляет размерами, только измеряет реальные пиксели
 */
export const useContainerResize = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<ContainerSize>({
        width: 0,
        height: 0
    });

    // Callback для обновления размеров и отправки события
    const updateSize = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        // Берем реальные размеры после применения CSS aspect-ratio
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Если размеры изменились
        if (width !== size.width || height !== size.height) {
            setSize({ width, height });

            // Отправляем событие о ресайзе canvas
            const eventBus = eventBusManager.getCoreBus();
            eventBus.emit('canvas-resized', {
                width,
                height
            });
        }
    }, [size.width, size.height]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Наблюдаем за изменениями размеров самого контейнера
        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(container);

        // Первоначальное измерение
        const timerId = setTimeout(updateSize, 100);

        return () => {
            resizeObserver.disconnect();
            clearTimeout(timerId);
        };
    }, [updateSize]);

    return { containerRef, size };
};