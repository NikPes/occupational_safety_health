import React, { useState, useEffect } from 'react';
import './SchemaEditor.css';

const SchemaEditor = ({ schema, onSave, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_template: false,
    is_public: false,
    required_permission: 0,
    version: '1.0.0',
    based_on_template: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (schema) {
      setFormData({
        name: schema.name || '',
        description: schema.description || '',
        is_template: schema.is_template || false,
        is_public: schema.is_public || false,
        required_permission: schema.required_permission || 0,
        version: schema.version || '1.0.0',
        based_on_template: schema.based_on_template || ''
      });
      setIsEditing(true);
    } else {
      setFormData({
        name: '',
        description: '',
        is_template: false,
        is_public: false,
        required_permission: 0,
        version: '1.0.0',
        based_on_template: ''
      });
      setIsEditing(false);
    }
  }, [schema]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus('saving');

    try {
      if (isEditing) {
        await onSave(schema.id, formData);
        setSaveStatus('success');
      } else {
        await onCreate({
          ...formData,
          flow_data: { nodes: [], edges: [], viewport: {} }
        });
        setSaveStatus('created');
      }

      // Сбрасываем статус через 2 секунды
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const getStatusMessage = () => {
    switch (saveStatus) {
      case 'saving': return 'Сохранение...';
      case 'success': return 'Сохранено успешно!';
      case 'created': return 'Схема создана!';
      case 'error': return 'Ошибка сохранения';
      default: return '';
    }
  };

  return (
    <div className="schema-editor">
      <div className="editor-header">
        <h3>{isEditing ? 'Редактирование схемы' : 'Создание схемы'}</h3>
        {saveStatus && (
          <div className={`status-message ${saveStatus}`}>
            {getStatusMessage()}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="editor-form">
        <div className="form-section">
          <label>Название схемы *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            placeholder="Введите название схемы"
          />
        </div>

        <div className="form-section">
          <label>Описание</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Описание схемы и её назначения"
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-section">
            <label>Версия</label>
            <input
              type="text"
              value={formData.version}
              onChange={(e) => handleInputChange('version', e.target.value)}
              placeholder="1.0.0"
            />
          </div>

          <div className="form-section">
            <label>Уровень доступа</label>
            <select
              value={formData.required_permission}
              onChange={(e) => handleInputChange('required_permission', parseInt(e.target.value))}
            >
              <option value={0}>Базовый</option>
              <option value={1}>Стандартный</option>
              <option value={2}>Расширенный</option>
              <option value={3}>Администратор</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-section checkbox-section">
            <label>
              <input
                type="checkbox"
                checked={formData.is_template}
                onChange={(e) => handleInputChange('is_template', e.target.checked)}
              />
              Шаблон схемы
            </label>
          </div>

          <div className="form-section checkbox-section">
            <label>
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => handleInputChange('is_public', e.target.checked)}
              />
              Публичная схема
            </label>
          </div>
        </div>

        {formData.is_template && (
          <div className="form-section">
            <label>На основе шаблона (UUID)</label>
            <input
              type="text"
              value={formData.based_on_template}
              onChange={(e) => handleInputChange('based_on_template', e.target.value)}
              placeholder="UUID шаблона"
            />
          </div>
        )}

        <div className="form-section">
          <label>Статистика</label>
          <div className="stats-preview">
            <div className="stat-preview">
              <span className="stat-label">Нодов:</span>
              <span className="stat-value">{schema?.nodes_count || 0}</span>
            </div>
            <div className="stat-preview">
              <span className="stat-label">Связей:</span>
              <span className="stat-value">{schema?.edges_count || 0}</span>
            </div>
            {schema?.last_executed && (
              <div className="stat-preview">
                <span className="stat-label">Последний запуск:</span>
                <span className="stat-value">
                  {new Date(schema.last_executed).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Сохранение...' :
             isEditing ? 'Сохранить изменения' : 'Создать схему'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SchemaEditor;