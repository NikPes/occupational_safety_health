import React, { useState } from 'react';
import useToken from '../../../UseToken/UseToken.jsx';
import './SchemaLibrary.css';

const SchemaLibrary = ({
  schemas,
  stats,
  selectedSchema,
  filter,
  onFilterChange,
  onSearch,
  onSchemaSelect,
  onSchemaDuplicate,
  onSchemaDelete
}) => {
  const { token } = useToken();
  const [localSearch, setLocalSearch] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  // Получаем ID текущего пользователя из токена
  React.useEffect(() => {
    if (token) {
      try {
        // Декодируем JWT токен чтобы получить ID пользователя
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.sub || payload.id);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, [token]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    onSearch(value);
  };

  const handleFilterToggle = (filterType, value) => {
    onFilterChange({ [filterType]: value });
  };

  const handleDuplicate = async (schema, e) => {
    e.stopPropagation();
    const newName = prompt('Введите название для копии:', `Копия ${schema.name}`);
    if (newName) {
      await onSchemaDuplicate(schema.id, newName);
    }
  };

  const handleDelete = async (schema, e) => {
    e.stopPropagation();
    if (window.confirm(`Удалить схему "${schema.name}"?`)) {
      await onSchemaDelete(schema.id);
    }
  };

  // Проверяем, может ли пользователь удалить схему
  const canDeleteSchema = (schema) => {
    return currentUserId && schema.created_by === currentUserId;
  };


  return (
    <div className="schema-library">
      <div className="library-header">
        <h3>Библиотека схем</h3>
        <div className="search-box">
          <input
            type="text"
            placeholder="Поиск схем..."
            value={localSearch}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>

      <div className="library-filters">
        <div className="filter-group">
          <label>Тип:</label>
          <div className="filter-buttons">
            <button
              className={filter.isTemplate === null ? 'active' : ''}
              onClick={() => handleFilterToggle('isTemplate', null)}
            >
              Все
            </button>
            <button
              className={filter.isTemplate === true ? 'active' : ''}
              onClick={() => handleFilterToggle('isTemplate', true)}
            >
              Шаблоны
            </button>
            <button
              className={filter.isTemplate === false ? 'active' : ''}
              onClick={() => handleFilterToggle('isTemplate', false)}
            >
              Схемы
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={filter.mySchemas}
              onChange={(e) => handleFilterToggle('mySchemas', e.target.checked)}
            />
            Только мои
          </label>
        </div>
      </div>

      <div className="library-stats">
        <div className="stat-item">
          <span className="stat-label">Всего:</span>
          <span className="stat-value">{stats.total_schemas || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Шаблоны:</span>
          <span className="stat-value">{stats.total_templates || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Публичные:</span>
          <span className="stat-value">{stats.total_public || 0}</span>
        </div>
      </div>

      <div className="schemas-list">
        {schemas.length === 0 ? (
          <div className="empty-state">
            {localSearch ? 'Схемы не найдены' : 'Нет схем'}
          </div>
        ) : (
          schemas.map(schema => (
            <div
              key={schema.id}
              className={`schema-item ${selectedSchema?.id === schema.id ? 'selected' : ''}`}
              onClick={() => onSchemaSelect(schema)}
            >
              <div className="schema-icon">
                {schema.is_template ? '📋' : '🔧'}
              </div>
              <div className="schema-info">
                <div className="schema-name">{schema.name}</div>
                <div className="schema-description">{schema.description}</div>
                <div className="schema-meta">
                  <span className="schema-type">
                    {schema.is_template ? 'Шаблон' : 'Схема'}
                  </span>
                  <span className="schema-nodes">📊 {schema.nodes_count}</span>
                  <span className="schema-edges">🔗 {schema.edges_count}</span>
                </div>
                <div className="schema-author">
                  {schema.created_by_name}
                </div>
              </div>
              <div className="schema-actions">
                <button
                  className="btn-small btn-duplicate"
                  onClick={(e) => handleDuplicate(schema, e)}
                  title="Дублировать"
                >
                  📋
                </button>
                {canDeleteSchema(schema) && (
                  <button
                    className="btn-small btn-delete"
                    onClick={(e) => handleDelete(schema, e)}
                    title="Удалить"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SchemaLibrary;