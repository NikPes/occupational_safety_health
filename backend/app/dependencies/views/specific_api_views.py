from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

import backend.app.user.models.service_class_model as user_service
import backend.app.subject_structure.utils.division_utils as divposition_utils

import backend.app.table.models.service_class_model as table_serv_mod

blu_dependencies = Blueprint('dependencies_views', __name__)


@blu_dependencies.route('/getDivisionPositions', methods=['GET'])
@jwt_required()
def get_division_positions():
    """Получение должностей для конкретного подразделения"""
    division_id = request.args.get('division_id')

    if not division_id:
        return jsonify({'error': 'Division ID is required'}), 400

    try:
        # Запрос к таблице DivPosition
        positions = divposition_utils.ActionDivPosition.get_data_list(id_div=division_id)

        return jsonify({'list': positions})

    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500


@blu_dependencies.route('/getTableFields', methods=['GET'])
@jwt_required()
def get_table_fields():
    """Получение полей для конкретной таблицы"""
    table_name = request.args.get('table_name')
    current_user = user_service.ServiceClassModel.get_current_user(get_jwt_identity())

    allowed_columns = table_serv_mod.ServiceClassModel.get_allowed_columns(table_name, current_user)

    # Форматируем результат
    fields = [{'id': column, 'name': column} for column in allowed_columns]
    print(fields)
    return jsonify({'list': fields})
