from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
import backend.app.phi_node.models.phi_node_model as phi_node_mod

blu_phi_socket = Blueprint('phi_socket', __name__)


@blu_phi_socket.route('/definitions', methods=['GET'])
@jwt_required()
def get_socket_definitions():
    """Получение всех определений сокетов"""
    try:
        # Получаем все сокеты с их типами
        sockets = phi_node_mod.PhiSocket.query.filter_by(is_deprecated=False).all()

        definitions = []
        for socket in sockets:
            definition = {
                'id': str(socket.id),
                'name': socket.name,
                'typeKey': socket.std_type_rel.type_key if socket.std_type_rel else 'any',
                'compatibleWith': socket.get_compatible_type_keys(),
                'visualProps': socket.get_visual_props(),
                'description': socket.description
            }
            definitions.append(definition)

        return jsonify(definitions), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blu_phi_socket.route('/types', methods=['GET'])
@jwt_required()
def get_socket_types():
    """Получение всех типов сокетов"""
    try:
        types = phi_node_mod.STDTypeConnectionPhi.query.order_by(phi_node_mod.STDTypeConnectionPhi.order).all()
        type_list = [type.to_phi_dict() for type in types]

        return jsonify(type_list), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blu_phi_socket.route('/compatibility', methods=['GET'])
@jwt_required()
def get_compatibility_rules():
    """Получение правил совместимости"""
    try:
        compatibilities = phi_node_mod.CompatibleType.query.all()
        rules = []

        for comp in compatibilities:
            rule = {
                'type1': comp.type_one_rel.type_key if comp.type_one_rel else 'unknown',
                'type2': comp.type_two_rel.type_key if comp.type_two_rel else 'unknown'
            }
            rules.append(rule)

        return jsonify(rules), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500