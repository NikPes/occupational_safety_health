# backend/app/views/node_schemas_builder_views.py
from flask import request, Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

import backend.app.logic_model.node_schemas_builder_logic as node_schemas_log

blu_node_schemas_builder = Blueprint('node_schemas_builder', __name__)

# ===== СХЕМЫ =====
@blu_node_schemas_builder.route('/schemas', methods=['GET'])
@jwt_required()
def get_schemas():
    """Получить схемы с фильтрацией и пагинацией"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 30, type=int)
    is_template = request.args.get('is_template', type=lambda x: x.lower() == 'true')
    search = request.args.get('search', '')
    my_schemas = request.args.get('my_schemas', type=lambda x: x.lower() == 'true')

    created_by = current_user_id if my_schemas else None

    schemas = node_schemas_log.ActionNodeSchemasBuilder.get_schemas(
        page=page,
        per_page=per_page,
        is_template=is_template,
        search=search,
        created_by=created_by
    )

    return jsonify({
        "schemas": [{
            'id': schema.id,
            'name': schema.name,
            'description': schema.description,
            'is_template': schema.is_template,
            'is_public': schema.is_public,
            'required_permission': schema.required_permission,
            'version': schema.version,
            'nodes_count': schema.nodes_count,
            'edges_count': schema.edges_count,
            'last_executed': schema.last_executed.isoformat() if schema.last_executed else None,
            'created_at': schema.created_at.isoformat() if schema.created_at else None,
            'updated_at': schema.updated_at.isoformat() if schema.updated_at else None,
            'created_by': schema.created_by,
            'created_by_name': schema.created_by_rel.username if schema.created_by_rel else 'Unknown'
        } for schema in schemas.items],
        "total": schemas.total,
        "pages": schemas.pages,
        "current_page": page,
        "status": "success"
    })

@blu_node_schemas_builder.route('/schemas/<int:schema_id>', methods=['GET'])
@jwt_required()
def get_schema(schema_id):
    """Получить детальную информацию о схеме"""
    schema = node_schemas_log.ActionNodeSchemasBuilder.get_schema_by_id(schema_id)

    if not schema:
        return jsonify({"error": "Schema not found"}), 404

    # Проверка прав доступа
    current_user_id = get_jwt_identity()
    if not schema.is_public and schema.created_by != current_user_id:
        return jsonify({"error": "Access denied"}), 403

    return jsonify({
        "schema": {
            'id': schema.id,
            'name': schema.name,
            'description': schema.description,
            'flow_data': schema.flow_data,
            'is_template': schema.is_template,
            'is_public': schema.is_public,
            'required_permission': schema.required_permission,
            'version': schema.version,
            'based_on_template': schema.based_on_template,
            'nodes_count': schema.nodes_count,
            'edges_count': schema.edges_count,
            'last_executed': schema.last_executed.isoformat() if schema.last_executed else None,
            'created_at': schema.created_at.isoformat() if schema.created_at else None,
            'updated_at': schema.updated_at.isoformat() if schema.updated_at else None,
            'created_by': schema.created_by,
            'created_by_name': schema.created_by_rel.username if schema.created_by_rel else 'Unknown'
        },
        "status": "success"
    })

@blu_node_schemas_builder.route('/schemas', methods=['POST'])
@jwt_required()
def create_schema():
    """Создать новую схему"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # Валидация обязательных полей
    if 'name' not in data:
        return jsonify({"error": "Missing required field: name"}), 400

    try:
        schema = node_schemas_log.ActionNodeSchemasBuilder.create_schema(data, current_user_id)
        return jsonify({
            "message": "Schema created successfully",
            "schema_id": schema.id,
            "status": "success"
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@blu_node_schemas_builder.route('/schemas/<int:schema_id>', methods=['PUT'])
@jwt_required()
def update_schema(schema_id):
    """Обновить схему"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    schema = node_schemas_log.ActionNodeSchemasBuilder.get_schema_by_id(schema_id)
    if not schema:
        return jsonify({"error": "Schema not found"}), 404

    # Проверка прав доступа
    if schema.created_by != current_user_id:
        return jsonify({"error": "Access denied"}), 403

    try:
        node_schemas_log.ActionNodeSchemasBuilder.update_schema(schema, data)
        return jsonify({
            "message": "Schema updated successfully",
            "status": "success"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@blu_node_schemas_builder.route('/schemas/<int:schema_id>', methods=['DELETE'])
@jwt_required()
def delete_schema(schema_id):
    """Удалить схему"""
    current_user_id = get_jwt_identity()

    schema = node_schemas_log.ActionNodeSchemasBuilder.get_schema_by_id(schema_id)
    if not schema:
        return jsonify({"error": "Schema not found"}), 404

    if schema.created_by != current_user_id:
        return jsonify({"error": "Access denied"}), 403

    try:
        node_schemas_log.ActionNodeSchemasBuilder.delete_schema(schema)
        return jsonify({
            "message": "Schema deleted successfully",
            "status": "success"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@blu_node_schemas_builder.route('/schemas/<int:schema_id>/duplicate', methods=['POST'])
@jwt_required()
def duplicate_schema(schema_id):
    """Дублировать схему"""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    schema = node_schemas_log.ActionNodeSchemasBuilder.get_schema_by_id(schema_id)
    if not schema:
        return jsonify({"error": "Schema not found"}), 404

    # Проверка прав доступа для приватных схем
    if not schema.is_public and schema.created_by != current_user_id:
        return jsonify({"error": "Access denied"}), 403

    new_name = data.get('name', f"Копия {schema.name}")

    try:
        new_schema = node_schemas_log.ActionNodeSchemasBuilder.duplicate_schema(
            schema, new_name, current_user_id
        )
        return jsonify({
            "message": "Schema duplicated successfully",
            "schema_id": new_schema.id,
            "status": "success"
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===== ПОИСК И ФИЛЬТРЫ =====
@blu_node_schemas_builder.route('/schemas/search', methods=['GET'])
@jwt_required()
def search_schemas():
    """Поиск схем"""
    current_user_id = get_jwt_identity()
    search = request.args.get('q', '')
    is_template = request.args.get('is_template', type=lambda x: x.lower() == 'true')
    my_schemas = request.args.get('my_schemas', type=lambda x: x.lower() == 'true')

    created_by = current_user_id if my_schemas else None

    schemas = node_schemas_log.ActionNodeSchemasBuilder.search_schemas(
        search=search,
        is_template=is_template,
        created_by=created_by
    )

    return jsonify({
        "schemas": [{
            'id': schema.id,
            'name': schema.name,
            'description': schema.description,
            'is_template': schema.is_template,
            'nodes_count': schema.nodes_count,
            'created_by_name': schema.created_by_rel.username if schema.created_by_rel else 'Unknown'
        } for schema in schemas],
        "status": "success"
    })

# ===== СТАТИСТИКА =====
@blu_node_schemas_builder.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Статистика по схемам"""
    current_user_id = get_jwt_identity()
    my_stats = request.args.get('my_stats', type=lambda x: x.lower() == 'true')

    user_id = current_user_id if my_stats else None
    stats = node_schemas_log.ActionNodeSchemasBuilder.get_stats(user_id)
    most_used = node_schemas_log.ActionNodeSchemasBuilder.get_most_used_schemas(5, user_id)

    return jsonify({
        "stats": {**stats, "most_used": most_used},
        "status": "success"
    })