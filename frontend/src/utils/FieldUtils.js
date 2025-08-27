export const formatFieldName = (name) => {
    if (!name) return '';
    return name
        .replace(/_/g, ' ')
        .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
        .replace(/\bId\b/g, 'ID');
};

export const validateInput = (value, fieldType) => {
    if (value === '' || value === null || value === undefined) return true;

    switch(fieldType) {
        case 'intField':
            return Number.isInteger(Number(value));
        case 'floatField':
            return !isNaN(parseFloat(value));
        case 'dateField':
            return !isNaN(Date.parse(value));
        default:
            return true;
    }
};

export const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch {
        return '';
    }
};