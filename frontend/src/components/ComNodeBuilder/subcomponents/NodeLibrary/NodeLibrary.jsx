import React, { useState } from 'react';
import './NodeLibrary.css';

const NodeLibrary = ({
  categories,
  nodes,
  selectedCategory,
  selectedNode,
  onCategorySelect,
  onNodeSelect,
  onSearch,
  token
}) => {
  const [localSearch, setLocalSearch] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    onSearch(value);
  };

  const handleCategoryClick = (categoryId) => {
    onCategorySelect(categoryId === selectedCategory ? null : categoryId);
  };

  const handleNodeClick = async (node) => {
    try {
      console.log('Fetching node details for:', node.node_id);

      // Делаем запрос для получения полной информации о ноде
      const response = await fetch(`/WorkOST/node_builder/nodes/${node.node_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch node details');
      }

      const result = await response.json();
      console.log('Node details received:', result.node);

      // Передаем полные данные нода
      onNodeSelect(result.node);

    } catch (error) {
      console.error('Error fetching node details:', error);
      // Если запрос не удался, используем базовые данные
      onNodeSelect(node);
    }
  };

  return (
    <div className="node-library">
      <div className="library-header">
        <h3>Библиотека нодов</h3>
        <div className="search-box">
          <input
            type="text"
            placeholder="Поиск нодов..."
            value={localSearch}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>

      <div className="categories-list">
        <div
          className={`category-item ${!selectedCategory ? 'active' : ''}`}
          onClick={() => onCategorySelect(null)}
        >
          <span className="category-icon">📁</span>
          <span className="category-name">Все ноды</span>
        </div>

        {categories.map(category => (
          <div
            key={category.id}
            className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category.id)}
            style={{ borderLeft: `3px solid ${category.color}` }}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
            <span className="category-count">
              {nodes.filter(node => node.category_id === category.id).length}
            </span>
          </div>
        ))}
      </div>

      <div className="nodes-list">
        {nodes.length === 0 ? (
          <div className="empty-state">
            {localSearch ? 'Ноды не найдены' : 'Нет нодов в этой категории'}
          </div>
        ) : (
          nodes.map(node => (
            <div
              key={node.node_id}
              className={`node-item ${selectedNode?.node_id === node.node_id ? 'selected' : ''}`}
              onClick={() => handleNodeClick(node)} // Используем новую функцию
            >
              <div className="node-icon" style={{ color: node.color }}>
                {node.icon}
              </div>
              <div className="node-info">
                <div className="node-name">{node.name}</div>
                <div className="node-description">{node.description}</div>
                <div className="node-meta">
                  <span className="node-type">{node.type}</span>
                  {node.usage_count > 0 && (
                    <span className="node-usage">👥 {node.usage_count}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NodeLibrary;