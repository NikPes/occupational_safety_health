// src/components/ComPhiStructure/subcomponents/PhiNode/BasePhiNode.tsx
import React from 'react';
import { PhiNodeData, PhiPort } from './types/nodeTypes';
import './BasePhiNode.css';

interface BasePhiNodeProps {
  nodeData: PhiNodeData;
  isEditing: boolean;
  scale: number;
  onNodeUpdate: (data: PhiNodeData) => void;
  onOpenModal: (nodeId: string) => void;
  onNodeMouseDown: (nodeId: string, event: React.MouseEvent) => void;
  isDragging?: boolean;
}

export const BasePhiNode: React.FC<BasePhiNodeProps> = ({
  nodeData,
  isEditing,
  scale,
  onNodeUpdate,
  onOpenModal,
  onNodeMouseDown,
  isDragging = false
}) => {
  const inputPorts = nodeData.ports.filter(port => port.direction === 'input');
  const outputPorts = nodeData.ports.filter(port => port.direction === 'output');

  const handleHeaderMouseDown = (event: React.MouseEvent) => {
    onNodeMouseDown(nodeData.id, event);
  };

  const handleControlChange = (portId: string, value: any) => {
    const updatedPorts = nodeData.ports.map(port =>
      port.id === portId && port.control
        ? { ...port, control: { ...port.control, value } }
        : port
    );

    onNodeUpdate({ ...nodeData, ports: updatedPorts });
  };

  const renderControl = (port: PhiPort) => {
    if (!port.control) return null;

    switch (port.control.type) {
      case 'input':
        return (
          <input
            type="text"
            value={port.control.value || ''}
            onChange={(e) => handleControlChange(port.id, e.target.value)}
            {...port.control.props}
          />
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={port.control.value || false}
            onChange={(e) => handleControlChange(port.id, e.target.checked)}
            {...port.control.props}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`base-phi-node ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: `translate(${nodeData.position.x}px, ${nodeData.position.y}px)`,
        width: nodeData.width,
        minHeight: nodeData.height
      }}
    >
      {/* Header с drag handle */}
      <div
        className="node-header"
        onMouseDown={handleHeaderMouseDown}
      >
        <span className="drag-handle">⋮⋮</span>
        <span className="node-icon">{nodeData.icon}</span>
        <span className="node-name">
          {nodeData.name} v{nodeData.version}
        </span>
        <button className="collapse-btn">_</button>
        <button className="expand-btn">□</button>
        <button
          className="settings-btn"
          onClick={() => onOpenModal(nodeData.id)}
        >
          ⚙️
        </button>
      </div>

      {/* Body с портами */}
      <div className="node-body">
        {/* Input порты слева */}
        <div className="ports-column inputs">
          {inputPorts.map(port => (
            <div key={port.id} className="phi-port input-port">
              <div className="port-connection" style={{ color: port.color }}>●</div>
              <div className="port-content">
                <div className="port-name">{port.name}</div>
                <div className="port-type" style={{ color: port.color }}>
                  {port.type}
                </div>
                {port.control && (
                  <div className="port-control">
                    → {renderControl(port)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Output порты справа */}
        <div className="ports-column outputs">
          {outputPorts.map(port => (
            <div key={port.id} className="phi-port output-port">
              <div className="port-content">
                <div className="port-name">{port.name}</div>
                <div className="port-type" style={{ color: port.color }}>
                  {port.type}
                </div>
              </div>
              <div className="port-connection" style={{ color: port.color }}>○</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="node-footer">
        {isEditing ? (
          // Режим редактирования
          <>
            <button className="footer-btn">+</button>
            <button className="footer-btn">-</button>
            <button className="footer-btn">❌</button>
            <button className="footer-btn">ℹ️</button>
            <button className="footer-btn">+</button>
            <button className="footer-btn">-</button>
          </>
        ) : (
          // Режим использования
          <>
            <button className="footer-btn">❌</button>
            <button className="footer-btn">ℹ️</button>
            <span className={`status-indicator ${nodeData.status}`}>
              {nodeData.status === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};