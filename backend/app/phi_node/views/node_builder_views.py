from flask import request, Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from backend.app.logic_model.node_builder_logic import NodeBuilderLogic

blu_node_builder = Blueprint('node_builder', __name__)


# ===== КАТЕГОРИИ КОМПОНЕНТОВ =====
@blu_node_builder.route('/component-categories', methods=['GET'])
@jwt_required()
def get_component_categories():
    """Получить все категории компонентов"""
    try:
        categories = NodeBuilderLogic.get_component_categories()
        return jsonify(categories)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== ТИПЫ КОМПОНЕНТОВ =====
@blu_node_builder.route('/component-types', methods=['GET'])
@jwt_required()
def get_component_types():
    """Получить все типы компонентов"""
    try:
        types = NodeBuilderLogic.get_component_types()
        return jsonify(types)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== ТИПЫ СОКЕТОВ =====
@blu_node_builder.route('/socket-types', methods=['GET'])
@jwt_required()
def get_socket_types():
    """Получить все типы данных для сокетов"""
    try:
        types = NodeBuilderLogic.get_socket_types()
        return jsonify(types)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== СОВМЕСТИМОСТЬ ТИПОВ =====
@blu_node_builder.route('/type-compatibilities', methods=['GET'])
@jwt_required()
def get_type_compatibilities():
    """Получить матрицу совместимости типов"""
    try:
        compatibilities = NodeBuilderLogic.get_type_compatibilities()
        return jsonify(compatibilities)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== КОМПОНЕНТЫ =====
@blu_node_builder.route('/components', methods=['GET'])
@jwt_required()
def get_components():
    """Получить все компоненты"""
    try:
        components = NodeBuilderLogic.get_all_components()
        return jsonify(components)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blu_node_builder.route('/components/<string:component_key>', methods=['GET'])
@jwt_required()
def get_component(component_key):
    """Получить конкретный компонент по ключу"""
    try:
        component = NodeBuilderLogic.get_component_by_key(component_key)
        if not component:
            return jsonify({'error': 'Component not found'}), 404
        return jsonify(component.to_rete_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blu_node_builder.route('/components', methods=['POST'])
@jwt_required()
def create_component():
    """Создать новый компонент"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()

        # Валидация
        errors = NodeBuilderLogic.validate_component_data(data)
        if errors:
            return jsonify({'errors': errors}), 400

        component = NodeBuilderLogic.create_component(data, user_id)
        return jsonify(component.to_rete_dict()), 201

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blu_node_builder.route('/components/<string:component_key>', methods=['PUT'])
@jwt_required()
def update_component(component_key):
    """Обновить компонент"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()

        # Валидация
        errors = NodeBuilderLogic.validate_component_data(data)
        if errors:
            return jsonify({'errors': errors}), 400

        component = NodeBuilderLogic.update_component(component_key, data, user_id)
        return jsonify(component.to_rete_dict())

    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blu_node_builder.route('/components/<string:component_key>', methods=['DELETE'])
@jwt_required()
def delete_component(component_key):
    """Удалить компонент"""
    try:
        user_id = get_jwt_identity()
        NodeBuilderLogic.delete_component(component_key, user_id)
        return jsonify({'message': 'Component deleted'})

    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== ВАЛИДАЦИЯ =====
@blu_node_builder.route('/validate-component', methods=['POST'])
@jwt_required()
def validate_component():
    """Валидация компонента перед сохранением"""
    try:
        data = request.get_json()
        errors = NodeBuilderLogic.validate_component_data(data)

        if errors:
            return jsonify({'valid': False, 'errors': errors}), 400

        return jsonify({'valid': True, 'message': 'Component is valid'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blu_node_builder.route('/components/search', methods=['GET'])
@jwt_required()
def search_components():
    """Поиск и фильтрация компонентов"""
    try:
        # Параметры запроса
        search_query = request.args.get('q', '').strip() or None
        category_id = request.args.get('category_id', type=int) or None
        component_type_id = request.args.get('type_id', type=int) or None
        tags = request.args.getlist('tags') or None
        limit = min(request.args.get('limit', 50, type=int), 100)
        offset = request.args.get('offset', 0, type=int)

        result = NodeBuilderLogic.search_components(
            search_query=search_query,
            category_id=category_id,
            component_type_id=component_type_id,
            tags=tags,
            limit=limit,
            offset=offset
        )

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500