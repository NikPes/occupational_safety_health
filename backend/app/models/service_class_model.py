from flask import jsonify
from sqlalchemy.orm import joinedload
from backend.app.extension import db
import backend.app.models.base_table_model as base_table_mod
import backend.app.models.user_model as usr_mod
# import backend.models.currency_data_model as curr_mod
import backend.app.procedure.clear_name as clear_name


class ServiceClassModel:
    @staticmethod
    def get_current_user(identity):
        """Получение текущего пользователя по identity"""
        return usr_mod.User.query.filter_by(user_login=identity).first()

    @staticmethod
    def get_allowed_columns(table_name, current_user):
        """Получение разрешенных колонок для таблицы"""
        if current_user and hasattr(current_user, 'status_user') and current_user.status_user:
            user_permission = current_user.status_user.priority
        else:
            user_permission = 999

        return [
        a.column_name for a in
        base_table_mod.AccessToStatus.query.filter(
            base_table_mod.AccessToStatus.table_name == table_name,
            base_table_mod.AccessToStatus.required_permission >= user_permission
        ).all()
    ]

    @staticmethod
    def clean_master_order(master_order, allowed_columns):
        """Очистка master_order с учетом доступных колонок"""
        if not master_order:
            return allowed_columns  # Если порядок не задан, возвращаем все доступные поля

        # Фильтруем только разрешенные колонки, сохраняя порядок
        return [field for field in master_order if field in allowed_columns]

    @staticmethod
    def get_table_model(table_name):
        """Поиск модели по имени таблицы"""
        for model in db.Model.registry._class_registry.values():
            if hasattr(model, '__tablename__') and model.__tablename__ == table_name:
                return model
        return None

    @staticmethod
    def build_query_with_relations(model_class):
        """Построение запроса с подгрузкой отношений"""
        query = db.session.query(model_class)
        if hasattr(model_class, '__mapper__'):
            for rel in model_class.__mapper__.relationships:
                relationship_attr = getattr(model_class, rel.key)
                query = query.options(joinedload(relationship_attr))
        return query

    @staticmethod
    def get_edit_access(table_name, current_user):
        """Проверка прав на редактирование"""
        if current_user and hasattr(current_user, 'status_user') and current_user.status_user:
            user_permission = current_user.status_user.priority
        else:
            user_permission = 999

        access_records = base_table_mod.AccessToStatus.query.filter(
            base_table_mod.AccessToStatus.table_name == table_name,
            base_table_mod.AccessToStatus.required_permission >= user_permission
        ).join(
            base_table_mod.STDLevelAccess,
            base_table_mod.AccessToStatus.id_level_access == base_table_mod.STDLevelAccess.id
        ).add_columns(
            base_table_mod.STDLevelAccess.std_level_access
        ).all()

        for record in access_records:
            if record.std_level_access in ['Full access', 'Edit access']:
                return record.std_level_access
        return None

    @staticmethod
    def serialize_item(item, allowed_columns, edit_access=None):
        """Сериализация элемента с учетом прав доступа"""
        row_data = {}

        # Базовые поля
        for column in item.__table__.columns:
            if column.name in allowed_columns:
                row_data[column.name] = getattr(item, column.name)

        # Связанные данные
        if hasattr(item, '__mapper__'):
            for rel in item.__mapper__.relationships:
                fk_column = rel.local_remote_pairs[0][0].key
                if fk_column in allowed_columns:
                    related = getattr(item, rel.key)
                    if related is not None:
                        data_key = f"{fk_column}_data"
                        row_data[data_key] = (
                            [r.to_relation_dict() for r in related]
                            if isinstance(related, list)
                            else related.to_relation_dict()
                        )

        if edit_access:
            row_data['_edit_access'] = edit_access

        return row_data

    @classmethod
    def get_paginated_data(cls,
                           table_name,
                           user_identity,
                           page=1,
                           per_page=30,
                           sort_by=None,
                           sort_order='asc',
                           search=None):
        """Полная обработка запроса данных таблицы"""
        from sqlalchemy import or_, and_, String, Text, cast
        from sqlalchemy.sql import exists

        # 1. Валидация и получение пользователя
        current_user = cls.get_current_user(user_identity)
        if not current_user:
            return {"error": "User not found"}, 404

        # 2. Получение разрешенных колонок
        allowed_columns = cls.get_allowed_columns(table_name, current_user)
        if not allowed_columns:
            return {"rows": [], "totalPages": 0}, 200

        # 3. Поиск модели
        model_class = cls.get_table_model(table_name)
        if not model_class:
            return {"error": f"Table {table_name} not found"}, 404

        # 4. Построение базового запроса
        query = cls.build_query_with_relations(model_class)

        # 5. Добавление условий поиска
        if search:
            search_terms = search.strip().split()
            term_conditions = []

            for term in search_terms:
                term = f"%{term}%"
                field_conditions = []

                # Поиск по полям основной таблицы
                for column in model_class.__table__.columns:
                    if column.name in allowed_columns:
                        if isinstance(column.type, (String, Text)):
                            field_conditions.append(column.ilike(term))
                        else:
                            field_conditions.append(cast(column, Text).ilike(term))

                # Поиск по связанным таблицам
                if hasattr(model_class, '__mapper__'):
                    for rel in model_class.__mapper__.relationships:
                        if rel.key.endswith('_data'):  # Пропускаем технические поля
                            continue

                        related_model = rel.mapper.class_
                        related_columns = [col for col in related_model.__table__.columns
                                           if isinstance(col.type, (String, Text))]

                        if related_columns:
                            # Получаем имя поля внешнего ключа
                            fk_column = rel.local_remote_pairs[0][0].key

                            # Создаем условия поиска по каждому строковому полю связанной таблицы
                            rel_conditions = [col.ilike(term) for col in related_columns]

                            # Создаем подзапрос для проверки связи
                            subq = exists().where(
                                and_(
                                    getattr(model_class, fk_column) == related_model.id,
                                    or_(*rel_conditions)
                                )
                            )
                            field_conditions.append(subq)

                if field_conditions:
                    term_conditions.append(or_(*field_conditions))

            if term_conditions:
                query = query.filter(and_(*term_conditions))

        # 6. Добавление сортировки
        if sort_by and sort_by in allowed_columns:
            column = getattr(model_class, sort_by)
            if sort_order == 'asc':
                query = query.order_by(column.asc())
            else:
                query = query.order_by(column.desc())

        # 7. Пагинация
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)

        # 8. Проверка прав
        edit_access = cls.get_edit_access(table_name, current_user)

        # 9. Сериализация результатов
        rows = [cls.serialize_item(item, allowed_columns, edit_access)
                for item in paginated.items]

        return {
            "rows": rows,
            "edit_access": edit_access,
            "totalPages": paginated.pages,
            "currentPage": page,
            "perPage": per_page,
            "totalCount": paginated.total,
            "meta": {
                "relations": [
                    rel.key for rel in model_class.__mapper__.relationships
                ] if hasattr(model_class, '__mapper__') else []
            }
        }

    # @staticmethod
    # def get_relation_options(relation_model, current_id=None):
    #     """Получение вариантов для выпадающего списка"""
    #     if not hasattr(relation_model, '__query__'):
    #         # Если модель не имеет query, используем session.query
    #         items = db.session.query(relation_model).all()
    #     else:
    #         items = relation_model.query.all()
    #
    #     result = {"list": []}
    #
    #     if current_id:
    #         # Находим текущий элемент
    #         current_item = next((item for item in items if item.id == current_id), None)
    #         if current_item:
    #             result["list"].append(current_item.to_relation_dict())
    #
    #     # Добавляем остальные элементы
    #     for item in items:
    #         if not current_id or item.id != current_id:
    #             result["list"].append(item.to_relation_dict())
    #
    #     return result

    @staticmethod
    def serialize_for_edit(item, allowed_columns):
        """Специальная сериализация для формы редактирования"""
        row_data = {}

        # Базовые поля
        for column in item.__table__.columns:
            if column.name in allowed_columns:
                row_data[column.name] = getattr(item, column.name)

        # Связанные данные в новом формате
        if hasattr(item, '__mapper__'):
            for rel in item.__mapper__.relationships:
                fk_column = rel.local_remote_pairs[0][0].key
                if fk_column in allowed_columns:
                    current_id = getattr(item, fk_column)
                    related_model = rel.mapper.class_
                    row_data[f"{fk_column}_data"] = WorksModel.get_relation_options(
                        related_model,
                        current_id
                    )

        return row_data

    @classmethod
    def get_edit_data(cls, table_name, record_id, user_identity):
        """Получение данных для редактирования записи с сортировкой по master_order"""
        # 1. Получение текущего пользователя
        current_user = cls.get_current_user(user_identity)
        if not current_user:
            return None, jsonify({"error": "User not found"}), 404

        # 2. Проверка доступных колонок (исключаем id)
        allowed_columns = [
            col for col in cls.get_allowed_columns(table_name, current_user.id_status_user)
            # if col != 'id'
        ]
        if not allowed_columns:
            return None, jsonify({"error": "No access to this table"}), 403

        # 3. Поиск модели таблицы
        model_class = cls.get_table_model(table_name)
        if not model_class:
            return None, jsonify({"error": f"Table {table_name} not found"}), 404

        # 4. Получение записи
        record = model_class.query.get(record_id)
        if not record:
            return None, jsonify({"error": "Record not found"}), 404

        # 5. Получаем и очищаем master_order
        raw_master_order = getattr(model_class, 'master_order', None)
        master_order = cls.clean_master_order(raw_master_order,
                                              allowed_columns) if raw_master_order else allowed_columns

        # 6. Собираем данные
        data = {}

        # Сначала добавляем основные поля
        for column_name in master_order:
            if hasattr(record, column_name):
                data[column_name] = getattr(record, column_name)

        # 7. Получаем метаданные полей
        columns_info = db.session.query(
            base_table_mod.AccessToStatus.column_name,
            base_table_mod.AccessToStatus.column_name_show,
            base_table_mod.STDTypeField.std_type_field,
            base_table_mod.STDTypeField.id.label('type_id')
        ).join(
            base_table_mod.STDTypeField,
            base_table_mod.AccessToStatus.id_std_type_field == base_table_mod.STDTypeField.id
        ).filter(
            base_table_mod.AccessToStatus.table_name == table_name,
            base_table_mod.AccessToStatus.id_user_status == current_user.id_status_user,
            base_table_mod.AccessToStatus.column_name.in_(allowed_columns)
        ).all()

        # 8. Добавляем метаданные и связанные данные
        for col in columns_info:
            # Отображаемые имена
            data[f"{col.column_name}_display"] = col.column_name_show or clear_name.format_display_field_name(
                col.column_name)

            # Типы полей
            data[f"{col.column_name}_type"] = col.std_type_field

            # Обработка выпадающих списков
            if col.std_type_field == 'dropField':
                relation_model = None

                # Получаем объект колонки безопасным способом
                column_obj = record.__table__.columns.get(col.column_name)

                # Проверяем наличие foreign_keys
                if column_obj is not None and column_obj.foreign_keys:
                    for fk in column_obj.foreign_keys:
                        relation_model = cls.get_table_model(fk.column.table.name)
                        break

                # Специальные случаи
                if not relation_model:
                    if table_name == 'AccessToStatus':
                        if col.column_name == 'id_std_type_field':
                            relation_model = base_table_mod.STDTypeField
                        elif col.column_name == 'id_level_access':
                            relation_model = base_table_mod.STDLevelAccess
                        elif col.column_name == 'id_user_status':
                            relation_model = usr_mod.STDStatusUser
                    elif table_name == 'User' and col.column_name == 'id_status_user':
                        relation_model = usr_mod.STDStatusUser

                if relation_model:
                    data[f"{col.column_name}_data"] = cls.get_relation_options(
                        relation_model,
                        getattr(record, col.column_name, None)
                    )

        return {
            'fields_data': data,
            'master_order': master_order
        }


    @classmethod
    def get_relation_options(cls, model, current_value=None, extra_condition=None):
        """Универсальный метод для получения вариантов выпадающего списка"""
        query = model.query
        if extra_condition:
            query = query.filter(extra_condition)

        items = query.all()
        options = []
        current_option = None

        for item in items:
            name = None

            # 1. Пробуем get_display_name()
            if hasattr(item, 'get_display_name'):
                name = item.get_display_name()

            # 2. Если get_display_name() не вернул значение, пробуем __repr__()
            if name is None:
                repr_str = repr(item)
                if not (repr_str.startswith('<') and repr_str.endswith('>')):
                    name = repr_str

            # 3. Автоматический поиск поля
            if name is None:
                name = cls._auto_detect_display_value(item)

            option = {'id': item.id, 'name': str(name) if name else f"Item #{item.id}"}

            if current_value is not None and item.id == current_value:
                current_option = option
            else:
                options.append(option)

        return {
            'list': [current_option] + options if current_option else options,
            'current': current_value
        }

    @classmethod
    def _auto_detect_display_value(cls, item):
        """Автоматически определяет значение для отображения"""
        # 1. Проверяем стандартные имена полей
        for attr in ['name', 'title', 'username', 'email', 'item_name', 'page_name',
                     'std_status_user', 'std_type_field', 'std_level_access']:
            if hasattr(item, attr):
                val = getattr(item, attr)
                if val is not None:
                    return val

        # 2. Ищем строковые столбцы
        for column in item.__table__.columns:
            if (isinstance(column.type, (db.String, db.Text)) and
                    column.name != 'id' and
                    getattr(item, column.name) is not None):
                return getattr(item, column.name)

        # 3. Возвращаем первый не-ID атрибут
        for column in item.__table__.columns:
            if column.name != 'id':
                val = getattr(item, column.name)
                if val is not None:
                    return str(val)

        return None

    @classmethod
    def special_edit_processing(cls, record, allowed_columns, table_name, user_status_id):
        """Специальная обработка для AccessToStatus и User"""
        data = cls.serialize_for_edit(record, allowed_columns)

        # Получаем полную информацию о колонках
        columns_info = db.session.query(
            base_table_mod.AccessToStatus.column_name,
            base_table_mod.AccessToStatus.column_name_show,
            base_table_mod.STDTypeField.std_type_field,
            base_table_mod.STDTypeField.id.label('type_id')
        ).join(
            base_table_mod.STDTypeField,
            base_table_mod.AccessToStatus.id_std_type_field == base_table_mod.STDTypeField.id
        ).filter(
            base_table_mod.AccessToStatus.table_name == table_name,
            base_table_mod.AccessToStatus.id_user_status == user_status_id
        ).all()

        # Добавляем метаданные полей
        data['_fields_meta'] = {
            col.column_name: {
                'display_name': col.column_name_show or clear_name.format_display_field_name(col.column_name),
                'field_type': col.std_type_field,
                'type_id': col.type_id
            }
            for col in columns_info
            if col.column_name in allowed_columns
        }

        # Обработка связанных данных
        if table_name == 'AccessToStatus':
            relations = {
                'id_std_type_field': base_table_mod.STDTypeField,
                'id_level_access': base_table_mod.STDLevelAccess,
                'id_user_status': usr_mod.STDStatusUser
            }
            for field, model in relations.items():
                if field in allowed_columns:
                    data[f"{field}_data"] = cls.get_relation_options(
                        model,
                        getattr(record, field, None)
                    )

        elif table_name == 'User':
            if 'id_status_user' in allowed_columns:
                data['id_status_user_data'] = cls.get_relation_options(
                    usr_mod.STDStatusUser,
                    getattr(record, 'id_status_user', None)
                )

        return data, None, None

    # ...........................................................................................
    @classmethod
    def get_add_data(cls, table_name, user_identity):
        """Получение данных для формы добавления"""
        # 1. Получение текущего пользователя
        current_user = cls.get_current_user(user_identity)
        if not current_user:
            return None, jsonify({"error": "User not found"}), 404

        # 2. Проверка прав доступа (только Full access может добавлять)
        access_records = db.session.query(
            base_table_mod.AccessToStatus,
            base_table_mod.STDLevelAccess
        ).join(
            base_table_mod.STDLevelAccess,
            base_table_mod.AccessToStatus.id_level_access == base_table_mod.STDLevelAccess.id
        ).filter(
            base_table_mod.AccessToStatus.table_name == table_name,
            base_table_mod.AccessToStatus.id_user_status == current_user.id_status_user
        ).all()

        has_full_access = any(access.STDLevelAccess.std_level_access == 'Full access'
                              for access in access_records)
        if not has_full_access:
            return None, jsonify({"error": "No permission to add records"}), 403

        # 3. Поиск модели таблицы
        model_class = cls.get_table_model(table_name)
        if not model_class:
            return None, jsonify({"error": f"Table {table_name} not found"}), 404

        # 4. Получаем разрешенные колонки (исключая id)
        allowed_columns = [
            col for col in cls.get_allowed_columns(table_name, current_user.id_status_user)
            if col != 'id'
        ]

        # 5. Получаем master_order
        raw_master_order = getattr(model_class, 'master_order', None)
        master_order = cls.clean_master_order(raw_master_order,
                                              allowed_columns) if raw_master_order else allowed_columns

        # 6. Собираем метаданные полей
        data = {}
        columns_info = db.session.query(
            base_table_mod.AccessToStatus.column_name,
            base_table_mod.AccessToStatus.column_name_show,
            base_table_mod.STDTypeField.std_type_field
        ).join(
            base_table_mod.STDTypeField,
            base_table_mod.AccessToStatus.id_std_type_field == base_table_mod.STDTypeField.id
        ).filter(
            base_table_mod.AccessToStatus.table_name == table_name,
            base_table_mod.AccessToStatus.id_user_status == current_user.id_status_user,
            base_table_mod.AccessToStatus.column_name.in_(allowed_columns)
        ).all()

        for col in columns_info:
            # Отображаемые имена
            data[f"{col.column_name}_display"] = col.column_name_show or clear_name.format_display_field_name(
                col.column_name)

            # Типы полей
            data[f"{col.column_name}_type"] = col.std_type_field

            # Обработка выпадающих списков
            if col.std_type_field == 'dropField':
                relation_model = None
                column_obj = model_class.__table__.columns.get(col.column_name)

                if column_obj is not None and column_obj.foreign_keys:
                    for fk in column_obj.foreign_keys:
                        relation_model = cls.get_table_model(fk.column.table.name)
                        break

                # Специальные случаи
                if not relation_model:
                    if table_name == 'AccessToStatus':
                        if col.column_name == 'id_std_type_field':
                            relation_model = base_table_mod.STDTypeField
                        elif col.column_name == 'id_level_access':
                            relation_model = base_table_mod.STDLevelAccess
                        elif col.column_name == 'id_user_status':
                            relation_model = usr_mod.STDStatusUser
                    elif table_name == 'User' and col.column_name == 'id_status_user':
                        relation_model = usr_mod.STDStatusUser

                if relation_model:
                    data[f"{col.column_name}_data"] = cls.get_relation_options(relation_model)

        return {
            'fields_data': data,
            'master_order': master_order
        }, None, None