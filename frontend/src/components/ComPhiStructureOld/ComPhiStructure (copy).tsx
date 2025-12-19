import React, { useState, useCallback, useEffect } from 'react';
import { useZoomPan } from './hooks/useZoomPan';
import { BasePhiNode } from './subcomponents/PhiNode/BasePhiNode';
import { PhiNodeModal } from './subcomponents/PhiNode/PhiNodeModal';
import { useNodeDrag } from './hooks/useNodeDrag';
import { PhiNodeData } from './subcomponents/PhiNode/types/nodeTypes';
import './ComPhiStructure.css';

// Mock данные для тестирования (позже заменим на API)
const mockNodes: PhiNodeData[] = [
  {
    id: 'node-1',
    node_key: 'math_operation',
    name: 'Math Operation',
    version: '1.0.0',
    icon: '🔢',
    color: '#3B82F6',
    position: { x: 100, y: 100 },
    ports: [
      {
        id: 'input-1',
        name: 'input_a',
        type: 'number',
        direction: 'input',
        color: '#3B82F6',
        icon: '🔢',
        compatibleWith: ['number'],
        control: {
          type: 'input',
          props: { type: 'number', placeholder: 'Enter value' },
          value: 0
        }
      },
      {
        id: 'input-2',
        name: 'input_b',
        type: 'number',
        direction: 'input',
        color: '#3B82F6',
        icon: '🔢',
        compatibleWith: ['number'],
        control: {
          type: 'input',
          props: { type: 'number', placeholder: 'Enter value' },
          value: 0
        }
      },
      {
        id: 'output-1',
        name: 'result',
        type: 'number',
        direction: 'output',
        color: '#3B82F6',
        icon: '🔢',
        compatibleWith: ['number']
      }
    ],
    controls: [],
    data: {},
    status: 'online',
    width: 200,
    height: 150
  },
  {
    id: 'node-2',
    node_key: 'string_concat',
    name: 'String Concatenation',
    version: '1.0.0',
    icon: '📝',
    color: '#10B981',
    position: { x: 400, y: 200 },
    ports: [
      {
        id: 'input-1',
        name: 'string_a',
        type: 'string',
        direction: 'input',
        color: '#10B981',
        icon: '📝',
        compatibleWith: ['string'],
        control: {
          type: 'input',
          props: { type: 'text', placeholder: 'Enter text' },
          value: ''
        }
      },
      {
        id: 'input-2',
        name: 'string_b',
        type: 'string',
        direction: 'input',
        color: '#10B981',
        icon: '📝',
        compatibleWith: ['string'],
        control: {
          type: 'input',
          props: { type: 'text', placeholder: 'Enter text' },
          value: ''
        }
      },
      {
        id: 'output-1',
        name: 'result',
        type: 'string',
        direction: 'output',
        color: '#10B981',
        icon: '📝',
        compatibleWith: ['string']
      }
    ],
    controls: [],
    data: {},
    status: 'offline',
    width: 250,
    height: 180
  }
];

export const ComPhiStructure: React.FC = () => {
  const [nodes, setNodes] = useState<PhiNodeData[]>(mockNodes);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const {
    scale,
    position,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    handleMouseDown
  } = useZoomPan();

  const {
    draggingNodeId,
    handleNodeMouseDown
  } = useNodeDrag({
    nodes,
    onNodesUpdate: setNodes,
    scale,
    canvasPosition: position
  });

  // Обработчик обновления нода
  const handleNodeUpdate = useCallback((updatedNode: PhiNodeData) => {
    setNodes(prev => prev.map(node =>
      node.id === updatedNode.id ? updatedNode : node
    ));
  }, []);

  // Обработчик сохранения из модального окна
  const handleSaveNode = useCallback((nodeData: PhiNodeData) => {
    handleNodeUpdate(nodeData);
    setEditingNodeId(null);
  }, [handleNodeUpdate]);

  // Загрузка данных с бэкенда (заглушка)
  useEffect(() => {
    // TODO: Заменить на реальный API вызов
    const loadNodes = async () => {
      try {
        // const response = await axios.get('/api/phi-nodes');
        // setNodes(response.data);
      } catch (error) {
        console.error('Error loading nodes:', error);
      }
    };

    loadNodes();
  }, []);

  const editingNode = editingNodeId ? nodes.find(n => n.id === editingNodeId) : null;

  return (
    <div className="phi-editor">
      {/* Canvas area с zoom/pan */}
      <div
          className="phi-canvas"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0'
          }}
      >
        {nodes.map(node => (
            <BasePhiNode
                key={node.id}
                nodeData={node}
                isEditing={false}
                scale={scale}
                onNodeUpdate={handleNodeUpdate}
                onOpenModal={setEditingNodeId}
                onNodeMouseDown={handleNodeMouseDown}
                isDragging={node.id === draggingNodeId}
            />
        ))}
      </div>

      {/* Модальное окно редактирования */}
      {editingNode && (
          <PhiNodeModal
              node={editingNode}
              onSave={handleSaveNode}
              onClose={() => setEditingNodeId(null)}
          />
      )}

      {/* Controls для управления zoom */}
      <div className="phi-controls">
        <button onClick={zoomIn} title="Zoom In">+</button>
        <button onClick={zoomOut} title="Zoom Out">-</button>
        <button onClick={resetZoom} title="Reset Zoom">⌂</button>
        <span className="zoom-display">Zoom: {(scale * 100).toFixed(0)}%</span>
      </div>

      {/* Дополнительная информация о состоянии */}
      <div className="phi-status">
        <span>Nodes: {nodes.length}</span>
        <span>Position: {position.x.toFixed(0)}, {position.y.toFixed(0)}</span>
      </div>
    </div>
  );
};

export default ComPhiStructure;