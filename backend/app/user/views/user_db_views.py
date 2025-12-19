from flask import request, Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import json

import backend.app.table.models.service_class_model as table_serv_mod
import backend.app.user.models.service_class_model as user_service
import backend.app.user.models.user_model as user_mod

blu_user_bd_views = Blueprint('userBdViews',
                         __name__)

@blu_user_bd_views.route('/getUserStatus', methods=['GET'])
@jwt_required()
def get_user_status():
    current_user = user_service.ServiceClassModel.get_current_user(get_jwt_identity())
    table_name = "STDStatusUser"
    field = "std_status_user"
    # 2. Проверяем доступ к таблице
    allowed = table_serv_mod.ServiceClassModel.get_allowed_columns(table_name, current_user)
    if not allowed:
        return jsonify({"error": f"No access to {table_name}"}), 403

    # 3. Проверяем запрашиваемые поля
    if field not in allowed:
        return jsonify({"error": f"No access to field: {field}"}), 403

    return jsonify(user_mod.User.get_status_user(id=current_user.id))