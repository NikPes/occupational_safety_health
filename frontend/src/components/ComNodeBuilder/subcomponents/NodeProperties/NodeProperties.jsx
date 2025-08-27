import React from 'react';
import './NodeProperties.css';

const NodeProperties = ({ node }) => {
  if (!node) {
    return (
      <div className="node-properties">
        <div className="properties-header">
          <h3>Свойства нода</h3>
        </div>
        <div className="properties-empty">
          <p>Выберите нод для просмотра свойств</p>
        </div>
      </div>
    );
  }

  return (
    <div className="node-properties">
      <div className="properties-header">
        <h3>Свойства нода</h3>
        <div className="node-icon-large" style={{ color: node.color }}>
          {node.icon}
        </div>
      </div>

      <div className="properties-content">
        <div className="property-group">
          <h4>Основная информация</h4>
          <div className="property-item">
            <span className="property-label">Название:</span>
            <span className="property-value">{node.name}</span>
          </div>
          <div className="property-item">
            <span className="property-label">Тип:</span>
            <span className="property-value">{node.type}</span>
          </div>
          <div className="property-item">
            <span className="property-label">Версия:</span>
            <span className="property-value">{node.version || '1.0.0'}</span>
          </div>
          <div className="property-item">
            <span className="property-label">Использований:</span>
            <span className="property-value">{node.usage_count || 0}</span>
          </div>
        </div>

        <div className="property-group">
          <h4>Порты</h4>
          <div className="property-item">
            <span className="property-label">Входы:</span>
            <span className="property-value">{node.inputs_count} портов</span>
          </div>
          <div className="property-item">
            <span className="property-label">Выходы:</span>
            <span className="property-value">{node.outputs_count} портов</span>
          </div>
        </div>

        <div className="property-group">
          <h4>Метаданные</h4>
          <div className="property-item">
            <span className="property-label">Теги:</span>
            <span className="property-value">
              {node.tags && node.tags.length > 0 ? node.tags.join(', ') : 'нет'}
            </span>
          </div>
          <div className="property-item">
            <span className="property-label">Создан:</span>
            <span className="property-value">
              {node.created_at ? new Date(node.created_at).toLocaleDateString() : 'неизвестно'}
            </span>
          </div>
          <div className="property-item">
            <span className="property-label">Обновлен:</span>
            <span className="property-value">
              {node.updated_at ? new Date(node.updated_at).toLocaleDateString() : 'неизвестно'}
            </span>
          </div>
        </div>

        {node.description && (
          <div className="property-group">
            <h4>Описание</h4>
            <p className="property-description">{node.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeProperties;