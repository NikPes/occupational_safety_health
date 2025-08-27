import React from 'react';
import { formatFieldName, validateInput, formatDateForInput } from '../../utils/FieldUtils';
import './PartitionEditBox.css';

const PartitionEditBox = ({ fieldName, fieldValue, config, onChange, disabled }) => {
    const { type = 'inputField', display, options = [], required } = config || {};
    const displayName = display || formatFieldName(fieldName);
    const isInvalid = !validateInput(fieldValue, type);

    const handleChange = (e) => {
        let value;
        switch(type) {
            case 'checkList':
                value = Boolean(e.target.checked);
                break;
            case 'intField':
            case 'dropField': // Добавляем обработку dropField
                value = parseInt(e.target.value) || 0;
                break;
            case 'floatField':
                value = parseFloat(e.target.value) || 0;
                break;
            case 'dateField':
                value = e.target.value;
                break;
            default:
                value = e.target.value;
        }
        onChange(fieldName, value);
    };

    const renderField = () => {
        switch(type) {
            case 'dropField':
                return (
                    <select
                        value={fieldValue || ''}
                        onChange={handleChange}
                        disabled={disabled}
                        required={required}
                    >
                        <option value="">-- Select --</option>
                        {options.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name || item.id}
                            </option>
                        ))}
                    </select>
                );
            case 'checkList':
                return (
                    <label className="checkbox-container">
                        <input
                            type="checkbox"
                            checked={Boolean(fieldValue)} // Гарантированное boolean
                            onChange={handleChange}
                            disabled={disabled}
                            required={required}
                        />
                        <span className="checkmark"></span>
                        {displayName}
                    </label>
                );
            case 'dateField':
                return (
                    <input
                        type="date"
                        value={formatDateForInput(fieldValue)}
                        onChange={handleChange}
                        disabled={disabled}
                        required={required}
                        className={isInvalid ? 'invalid' : ''}
                    />
                );
            case 'intField':
            case 'floatField':
                return (
                    <input
                        type="number"
                        value={fieldValue ?? ''}
                        onChange={handleChange}
                        disabled={disabled}
                        required={required}
                        min={type === 'intField' ? '0' : undefined}
                        step={type === 'floatField' ? '0.01' : '1'}
                        className={isInvalid ? 'invalid' : ''}
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        value={fieldValue || ''}
                        onChange={handleChange}
                        disabled={disabled}
                        required={required}
                    />
                );
        }
    };

    return (
        <div className={`form-group ${type === 'checkList' ? 'checkbox-group' : ''}`}>
            {type !== 'checkList' && <label>{displayName}{required && <span className="required">*</span>}</label>}
            {renderField()}
            {isInvalid && type !== 'checkList' && (
                <div className="error-message">
                    {type === 'dateField'
                        ? 'Неверный формат даты (YYYY-MM-DD)'
                        : `Неверное значение для ${type === 'intField' ? 'целого числа' : 'числа'}`}
                </div>
            )}
        </div>
    );
};

export default PartitionEditBox;