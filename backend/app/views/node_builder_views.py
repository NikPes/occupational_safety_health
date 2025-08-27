from flask import request, Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

import backend.app.logic_model.node_builder_logic as node_build_log


blu_node_builder = Blueprint('node_builder',
                           __name__)

# ===== КАТЕГОРИИ =====
@blu_node_builder.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Получить все категории нодов"""
    categories = node_build_log.ActionNodeBuilder.get_categories()

    return jsonify({
        "categories": [{
            'id': cat.id,
            'name': cat.name,
            'icon': cat.icon,
            'description': cat.description,
            'order': cat.order,
            'color': cat.color
        } for cat in categories],
        "status": "success"
    })


# ===== НОДЫ =====
@blu_node_builder.route('/nodes', methods=['GET'])
@jwt_required()
def get_nodes():

    """Получить ноды с фильтрацией и пагинацией"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    category_id = request.args.get('category_id', type=int)
    search = request.args.get('search', '')
    tags = request.args.getlist('tags[]')

    nodes = node_build_log.ActionNodeBuilder.get_nodes(
        page=page,
        per_page=per_page,
        category_id=category_id,
        search=search,
        tags=tags
    )
    return jsonify({
        "nodes": [{
            'id': node.id,
            'node_id': node.node_id,
            'name': node.name,
            'type': node.type,
            'description': node.description,
            'category_id': node.category_id,
            'version': node.version,
            'tags': node.tags,
            'icon': node.data.get('icon', '⚙️'),
            'color': node.data.get('color', '#6B7280'),
            'inputs_count': len(node.inputs_schema or []),
            'outputs_count': len(node.outputs_schema or []),
            'usage_count': node.usage_count,
            'last_used': node.last_used.isoformat() if node.last_used else None
        } for node in nodes.items],
        "total": nodes.total,
        "pages": nodes.pages,
        "current_page": page,
        "status": "success"
    })


@blu_node_builder.route('/nodes/<string:node_id>', methods=['GET'])
@jwt_required()
def get_node(node_id):
    """Получить детальную информацию о ноде"""
    node = node_build_log.ActionNodeBuilder.get_node_by_id(node_id)

    if not node:
        return jsonify({"error": "Node not found"}), 404

    return jsonify({
        "node": {
            'id': node.id,
            'node_id': node.node_id,
            'name': node.name,
            'type': node.type,
            'description': node.description,
            'category_id': node.category_id,
            'data': node.data,
            'inputs_schema': node.inputs_schema,
            'outputs_schema': node.outputs_schema,
            'execution_logic': node.execution_logic,
            'width': node.width,
            'height': node.height,
            'version': node.version,
            'changelog': node.changelog,
            'tags': node.tags,
            'required_permission': node.required_permission,
            'usage_count': node.usage_count,
            'last_used': node.last_used.isoformat() if node.last_used else None,
            'created_at': node.created_at.isoformat() if node.created_at else None,
            'updated_at': node.updated_at.isoformat() if node.updated_at else None
        },
        "status": "success"
    })


@blu_node_builder.route('/nodes', methods=['POST'])
@jwt_required()
def create_node():
    """Создать новый нод"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # Валидация обязательных полей
    required_fields = ['name', 'type', 'category_id']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        node = node_build_log.ActionNodeBuilder.create_node(data, current_user_id)
        return jsonify({
            "message": "Node created successfully",
            "node_id": node.node_id,
            "status": "success"
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@blu_node_builder.route('/nodes/<string:node_id>', methods=['PUT'])
@jwt_required()
def update_node(node_id):
    """Обновить нод"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    node = node_build_log.ActionNodeBuilder.get_node_by_id(node_id)
    if not node:
        return jsonify({"error": "Node not found"}), 404

    # Проверка прав доступа
    if node.created_by != current_user_id:
        return jsonify({"error": "Access denied"}), 403

    try:
        node_build_log.ActionNodeBuilder.update_node(node, data)
        return jsonify({
            "message": "Node updated successfully",
            "status": "success"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@blu_node_builder.route('/nodes/<string:node_id>', methods=['DELETE'])
@jwt_required()
def delete_node(node_id):
    """Удалить нод"""
    current_user_id = get_jwt_identity()

    node = node_build_log.ActionNodeBuilder.get_node_by_id(node_id)
    if not node:
        return jsonify({"error": "Node not found"}), 404

    if node.created_by != current_user_id:
        return jsonify({"error": "Access denied"}), 403

    try:
        node_build_log.ActionNodeBuilder.delete_node(node)
        return jsonify({
            "message": "Node deleted successfully",
            "status": "success"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== ПОИСК И ФИЛЬТРЫ =====
@blu_node_builder.route('/nodes/search', methods=['GET'])
@jwt_required()
def search_nodes():
    """Поиск нодов по тегам и названию"""
    search = request.args.get('q', '')
    tags = request.args.getlist('tags[]')

    nodes = node_build_log.ActionNodeBuilder.search_nodes(search, tags)

    return jsonify({
        "nodes": [{
            'node_id': node.node_id,
            'name': node.name,
            'type': node.type,
            'description': node.description,
            'icon': node.data.get('icon', '⚙️'),
            'tags': node.tags
        } for node in nodes],
        "status": "success"
    })


@blu_node_builder.route('/nodes/tags', methods=['GET'])
@jwt_required()
def get_all_tags():
    """Получить все уникальные теги"""
    tags = node_build_log.ActionNodeBuilder.get_all_tags()

    return jsonify({
        "tags": tags,
        "status": "success"
    })


# ===== СТАТИСТИКА =====
@blu_node_builder.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Статистика по нодам"""
    stats = node_build_log.ActionNodeBuilder.get_stats()
    most_used = node_build_log.ActionNodeBuilder.get_most_used_nodes(5)

    return jsonify({
        "stats": {**stats, "most_used": most_used},
        "status": "success"
    })
