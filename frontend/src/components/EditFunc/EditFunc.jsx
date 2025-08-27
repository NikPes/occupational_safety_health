import React, { useState } from 'react';
import axios from 'axios';
import ModalWin from '../ModalWin/ModalWin';
import EditDelButtons from '../EditDelButtons/EditDelButtons';
import PartitionEditBox from '../PartitionEditBox/PartitionEditBox';
import ExtendTables from '../ExtendTables/ExtendTables';
import './EditFunc.css';

const EditFunc = ({ id, table_name, token, onDataUpdated, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [fieldConfig, setFieldConfig] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);



    const handleEdit = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/flaskCuda/edit_del/getToEdit", {
                headers: { Authorization: `Bearer ${token}` },
                params: { table_name, id }
            });

            const { fields_data, master_order } = response.data;
            const initialFormData = {};
            const initialFieldConfig = {};

            master_order.forEach(fieldName => {
                // Исправленная инициализация значений
                if (fields_data[`${fieldName}_type`] === 'checkList') {
                    initialFormData[fieldName] = fields_data[fieldName] === '' ? false : Boolean(fields_data[fieldName]);
                } else if (fields_data[`${fieldName}_type`] === 'timeField' && fields_data[fieldName]) {
                    // Форматирование времени для timeField
                    const timeValue = fields_data[fieldName];
                    initialFormData[fieldName] = typeof timeValue === 'string' ? timeValue :
                        new Date(timeValue).toTimeString().slice(0, 5);
                } else {
                    initialFormData[fieldName] = fields_data[fieldName] || '';
                }

                initialFieldConfig[fieldName] = {
                    display: fields_data[`${fieldName}_display`] || fieldName,
                    type: fields_data[`${fieldName}_type`] || 'inputField',
                    options: fields_data[`${fieldName}_data`]?.list || []
                };
            });

            setFormData(initialFormData);
            setFieldConfig(initialFieldConfig);
            setIsModalOpen(true);
        } catch (error) {
            setError(error.response?.data?.error || error.message);
        } finally {
            setLoading(false);
        }
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

            // Явное преобразование полей по fieldConfig
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

            // Отправка запроса для редактирования (отличается от AddRow!)
            await axios.post(
                "/flaskCuda/edit_del/saveOfEdit",
                { table_name, id, data: dataToSend }, // id обязателен для редактирования
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setIsModalOpen(false);
            if (onDataUpdated) onDataUpdated(); // Колбэк после успешного обновления
        } catch (err) {
            setError(err.message || err.response?.data?.error || "Ошибка сохранения");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <>
            <EditDelButtons
                access_type={onDelete ? 'Full access' : 'Edit access'}
                onEdit={handleEdit}
                onDelete={onDelete}
            />
            <ModalWin
                title={`Редактируем ${table_name}`}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAction={handleSave}
                actionText="Сохранить"
                actionStyle="blue"
                isLoading={loading}
                loadingText="Сохранение..."
                error={error}
            >
                <div className="edit-func-container">
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
                            {Object.entries(formData)
                                .filter(([fieldName]) =>
                                    fieldName !== 'table_name' &&
                                    fieldName !== 'column_name' &&
                                    fieldName !== 'id'
                                )
                                .map(([fieldName, fieldValue]) => (
                                    <PartitionEditBox
                                        key={fieldName}
                                        fieldName={fieldName}
                                        fieldValue={fieldValue}
                                        config={fieldConfig[fieldName]}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                    />
                                ))
                            }
                        </>
                    ) : (
                        Object.entries(formData).filter(([fieldName]) => fieldName !== 'id')
                            .map(([fieldName, fieldValue]) => (
                            <PartitionEditBox
                                key={fieldName}
                                fieldName={fieldName}
                                fieldValue={fieldValue}
                                config={fieldConfig[fieldName]}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        ))
                    )}
                </div>
            </ModalWin>
        </>
    );
};

export default EditFunc;


// import React, { useState } from 'react';
// import axios from 'axios';
// import ModalWin from '../ModalWin/ModalWin';
// import EditDelButtons from '../EditDelButtons/EditDelButtons';
// import PartitionEditBox from '../PartitionEditBox/PartitionEditBox';
// import ExtendTables from '../ExtendTables/ExtendTables';
// import './EditFunc.css';
//
// const EditFunc = ({ id, table_name, token, onDataUpdated, onDelete }) => {
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [formData, setFormData] = useState({});
//     const [fieldConfig, setFieldConfig] = useState({});
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);
//
//     const handleEdit = async () => {
//         setLoading(true);
//
//         console.log(table_name, id)
//         try {
//             const response = await axios.get("/flaskCuda/edit_del/getToEdit", {
//                 headers: { Authorization: `Bearer ${token}` },
//                 params: { table_name, id }
//             });
//
//             const { fields_data, master_order } = response.data;
//             const initialFormData = {};
//             const initialFieldConfig = {};
//
//             master_order.forEach(fieldName => {
//                 // Исправленная инициализация значений
//                 if (fields_data[`${fieldName}_type`] === 'checkList') {
//                     initialFormData[fieldName] = fields_data[fieldName] === '' ? false : Boolean(fields_data[fieldName]);
//                 } else {
//                     initialFormData[fieldName] = fields_data[fieldName] || '';
//                 }
//
//                 initialFieldConfig[fieldName] = {
//                     display: fields_data[`${fieldName}_display`] || fieldName,
//                     type: fields_data[`${fieldName}_type`] || 'inputField',
//                     options: fields_data[`${fieldName}_data`]?.list || []
//                 };
//             });
//
//             setFormData(initialFormData);
//             setFieldConfig(initialFieldConfig);
//             setIsModalOpen(true);
//         } catch (error) {
//             setError(error.response?.data?.error || error.message);
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const handleSave = async () => {
//         setLoading(true);
//         setError(null);
//
//         try {
//             // Валидация для AccessToStatus
//             if (table_name === 'AccessToStatus') {
//                 if (!formData.table_name || formData.table_name === '') {
//                     throw new Error('Выберите таблицу');
//                 }
//                 if (!formData.column_name || formData.column_name === '') {
//                     throw new Error('Выберите колонку');
//                 }
//             }
//
//             const dataToSend = { ...formData };
//
//             // Явное преобразование полей по fieldConfig
//             const fieldsToTransform = Object.keys(fieldConfig).filter(
//                 key => fieldConfig[key]?.type === 'intField' ||
//                     fieldConfig[key]?.type === 'floatField' ||
//                     fieldConfig[key]?.type === 'checkList'
//             );
//
//             fieldsToTransform.forEach(key => {
//                 const type = fieldConfig[key]?.type;
//                 if (type === 'intField') {
//                     dataToSend[key] = parseInt(dataToSend[key]) || 0;
//                 } else if (type === 'floatField') {
//                     dataToSend[key] = parseFloat(dataToSend[key]) || 0.0;
//                 } else if (type === 'checkList') {
//                     dataToSend[key] = Boolean(dataToSend[key]);
//                 }
//             });
//
//             // Отправка запроса для редактирования (отличается от AddRow!)
//             await axios.post(
//                 "/flaskCuda/edit_del/saveOfEdit",
//                 { table_name, id, data: dataToSend }, // id обязателен для редактирования
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//
//             setIsModalOpen(false);
//             if (onDataUpdated) onDataUpdated(); // Колбэк после успешного обновления
//         } catch (err) {
//             setError(err.message || err.response?.data?.error || "Ошибка сохранения");
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const handleInputChange = (field, value) => {
//         setFormData(prev => ({ ...prev, [field]: value }));
//     };
//
//     return (
//         <>
//             <EditDelButtons
//                 access_type={onDelete ? 'Full access' : 'Edit access'}
//                 onEdit={handleEdit}
//                 onDelete={onDelete}
//             />
//
//             <ModalWin
//                 title={`Редактируем ${table_name}`}
//                 isOpen={isModalOpen}
//                 onClose={() => setIsModalOpen(false)}
//                 onSave={handleSave}
//                 mode="edit"
//                 isLoading={loading}
//                 error={error}
//             >
//                 <div className="edit-func-container">
//                     {error && <div className="error-message">{error}</div>}
//                     {table_name === 'AccessToStatus' ? (
//                         <>
//                             <ExtendTables
//                                 key="extended-fields"
//                                 token={token}
//                                 selectedTable={formData.table_name}
//                                 selectedColumn={formData.column_name}
//                                 onTableChange={(val) => handleInputChange('table_name', val)}
//                                 onColumnChange={(val) => handleInputChange('column_name', val)}
//                             />
//                             {Object.entries(formData)
//                                 .filter(([fieldName]) =>
//                                     fieldName !== 'table_name' &&
//                                     fieldName !== 'column_name' &&
//                                     fieldName !== 'id'
//                                 )
//                                 .map(([fieldName, fieldValue]) => (
//                                     <PartitionEditBox
//                                         key={fieldName}
//                                         fieldName={fieldName}
//                                         fieldValue={fieldValue}
//                                         config={fieldConfig[fieldName]}
//                                         onChange={handleInputChange}
//                                         disabled={loading}
//                                     />
//                                 ))
//                             }
//                         </>
//                     ) : (
//                         Object.entries(formData).filter(([fieldName]) => fieldName !== 'id')
//                             .map(([fieldName, fieldValue]) => (
//                             <PartitionEditBox
//                                 key={fieldName}
//                                 fieldName={fieldName}
//                                 fieldValue={fieldValue}
//                                 config={fieldConfig[fieldName]}
//                                 onChange={handleInputChange}
//                                 disabled={loading}
//                             />
//                         ))
//                     )}
//                 </div>
//             </ModalWin>
//         </>
//     );
// };
//
// export default EditFunc;