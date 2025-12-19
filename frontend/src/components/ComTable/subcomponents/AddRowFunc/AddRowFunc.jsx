import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ModalWin from '../../../ModalWin/ModalWin.jsx';

const AddRowFunc = ({
  token,
  table_name,
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

  useEffect(() => {
    const loadConfig = async () => {
      if (!isOpen) return;

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get("/WorkOST/table_bd_add_row/getAddRow", {
          headers: { Authorization: `Bearer ${token}` },
          params: { table_name }
        });

        console.log("ДАННЫЕ С СЕРВЕРА:", response.data);

        const { fields_data, master_order } = response.data;
        const initialData = {};
        const initialConfig = {};

        master_order.forEach(field => {
          // Устанавливаем начальные значения
          const fieldType = fields_data[`${field}_type`];

          switch(fieldType) {
            case 'intField':
              initialData[field] = 0;
              break;
            case 'floatField':
              initialData[field] = 0.0;
              break;
            case 'checkList':
            case 'booField':
              initialData[field] = false;
              break;
            case 'dateField':
              initialData[field] = new Date().toISOString().split('T')[0];
              break;
            case 'timeField':
              initialData[field] = new Date().toTimeString().slice(0, 5);
              break;
            case 'datetimeField':
              initialData[field] = new Date().toISOString().slice(0, 16);
              break;
            default:
              initialData[field] = '';
          }

          // Правильно обрабатываем данные для выпадающих списков
          const fieldData = fields_data[`${field}_data`];
          let options = [];

          if (fieldData && fieldData.list && Array.isArray(fieldData.list)) {
            options = fieldData.list;
          }

          // Формируем конфигурацию для ModalWin
          initialConfig[field] = {
            type: fieldType || 'inputField',
            display: fields_data[`${field}_display`] || field,
            data: {
              list: options,
              current: initialData[field] // Сохраняем текущее значение
            }
          };
        });

        // Добавляем зависимости в конфиг, если они есть
        if (fields_data._dependencies) {
          initialConfig._dependencies = fields_data._dependencies;
        }

        setFormData(initialData);
        setFieldsConfig(initialConfig);
        setFieldsOrder(master_order);

      } catch (err) {
        console.error("Ошибка загрузки конфигурации:", err);
        setError(err.response?.data?.error || "Ошибка загрузки формы");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadConfig();
    } else {
      // Сбрасываем состояние при закрытии
      setFormData({});
      setFieldsConfig({});
      setFieldsOrder([]);
      setError(null);
      previousDependencies.current = {};
    }
  }, [isOpen, token, table_name]);

  useEffect(() => {
    const loadDependentData = async (fieldName, config, value) => {
      if (!value) return;

      try {
        console.log(`Загрузка данных для ${fieldName}:`, {
          endpoint: config.endpoint,
          param_name: config.param_name,
          value: value
        });

        const response = await axios.get(config.endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          params: { [config.param_name]: value }
        });

        console.log(`Данные получены для ${fieldName}:`, response.data);

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сохраняем текущее значение при обновлении списка
        setFieldsConfig(prev => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            data: {
              list: response.data.list || [],
              current: formData[fieldName] // Сохраняем текущее значение
            }
          }
        }));

      } catch (error) {
        console.error(`Error loading ${fieldName}:`, error.response?.data || error.message);
      }
    };

    // Проверяем зависимости при изменении formData
    if (fieldsConfig._dependencies) {
      Object.entries(fieldsConfig._dependencies).forEach(([fieldName, config]) => {
        const dependsOnValue = formData[config.depends_on];
        const previousValue = previousDependencies.current[fieldName];

        // Если значение изменилось и не пустое
        if (dependsOnValue && dependsOnValue !== previousValue) {
          console.log(`Обнаружено изменение зависимости: ${fieldName} зависит от ${config.depends_on}=${dependsOnValue}`);

          loadDependentData(fieldName, config, dependsOnValue);

          // Сбрасываем значение зависимого поля только если оно не валидно в новом списке
          const currentValue = formData[fieldName];
          if (currentValue) {
            // Проверяем, есть ли текущее значение в новом списке
            const currentConfig = fieldsConfig[fieldName];
            const newList = response?.data?.list || [];
            const valueExists = newList.some(item => {
              const itemValue = typeof item === 'object' ? item.id || item.value : item;
              return String(itemValue) === String(currentValue);
            });

            if (!valueExists) {
              handleFieldChange(fieldName, '');
            }
          }

          // Сохраняем текущее значение для будущих сравнений
          previousDependencies.current[fieldName] = dependsOnValue;
        }
      });
    }
  }, [formData, token, fieldsConfig._dependencies]);

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обновляем текущее значение в конфиге для выпадающих списков
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
        if (key === '_dependencies') return; // Пропускаем мета-поля

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
        "/WorkOST/table_bd_add_row/addRow",
        {
          table_name,
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
        "Ошибка при сохранении данных"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWin
      title={`Добавление в ${table_name}`}
      isOpen={isOpen}
      onClose={onClose}
      onAction={handleSave}
      actionText="Добавить"
      actionStyle="blue"
      isLoading={loading}
      loadingText="Добавление..."
      error={error}
      fieldsConfig={fieldsConfig}
      fieldsOrder={fieldsOrder}
      formData={formData}
      onFieldChange={handleFieldChange}
    />
  );
};

export default AddRowFunc;