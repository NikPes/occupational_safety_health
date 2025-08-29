import React, { useState, useEffect } from 'react';
import UseToken from '../UseToken/UseToken';
import './ComNodeBuilder.css';

// Subcomponents
import NodeLibrary from './subcomponents/NodeLibrary/NodeLibrary';
import NodeEditor from './subcomponents/NodeEditor/NodeEditor';
import NodeProperties from './subcomponents/NodeProperties/NodeProperties';
import NodePreview from './subcomponents/NodePreview/NodePreview';

const ComNodeBuilder = ({
                          pageName = 'node-builder',
                          onNodeSelect,
                          onNodeCreate,
                          initialData = null
                        }) => {
  const { token } = UseToken();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка данных при монтировании
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCategories(),
        loadNodes()
      ]);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error('NodeBuilder load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/WorkOST/node_builder/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load categories');

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Categories load error:', err);
      throw err;
    }
  };

  const loadNodes = async (categoryId = null, search = '') => {
    try {
      let url = `/WorkOST/node_builder/nodes?page=1&per_page=100`;
      if (categoryId) url += `&category_id=${categoryId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load nodes');

      const data = await response.json();
      setNodes(data.nodes || []);
    } catch (err) {
      console.error('Nodes load error:', err);
      throw err;
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    loadNodes(categoryId, searchQuery);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    loadNodes(selectedCategory, query);
  };

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    if (onNodeSelect) onNodeSelect(node);
  };

  const handleNewNode = () => {
    setSelectedNode(null);
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) return;

    try {
      const response = await fetch(`/WorkOST/node_builder/nodes/${selectedNode.node_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete node');

      setNodes(prev => prev.filter(node => node.node_id !== selectedNode.node_id));
      setSelectedNode(null);

      console.log('Node deleted successfully');
    } catch (err) {
      console.error('Node deletion error:', err);
      alert('Ошибка при удалении нода');
    }
  };

  const handleNodeCreate = async (nodeData) => {
    try {
      const response = await fetch('/WorkOST/node_builder/nodes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nodeData)
      });

      if (!response.ok) throw new Error('Failed to create node');

      const result = await response.json();
      if (onNodeCreate) onNodeCreate(result.node);

      await loadNodes(selectedCategory, searchQuery);
      return result;
    } catch (err) {
      console.error('Node creation error:', err);
      throw err;
    }
  };

  const handleNodeUpdate = async (nodeId, nodeData) => {
    try {
      const response = await fetch(`/WorkOST/node_builder/nodes/${nodeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nodeData)
      });

      if (!response.ok) throw new Error('Failed to update node');

      setNodes(prev => prev.map(node =>
        node.node_id === nodeId ? { ...node, ...nodeData } : node
      ));

      if (selectedNode?.node_id === nodeId) {
        setSelectedNode(prev => ({ ...prev, ...nodeData }));
      }

    } catch (err) {
      console.error('Node update error:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="com-node-builder loading">
        <div className="loading-spinner">Загрузка конструктора нодов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="com-node-builder error">
        <div className="error-message">{error}</div>
        <button onClick={loadInitialData} className="retry-button">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="com-node-builder">
      <div className="node-builder-header">
        <h2>Конструктор нодов</h2>
      </div>

      <div className="node-builder-content">
        {/* Левая панель - Библиотека нодов */}
        <div className="node-library-panel">
          <NodeLibrary
            categories={categories}
            nodes={nodes}
            selectedCategory={selectedCategory}
            selectedNode={selectedNode}
            onCategorySelect={handleCategorySelect}
            onNodeSelect={handleNodeSelect}
            onSearch={handleSearch}
            token={token}
          />
        </div>

        {/* Центральная панель - Редактор */}
        <div className="node-editor-panel">
          <NodeEditor
            node={selectedNode}
            categories={categories}
            onSave={handleNodeUpdate}
            onCreate={handleNodeCreate}
            onNewNode={handleNewNode}
            onDeleteNode={handleDeleteNode}
            isEditing={!!selectedNode}
          />
        </div>

        {/* Правая панель - Свойства и превью */}
        <div className="node-properties-panel">
          <NodeProperties node={selectedNode} />
          <NodePreview node={selectedNode} />
        </div>
      </div>
    </div>
  );
};

export default ComNodeBuilder;