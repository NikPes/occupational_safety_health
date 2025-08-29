import React from 'react';
import './SchemaProperties.css';

const SchemaProperties = ({ schema, stats }) => {
  if (!schema) {
    return (
      <div className="schema-properties">
        <div className="properties-header">
          <h3>Свойства схемы</h3>
        </div>
        <div className="properties-empty">
          <p>Выберите схему для просмотра свойств</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schema-properties">
      <div className="properties-header">
        <h3>Свойства схемы</h3>
        <div className="schema-icon-large">
          {schema.is_template ? '📋' : '🔧'}
        </div>
      </div>

      <div className="properties-content">
        <div className="property-group">
          <h4>Основная информация</h4>
          <div className="property-item">
            <span className="property-label">Название:</span>
            <span className="property-value">{schema.name}</span>
          </div>
          <div className="property-item">
            <span className="property-label">Тип:</span>
            <span className="property-value">
              {schema.is_template ? 'Шаблон' : 'Схема'}
            </span>
          </div>
          <div className="property-item">
            <span className="property-label">Версия:</span>
            <span className="property-value">{schema.version || '1.0.0'}</span>
          </div>
          <div className="property-item">
            <span className="property-label">Статус:</span>
            <span className="property-value">
              {schema.is_public ? 'Публичная' : 'Приватная'}
            </span>
          </div>
        </div>

        <div className="property-group">
          <h4>Композиция</h4>
          <div className="property-item">
            <span className="property-label">Нодов:</span>
            <span className="property-value">{schema.nodes_count || 0}</span>
          </div>
          <div className="property-item">
            <span className="property-label">Связей:</span>
            <span className="property-value">{schema.edges_count || 0}</span>
          </div>
          <div className="property-item">
            <span className="property-label">Уровень доступа:</span>
            <span className="property-value">
              {schema.required_permission === 0 ? 'Базовый' :
               schema.required_permission === 1 ? 'Стандартный' :
               schema.required_permission === 2 ? 'Расширенный' : 'Администратор'}
            </span>
          </div>
        </div>

        <div className="property-group">
          <h4>Метаданные</h4>
          <div className="property-item">
            <span className="property-label">Автор:</span>
            <span className="property-value">{schema.created_by_name || 'Неизвестно'}</span>
          </div>
          <div className="property-item">
            <span className="property-label">Создана:</span>
            <span className="property-value">
              {schema.created_at ? new Date(schema.created_at).toLocaleDateString() : 'неизвестно'}
            </span>
          </div>
          <div className="property-item">
            <span className="property-label">Обновлена:</span>
            <span className="property-value">
              {schema.updated_at ? new Date(schema.updated_at).toLocaleDateString() : 'неизвестно'}
            </span>
          </div>
          {schema.last_executed && (
            <div className="property-item">
              <span className="property-label">Последний запуск:</span>
              <span className="property-value">
                {new Date(schema.last_executed).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {schema.description && (
          <div className="property-group">
            <h4>Описание</h4>
            <p className="property-description">{schema.description}</p>
          </div>
        )}

        {schema.based_on_template && (
          <div className="property-group">
            <h4>Шаблон</h4>
            <div className="property-item">
              <span className="property-label">На основе:</span>
              <span className="property-value code">{schema.based_on_template}</span>
            </div>
          </div>
        )}

        {stats && Object.keys(stats).length > 0 && (
          <div className="property-group">
            <h4>Статистика</h4>
            <div className="property-item">
              <span className="property-label">Всего схем:</span>
              <span className="property-value">{stats.total_schemas || 0}</span>
            </div>
            <div className="property-item">
              <span className="property-label">Шаблонов:</span>
              <span className="property-value">{stats.total_templates || 0}</span>
            </div>
            <div className="property-item">
              <span className="property-label">Публичных:</span>
              <span className="property-value">{stats.total_public || 0}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaProperties;