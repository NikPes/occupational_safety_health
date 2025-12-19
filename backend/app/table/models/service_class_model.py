from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from sqlalchemy.orm import joinedload

from backend.app.extension import db
import backend.app.user.models.access_table_model as access_table_mod
import backend.app.user.models.service_class_model as user_service
import backend.app.base.utils.clear_name as clear_name
import backend.app.user.models.user_model as usr_mod

import backend.app.dependencies.config.field_dependencies as dependencies_conf


class ServiceClassModel:
    @staticmethod
    def get_allowed_columns(table_name, current_user):
        """Получение разрешенных колонок для таблицы на основе priority_permission"""
        if not current_user:
            user_priority = 999
        else:
            user_priority = current_user.priority_permission

        # ROOT доступ - возвращаем все колонки таблицы
        if user_priority == 0 and current_user.user_login == 'root':
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            columns = inspector.get_columns(table_name)

            return [col['name'] for col in columns]

        # Обычные пользователи - только разрешенные колонки
        return [
            a.column_name for a in
            access_table_mod.AccessToStatus.query.filter(
                access_table_mod.AccessToStatus.table_name == table_name,
                access_table_mod.AccessToStatus.required_permission >= user_priority
            ).all()
        ]

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
    def clean_master_order(master_order, allowed_columns):
        """Очистка master_order с учетом доступных колонок"""
        if not master_order:
            return allowed_columns  # Если порядок не задан, возвращаем все доступные поля

        # Фильтруем только разрешенные колонки, сохраняя порядок
        return [field for field in master_order if field in allowed_columns]

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
    def serialize_for_edit(cls, item, allowed_columns):
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
                    row_data[f"{fk_column}_data"] = cls.get_relation_options(
                        related_model,
                        current_id
                    )

        return row_data

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

    @staticmethod
    def get_edit_access(table_name, current_user):
        """Проверка прав на редактирование на основе priority_permission"""
        if not current_user:
            user_priority = 999
        else:
            user_priority = current_user.priority_permission

        # ROOT доступ - полный доступ ко всем таблицам
        if user_priority == 0 and hasattr(current_user, 'user_login') and current_user.user_login == 'root':
            return 'Full access'

        # Для таблицы AccessToStatus - специальная обработка
        if table_name == 'AccessToStatus' or table_name == access_table_mod.AccessToStatus.__tablename__:
            # Только root может редактировать таблицу прав доступа
            if user_priority == 0 and hasattr(current_user, 'user_login') and current_user.user_login == 'root':
                return 'Full access'
            else:
                return None

        # Обычные пользователи и другие таблицы
        access_records = access_table_mod.AccessToStatus.query.filter(
            access_table_mod.AccessToStatus.table_name == table_name,
            access_table_mod.AccessToStatus.required_permission >= user_priority
        ).join(
            access_table_mod.STDLevelAccess,
            access_table_mod.AccessToStatus.id_level_access == access_table_mod.STDLevelAccess.id
        ).add_columns(
            access_table_mod.STDLevelAccess.std_level_access
        ).all()

        for record in access_records:
            if record.std_level_access in ['Full access', 'Edit access']:
                return record.std_level_access
        return None

    @staticmethod
    def get_table_model(table_name):
        """Поиск модели по имени таблицы"""
        for model in db.Model.registry._class_registry.values():
            if hasattr(model, '__tablename__') and model.__tablename__ == table_name:
                return model
        return None

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
        current_user = user_service.ServiceClassModel.get_current_user(get_jwt_identity())
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

    @classmethod
    def special_edit_processing(cls, record, allowed_columns, table_name, user_priority):
        """Специальная обработка для AccessToStatus и User"""
        data = cls.serialize_for_edit(record, allowed_columns)

        # Получаем полную информацию о колонках
        columns_info = db.session.query(
            access_table_mod.AccessToStatus.column_name,
            access_table_mod.AccessToStatus.column_name_show,
            access_table_mod.STDTypeField.std_type_field,
            access_table_mod.STDTypeField.id.label('type_id')
        ).join(
            access_table_mod.STDTypeField,
            access_table_mod.AccessToStatus.id_std_type_field == access_table_mod.STDTypeField.id
        ).filter(
            access_table_mod.AccessToStatus.table_name == table_name,
            access_table_mod.AccessToStatus.required_permission >= user_priority  # Изменено
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
                'id_std_type_field': access_table_mod.STDTypeField,
                'id_level_access': access_table_mod.STDLevelAccess,
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

    @staticmethod
    def get_all_table_names():
        """Получение всех имен таблиц из базы данных"""
        try:
            # Для SQLAlchemy 1.4+
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            all_tables = inspector.get_table_names()

            # # Отладочная информация
            # print(f"=== DEBUG: Database tables ===")
            # print(f"Total tables found: {len(all_tables)}")
            # for i, table in enumerate(sorted(all_tables), 1):
            #     print(f"{i:3d}. {table}")
            # print("==============================")

            return all_tables

        except Exception as e:
            print(f"Error getting table names: {e}")
            return []

    # ...........................................................................................
    @classmethod
    def get_add_data(cls, table_name, user_identity):
        """Получение данных для формы добавления"""
        # 1. Получение текущего пользователя
        current_user = user_service.ServiceClassModel.get_current_user(user_identity)
        if not current_user:
            return None, jsonify({"error": "User not found"}), 404

        # 2. Проверка прав доступа (только Full access может добавлять)
        user_priority = getattr(current_user, 'priority_permission', 999)
        if user_priority is None:
            user_priority = 999

        access_records = db.session.query(
            access_table_mod.AccessToStatus,
            access_table_mod.STDLevelAccess
        ).join(
            access_table_mod.STDLevelAccess,
            access_table_mod.AccessToStatus.id_level_access == access_table_mod.STDLevelAccess.id
        ).filter(
            access_table_mod.AccessToStatus.table_name == table_name,
            access_table_mod.AccessToStatus.required_permission >= user_priority
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
            col for col in cls.get_allowed_columns(table_name, current_user)
            if col != 'id'
        ]

        # 5. Получаем master_order
        raw_master_order = getattr(model_class, 'master_order', None)
        master_order = cls.clean_master_order(raw_master_order,
                                              allowed_columns) if raw_master_order else allowed_columns

        # 6. Собираем метаданные полей
        data = {}
        columns_info = db.session.query(
            access_table_mod.AccessToStatus.column_name,
            access_table_mod.AccessToStatus.column_name_show,
            access_table_mod.STDTypeField.std_type_field
        ).join(
            access_table_mod.STDTypeField,
            access_table_mod.AccessToStatus.id_std_type_field == access_table_mod.STDTypeField.id
        ).filter(
            access_table_mod.AccessToStatus.table_name == table_name,
            access_table_mod.AccessToStatus.required_permission >= user_priority,
            access_table_mod.AccessToStatus.column_name.in_(allowed_columns)
        ).all()

        for col in columns_info:
            # Отображаемые имена
            data[f"{col.column_name}_display"] = col.column_name_show or clear_name.format_display_field_name(
                col.column_name)

            # Типы полей
            data[f"{col.column_name}_type"] = col.std_type_field

            # Обработка выпадающих списков
            if col.std_type_field == 'dropField':
                # Специальная обработка для table_name в AccessToStatus
                if table_name == 'AccessToStatus' and col.column_name == 'table_name':
                    # Получаем все имена таблиц из базы данных
                    table_names = cls.get_all_table_names()
                    table_names = [name for name in table_names if
                                   not name.startswith('_')]  # Исключаем системные таблицы
                    data[f"{col.column_name}_data"] = {
                        'list': [{'id': name, 'name': name} for name in table_names],
                        'current': None
                    }
                    continue

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
                            relation_model = access_table_mod.STDTypeField
                        elif col.column_name == 'id_level_access':
                            relation_model = access_table_mod.STDLevelAccess
                        # required_permission - это число, не требует выпадающего списка
                    elif table_name == 'User':
                        if col.column_name == 'id_std_status_user':
                            relation_model = usr_mod.STDStatusUser
                        # priority_permission - это число, не требует выпадающего списка

                if relation_model:
                    data[f"{col.column_name}_data"] = cls.get_relation_options(relation_model)

        dependencies = dependencies_conf.get_dependencies_for_table(table_name)
        if dependencies:
            data['_dependencies'] = dependencies

        return {
            'fields_data': data,
            'master_order': master_order
        }, None, None

    @classmethod
    def get_edit_data(cls, table_name, record_id, user_identity):
        """Получение данных для редактирования записи с сортировкой по master_order"""
        # 1. Получение текущего пользователя
        current_user = user_service.ServiceClassModel.get_current_user(user_identity)
        if not current_user:
            return None, jsonify({"error": "User not found"}), 404

        # 2. Проверка доступных колонок через новый механизм
        allowed_columns = [
            col for col in cls.get_allowed_columns(table_name, current_user)
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
        user_priority = getattr(current_user, 'priority_permission', 999)
        if user_priority is None:
            user_priority = 999

        columns_info = db.session.query(
            access_table_mod.AccessToStatus.column_name,
            access_table_mod.AccessToStatus.column_name_show,
            access_table_mod.STDTypeField.std_type_field,
            access_table_mod.STDTypeField.id.label('type_id')
        ).join(
            access_table_mod.STDTypeField,
            access_table_mod.AccessToStatus.id_std_type_field == access_table_mod.STDTypeField.id
        ).filter(
            access_table_mod.AccessToStatus.table_name == table_name,
            access_table_mod.AccessToStatus.required_permission >= user_priority,
            access_table_mod.AccessToStatus.column_name.in_(allowed_columns)
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
                # Специальная обработка для table_name в AccessToStatus
                if table_name == 'AccessToStatus' and col.column_name == 'table_name':
                    # Получаем все имена таблиц из базы данных
                    table_names = cls.get_all_table_names()
                    table_names = [name for name in table_names if
                                   not name.startswith('_')]  # Исключаем системные таблицы
                    current_value = getattr(record, col.column_name, None)
                    data[f"{col.column_name}_data"] = {
                        'list': [{'id': name, 'name': name} for name in table_names],
                        'current': current_value
                    }
                    continue

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
                            relation_model = access_table_mod.STDTypeField
                        elif col.column_name == 'id_level_access':
                            relation_model = access_table_mod.STDLevelAccess
                        # required_permission - число, не требует выпадающего списка
                    elif table_name == 'User':
                        if col.column_name == 'id_std_status_user':
                            relation_model = usr_mod.STDStatusUser
                        # priority_permission - число, не требует выпадающего списка

                if relation_model:
                    data[f"{col.column_name}_data"] = cls.get_relation_options(
                        relation_model,
                        getattr(record, col.column_name, None)
                    )

        # 9. Добавляем зависимости
        dependencies = dependencies_conf.get_dependencies_for_table(table_name)
        if dependencies:
            data['_dependencies'] = dependencies

        return {
            'fields_data': data,
            'master_order': master_order
        }