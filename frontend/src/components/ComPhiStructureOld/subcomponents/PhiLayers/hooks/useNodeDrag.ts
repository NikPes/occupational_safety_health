import { useCallback, useRef } from 'react';

export interface DragState {
    isDragging: boolean;
    nodeId: string | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

export const useNodeDrag = () => {
    const dragState = useRef<DragState>({
        isDragging: false,
        nodeId: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
    });

    const startDrag = useCallback((nodeId: string, startX: number, startY: number) => {
        dragState.current = {
            isDragging: true,
            nodeId,
            startX,
            startY,
            currentX: startX,
            currentY: startY
        };
    }, []);

    const updateDrag = useCallback((currentX: number, currentY: number) => {
        if (dragState.current.isDragging) {
            dragState.current.currentX = currentX;
            dragState.current.currentY = currentY;
        }
    }, []);

    const stopDrag = useCallback(() => {
        dragState.current.isDragging = false;
        dragState.current.nodeId = null;
    }, []);

    const getDragState = useCallback(() => dragState.current, []);

    return { startDrag, updateDrag, stopDrag, getDragState };
};