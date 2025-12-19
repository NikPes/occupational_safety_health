from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import backend.app.phi_node.models.phi_node_model as phi_node_mod

from backend.app.extension import db

blu_phi_node = Blueprint('phi_node', __name__)


@blu_phi_node.route('/<node_id>', methods=['GET'])
@jwt_required()
def get_node(node_id):
    """Получение данных нода"""
    print(node_id)
    try:
        node = phi_node_mod.PhiNodeInstance.query.filter_by(node_id=node_id).first()
        if not node:
            return jsonify({'error': 'Node not found'}), 404

        return jsonify(node.to_phi_dict()), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blu_phi_node.route('', methods=['POST'])
@jwt_required()
def save_node():
    """Сохранение/обновление нода"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()

        node_id = data.get('nodeId')
        if node_id:
            # Обновление существующего нода
            node = phi_node_mod.PhiNodeInstance.query.filter_by(node_id=node_id).first()
            if not node:
                return jsonify({'error': 'Node not found'}), 404

            node.node_data = data.get('data', {})
            node.position_x = data.get('position', {}).get('x', 0)
            node.position_y = data.get('position', {}).get('y', 0)
            node.component_key = data.get('componentKey', 'default')

        else:
            # Создание нового нода
            node = phi_node_mod.PhiNodeInstance.from_dict(data)
            node.created_by = user_id

        db.session.commit()
        return jsonify(node.to_phi_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@blu_phi_node.route('/<node_id>', methods=['DELETE'])
@jwt_required()
def delete_node(node_id):
    print(node_id)
    """Удаление нода"""
    try:
        node = phi_node_mod.PhiNodeInstance.query.filter_by(node_id=node_id).first()
        if not node:
            return jsonify({'error': 'Node not found'}), 404

        db.session.delete(node)
        db.session.commit()
        return jsonify({'message': 'Node deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500