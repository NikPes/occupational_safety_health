import React, { useState, useEffect } from 'react';
import './NodeEditor.css';

const NodeEditor = ({ node, categories, onSave, onCreate }) => {
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

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (node) {
      setFormData({
        name: node.name || '',
        type: node.type || '',
        category_id: node.category_id || '',
        description: node.description || '',
        icon: node.data?.icon || '⚙️',
        color: node.data?.color || '#6B7280',
        inputs_schema: node.inputs_schema || [],
        outputs_schema: node.outputs_schema || [],
        execution_logic: node.execution_logic || '',
        tags: node.tags || []
      });
      setIsEditing(true);
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
      setIsEditing(false);
    }
  }, [node]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nodeData = {
        ...formData,
        data: {
          icon: formData.icon,
          color: formData.color
        }
      };

      if (isEditing) {
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

    handleInputChange(
      type === 'input' ? 'inputs_schema' : 'outputs_schema',
      [...formData[type === 'input' ? 'inputs_schema' : 'outputs_schema'], newPort]
    );
  };

  return (
    <div className="node-editor">
      <div className="editor-header">
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

          <div className="ports-header">
            <h4>Порты вывода</h4>
            <button type="button" onClick={() => addPort('output')} className="btn-small">
              + Добавить
            </button>
          </div>
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
          <button type="submit" className="btn-primary">
            {isEditing ? 'Сохранить изменения' : 'Создать нод'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NodeEditor;