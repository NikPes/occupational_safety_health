// frontend/src/components/ComNodeSchemasBuilder/ComNodeSchemasBuilder.jsx
import React, { useState, useEffect } from 'react';
import useToken from '../UseToken/UseToken.jsx';
import './ComNodeSchemasBuilder.css';

// Subcomponents
import SchemaLibrary from './subcomponents/SchemaLibrary/SchemaLibrary.jsx';
import SchemaEditor from './subcomponents/SchemaEditor/SchemaEditor.jsx';
import SchemaProperties from './subcomponents/SchemaProperties/SchemaProperties.jsx';
import SchemaPreview from './subcomponents/SchemaPreview/SchemaPreview.jsx';

const ComNodeSchemasBuilder = ({
  pageName = 'Node-Schemas-Builder',
  onSchemaSelect,
  onSchemaCreate,
  initialData = null
}) => {
  const { token } = useToken();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [filter, setFilter] = useState({
    isTemplate: null,
    mySchemas: false,
    search: ''
  });
  const [stats, setStats] = useState({});

  // Загрузка данных при монтировании
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSchemas(),
        loadStats()
      ]);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error('NodeSchemasBuilder load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSchemas = async () => {
    try {
      let url = `/WorkOST/node_schemas_builder/schemas?page=1&per_page=100`;
      if (filter.isTemplate !== null) url += `&is_template=${filter.isTemplate}`;
      if (filter.mySchemas) url += `&my_schemas=true`;
      if (filter.search) url += `&search=${encodeURIComponent(filter.search)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load schemas');

      const data = await response.json();
      setSchemas(data.schemas || []);
    } catch (err) {
      console.error('Schemas load error:', err);
      throw err;
    }
  };

  const loadStats = async () => {
    try {
      const url = `/WorkOST/node_schemas_builder/stats?my_stats=${filter.mySchemas}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load stats');

      const data = await response.json();
      setStats(data.stats || {});
    } catch (err) {
      console.error('Stats load error:', err);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  const handleSearch = (search) => {
    setFilter(prev => ({ ...prev, search }));
  };

  const handleSchemaSelect = (schema) => {
    setSelectedSchema(schema);
    if (onSchemaSelect) onSchemaSelect(schema);
  };

  const handleSchemaCreate = async (schemaData) => {
    try {
      const response = await fetch('/WorkOST/node_schemas_builder/schemas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(schemaData)
      });

      if (!response.ok) throw new Error('Failed to create schema');

      const result = await response.json();
      if (onSchemaCreate) onSchemaCreate(result.schema);

      // Перезагружаем список схем
      await loadSchemas();
      await loadStats();

      return result;
    } catch (err) {
      console.error('Schema creation error:', err);
      throw err;
    }
  };

  const handleSchemaUpdate = async (schemaId, schemaData) => {
    try {
      const response = await fetch(`/WorkOST/node_schemas_builder/schemas/${schemaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(schemaData)
      });

      if (!response.ok) throw new Error('Failed to update schema');

      // Обновляем локальное состояние
      setSchemas(prev => prev.map(schema =>
        schema.id === schemaId ? { ...schema, ...schemaData } : schema
      ));

      if (selectedSchema?.id === schemaId) {
        setSelectedSchema(prev => ({ ...prev, ...schemaData }));
      }

      await loadStats();

    } catch (err) {
      console.error('Schema update error:', err);
      throw err;
    }
  };

  const handleSchemaDuplicate = async (schemaId, newName) => {
    try {
      const response = await fetch(`/WorkOST/node_schemas_builder/schemas/${schemaId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });

      if (!response.ok) throw new Error('Failed to duplicate schema');

      const result = await response.json();

      // Перезагружаем список схем
      await loadSchemas();
      await loadStats();

      return result;
    } catch (err) {
      console.error('Schema duplication error:', err);
      throw err;
    }
  };

  const handleSchemaDelete = async (schemaId) => {
    try {
      const response = await fetch(`/WorkOST/node_schemas_builder/schemas/${schemaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete schema');

      // Обновляем локальное состояние
      setSchemas(prev => prev.filter(schema => schema.id !== schemaId));

      if (selectedSchema?.id === schemaId) {
        setSelectedSchema(null);
      }

      await loadStats();

    } catch (err) {
      console.error('Schema deletion error:', err);
      throw err;
    }
  };

  // Применяем фильтры при их изменении
  useEffect(() => {
    loadSchemas();
    loadStats();
  }, [filter.isTemplate, filter.mySchemas]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadSchemas();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filter.search]);

  if (loading) {
    return (
      <div className="com-node-schemas-builder loading">
        <div className="loading-spinner">Загрузка конструктора схем...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="com-node-schemas-builder error">
        <div className="error-message">{error}</div>
        <button onClick={loadInitialData} className="retry-button">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="com-node-schemas-builder">
      <div className="schemas-builder-header">
        <h2>Конструктор схем</h2>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => handleSchemaCreate({ name: 'Новая схема', flow_data: { nodes: [], edges: [], viewport: {} } })}
          >
            Новая схема
          </button>
        </div>
      </div>

      <div className="schemas-builder-content">
        {/* Левая панель - Библиотека схем */}
        <div className="schema-library-panel">
          <SchemaLibrary
            schemas={schemas}
            stats={stats}
            selectedSchema={selectedSchema}
            filter={filter}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            onSchemaSelect={handleSchemaSelect}
            onSchemaDuplicate={handleSchemaDuplicate}
            onSchemaDelete={handleSchemaDelete}
          />
        </div>

        {/* Центральная панель - Редактор */}
        <div className="schema-editor-panel">
          <SchemaEditor
            schema={selectedSchema}
            onSave={handleSchemaUpdate}
            onCreate={handleSchemaCreate}
          />
        </div>

        {/* Правая панель - Свойства и превью */}
        <div className="schema-properties-panel">
          <SchemaProperties schema={selectedSchema} stats={stats} />
          <SchemaPreview schema={selectedSchema} />
        </div>
      </div>
    </div>
  );
};

export default ComNodeSchemasBuilder;