from flask import request, Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import and_
import json

import backend.app.table.models.service_class_model as table_serv_mod
import backend.app.user.models.service_class_model as user_service
import backend.app.user.models.access_table_model as base_table_mod

blu_table_bd_views = Blueprint('tableBdViews',
                         __name__)

@blu_table_bd_views.route('/getNameHead', methods=['GET'])
@jwt_required()
def get_head_name():
    name_table = request.args.get('table_name', None)
    current_user = user_service.ServiceClassModel.get_current_user(get_jwt_identity())

    if current_user.priority_permission is not None:
        user_permission = current_user.priority_permission
    else:
        user_permission = 999

    select_access_status = (base_table_mod.AccessToStatus.query.
                            filter(and_(base_table_mod.AccessToStatus.table_name == name_table,
                                        base_table_mod.AccessToStatus.required_permission >= user_permission)).
                            all())
    columns = [{"column_name": access.column_name,
                "column_name_show": access.column_name_show} for access in select_access_status]
    return jsonify(columns)


@blu_table_bd_views.route('/getDataTable', methods=['GET'])
@jwt_required()
def get_data_table():
    name_table = request.args.get('table_name')
    if not name_table:
        return jsonify({"error": "Missing table_name"}), 400

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    sort_by = request.args.get('sort_by')
    sort_order = request.args.get('sort_order', 'asc')
    search = request.args.get('search')

    result = table_serv_mod.ServiceClassModel.get_paginated_data(
        table_name=name_table,
        user_identity=get_jwt_identity(),
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order,
        search=search
    )

    return jsonify(result)


@blu_table_bd_views.route('/getDataFromBase', methods=['GET'])
@jwt_required()
def get_data_from_base():

    json_str = request.args.get('json_data')
    if not json_str:
        return jsonify({"error": "Missing json_data"}), 400

    try:
        json_data = json.loads(json_str)
    except:
        return jsonify({"error": "Invalid JSON"}), 400

    current_user = user_service.ServiceClassModel.get_current_user(get_jwt_identity())

    # 1. Получаем имя таблицы
    table_name = json_data.get("table")
    if not table_name:
        return jsonify({"error": "No table specified"}), 400

    # 2. Проверяем доступ к таблице
    allowed = table_serv_mod.ServiceClassModel.get_allowed_columns(table_name, current_user)
    if not allowed:
        return jsonify({"error": f"No access to {table_name}"}), 403

    # 3. Проверяем запрашиваемые поля
    get_fields = json_data.get("fields", [])
    for field in get_fields:
        if field not in allowed:
            return jsonify({"error": f"No access to field: {field}"}), 403

    # 4. Находим модель таблицы
    model_class = table_serv_mod.ServiceClassModel.get_table_model(table_name)
    if not model_class:
        return jsonify({"error": f"Table {table_name} not found"}), 404

    # 5. Обрабатываем фильтр (current_user → real id)
    filter_list = json_data.get("filter", [])
    if len(filter_list) >= 2 and filter_list[1] == "current_user":
        filter_value = current_user.id
    elif len(filter_list) >= 2:
        filter_value = filter_list[1]
    else:
        filter_value = None

    # 6. Строим запрос
    query = table_serv_mod.ServiceClassModel.build_query_with_relations(model_class)

    # 7. Добавляем фильтр если есть
    if filter_value and len(filter_list) >= 1:
        filter_field = filter_list[0]
        if filter_field in allowed:  # Проверяем доступ к полю фильтра
            query = query.filter(getattr(model_class, filter_field) == filter_value)

    # 8. Применяем лимит
    limit = json_data.get("limit")
    if limit:
        query = query.limit(limit)

    # 9. Выполняем и сериализуем
    results = query.all()
    data = [
        table_serv_mod.ServiceClassModel.serialize_item(item, get_fields)
        for item in results
    ]

    return jsonify(data)
