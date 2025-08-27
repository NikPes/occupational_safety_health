from flask import request, Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import and_
import os, json

# import backend.models.works_model as works_mod
import backend.app.models.user_model as usr_mod
import backend.app.models.main_menu_model as menu_mod
# import backend.models.models_models as mod_mod
# from backend.extension import db
# from backend.procedure.log_console import console_logger


blu_main_menu = Blueprint('main_menu',
                                __name__)

@blu_main_menu.route('/menu', methods=['GET'])
@jwt_required()
def show_menu():
    page_name = request.args.get('page_name', 'root')
    current_user = usr_mod.User.query.filter_by(user_login=get_jwt_identity()).first()

    if not current_user:
        return jsonify({"error": "User not found"}), 404

    menu_data = menu_mod.MainMenu.get_current_page_menu(page_system_name=page_name, current_user=current_user)

    return jsonify({
        "menu": menu_data,
        "page_name": page_name,
        "status": "success"
    })
