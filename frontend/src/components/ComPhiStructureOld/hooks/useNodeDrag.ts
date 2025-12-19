import { useState, useRef, useEffect } from 'react';
import { PhiNodeData } from '../subcomponents/PhiNode/types/nodeTypes';
import { screenToWorldCoordinates, worldToScreenCoordinates } from '../utils/coordinateUtils';
console.log('🔴 useNodeDrag: FILE LOADED');
interface UseNodeDragProps {
  nodes: PhiNodeData[];
  onNodesUpdate: (nodes: PhiNodeData[]) => void;
  scale: number;
  canvasPosition: { x: number; y: number };
  canvas: HTMLCanvasElement | null;
}

interface UseNodeDragReturn {
  draggingNodeId: string | null;
  handleNodeMouseDown: (nodeId: string, event: React.MouseEvent) => void;
}

export const useNodeDrag = ({
  nodes,
  onNodesUpdate,
  scale,
  canvasPosition,
  canvas
}: UseNodeDragProps): UseNodeDragReturn => {
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const transformRef = useRef({ scale, position: canvasPosition });
  const nodesRef = useRef(nodes);
  const onNodesUpdateRef = useRef(onNodesUpdate);

  // Обновляем ref'ы при изменении пропсов
  useEffect(() => {
    transformRef.current = { scale, position: canvasPosition };
    nodesRef.current = nodes;
    onNodesUpdateRef.current = onNodesUpdate;

    console.log('🔄 useNodeDrag: refs updated', {
      scale,
      canvasPosition,
      nodesCount: nodes.length
    });
  }, [scale, canvasPosition, nodes, onNodesUpdate]);

  // Обработчики событий
  useEffect(() => {
    if (!draggingNodeId) return;

    console.log('🎯 useNodeDrag: START DRAG SESSION', draggingNodeId);

    const handleMouseMove = (event: MouseEvent) => {
      if (!canvas) {
        console.error('❌ useNodeDrag: canvas is null during drag');
        return;
      }

      console.log('🖱️ useNodeDrag: MOUSE MOVE', {
        clientX: event.clientX,
        clientY: event.clientY,
        dragOffset: dragOffset.current,
        transform: transformRef.current
      });

      // Вычисляем желаемую позицию нода в ЭКРАННЫХ координатах
      const desiredScreenX = event.clientX - dragOffset.current.x;
      const desiredScreenY = event.clientY - dragOffset.current.y;

      console.log('🎯 useNodeDrag: desired screen position', {
        desiredScreenX,
        desiredScreenY
      });

      // Конвертируем экранные координаты в мировые
      const newWorldPos = screenToWorldCoordinates(
        desiredScreenX,
        desiredScreenY,
        canvas,
        transformRef.current.position,
        transformRef.current.scale
      );

      console.log('🌍 useNodeDrag: new world position', newWorldPos);

      // Обновляем позицию нода
      onNodesUpdateRef.current(
        nodesRef.current.map(node =>
          node.id === draggingNodeId
            ? { ...node, position: { x: newWorldPos.x, y: newWorldPos.y } }
            : node
        )
      );

      console.log('✅ useNodeDrag: node position updated');
    };

    const handleMouseUp = () => {
      console.log('🛑 useNodeDrag: DRAG END', { draggingNodeId });
      setDraggingNodeId(null);
      document.body.style.cursor = '';
    };

    // Вешаем обработчики
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Убираем обработчики при размонтировании
    return () => {
      console.log('🧹 useNodeDrag: cleaning up event listeners');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNodeId, canvas]);

  const handleNodeMouseDown = (nodeId: string, event: React.MouseEvent) => {
    if (!canvas) {
      console.error('❌ useNodeDrag: canvas is null on mouse down');
      return;
    }

    const target = event.target as HTMLElement;
    if (!target.closest('.node-header') && !target.closest('.drag-handle')) {
      console.log('🔸 useNodeDrag: not a drag target', target.className);
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) {
      console.error('❌ useNodeDrag: node not found', nodeId);
      return;
    }

    console.log('🖱️ useNodeDrag: MOUSE DOWN', {
      nodeId,
      nodePosition: node.position,
      clientX: event.clientX,
      clientY: event.clientY,
      transform: transformRef.current
    });

    // Конвертируем позицию нода в экранные координаты для отладки
    const nodeScreenPos = worldToScreenCoordinates(
      node.position.x,
      node.position.y,
      canvas,
      transformRef.current.position,
      transformRef.current.scale
    );

    console.log('📊 useNodeDrag: node screen position', nodeScreenPos);

    // Вычисляем смещение между курсором и нодом в ЭКРАННЫХ координатах
    dragOffset.current = {
      x: event.clientX - nodeScreenPos.x,
      y: event.clientY - nodeScreenPos.y
    };

    console.log('📏 useNodeDrag: drag offset', dragOffset.current);

    setDraggingNodeId(nodeId);
    document.body.style.cursor = 'grabbing';

    console.log('✅ useNodeDrag: drag started successfully');
  };

  return {
    draggingNodeId,
    handleNodeMouseDown
  };
};