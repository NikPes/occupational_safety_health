from flask import request, Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

import backend.app.models.user_model as usr_mod
import backend.app.models.base_table_model as base_table_mod


blu_body_construct = Blueprint('body',
                         __name__)


@blu_body_construct.route('/pageConstruction', methods=['GET'])
@jwt_required()
def get_page_construction():
    page_name = request.args.get('page_name', 'root')
    current_user = usr_mod.User.query.filter_by(user_login=get_jwt_identity()).first()

    if not current_user:
        return jsonify({"error": "User not found"}), 404

    structure = base_table_mod.PageConstruction.get_structure(current_user, page_name)
    # Преобразуем для клиента
    simplified_structure = [{
        **item,
        'id_type_data': item['id_type_data']['id'] if isinstance(item['id_type_data'], dict) else item['id_type_data']
    } for item in structure]

    print('simplified_structure', simplified_structure)
    return jsonify(simplified_structure)


@blu_body_construct.route('/getComponentName', methods=['GET'])
@jwt_required()
def get_component_name():
    name_component = None
    type_data = request.args.get('type_data', None)
    if type_data is not None:
        name_component = base_table_mod.STDTypeData.get_component_name(type_data)
    print('componentName', name_component)
    return jsonify({"componentName": name_component})