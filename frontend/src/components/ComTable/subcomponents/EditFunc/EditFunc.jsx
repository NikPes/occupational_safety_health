import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ModalWin from '../../../ModalWin/ModalWin.jsx';

const EditFunc = ({
  token,
  table_name,
  record_id,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({});
  const [fieldsConfig, setFieldsConfig] = useState({});
  const [fieldsOrder, setFieldsOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const previousDependencies = useRef({});
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const loadEditData = async () => {
      if (!isOpen || !record_id) return;

      setLoading(true);
      setError(null);
      setInitialLoadComplete(false);

      try {
        const response = await axios.get("/WorkOST/table_bd_edit/getToEdit", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            table_name,
            id: record_id
          }
        });

        console.log("ДАННЫЕ ДЛЯ РЕДАКТИРОВАНИЯ:", response.data);

        const { fields_data, master_order } = response.data;
        const initialData = {};
        const initialConfig = {};

        // Исключаем поле ID из отображения
        const filteredMasterOrder = master_order.filter(field => field !== 'id');

        filteredMasterOrder.forEach(field => {
          // Устанавливаем значения из записи
          initialData[field] = fields_data[field] ?? '';

          // Формируем конфигурацию для ModalWin
          initialConfig[field] = {
            type: fields_data[`${field}_type`] || 'inputField',
            display: fields_data[`${field}_display`] || field,
            data: {
              list: fields_data[`${field}_data`]?.list || [],
              current: fields_data[field]
            }
          };
        });

        // Добавляем зависимости в конфиг, если они есть
        if (fields_data._dependencies) {
          initialConfig._dependencies = fields_data._dependencies;
        }

        setFormData(initialData);
        setFieldsConfig(initialConfig);
        setFieldsOrder(filteredMasterOrder);
        setInitialLoadComplete(true);

      } catch (err) {
        console.error("Ошибка загрузки данных для редактирования:", err);
        setError(err.response?.data?.error || "Ошибка загрузки формы редактирования");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadEditData();
    } else {
      // Сбрасываем состояние при закрытии
      setFormData({});
      setFieldsConfig({});
      setFieldsOrder([]);
      setError(null);
      setInitialLoadComplete(false);
      previousDependencies.current = {};
    }
  }, [isOpen, token, table_name, record_id]);

  // Загрузка зависимых данных при первоначальной загрузке
  useEffect(() => {
    const loadDependentDataForEdit = async () => {
      if (!initialLoadComplete || !fieldsConfig._dependencies) return;

      for (const [fieldName, config] of Object.entries(fieldsConfig._dependencies)) {
        const dependsOnValue = formData[config.depends_on];

        if (dependsOnValue) {
          try {
            const response = await axios.get(config.endpoint, {
              headers: { Authorization: `Bearer ${token}` },
              params: { [config.param_name]: dependsOnValue }
            });

            // Обновляем ТОЛЬКО список, не трогая current значение
            setFieldsConfig(prev => ({
              ...prev,
              [fieldName]: {
                ...prev[fieldName],
                data: {
                  ...prev[fieldName]?.data,
                  list: response.data.list || []
                }
              }
            }));

          } catch (error) {
            console.error(`Error loading ${fieldName}:`, error);
          }
        }
      }
    };

    loadDependentDataForEdit();
  }, [initialLoadComplete, token]);

  // Обработка изменений зависимых полей
  useEffect(() => {
    const loadDependentData = async (fieldName, config, value) => {
      if (!value) return;

      try {
        const response = await axios.get(config.endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          params: { [config.param_name]: value }
        });

        setFieldsConfig(prev => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            data: {
              list: response.data.list || [],
              current: formData[fieldName]
            }
          }
        }));

      } catch (error) {
        console.error(`Error loading ${fieldName}:`, error.response?.data || error.message);
      }
    };

    if (fieldsConfig._dependencies) {
      Object.entries(fieldsConfig._dependencies).forEach(([fieldName, config]) => {
        const dependsOnValue = formData[config.depends_on];
        const previousValue = previousDependencies.current[fieldName];

        if (dependsOnValue && dependsOnValue !== previousValue) {
          loadDependentData(fieldName, config, dependsOnValue);
          previousDependencies.current[fieldName] = dependsOnValue;
        }
      });
    }
  }, [formData, token]);

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    setFieldsConfig(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        data: {
          ...prev[fieldName]?.data,
          current: value
        }
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const dataToSend = { ...formData };

      // Преобразование типов данных перед отправкой
      Object.keys(fieldsConfig).forEach(key => {
        if (key === '_dependencies') return;

        const type = fieldsConfig[key]?.type;
        const value = dataToSend[key];

        if (type === 'intField') {
          dataToSend[key] = parseInt(value) || 0;
        } else if (type === 'floatField') {
          dataToSend[key] = parseFloat(value) || 0.0;
        } else if (type === 'checkList' || type === 'booField') {
          dataToSend[key] = Boolean(value);
        }
      });

      await axios.post(
        "/WorkOST/table_bd_edit/saveOfEdit",
        {
          table_name,
          id: record_id,
          data: dataToSend
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      onSuccess();
      onClose();

    } catch (err) {
      console.error("Ошибка сохранения:", err);
      setError(
        err.message ||
        err.response?.data?.error ||
        "Ошибка при сохранении изменений"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWin
      title={`Редактирование записи в ${table_name}`}
      isOpen={isOpen}
      onClose={onClose}
      onAction={handleSave}
      actionText="Сохранить"
      actionStyle="blue"
      isLoading={loading}
      loadingText="Сохранение..."
      error={error}
      fieldsConfig={fieldsConfig}
      fieldsOrder={fieldsOrder}
      formData={formData}
      onFieldChange={handleFieldChange}
    />
  );
};

export default EditFunc;