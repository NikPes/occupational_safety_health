import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModalWin from '../ModalWin/ModalWin';
import PartitionEditBox from '../PartitionEditBox/PartitionEditBox';
import ExtendTables from '../ExtendTables/ExtendTables';
import './AddRowFunc.css';

const AddRowFunc = ({
                      token,
                      table_name,
                      isOpen,
                      onClose,
                      onSuccess
                    }) => {
  const [formData, setFormData] = useState({});
  const [fieldConfig, setFieldConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        const response = await axios.get("/flaskCuda/add_row/getAddRow", {
          headers: { Authorization: `Bearer ${token}` },
          params: { table_name }
        });

        const { fields_data, master_order } = response.data;
        const initialData = {};
        const initialConfig = {};

        master_order.forEach(field => {
          switch(fields_data[`${field}_type`]) {
            case 'intField': initialData[field] = 0; break;
            case 'floatField': initialData[field] = 0.0; break;
            case 'checkList': initialData[field] = false; break;
            case 'dateField': initialData[field] = new Date().toISOString().split('T')[0]; break;
            case 'timeField': initialData[field] = new Date().toTimeString().slice(0, 5); break;
            default: initialData[field] = '';
          }

          initialConfig[field] = {
            display: fields_data[`${field}_display`] || field,
            type: fields_data[`${field}_type`] || 'inputField',
            options: fields_data[`${field}_data`]?.list || []
          };
        });

        setFormData(initialData);
        setFieldConfig(initialConfig);
      } catch (err) {
        setError(err.response?.data?.error || "Ошибка загрузки формы");
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [isOpen, token, table_name]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Валидация для AccessToStatus
      if (table_name === 'AccessToStatus') {
        if (!formData.table_name || formData.table_name === '') {
          throw new Error('Выберите таблицу');
        }
        if (!formData.column_name || formData.column_name === '') {
          throw new Error('Выберите колонку');
        }
      }

      const dataToSend = { ...formData };

      // Явно указываем какие поля преобразовывать
      const fieldsToTransform = Object.keys(fieldConfig).filter(
          key => fieldConfig[key]?.type === 'intField' ||
              fieldConfig[key]?.type === 'floatField' ||
              fieldConfig[key]?.type === 'checkList'
      );

      fieldsToTransform.forEach(key => {
        const type = fieldConfig[key]?.type;
        if (type === 'intField') {
          dataToSend[key] = parseInt(dataToSend[key]) || 0;
        } else if (type === 'floatField') {
          dataToSend[key] = parseFloat(dataToSend[key]) || 0.0;
        } else if (type === 'checkList') {
          dataToSend[key] = Boolean(dataToSend[key]);
        }
      });

      await axios.post("/flaskCuda/add_row/addRow",
          { table_name, data: dataToSend },
          { headers: { Authorization: `Bearer ${token}` } }
      );

      onSuccess();
    } catch (err) {
      setError(err.message || err.response?.data?.error || "Ошибка сохранения");
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
      >
        <div className="add-row-fields">
          {error && <div className="error-message">{error}</div>}
          {table_name === 'AccessToStatus' ? (
              <>
                <ExtendTables
                    key="extended-fields"
                    token={token}
                    selectedTable={formData.table_name}
                    selectedColumn={formData.column_name}
                    onTableChange={(val) => handleInputChange('table_name', val)}
                    onColumnChange={(val) => handleInputChange('column_name', val)}
                />
                {Object.entries(fieldConfig)
                    .filter(([field]) =>
                        field !== 'table_name' &&
                        field !== 'column_name'
                    )
                    .map(([field, config]) => (
                        <PartitionEditBox
                            key={field}
                            fieldName={field}
                            fieldValue={formData[field]}
                            config={config}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                    ))
                }
              </>
          ) : (
              Object.entries(fieldConfig).map(([field, config]) => (
                  <PartitionEditBox
                      key={field}
                      fieldName={field}
                      fieldValue={formData[field]}
                      config={config}
                      onChange={handleInputChange}
                      disabled={loading}
                  />
              ))
          )}
        </div>
      </ModalWin>
  );
};

export default AddRowFunc;


// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import ModalWin from '../ModalWin/ModalWin';
// import PartitionEditBox from '../PartitionEditBox/PartitionEditBox';
// import ExtendTables from '../ExtendTables/ExtendTables';
// import './AddRowFunc.css';
//
// const AddRowFunc = ({
//                       token,
//                       table_name,
//                       isOpen,
//                       onClose,
//                       onSuccess
//                     }) => {
//   const [formData, setFormData] = useState({});
//   const [fieldConfig, setFieldConfig] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//
//   useEffect(() => {
//     const loadConfig = async () => {
//       if (!isOpen) return;
//
//       setLoading(true);
//       try {
//         const response = await axios.get("/flaskCuda/add_row/getAddRow", {
//           headers: { Authorization: `Bearer ${token}` },
//           params: { table_name }
//         });
//
//         const { fields_data, master_order } = response.data;
//         const initialData = {};
//         const initialConfig = {};
//
//         master_order.forEach(field => {
//           switch(fields_data[`${field}_type`]) {
//             case 'intField': initialData[field] = 0; break;
//             case 'floatField': initialData[field] = 0.0; break;
//             case 'checkList': initialData[field] = false; break;
//             case 'dateField': initialData[field] = new Date().toISOString().split('T')[0]; break;
//             default: initialData[field] = '';
//           }
//
//           initialConfig[field] = {
//             display: fields_data[`${field}_display`] || field,
//             type: fields_data[`${field}_type`] || 'inputField',
//             options: fields_data[`${field}_data`]?.list || []
//           };
//         });
//
//         setFormData(initialData);
//         setFieldConfig(initialConfig);
//       } catch (err) {
//         setError(err.response?.data?.error || "Ошибка загрузки формы");
//       } finally {
//         setLoading(false);
//       }
//     };
//
//     loadConfig();
//   }, [isOpen, token, table_name]);
//
//   const handleInputChange = (field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };
//
//   const handleSave = async () => {
//     setLoading(true);
//     setError(null);
//
//     try {
//       // Валидация для AccessToStatus
//       if (table_name === 'AccessToStatus') {
//         if (!formData.table_name || formData.table_name === '') {
//           throw new Error('Выберите таблицу');
//         }
//         if (!formData.column_name || formData.column_name === '') {
//           throw new Error('Выберите колонку');
//         }
//       }
//
//       const dataToSend = { ...formData };
//
//       // Явно указываем какие поля преобразовывать
//       const fieldsToTransform = Object.keys(fieldConfig).filter(
//           key => fieldConfig[key]?.type === 'intField' ||
//               fieldConfig[key]?.type === 'floatField' ||
//               fieldConfig[key]?.type === 'checkList'
//       );
//
//       fieldsToTransform.forEach(key => {
//         const type = fieldConfig[key]?.type;
//         if (type === 'intField') {
//           dataToSend[key] = parseInt(dataToSend[key]) || 0;
//         } else if (type === 'floatField') {
//           dataToSend[key] = parseFloat(dataToSend[key]) || 0.0;
//         } else if (type === 'checkList') {
//           dataToSend[key] = Boolean(dataToSend[key]);
//         }
//       });
//
//       await axios.post("/flaskCuda/add_row/addRow",
//           { table_name, data: dataToSend },
//           { headers: { Authorization: `Bearer ${token}` } }
//       );
//
//       onSuccess();
//     } catch (err) {
//       setError(err.message || err.response?.data?.error || "Ошибка сохранения");
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   // if (Object.keys(fieldConfig).length === 0) {
//   //   return <div>Загрузка формы...</div>;
//   // }
//
//   return (
//       <ModalWin
//           title={`Добавление в ${table_name}`}
//           isOpen={isOpen}
//           onClose={onClose}
//           onSave={handleSave}
//           mode="add"
//           isLoading={loading}
//           error={error}
//       >
//         <div className="add-row-fields">
//           {error && <div className="error-message">{error}</div>}
//           {table_name === 'AccessToStatus' ? (
//               <>
//                 <ExtendTables
//                     key="extended-fields"
//                     token={token}
//                     selectedTable={formData.table_name}
//                     selectedColumn={formData.column_name}
//                     onTableChange={(val) => handleInputChange('table_name', val)}
//                     onColumnChange={(val) => handleInputChange('column_name', val)}
//                 />
//                 {Object.entries(fieldConfig)
//                     .filter(([field]) =>
//                         field !== 'table_name' &&
//                         field !== 'column_name'
//                     )
//                     .map(([field, config]) => (
//                         <PartitionEditBox
//                             key={field}
//                             fieldName={field}
//                             fieldValue={formData[field]}
//                             config={config}
//                             onChange={handleInputChange}
//                             disabled={loading}
//                         />
//                     ))
//                 }
//               </>
//           ) : (
//               Object.entries(fieldConfig).map(([field, config]) => (
//                   <PartitionEditBox
//                       key={field}
//                       fieldName={field}
//                       fieldValue={formData[field]}
//                       config={config}
//                       onChange={handleInputChange}
//                       disabled={loading}
//                   />
//               ))
//           )}
//         </div>
//       </ModalWin>
//   );
// };
//
// export default AddRowFunc;