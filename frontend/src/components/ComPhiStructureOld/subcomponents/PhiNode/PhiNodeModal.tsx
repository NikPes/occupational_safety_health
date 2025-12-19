import React, { useState, useEffect } from 'react';
import { PhiNodeData, PhiPortEdit, PhiControlEdit } from './types/nodeTypes';
import './PhiNodeModal.css';

interface PhiNodeModalProps {
  node: PhiNodeData;
  onSave: (nodeData: PhiNodeData) => void;
  onClose: () => void;
}

export const PhiNodeModal: React.FC<PhiNodeModalProps> = ({
  node,
  onSave,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [editedNode, setEditedNode] = useState<PhiNodeData>({ ...node });

  // Инициализируем editedNode при изменении node
  useEffect(() => {
    setEditedNode({ ...node });
  }, [node]);

  const handleSave = () => {
    onSave(editedNode);
    onClose();
  };

  const handlePortChange = (portId: string, field: string, value: any) => {
    setEditedNode(prev => ({
      ...prev,
      ports: prev.ports.map(port =>
        port.id === portId ? { ...port, [field]: value } : port
      )
    }));
  };

  const addNewPort = (direction: 'input' | 'output') => {
    const newPort: PhiPortEdit = {
      id: `port-${Date.now()}`,
      name: `new_${direction}`,
      type: 'any',
      socketType: 'any',
      color: '#6B7280',
      icon: '🔵',
      controlType: undefined,
      controlProps: {},
      description: '',
      compatibleWith: ['any']
    };

    setEditedNode(prev => ({
      ...prev,
      ports: [...prev.ports, newPort as any]
    }));
  };

  const removePort = (portId: string) => {
    setEditedNode(prev => ({
      ...prev,
      ports: prev.ports.filter(port => port.id !== portId)
    }));
  };

  const renderBasicTab = () => (
    <div className="modal-tab-content">
      <div className="form-group">
        <label>Название нода</label>
        <input
          type="text"
          value={editedNode.name}
          onChange={(e) => setEditedNode(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div className="form-group">
        <label>Версия</label>
        <input
          type="text"
          value={editedNode.version}
          onChange={(e) => setEditedNode(prev => ({ ...prev, version: e.target.value }))}
        />
      </div>

      <div className="form-group">
        <label>Иконка</label>
        <input
          type="text"
          value={editedNode.icon}
          onChange={(e) => setEditedNode(prev => ({ ...prev, icon: e.target.value }))}
        />
      </div>

      <div className="form-group">
        <label>Цвет</label>
        <input
          type="color"
          value={editedNode.color}
          onChange={(e) => setEditedNode(prev => ({ ...prev, color: e.target.value }))}
        />
      </div>

      <div className="form-group">
        <label>Описание</label>
        <textarea
          rows={3}
          value={editedNode.data.description || ''}
          onChange={(e) => setEditedNode(prev => ({
            ...prev,
            data: { ...prev.data, description: e.target.value }
          }))}
        />
      </div>
    </div>
  );

  const renderPortsTab = () => (
    <div className="modal-tab-content">
      <div className="ports-section">
        <h3>Входные порты</h3>
        <button
          className="add-port-btn"
          onClick={() => addNewPort('input')}
        >
          + Добавить входной порт
        </button>

        {editedNode.ports
          .filter(port => port.direction === 'input')
          .map(port => (
            <div key={port.id} className="port-editor">
              <div className="port-header">
                <h4>Порт: {port.name}</h4>
                <button
                  className="remove-btn"
                  onClick={() => removePort(port.id)}
                >
                  ❌
                </button>
              </div>

              <div className="port-fields">
                <div className="form-group">
                  <label>Название</label>
                  <input
                    type="text"
                    value={port.name}
                    onChange={(e) => handlePortChange(port.id, 'name', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Тип данных</label>
                  <select
                    value={port.type}
                    onChange={(e) => handlePortChange(port.id, 'type', e.target.value)}
                  >
                    <option value="number">Number</option>
                    <option value="string">String</option>
                    <option value="boolean">Boolean</option>
                    <option value="array">Array</option>
                    <option value="object">Object</option>
                    <option value="any">Any</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Элемент управления</label>
                  <select
                    value={port.control?.type || 'none'}
                    onChange={(e) => handlePortChange(port.id, 'control',
                      e.target.value === 'none' ? undefined : { type: e.target.value, props: {}, value: '' }
                    )}
                  >
                    <option value="none">Нет</option>
                    <option value="input">Текстовое поле</option>
                    <option value="checkbox">Чекбокс</option>
                    <option value="select">Выпадающий список</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="ports-section">
        <h3>Выходные порты</h3>
        <button
          className="add-port-btn"
          onClick={() => addNewPort('output')}
        >
          + Добавить выходной порт
        </button>

        {editedNode.ports
          .filter(port => port.direction === 'output')
          .map(port => (
            <div key={port.id} className="port-editor">
              <div className="port-header">
                <h4>Порт: {port.name}</h4>
                <button
                  className="remove-btn"
                  onClick={() => removePort(port.id)}
                >
                  ❌
                </button>
              </div>

              <div className="port-fields">
                <div className="form-group">
                  <label>Название</label>
                  <input
                    type="text"
                    value={port.name}
                    onChange={(e) => handlePortChange(port.id, 'name', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Тип данных</label>
                  <select
                    value={port.type}
                    onChange={(e) => handlePortChange(port.id, 'type', e.target.value)}
                  >
                    <option value="number">Number</option>
                    <option value="string">String</option>
                    <option value="boolean">Boolean</option>
                    <option value="array">Array</option>
                    <option value="object">Object</option>
                    <option value="any">Any</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderControlsTab = () => (
    <div className="modal-tab-content">
      <div className="form-group">
        <label>Код выполнения</label>
        <textarea
          rows={8}
          value={editedNode.data.executor || ''}
          onChange={(e) => setEditedNode(prev => ({
            ...prev,
            data: { ...prev.data, executor: e.target.value }
          }))}
          placeholder="function execute(inputs) { return { result: inputs.input_a + inputs.input_b }; }"
        />
      </div>

      <div className="form-group">
        <label>Код инициализации</label>
        <textarea
          rows={4}
          value={editedNode.data.initCode || ''}
          onChange={(e) => setEditedNode(prev => ({
            ...prev,
            data: { ...prev.data, initCode: e.target.value }
          }))}
          placeholder="function init() { console.log('Node initialized'); }"
        />
      </div>
    </div>
  );

  return (
    <div className="phi-modal-overlay" onClick={onClose}>
      <div className="phi-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактирование нода: {node.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={activeTab === 'basic' ? 'active' : ''}
            onClick={() => setActiveTab('basic')}
          >
            Основные
          </button>
          <button
            className={activeTab === 'ports' ? 'active' : ''}
            onClick={() => setActiveTab('ports')}
          >
            Порты
          </button>
          <button
            className={activeTab === 'controls' ? 'active' : ''}
            onClick={() => setActiveTab('controls')}
          >
            Управление
          </button>
          <button
            className={activeTab === 'appearance' ? 'active' : ''}
            onClick={() => setActiveTab('appearance')}
          >
            Внешний вид
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'basic' && renderBasicTab()}
          {activeTab === 'ports' && renderPortsTab()}
          {activeTab === 'controls' && renderControlsTab()}
          {activeTab === 'appearance' && (
            <div className="modal-tab-content">
              <p>Настройки внешнего вида будут здесь</p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Отмена
          </button>
          <button className="save-btn" onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};