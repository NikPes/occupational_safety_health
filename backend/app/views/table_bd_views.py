from flask import request, Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import and_

import backend.app.models.service_class_model as service_tab_mod
import backend.app.models.user_model as usr_mod
import backend.app.models.base_table_model as base_table_mod

blu_table_bd_views = Blueprint('tableBdViews',
                         __name__)

@blu_table_bd_views.route('/getNameHead', methods=['GET'])
@jwt_required()
def get_head_name():
    name_table = request.args.get('table_name', None)
    current_user = usr_mod.User.query.filter(usr_mod.User.user_login == get_jwt_identity()).first()

    if current_user and hasattr(current_user, 'status_user') and current_user.status_user:
        user_permission = current_user.status_user.priority
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

    result = service_tab_mod.ServiceClassModel.get_paginated_data(
        table_name=name_table,
        user_identity=get_jwt_identity(),
        page=page,
        per_page=per_page,
        sort_by=sort_by,
        sort_order=sort_order,
        search=search
    )

    return jsonify(result)