from flask import request, Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

import backend.app.user.models.service_class_model as user_service
import backend.app.table.models.service_class_model as table_serv_mod
# import backend.models.test_model as test_mod
from backend.app.extension import db


blu_table_bd_edit = Blueprint('table_bd_edit',
                              __name__)


@blu_table_bd_edit.route('/getToEdit', methods=['GET'])
@jwt_required()
def get_edit():
    name_table = request.args.get('table_name')
    record_id = request.args.get('id')
    if not name_table or not record_id:
        return jsonify({"error": "Missing parameters"}), 400

    result = table_serv_mod.ServiceClassModel.get_edit_data(
        table_name=name_table,
        record_id=record_id,
        user_identity=get_jwt_identity()
    )
    print(result)
    return jsonify(result)


@blu_table_bd_edit.route('/getSystemTables', methods=['GET'])
@jwt_required()
def get_system_tables():
    # Исключаем системные таблицы
    EXCLUDED_TABLES = ['alembic_version', 'STDTypeField', 'STDLevelAccess', 'STDStatusUser']

    try:
        # Получаем ВСЕ таблицы из базы данных
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        all_tables = inspector.get_table_names()

        # Фильтруем системные таблицы
        tables = [table for table in all_tables if table not in EXCLUDED_TABLES]

        return jsonify({"tables": tables})

    except Exception as e:
        print(f"Error getting tables: {e}")
        # Fallback: возвращаем таблицы из metadata
        tables = []
        for table in db.metadata.tables.keys():
            if table not in EXCLUDED_TABLES:
                tables.append(table)
        return jsonify({"tables": tables})


@blu_table_bd_edit.route('/getTableFields', methods=['GET'])
@jwt_required()
def get_table_fields():
    table_name = request.args.get('table_name')

    try:
        # Получаем колонки ЛЮБОЙ таблицы, даже если её нет в моделях
        from sqlalchemy import inspect, Table, MetaData
        inspector = inspect(db.engine)

        columns = inspector.get_columns(table_name)
        fields = []

        for column in columns:
            fields.append({
                'name': column['name'],
                'type': str(column['type']),
                'nullable': column.get('nullable', True),
                'default': column.get('default'),
                'primary_key': column.get('primary_key', False)
            })

        return jsonify({"fields": fields})

    except Exception as e:
        print(f"Error getting columns for table {table_name}: {e}")
        # Fallback: пытаемся получить через существующие модели
        try:
            if table_name in db.metadata.tables:
                table = db.metadata.tables[table_name]
                fields = []
                for column in table.columns:
                    fields.append({
                        'name': column.name,
                        'type': str(column.type),
                        'nullable': column.nullable,
                        'default': str(column.default) if column.default else None,
                        'primary_key': column.primary_key
                    })
                return jsonify({"fields": fields})
            else:
                return jsonify({"error": f"Table {table_name} not found"}), 404

        except Exception as inner_error:
            return jsonify({"error": str(inner_error)}), 500



@blu_table_bd_edit.route('/saveOfEdit', methods=['POST'])
@jwt_required()
def save_of_edit():
    data = request.get_json()
    name_table = data.get('table_name')
    record_id = data.get('id')
    new_data = data.get('data', {})
    current_user = user_service.ServiceClassModel.get_current_user(get_jwt_identity())

    if not current_user:
        return jsonify({"error": "User not found"}), 404

    # 1. Проверяем права доступа
    edit_access = table_serv_mod.ServiceClassModel.get_edit_access(name_table, current_user)
    if edit_access not in ['Full access', 'Edit access']:
        return jsonify({"error": "No edit access"}), 403

    # 2. Находим модель
    model_class = table_serv_mod.ServiceClassModel.get_table_model(name_table)
    if not model_class:
        return jsonify({"error": f"Table {name_table} not found"}), 404

    # 3. Получаем запись
    record = db.session.get(model_class, record_id)
    if not record:
        return jsonify({"error": "Record not found"}), 404

    # 4. Получаем разрешенные колонки для этого пользователя
    allowed_columns = table_serv_mod.ServiceClassModel.get_allowed_columns(name_table, current_user)

    # 5. Обновляем только разрешенные поля
    for column_name, value in new_data.items():
        # Проверяем доступ к колонке и что поле существует в модели
        if (column_name in allowed_columns and
            hasattr(record, column_name) and
            column_name != 'id'):  # Защита от изменения ID
            setattr(record, column_name, value)

    try:
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@blu_table_bd_edit.route('/delRow', methods=['DELETE'])
@jwt_required()
def delete_row():
    # Получаем параметры из запроса
    table_name = request.args.get('table_name')
    row_id = request.args.get('id')

    # 1. Проверка пользователя
    current_user = user_service.ServiceClassModel.get_current_user(get_jwt_identity())
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    # 2. Проверка прав доступа
    has_access = table_serv_mod.ServiceClassModel.get_edit_access(table_name, current_user) in ['Full access']
    if not has_access:
        return jsonify({"error": "No permission to delete records"}), 403

    # 3. Поиск модели
    model_class = table_serv_mod.ServiceClassModel.get_table_model(table_name)
    if not model_class:
        return jsonify({"error": f"Table {table_name} not found"}), 404

    # 4. Поиск и удаление записи
    try:
        record = db.session.get(model_class, row_id)
        if not record:
            return jsonify({"error": "Record not found"}), 404

        db.session.delete(record)
        db.session.commit()

        return jsonify({"success": True}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500