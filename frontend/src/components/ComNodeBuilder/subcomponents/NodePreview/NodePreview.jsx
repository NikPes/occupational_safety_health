import React from 'react';
import './NodePreview.css';

const NodePreview = ({ node }) => {
  if (!node) {
    return (
      <div className="node-preview">
        <div className="preview-header">
          <h3>Предпросмотр</h3>
        </div>
        <div className="preview-empty">
          <p>Выберите нод для предпросмотра</p>
        </div>
      </div>
    );
  }

  return (
    <div className="node-preview">
      <div className="preview-header">
        <h3>Предпросмотр</h3>
      </div>

      <div className="preview-content">
        <div className="node-preview-card" style={{
          borderColor: node.color,
          backgroundColor: `${node.color}10`
        }}>
          <div className="preview-header" style={{ backgroundColor: `${node.color}20` }}>
            <span className="preview-icon" style={{ color: node.color }}>
              {node.icon}
            </span>
            <span className="preview-name">{node.name}</span>
          </div>

          <div className="preview-ports">
            <div className="ports-side">
              <div className="port-list">
                {node.inputs_schema && node.inputs_schema.slice(0, 3).map((port, index) => (
                  <div key={index} className="port-item input-port">
                    <div className="port-dot"></div>
                    <span className="port-name">{port.name || `Input ${index + 1}`}</span>
                  </div>
                ))}
                {node.inputs_schema && node.inputs_schema.length > 3 && (
                  <div className="port-more">+{node.inputs_schema.length - 3} more</div>
                )}
              </div>
            </div>

            <div className="ports-side">
              <div className="port-list">
                {node.outputs_schema && node.outputs_schema.slice(0, 3).map((port, index) => (
                  <div key={index} className="port-item output-port">
                    <span className="port-name">{port.name || `Output ${index + 1}`}</span>
                    <div className="port-dot"></div>
                  </div>
                ))}
                {node.outputs_schema && node.outputs_schema.length > 3 && (
                  <div className="port-more">+{node.outputs_schema.length - 3} more</div>
                )}
              </div>
            </div>
          </div>

          <div className="preview-footer">
            <span className="preview-type">{node.type}</span>
          </div>
        </div>

        <div className="preview-info">
          <p>Так нод будет выглядеть в редакторе схем</p>
        </div>
      </div>
    </div>
  );
};

export default NodePreview;