import json
from datetime import datetime, timezone, timedelta
from flask import request, jsonify, Blueprint
from flask_jwt_extended import create_access_token,  get_jwt, get_jwt_identity, unset_jwt_cookies, jwt_required
import yaml, os

from backend.app.procedure.first_filling_db import main_starting_first
from backend.app.models.user_model import User
from backend.app.config import basedir

config_path = os.path.join(basedir, 'config.yml')

blu_login= Blueprint('login',
                     __name__)

def is_file_valid(file_path):
    try:
        with open(file_path, 'r') as file:
            data = yaml.safe_load(file)
            if not isinstance(data, dict):
                return False
        return True
    except (yaml.YAMLError, FileNotFoundError):
        return False

@blu_login.after_request
def refresh_expiring_jwts(response):
    try:
        exp_timestamp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
        if target_timestamp > exp_timestamp:
            access_token = create_access_token(identity=get_jwt_identity())
            data = response.get_json()
            if type(data) is dict:
                data["access_token"] = access_token
                response.data = json.dumps(data)
        return response
    except (RuntimeError, KeyError):
        # Case where there is not a valid JWT. Just return the original response
        return response


@blu_login.route('/login', methods=['POST'])
def login():
    # try:
    # Проверка конфигурационного файла
    if not is_file_valid(config_path):
        if os.path.exists(config_path):
            os.remove(config_path)
        # Создаем базовый конфиг
        data = {
            'host': 'localhost',
            'user': 'root',
            'password': 'root',
            'db': 'basesiz',
            'create_table': True
        }
        with open(config_path, 'w') as file:
            yaml.dump(data, file, default_flow_style=False)

    # Если нужно создать таблицы
    with open(config_path, 'r') as file:
        data = yaml.safe_load(file)

    if data.get('create_table', True):
        data['create_table'] = False
        first_filling_table()
        with open(config_path, 'w') as file:
            yaml.dump(data, file, default_flow_style=False)

    # Аутентификация пользователя
    user_login = request.json.get("user_login")
    password = request.json.get("password")

    if not user_login or not password:
        return jsonify({"msg": "Требуется логин и пароль"}), 400

    current_user = User.query.filter_by(user_login=user_login).first()

    if current_user and User.check_password(current_user, password):
        # Создаем JWT токен
        access_token = create_access_token(
            identity=current_user.user_login,
            additional_claims={
                "user_id": current_user.id,
                "role": current_user.status_user.std_status_user if current_user.status_user else "unknown"
            }
        )

        return jsonify({
            "access_token": access_token,
            "user_id": current_user.id,
            "user_login": current_user.user_login,
            "role": current_user.status_user.std_status_user if current_user.status_user else "unknown"
        })
    else:
        return jsonify({"msg": "Неверный логин или пароль"}), 401

    # except Exception as e:
    #     return jsonify({"msg": f"Ошибка сервера: {str(e)}"}), 500


@blu_login.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    response = jsonify({"msg": "logout successful"})
    unset_jwt_cookies(response)
    return response

def first_filling_table():
    main_starting_first()