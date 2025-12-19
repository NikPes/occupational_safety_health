from flask import request, Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

import backend.app.table.utils.validation as valid
import backend.app.table.models.service_class_model as table_serv_mod
import backend.app.user.models.service_class_model as user_service
from backend.app.extension import db


blu_table_bd_add_row = Blueprint('table_bd_add_row_views',
                         __name__)


@blu_table_bd_add_row.route('/getAddRow', methods=['GET'])
@jwt_required()
def get_add_row():
    name_table = request.args.get('table_name')
    current_user = get_jwt_identity()

    result, error_response, status_code = table_serv_mod.ServiceClassModel.get_add_data(name_table, current_user)
    if error_response:
        return error_response, status_code
    return jsonify(result), 200


@blu_table_bd_add_row.route('/addRow', methods=['POST'])
@jwt_required()
def add_row():
    data = request.get_json()
    table_name = data.get('table_name')
    row_data = data.get('data')

    # 1. Проверка пользователя
    current_user = user_service.ServiceClassModel.get_current_user(get_jwt_identity())
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    # 2. Проверка прав доступа
    has_access = table_serv_mod.ServiceClassModel.get_edit_access(table_name, current_user) in ['Full access']
    if not has_access:
        return jsonify({"error": "No permission to add records"}), 403

    # 3. Поиск модели
    model_class = table_serv_mod.ServiceClassModel.get_table_model(table_name)
    if not model_class:
        return jsonify({"error": f"Table {table_name} not found"}), 404

    # 4. Валидация и очистка данных
    cleaned_data, errors = valid.validate_and_clean(row_data, model_class)
    if errors:
        print(cleaned_data, errors)
        return jsonify({
            "success": False,
            "errors": errors
        }), 400

    # 5. Создание и сохранение записи
    try:
        new_record = model_class(**cleaned_data)
        db.session.add(new_record)
        db.session.commit()

        return jsonify({
            "success": True,
            "id": new_record.id
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

