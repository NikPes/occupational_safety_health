from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

blu_use_token = Blueprint('use_token',
                         __name__)


@blu_use_token.route('/checkToken', methods=['GET'])
@jwt_required()
def check_token():
    # Если токен действителен, возвращаем успешный ответ
    return jsonify({"message": "Token is valid"}), 200
