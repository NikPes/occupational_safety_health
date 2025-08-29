// frontend/src/components/ComNodeSchemasBuilder/subcomponents/SchemaPreview/SchemaPreview.jsx
import React from 'react';
import './SchemaPreview.css';

const SchemaPreview = ({ schema }) => {
  if (!schema) {
    return (
      <div className="schema-preview">
        <div className="preview-header">
          <h3>Предпросмотр схемы</h3>
        </div>
        <div className="preview-empty">
          <p>Выберите схему для предпросмотра</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schema-preview">
      <div className="preview-header">
        <h3>Предпросмотр схемы</h3>
      </div>

      <div className="preview-content">
        <div className="schema-preview-card">
          <div className="preview-header" style={{
            backgroundColor: schema.is_template ? '#eff6ff' : '#f0fdf4',
            borderColor: schema.is_template ? '#3b82f6' : '#22c55e'
          }}>
            <span className="preview-icon">
              {schema.is_template ? '📋' : '🔧'}
            </span>
            <span className="preview-name">{schema.name}</span>
          </div>

          <div className="preview-stats">
            <div className="stat-visual">
              <div className="nodes-visual">
                <div className="visual-label">Ноды</div>
                <div className="visual-bar">
                  <div
                    className="visual-fill"
                    style={{
                      width: `${Math.min((schema.nodes_count || 0) * 10, 100)}%`,
                      backgroundColor: schema.is_template ? '#3b82f6' : '#22c55e'
                    }}
                  ></div>
                </div>
                <div className="visual-count">{schema.nodes_count || 0}</div>
              </div>

              <div className="edges-visual">
                <div className="visual-label">Связи</div>
                <div className="visual-bar">
                  <div
                    className="visual-fill"
                    style={{
                      width: `${Math.min((schema.edges_count || 0) * 15, 100)}%`,
                      backgroundColor: schema.is_template ? '#3b82f6' : '#22c55e'
                    }}
                  ></div>
                </div>
                <div className="visual-count">{schema.edges_count || 0}</div>
              </div>
            </div>
          </div>

          <div className="preview-meta">
            <div className="meta-item">
              <span className="meta-label">Тип:</span>
              <span className="meta-value">{schema.is_template ? 'Шаблон' : 'Схема'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Версия:</span>
              <span className="meta-value">{schema.version}</span>
            </div>
            {schema.last_executed && (
              <div className="meta-item">
                <span className="meta-label">Запуск:</span>
                <span className="meta-value">
                  {new Date(schema.last_executed).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div className="preview-footer">
            <div className="complexity-indicator">
              <span className="complexity-label">Сложность:</span>
              <div className="complexity-dots">
                {[1, 2, 3].map(dot => (
                  <div
                    key={dot}
                    className={`complexity-dot ${
                      dot <= Math.min(Math.floor((schema.nodes_count || 0) / 5) + 1, 3) ? 'active' : ''
                    }`}
                    style={{
                      backgroundColor: schema.is_template ? '#3b82f6' : '#22c55e'
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="preview-info">
          <p>Так схема будет выглядеть в общем списке</p>
          {schema.description && (
            <p className="preview-description">{schema.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaPreview;