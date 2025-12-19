from flask import request, Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

import backend.app.logic_model.node_schemas_builder_logic as schemas_build_log
import backend.app.user.models.user_model as user_mod

blu_node_schemas_builder = Blueprint('node_schemas_builder', __name__)


# ===== КАТЕГОРИИ =====
@blu_node_schemas_builder.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    categories = schemas_build_log.ActionNodeSchemasBuilder.get_categories()
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

# ===== СПИСОК СХЕМ =====
@blu_node_schemas_builder.route('/schemas', methods=['GET'])
@jwt_required()
def get_schemas():
    """Получить список схем без пагинации"""
    try:
        current_user = user_mod.User.query.filter_by(user_login=get_jwt_identity()).first()
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        category_id = request.args.get('category_id', type=int)
        search = request.args.get('search', type=str)

        schemas = schemas_build_log.ActionNodeSchemasBuilder.get_schemas_list(
            current_user.id, category_id, search
        )

        # Убедимся, что schemas не None
        if schemas is None:
            schemas = []

        return jsonify({
            "schemas": [{
                'id': schema.id,
                'name': schema.name,
                'description': schema.description,
                'category': {
                    'id': schema.schemas_category_rel.id if schema.schemas_category_rel else None,
                    'name': schema.schemas_category_rel.show_name if schema.schemas_category_rel else 'Без категории',
                    'icon': schema.schemas_category_rel.icon if schema.schemas_category_rel else '📁'
                },
                'version': schema.version,
                'is_template': schema.is_template,
                'is_public': schema.is_public,
                'nodes_count': schema.nodes_count,
                'edges_count': schema.edges_count,
                'created_at': schema.created_at.isoformat() if schema.created_at else None,
                'updated_at': schema.updated_at.isoformat() if schema.updated_at else None,
                'last_executed': schema.last_executed.isoformat() if schema.last_executed else None
            } for schema in schemas],
            "total": len(schemas),
            "status": "success"
        })

    except Exception as e:
        print(f"Error in get_schemas: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ===== КАТЕГОРИИ СХЕМ =====
@blu_node_schemas_builder.route('/schemas/categories', methods=['GET'])
@jwt_required()
def get_schema_categories():
    """Получить категории схем"""
    # try:
    categories = schemas_build_log.ActionNodeSchemasBuilder.get_schema_categories()
    return jsonify({
        "categories": [{
            'id': cat.id,
            'std_schemas_category': cat.std_schemas_category,
            'show_name': cat.show_name,
            'description': cat.description,
            'order': cat.order,
            'icon': cat.icon
        } for cat in categories],
        "status": "success"
    })

    # except Exception as e:
    # print(f"Error in get_schema_categories: {str(e)}")
    # return jsonify({"error": str(e)}), 500


@blu_node_schemas_builder.route('/schemas/<int:schema_id>', methods=['GET'])
@jwt_required()
def get_schema(schema_id):
    """Получить детальную информацию о схеме"""
    # try:
    current_user = user_mod.User.query.filter_by(user_login=get_jwt_identity()).first()
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    schema = schemas_build_log.ActionNodeSchemasBuilder.get_schema_by_id(
        schema_id, current_user.id
    )

    if not schema:
        return jsonify({"error": "Schema not found"}), 404

    return jsonify({
        "schema": {
            'id': schema.id,
            'name': schema.name,
            'description': schema.description,
            'flow_data': schema.flow_data,
            'category': schema.category,
            'is_template': schema.is_template,
            'is_public': schema.is_public,
            'required_permission': schema.required_permission,
            'version': schema.version,
            'based_on_template': schema.based_on_template,
            'nodes_count': schema.nodes_count,
            'edges_count': schema.edges_count,
            'created_at': schema.created_at.isoformat() if schema.created_at else None,
            'updated_at': schema.updated_at.isoformat() if schema.updated_at else None,
            'last_executed': schema.last_executed.isoformat() if schema.last_executed else None,
            'created_by': schema.created_by
        },
        "status": "success"
    })

    # except Exception as e:
    #     print(f"Error in get_schemas: {str(e)}")
    # return jsonify({"error": str(e)}), 500


# ===== СОЗДАНИЕ И РЕДАКТИРОВАНИЕ СХЕМ =====
@blu_node_schemas_builder.route('/schemas', methods=['POST'])
@jwt_required()
def create_schema():
    """Создать новую схему"""
    try:
        current_user = user_mod.User.query.filter_by(user_login=get_jwt_identity()).first()
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()

        # Валидация обязательных полей
        required_fields = ['name', 'flow_data']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        schema = schemas_build_log.ActionNodeSchemasBuilder.create_schema(
            data, current_user.id
        )

        return jsonify({
            "message": "Schema created successfully",
            "schema_id": schema.id,
            "status": "success"
        }), 201

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@blu_node_schemas_builder.route('/schemas/<int:schema_id>', methods=['PUT'])
@jwt_required()
def update_schema(schema_id):
    """Обновить существующую схему"""
    try:
        current_user = user_mod.User.query.filter_by(user_login=get_jwt_identity()).first()
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()

        schema = schemas_build_log.ActionNodeSchemasBuilder.update_schema(
            schema_id, data, current_user.id
        )

        return jsonify({
            "message": "Schema updated successfully",
            "schema_id": schema.id,
            "status": "success"
        })

    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@blu_node_schemas_builder.route('/schemas/<int:schema_id>', methods=['DELETE'])
@jwt_required()
def delete_schema(schema_id):
    """Удалить схему"""
    try:
        current_user = user_mod.User.query.filter_by(user_login=get_jwt_identity()).first()
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        schemas_build_log.ActionNodeSchemasBuilder.delete_schema(
            schema_id, current_user.id
        )

        return jsonify({
            "message": "Schema deleted successfully",
            "status": "success"
        })

    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@blu_node_schemas_builder.route('/schemas/<int:schema_id>/duplicate', methods=['POST'])
@jwt_required()
def duplicate_schema(schema_id):
    """Дублировать схему"""
    try:
        current_user = user_mod.User.query.filter_by(user_login=get_jwt_identity()).first()
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()
        new_name = data.get('new_name')

        if not new_name:
            return jsonify({"error": "Missing new_name parameter"}), 400

        new_schema = schemas_build_log.ActionNodeSchemasBuilder.duplicate_schema(
            schema_id, new_name, current_user.id
        )

        return jsonify({
            "message": "Schema duplicated successfully",
            "new_schema_id": new_schema.id,
            "status": "success"
        })

    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===== ИЕРАРХИЯ НОДОВ =====
@blu_node_schemas_builder.route('/nodes/hierarchy', methods=['GET'])
@jwt_required()
def get_nodes_hierarchy():
    """Получить иерархию нодов для библиотеки"""
    try:
        hierarchy = schemas_build_log.ActionNodeSchemasBuilder.get_nodes_hierarchy()

        return jsonify({
            "hierarchy": hierarchy,
            "status": "success"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== СТАТИСТИКА =====
@blu_node_schemas_builder.route('/stats', methods=['GET'])
@jwt_required()
def get_schema_stats():
    """Получить статистику по схемам"""
    try:
        current_user = user_mod.User.query.filter_by(user_login=get_jwt_identity()).first()
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        stats = schemas_build_log.ActionNodeSchemasBuilder.get_schema_stats(
            current_user.id
        )

        return jsonify({
            "stats": stats,
            "status": "success"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== ЭКСПОРТ/ИМПОРТ =====
@blu_node_schemas_builder.route('/schemas/<int:schema_id>/export', methods=['GET'])
@jwt_required()
def export_schema(schema_id):
    """Экспортировать схему в JSON"""
    try:
        current_user = user_mod.User.query.filter_by(user_login=get_jwt_identity()).first()
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        schema = schemas_build_log.ActionNodeSchemasBuilder.get_schema_by_id(
            schema_id, current_user.id
        )

        if not schema:
            return jsonify({"error": "Schema not found"}), 404

        export_data = {
            'name': schema.name,
            'description': schema.description,
            'flow_data': schema.flow_data,
            'category': schema.category,
            'version': schema.version,
            'exported_at': datetime.now().isoformat(),
            'metadata': {
                'nodes_count': schema.nodes_count,
                'edges_count': schema.edges_count,
                'original_id': schema.id
            }
        }

        return jsonify({
            "export_data": export_data,
            "status": "success"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@blu_node_schemas_builder.route('/schemas/import', methods=['POST'])
@jwt_required()
def import_schema():
    """Импортировать схему из JSON"""
    try:
        current_user = user_mod.User.query.filter_by(user_login=get_jwt_identity()).first()
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()

        if not data or 'export_data' not in data:
            return jsonify({"error": "Invalid import data"}), 400

        export_data = data['export_data']

        # Создаем схему из импортированных данных
        schema_data = {
            'name': export_data.get('name', 'Imported Schema'),
            'description': export_data.get('description', ''),
            'flow_data': export_data.get('flow_data', {}),
            'category': export_data.get('category'),
            'version': export_data.get('version', '1.0.0')
        }

        schema = schemas_build_log.ActionNodeSchemasBuilder.create_schema(
            schema_data, current_user.id
        )

        return jsonify({
            "message": "Schema imported successfully",
            "schema_id": schema.id,
            "status": "success"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@blu_node_schemas_builder.route('/nodes', methods=['GET'])
@jwt_required()
def get_nodes_for_schemas():
    """Получить ноды для редактора схем (без пагинации)"""
    try:
        category_id = request.args.get('category_id', type=int)
        search = request.args.get('search', '')

        # Используем логику из Node Builder но возвращаем полные данные
        from backend.app.logic_model.node_builder_logic import ActionNodeBuilder

        nodes = ActionNodeBuilder.get_nodes(
            category_id=category_id,
            search=search
        )

        return jsonify({
            "nodes": [{
                'id': node.id,
                'node_id': node.node_id,
                'name': node.name,
                'std_node_type': node.std_node_type,
                'std_node_type_name': node.std_node_type_name,
                'id_std_node_type': node.id_std_node_type,
                'description': node.description,
                'category_id': node.category_id,
                'version': node.version,
                'tags': node.tags,
                'icon': node.data.get('icon', '⚙️') if node.data else '⚙️',
                'color': node.data.get('color', '#6B7280') if node.data else '#6B7280',
                # ВАЖНО: возвращаем полные данные для портов
                'inputs_schema': node.inputs_schema,
                'outputs_schema': node.outputs_schema,
                'data': node.data,
                'inputs_count': len(node.inputs_schema or []),
                'outputs_count': len(node.outputs_schema or []),
                'usage_count': node.usage_count,
                'last_used': node.last_used.isoformat() if node.last_used else None,
                'created_at': node.created_at.isoformat() if node.created_at else None,
                'updated_at': node.updated_at.isoformat() if node.updated_at else None
            } for node in nodes],  # Убрали .items
            "total": len(nodes),  # Просто количество нодов
            "status": "success"
        })

    except Exception as e:
        print(f"Error getting nodes for schemas: {str(e)}")
        return jsonify({"error": str(e)}), 500


@blu_node_schemas_builder.route('/nodes/categories', methods=['GET'])
@jwt_required()
def get_node_categories_for_schemas():
    """Получить категории нодов для редактора схем"""
    try:
        from backend.app.logic_model.node_builder_logic import ActionNodeBuilder

        categories = ActionNodeBuilder.get_categories()

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

    except Exception as e:
        print(f"Error getting node categories for schemas: {str(e)}")
        return jsonify({"error": str(e)}), 500