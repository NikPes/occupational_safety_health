import { useCallback, useRef } from 'react';

export const useZoomPan = () => {
    const scale = useRef(1);
    const position = useRef({ x: 0, y: 0 });

    const zoom = useCallback((delta: number, center: { x: number; y: number }) => {
        const zoomFactor = delta > 0 ? 1.1 : 0.9;
        scale.current *= zoomFactor;

        // Логика масштабирования относительно центра
        position.current.x = center.x - (center.x - position.current.x) * zoomFactor;
        position.current.y = center.y - (center.y - position.current.y) * zoomFactor;

        return { scale: scale.current, position: position.current };
    }, []);

    const pan = useCallback((deltaX: number, deltaY: number) => {
        position.current.x += deltaX;
        position.current.y += deltaY;
        return position.current;
    }, []);

    const reset = useCallback(() => {
        scale.current = 1;
        position.current = { x: 0, y: 0 };
        return { scale: scale.current, position: position.current };
    }, []);

    return { zoom, pan, reset, getScale: () => scale.current, getPosition: () => position.current };
};