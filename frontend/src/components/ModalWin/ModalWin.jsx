import React, { useEffect, useState } from 'react';
import './ModalWin.css';

const ModalWin = ({
  title,
  children,
  isOpen,
  onClose,
  onAction,
  actionStyle = 'blue',
  actionText = 'Подтвердить',
  isLoading = false,
  loadingText = 'Загрузка...',
  error = null,
  fieldsConfig = {},
  fieldsOrder = [],
  formData = {},
  onFieldChange = () => {}
}) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState({});
  const [dropdownOpenStates, setDropdownOpenStates] = useState({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      setIsDarkTheme(document.documentElement.getAttribute('data-theme') === 'dark');
    } else {
      document.body.style.overflow = 'auto';
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!isLoading && onClose) onClose();
  };

  const getOptionText = (option) => {
    if (typeof option === 'string') return option;
    if (typeof option === 'object' && option !== null) {
      return option.label || option.name || option.value || option.id || JSON.stringify(option);
    }
    return String(option);
  };

  const getOptionValue = (option) => {
    if (typeof option === 'string') return option;
    if (typeof option === 'object' && option !== null) {
      const value = option.value || option.id || option.name;
      return value !== undefined ? String(value) : JSON.stringify(option);
    }
    return String(option);
  };

  const getOptionKey = (option, index) => {
    if (typeof option === 'string') return option;
    if (typeof option === 'object' && option !== null) {
      const uniqueId = option.id || option.value || JSON.stringify(option);
      return uniqueId ? String(uniqueId) : `option_${index}`;
    }
    return `option_${index}`;
  };

  const toggleDropdown = (fieldName) => {
    setDropdownOpenStates(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const closeDropdown = (fieldName) => {
    setDropdownOpenStates(prev => ({
      ...prev,
      [fieldName]: false
    }));
  };

  const renderField = (fieldName) => {
    const config = fieldsConfig[fieldName];
    const value = formData[fieldName] ?? '';

    if (!config) return null;

    switch (config.type) {
      case 'inputField':
      case 'textField':
        return (
          <input
            className="modal-field-input"
            type="text"
            value={value}
            onChange={(e) => onFieldChange(fieldName, e.target.value)}
            disabled={isLoading}
          />
        );

      case 'intField':
        return (
          <input
            className="modal-field-input"
            type="number"
            value={value}
            onChange={(e) => onFieldChange(fieldName, parseInt(e.target.value) || 0)}
            disabled={isLoading}
            step="1"
          />
        );

      case 'floatField':
        return (
          <input
            className="modal-field-input"
            type="number"
            value={value}
            onChange={(e) => onFieldChange(fieldName, parseFloat(e.target.value) || 0)}
            disabled={isLoading}
            step="0.01"
          />
        );

      case 'dropField':
        const options = config.data?.list || [];
        // Используем currentValue из конфига для отображения
        const currentValue = config.data?.current;
        const isDisabled = isLoading || (config.depends_on && !formData[config.depends_on]);
        const searchTerm = dropdownSearch[fieldName] || '';
        const isDropdownOpen = dropdownOpenStates[fieldName] || false;

        const filteredOptions = searchTerm
          ? options.filter(option => {
            const text = getOptionText(option).toLowerCase();
            return text.includes(searchTerm.toLowerCase());
          })
          : options;

        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сравниваем как строки
        const selectedOption = options.find(opt =>
          String(getOptionValue(opt)) === String(currentValue)
        );

        return (
          <div className="modal-dropdown">
            <div
              className={`modal-dropdown-toggle ${isDisabled ? 'disabled' : ''}`}
              onClick={() => !isDisabled && toggleDropdown(fieldName)}
            >
              {selectedOption ? getOptionText(selectedOption) : '-- Выберите --'}
              <span className="modal-dropdown-arrow">▼</span>
            </div>

            {isDropdownOpen && !isDisabled && (
              <div className="dropdown-menu">
                <div className="dropdown-search">
                  <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchTerm}
                    onChange={(e) => setDropdownSearch(prev => ({...prev, [fieldName]: e.target.value}))}
                    className="search-input"
                    autoFocus
                  />
                </div>

                <div className="dropdown-options">
                  {filteredOptions.map((option, index) => {
                    const optionValue = getOptionValue(option);
                    const optionText = getOptionText(option);
                    const optionKey = getOptionKey(option, index);

                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сравниваем как строки
                    const isSelected = String(currentValue) === String(optionValue);

                    return (
                      <div
                        key={optionKey}
                        className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          onFieldChange(fieldName, optionValue);
                          closeDropdown(fieldName);
                          setDropdownSearch(prev => ({...prev, [fieldName]: ''}));
                        }}
                      >
                        {optionText}
                      </div>
                    );
                  })}

                  {filteredOptions.length === 0 && (
                    <div className="dropdown-no-results">Ничего не найдено</div>
                  )}
                </div>
              </div>
            )}

            {isDisabled && config.depends_on && (
              <div className="dependency-hint">
                Сначала выберите {fieldsConfig[config.depends_on]?.display}
              </div>
            )}
          </div>
        );

      case 'checkList':
      case 'booField':
        return (
          <label className="modal-checkbox">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onFieldChange(fieldName, e.target.checked)}
              disabled={isLoading}
            />
            <span className="modal-checkbox-label">{config.display}</span>
          </label>
        );

      case 'dateField':
        return (
          <input
            className="modal-field-input"
            type="date"
            value={value}
            onChange={(e) => onFieldChange(fieldName, e.target.value)}
            disabled={isLoading}
          />
        );

      case 'timeField':
        return (
          <input
            className="modal-field-input"
            type="time"
            value={value}
            onChange={(e) => onFieldChange(fieldName, e.target.value)}
            disabled={isLoading}
          />
        );

      case 'datetimeField':
        return (
          <input
            className="modal-field-input"
            type="datetime-local"
            value={value}
            onChange={(e) => onFieldChange(fieldName, e.target.value)}
            disabled={isLoading}
          />
        );

      default:
        return (
          <input
            className="modal-field-input"
            type="text"
            value={value}
            onChange={(e) => onFieldChange(fieldName, e.target.value)}
            disabled={isLoading}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`prefix-Dialog ${isOpen ? 'active' : ''} ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}>
      <div className="modal-content-wrapper">
        <a href="#close" className="prefix-close" onClick={handleClose}></a>
        <h2 className="modal-title">{title}</h2>

        <div className="prefix-tabs table_modal">
          {fieldsOrder.length > 0 ? (
            <div className="modal-content-form">
              {error && <div className="error-message">{error}</div>}
              {fieldsOrder.map(fieldName => {
                const config = fieldsConfig[fieldName];
                if (!config) return null;

                return (
                  <div key={fieldName} className="modal-field-group">
                    {config.type !== 'checkList' && config.type !== 'booField' && (
                      <label className="modal-field-label">
                        {config.display}
                      </label>
                    )}
                    {renderField(fieldName)}
                  </div>
                );
              })}
            </div>
          ) : (
            children
          )}
        </div>

        <div className="modal-footer">
          <button
            className={`action-button ${actionStyle}`}
            onClick={(e) => {
              e.preventDefault();
              onAction?.();
            }}
            disabled={isLoading}
          >
            {isLoading ? loadingText : actionText}
          </button>
          <button
            className="cancel-button"
            onClick={handleClose}
            disabled={isLoading}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalWin;