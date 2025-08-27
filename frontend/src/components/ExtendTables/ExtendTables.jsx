import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ExtendTables = ({
  token,
  selectedTable,
  selectedColumn,
  onTableChange,
  onColumnChange
}) => {
  const [tables, setTables] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loadingColumns, setLoadingColumns] = useState(false);

  useEffect(() => {
    const loadTables = async () => {
      try {
        const response = await axios.get("/flaskCuda/edit_del/getSystemTables", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTables(response.data.tables);
      } catch (error) {
        console.error("Error loading tables:", error);
      }
    };

    loadTables();
  }, [token]);

  useEffect(() => {
    if (selectedTable) {
      setLoadingColumns(true);
      const loadColumns = async () => {
        try {
          const response = await axios.get("/flaskCuda/edit_del/getTableFields", {
            headers: { Authorization: `Bearer ${token}` },
            params: { table_name: selectedTable }
          });
          setColumns(response.data.fields);
        } catch (error) {
          console.error("Error loading columns:", error);
        } finally {
          setLoadingColumns(false);
        }
      };

      loadColumns();
    } else {
      setColumns([]);
      onColumnChange(''); // Сбрасываем колонку при сбросе таблицы
    }
  }, [selectedTable, token]);

  return (
    <>
      <div className="form-group">
        <label>Table Name</label>
        <select
          value={selectedTable || ''}
          onChange={(e) => onTableChange(e.target.value)}
        >
          <option value="">-- Select Table --</option>
          {tables.map(table => (
            <option key={table} value={table}>
              {table}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Column Name</label>
        <select
          value={selectedColumn || ''}
          onChange={(e) => onColumnChange(e.target.value)}
          disabled={!selectedTable || loadingColumns}
        >
          <option value="">-- Select Column --</option>
          {columns.map(column => (
            <option key={column.name} value={column.name}>
              {column.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

export default ExtendTables;