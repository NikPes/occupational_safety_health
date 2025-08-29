import React, { useState, useEffect } from 'react';
import './NodeEditor.css';

const NodeEditor = ({ node,
                      categories,
                      onSave,
                      onCreate,
                      onNewNode,
                      onDeleteNode,
                      isEditing  }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category_id: '',
    description: '',
    icon: '⚙️',
    color: '#6B7280',
    inputs_schema: [],
    outputs_schema: [],
    execution_logic: '',
    tags: []
  });

  useEffect(() => {
    if (node) {
      // Правильное извлечение данных из нода
      setFormData({
        name: node.name || '',
        type: node.type || '',
        category_id: node.category_id || '',
        description: node.description || '',
        icon: node.data?.icon || node.icon || '⚙️', // Проверяем оба места
        color: node.data?.color || node.color || '#6B7280', // Проверяем оба места
        inputs_schema: node.inputs_schema || node.data?.inputs_schema || [],
        outputs_schema: node.outputs_schema || node.data?.outputs_schema || [],
        execution_logic: node.execution_logic || '',
        tags: node.tags || []
      });
    } else {
      setFormData({
        name: '',
        type: '',
        category_id: '',
        description: '',
        icon: '⚙️',
        color: '#6B7280',
        inputs_schema: [],
        outputs_schema: [],
        execution_logic: '',
        tags: []
      });
    }
  }, [node]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nodeData = {
        name: formData.name,
        type: formData.type,
        category_id: formData.category_id,
        description: formData.description,
        data: {
          icon: formData.icon,
          color: formData.color
        },
        inputs_schema: formData.inputs_schema,
        outputs_schema: formData.outputs_schema,
        execution_logic: formData.execution_logic,
        tags: formData.tags
      };

      if (isEditing && node) {
        await onSave(node.node_id, nodeData);
      } else {
        await onCreate(nodeData);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const addPort = (type) => {
    const newPort = {
      id: `port-${Date.now()}`,
      name: '',
      type: 'string',
      required: false
    };

    if (type === 'input') {
      setFormData(prev => ({
        ...prev,
        inputs_schema: [...prev.inputs_schema, newPort]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        outputs_schema: [...prev.outputs_schema, newPort]
      }));
    }
  };

  const removePort = (type, index) => {
    const key = type === 'input' ? 'inputs_schema' : 'outputs_schema';
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  const updatePort = (portType, index, field, value) => {
    const key = portType === 'input' ? 'inputs_schema' : 'outputs_schema';
    const updatedPorts = formData[key].map((port, i) =>
      i === index ? { ...port, [field]: value } : port
    );

    setFormData(prev => ({ ...prev, [key]: updatedPorts }));
  };

  const renderPorts = (ports, type) => (
      <div className="ports-list">
        {ports.map((port, index) => (
            <div key={port.id} className="port-item">
              <input
                  placeholder="Имя порта"
                  value={port.name}
                  onChange={(e) => updatePort(type, index, 'name', e.target.value)}
              />
              <select
                  value={port.type}
                  onChange={(e) => updatePort(type, index, 'type', e.target.value)}
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
              </select>
              <button
                  type="button"
                  onClick={() => removePort(type, index)}
                  className="btn-remove"
                  title="Удалить порт"
              >
                ×
              </button>
            </div>
        ))}
      </div>
  );

  return (
    <div className="node-editor">
      <div className="builder-editor-header">
        <h3>{isEditing ? 'Редактирование нода' : 'Создание нода'}</h3>
      </div>

      <form onSubmit={handleSubmit} className="editor-form">
        <div className="form-section">
          <label>Название нода *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            placeholder="Введите название нода"
          />
        </div>

        <div className="form-row">
          <div className="form-section">
            <label>Тип нода *</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              required
              placeholder="filter, export, etc."
            />
          </div>

          <div className="form-section">
            <label>Категория</label>
            <select
              value={formData.category_id}
              onChange={(e) => handleInputChange('category_id', e.target.value)}
            >
              <option value="">Выберите категорию</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <label>Описание</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Описание функциональности нода"
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-section">
            <label>Иконка</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => handleInputChange('icon', e.target.value)}
              placeholder="⚙️"
            />
          </div>

          <div className="form-section">
            <label>Цвет</label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
            />
          </div>
        </div>

        <div className="form-section">
          <label>Теги</label>
          <input
            type="text"
            value={formData.tags.join(', ')}
            onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
            placeholder="filter, data, export"
          />
        </div>

        <div className="ports-section">
          <div className="ports-header">
            <h4>Порты ввода</h4>
            <button type="button" onClick={() => addPort('input')} className="btn-small">
              + Добавить
            </button>
          </div>
          {renderPorts(formData.inputs_schema, 'input')}

          <div className="ports-header">
            <h4>Порты вывода</h4>
            <button type="button" onClick={() => addPort('output')} className="btn-small">
              + Добавить
            </button>
          </div>
          {renderPorts(formData.outputs_schema, 'output')}
        </div>

        <div className="form-section">
          <label>Логика выполнения</label>
          <textarea
            value={formData.execution_logic}
            onChange={(e) => handleInputChange('execution_logic', e.target.value)}
            placeholder="function execute(inputs) { return {}; }"
            rows="6"
            className="code-editor"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onDeleteNode}
            className="btn-danger"
            disabled={!isEditing}
            title={!isEditing ? "Выберите нод для удаления" : "Удалить нод"}
          >
            Удалить нод
          </button>

          <button
            type="button"
            onClick={onNewNode}
            className="btn-new"
          >
            Новый нод
          </button>

          <button type="submit" className="btn-primary">
            {isEditing ? 'Сохранить изменения' : 'Создать нод'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NodeEditor;