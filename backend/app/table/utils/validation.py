from datetime import datetime
from backend.app.extension import db


def validate_and_clean(data, model_class):
    """
    Валидирует и очищает данные перед сохранением в БД
    :param data: dict - данные для сохранения
    :param model_class: SQLAlchemy model class - класс модели для проверки типов
    :return: tuple (cleaned_data, errors) - очищенные данные и словарь ошибок
    """
    cleaned_data = {}
    errors = {}

    # Получаем информацию о колонках модели
    columns_info = {column.name: column for column in model_class.__table__.columns}

    for field_name, value in data.items():
        if field_name not in columns_info:
            continue  # Пропускаем поля, которых нет в модели

        column = columns_info[field_name]
        original_value = value

        # Обработка пустых значений
        if value == '':
            if column.nullable:
                cleaned_data[field_name] = None
                continue
            else:
                errors[field_name] = 'Поле не может быть пустым'
                continue

        # Валидация по типу данных
        try:
            if isinstance(column.type, (db.String, db.Text)):
                # Валидация строковых полей
                value = str(value).strip()
                max_length = getattr(column.type, 'length', None)

                if not value and not column.nullable:
                    errors[field_name] = 'Поле не может быть пустым'
                elif max_length and len(value) > max_length:
                    errors[field_name] = f'Максимальная длина {max_length} символов'
                else:
                    cleaned_data[field_name] = value

            elif isinstance(column.type, db.Integer):
                # Валидация целых чисел
                try:
                    cleaned_data[field_name] = int(value) if value is not None else None
                except (ValueError, TypeError):
                    errors[field_name] = 'Должно быть целым числом'

            elif isinstance(column.type, db.Float):
                # Валидация дробных чисел
                try:
                    cleaned_data[field_name] = float(value) if value is not None else None
                except (ValueError, TypeError):
                    errors[field_name] = 'Должно быть числом'

            elif isinstance(column.type, db.DateTime):
                # Валидация даты и времени
                try:
                    if isinstance(value, str):
                        cleaned_data[field_name] = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
                    else:
                        cleaned_data[field_name] = value
                except (ValueError, TypeError):
                    errors[field_name] = 'Неверный формат даты. Используйте ГГГГ-ММ-ДД ЧЧ:ММ:СС'

            elif isinstance(column.type, db.Date):
                # Валидация даты
                try:
                    if isinstance(value, str):
                        cleaned_data[field_name] = datetime.strptime(value, '%Y-%m-%d').date()
                    else:
                        cleaned_data[field_name] = value
                except (ValueError, TypeError):
                    errors[field_name] = 'Неверный формат даты. Используйте ГГГГ-ММ-ДД'

            elif isinstance(column.type, db.Boolean):
                # Валидация булевых значений
                if isinstance(value, str):
                    value = value.lower()
                    if value in ('true', '1', 't', 'y', 'yes'):
                        cleaned_data[field_name] = True
                    elif value in ('false', '0', 'f', 'n', 'no'):
                        cleaned_data[field_name] = False
                    else:
                        errors[field_name] = 'Должно быть true/false, 1/0, yes/no'
                else:
                    cleaned_data[field_name] = bool(value)

            else:
                # Для других типов просто сохраняем значение
                cleaned_data[field_name] = value

        except Exception as e:
            errors[field_name] = f'Ошибка валидации: {str(e)}'

    return cleaned_data, errors