from sqlalchemy.orm import joinedload
from backend.app.extension import db
import backend.app.models.react_flow_model as react_flow_mod


class ActionNodeSchemasBuilder:

    @staticmethod
    def get_categories():
        """Получить все категории нодов"""
        return react_flow_mod.STDNodeCategory.query.order_by(
            react_flow_mod.STDNodeCategory.order.asc()
        ).all()

    @staticmethod
    def get_schemas_list(user_id, category_id=None, search=None):
        """Получить список схем без пагинации"""
        try:
            # Добавляем joinedload для загрузки категорий
            query = react_flow_mod.ReactFlowSchema.query.options(
                joinedload(react_flow_mod.ReactFlowSchema.schemas_category_rel)
            ).filter_by(created_by=user_id)

            if category_id and category_id != 'all':
                # Исправляем название поля - должно быть id_schemas_category
                query = query.filter(react_flow_mod.ReactFlowSchema.id_schemas_category == category_id)

            if search:
                search_term = f"%{search}%"
                query = query.filter(
                    (react_flow_mod.ReactFlowSchema.name.ilike(search_term)) |
                    (react_flow_mod.ReactFlowSchema.description.ilike(search_term))
                )

            schemas = query.order_by(
                react_flow_mod.ReactFlowSchema.updated_at.desc()
            ).all()

            return schemas

        except Exception as e:
            print(f"Error getting schemas list: {str(e)}")
            # Возвращаем пустой список вместо None
            return []


    @staticmethod
    def get_node_type_list():
        return react_flow_mod.STDNodeType.query.order_by(
            react_flow_mod.STDNodeType.std_node_type
        ).all()

    @staticmethod
    def get_schema_categories():
        """Получить категории схем"""
        try:
            categories = react_flow_mod.STDSchemasCategory.query.order_by(
                react_flow_mod.STDSchemasCategory.order
            ).all()

            return categories

        except Exception as e:
            print(f"Error getting schema categories: {str(e)}")
            return []

    @staticmethod
    def get_schema_by_id(schema_id, user_id):
        """Получить схему по ID с проверкой прав доступа"""
        try:
            schema = react_flow_mod.ReactFlowSchema.query.filter_by(
                id=schema_id,
                created_by=user_id
            ).first()

            return schema

        except Exception as e:
            print(f"Error getting schema by ID: {str(e)}")
            return None

    @staticmethod
    def create_schema(schema_data, user_id):
        """Создать новую схему"""
        try:
            required_fields = ['name', 'flow_data']
            for field in required_fields:
                if field not in schema_data:
                    raise ValueError(f"Missing required field: {field}")

            schema = react_flow_mod.ReactFlowSchema(
                name=schema_data['name'],
                description=schema_data.get('description', ''),
                flow_data=schema_data['flow_data'],
                id_schemas_category=schema_data.get('id_schemas_category'),
                is_template=schema_data.get('is_template', False),
                is_public=schema_data.get('is_public', False),
                required_permission=schema_data.get('required_permission', 0),
                version=schema_data.get('version', '1.0.0'),
                created_by=user_id
            )

            schema.update_counts()

            db.session.add(schema)
            db.session.commit()

            return schema

        except Exception as e:
            db.session.rollback()
            print(f"Error creating schema: {str(e)}")
            raise

    @staticmethod
    def update_schema(schema_id, schema_data, user_id):
        """Обновить существующую схему"""
        try:
            schema = react_flow_mod.ReactFlowSchema.query.filter_by(
                id=schema_id,
                created_by=user_id
            ).first()

            if not schema:
                raise ValueError("Schema not found or access denied")

            # Обновляем поля
            if 'name' in schema_data:
                schema.name = schema_data['name']
            if 'description' in schema_data:
                schema.description = schema_data['description']
            if 'flow_data' in schema_data:
                schema.flow_data = schema_data['flow_data']
                schema.update_counts()  # Обновляем счетчики
            if 'category' in schema_data:
                schema.category = schema_data['category']
            if 'is_template' in schema_data:
                schema.is_template = schema_data['is_template']
            if 'is_public' in schema_data:
                schema.is_public = schema_data['is_public']
            if 'required_permission' in schema_data:
                schema.required_permission = schema_data['required_permission']
            if 'version' in schema_data:
                schema.version = schema_data['version']

            db.session.commit()

            return schema

        except Exception as e:
            db.session.rollback()
            print(f"Error updating schema: {str(e)}")
            raise

    @staticmethod
    def delete_schema(schema_id, user_id):
        """Удалить схему"""
        try:
            schema = react_flow_mod.ReactFlowSchema.query.filter_by(
                id=schema_id,
                created_by=user_id
            ).first()

            if not schema:
                raise ValueError("Schema not found or access denied")

            db.session.delete(schema)
            db.session.commit()

            return True

        except Exception as e:
            db.session.rollback()
            print(f"Error deleting schema: {str(e)}")
            raise

    @staticmethod
    def duplicate_schema(schema_id, new_name, user_id):
        """Дублировать схему"""
        try:
            original_schema = react_flow_mod.ReactFlowSchema.query.filter_by(
                id=schema_id,
                created_by=user_id
            ).first()

            if not original_schema:
                raise ValueError("Schema not found or access denied")

            # Создаем копию схемы
            new_schema = react_flow_mod.ReactFlowSchema(
                name=new_name,
                description=original_schema.description,
                flow_data=original_schema.flow_data,
                category=original_schema.category,
                is_template=original_schema.is_template,
                is_public=original_schema.is_public,
                required_permission=original_schema.required_permission,
                version=original_schema.version,
                created_by=user_id
            )

            new_schema.update_counts()

            db.session.add(new_schema)
            db.session.commit()

            return new_schema

        except Exception as e:
            db.session.rollback()
            print(f"Error duplicating schema: {str(e)}")
            raise

    @staticmethod
    def get_nodes_hierarchy():
        """Получить иерархию нодов для библиотеки"""
        try:
            # Загружаем категории с нодами
            categories = react_flow_mod.STDNodeCategory.query.options(
                joinedload(react_flow_mod.STDNodeCategory.nodes)
            ).order_by(react_flow_mod.STDNodeCategory.order).all()

            # Формируем иерархическую структуру
            hierarchy = []
            for category in categories:
                category_data = {
                    'id': category.id,
                    'name': category.name,
                    'icon': category.icon,
                    'color': category.color,
                    'description': category.description,
                    'types': {}
                }

                # Группируем ноды по типам
                for node in category.nodes:
                    if node.is_template:  # Только шаблонные ноды
                        if node.id_std_node_type not in category_data['types']:
                            # Получаем информацию о типе нода
                            node_type = react_flow_mod.STDNodeType.query.get(node.id_std_node_type)
                            category_data['types'][node.id_std_node_type] = {
                                'type_name': node_type.show_name_node_type if node_type and node_type.show_name_node_type else node_type.std_node_type if node_type else 'Unknown',
                                # Используем show_name_node_type
                                'nodes': []
                            }

                        category_data['types'][node.id_std_node_type]['nodes'].append({
                            'id': node.id,
                            'node_id': node.node_id,
                            'name': node.name,
                            'description': node.description,
                            'icon': node.data.get('icon', '⚙️'),
                            'color': node.data.get('color', '#6B7280'),
                            'inputs_schema': node.inputs_schema,
                            'outputs_schema': node.outputs_schema,
                            'inputs_count': len(node.inputs_schema or []),
                            'outputs_count': len(node.outputs_schema or [])
                        })

                # Преобразуем types в список
                category_data['types'] = list(category_data['types'].values())
                hierarchy.append(category_data)

            return hierarchy

        except Exception as e:
            print(f"Error getting nodes hierarchy: {str(e)}")
            return []

    @staticmethod
    def get_schema_stats(user_id):
        """Получить статистику по схемам"""
        try:
            total_schemas = react_flow_mod.ReactFlowSchema.query.filter_by(
                created_by=user_id
            ).count()

            total_nodes = db.session.query(
                db.func.sum(react_flow_mod.ReactFlowSchema.nodes_count)
            ).filter(
                react_flow_mod.ReactFlowSchema.created_by == user_id
            ).scalar() or 0

            total_edges = db.session.query(
                db.func.sum(react_flow_mod.ReactFlowSchema.edges_count)
            ).filter(
                react_flow_mod.ReactFlowSchema.created_by == user_id
            ).scalar() or 0

            recent_schemas = react_flow_mod.ReactFlowSchema.query.filter_by(
                created_by=user_id
            ).order_by(
                react_flow_mod.ReactFlowSchema.updated_at.desc()
            ).limit(5).all()

            return {
                'total_schemas': total_schemas,
                'total_nodes': total_nodes,
                'total_edges': total_edges,
                'recent_schemas': [
                    {
                        'id': schema.id,
                        'name': schema.name,
                        'updated_at': schema.updated_at.isoformat() if schema.updated_at else None,
                        'nodes_count': schema.nodes_count,
                        'edges_count': schema.edges_count
                    }
                    for schema in recent_schemas
                ]
            }

        except Exception as e:
            print(f"Error getting schema stats: {str(e)}")
            return {
                'total_schemas': 0,
                'total_nodes': 0,
                'total_edges': 0,
                'recent_schemas': []
            }