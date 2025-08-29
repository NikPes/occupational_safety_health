# backend/app/logic_model/node_schemas_builder_logic.py
from backend.app.extension import db
from sqlalchemy import or_, func
from datetime import datetime

import backend.app.models.react_flow_model as react_flow_mod

class ActionNodeSchemasBuilder:

    @staticmethod
    def get_schemas(page=1, per_page=30, is_template=None, search='', created_by=None):
        """Получить схемы с фильтрацией и пагинацией"""
        query = react_flow_mod.ReactFlowSchema.query

        if is_template is not None:
            query = query.filter_by(is_template=is_template)

        if created_by:
            query = query.filter_by(created_by=created_by)

        if search:
            query = query.filter(or_(
                react_flow_mod.ReactFlowSchema.name.ilike(f'%{search}%'),
                react_flow_mod.ReactFlowSchema.description.ilike(f'%{search}%')
            ))

        return query.order_by(react_flow_mod.ReactFlowSchema.updated_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    @staticmethod
    def get_schema_by_id(schema_id):
        """Получить схему по ID"""
        return react_flow_mod.ReactFlowSchema.query.get(schema_id)

    @staticmethod
    def create_schema(data, created_by):
        """Создать новую схему"""
        schema = react_flow_mod.ReactFlowSchema(
            name=data['name'],
            description=data.get('description', ''),
            flow_data=data.get('flow_data', {'nodes': [], 'edges': [], 'viewport': {}}),
            is_template=data.get('is_template', False),
            is_public=data.get('is_public', False),
            required_permission=data.get('required_permission', 0),
            version=data.get('version', '1.0.0'),
            based_on_template=data.get('based_on_template'),
            created_by=created_by
        )

        # Обновляем счетчики
        schema.update_counts()

        db.session.add(schema)
        db.session.commit()
        return schema

    @staticmethod
    def update_schema(schema, data):
        """Обновить существующую схему"""
        if 'name' in data: schema.name = data['name']
        if 'description' in data: schema.description = data['description']
        if 'flow_data' in data: 
            schema.flow_data = data['flow_data']
            schema.update_counts()
        if 'is_template' in data: schema.is_template = data['is_template']
        if 'is_public' in data: schema.is_public = data['is_public']
        if 'required_permission' in data: schema.required_permission = data['required_permission']
        if 'version' in data: schema.version = data['version']
        if 'based_on_template' in data: schema.based_on_template = data['based_on_template']

        schema.updated_at = db.func.current_timestamp()
        db.session.commit()
        return schema

    @staticmethod
    def delete_schema(schema):
        """Удалить схему"""
        db.session.delete(schema)
        db.session.commit()
        return schema

    @staticmethod
    def duplicate_schema(schema, new_name, created_by):
        """Дублировать схему"""
        new_schema = react_flow_mod.ReactFlowSchema(
            name=new_name,
            description=f"Копия: {schema.description}" if schema.description else "",
            flow_data=schema.flow_data.copy() if schema.flow_data else {'nodes': [], 'edges': [], 'viewport': {}},
            is_template=schema.is_template,
            is_public=schema.is_public,
            required_permission=schema.required_permission,
            version=schema.version,
            based_on_template=schema.based_on_template,
            nodes_count=schema.nodes_count,
            edges_count=schema.edges_count,
            created_by=created_by
        )

        db.session.add(new_schema)
        db.session.commit()
        return new_schema

    @staticmethod
    def search_schemas(search='', is_template=None, created_by=None):
        """Поиск схем"""
        query = react_flow_mod.ReactFlowSchema.query

        if is_template is not None:
            query = query.filter_by(is_template=is_template)

        if created_by:
            query = query.filter_by(created_by=created_by)

        if search:
            query = query.filter(or_(
                react_flow_mod.ReactFlowSchema.name.ilike(f'%{search}%'),
                react_flow_mod.ReactFlowSchema.description.ilike(f'%{search}%')
            ))

        return query.order_by(react_flow_mod.ReactFlowSchema.updated_at.desc()).limit(20).all()

    @staticmethod
    def get_stats(user_id=None):
        """Статистика по схемам"""
        query = react_flow_mod.ReactFlowSchema.query

        if user_id:
            query = query.filter_by(created_by=user_id)

        total_schemas = query.count()
        total_templates = query.filter_by(is_template=True).count()
        total_public = query.filter_by(is_public=True).count()

        # Статистика по типам
        type_stats = db.session.query(
            react_flow_mod.ReactFlowSchema.is_template,
            func.count(react_flow_mod.ReactFlowSchema.id)
        )

        if user_id:
            type_stats = type_stats.filter_by(created_by=user_id)

        type_stats = type_stats.group_by(react_flow_mod.ReactFlowSchema.is_template).all()

        return {
            'total_schemas': total_schemas,
            'total_templates': total_templates,
            'total_public': total_public,
            'types': [{'is_template': is_temp, 'count': count} for is_temp, count in type_stats]
        }

    @staticmethod
    def get_most_used_schemas(limit=5, user_id=None):
        """Самые популярные схемы"""
        query = react_flow_mod.ReactFlowSchema.query

        if user_id:
            query = query.filter_by(created_by=user_id)

        schemas = query.order_by(
            react_flow_mod.ReactFlowSchema.last_executed.desc()
        ).limit(limit).all()

        return [{
            'name': schema.name,
            'last_executed': schema.last_executed.isoformat() if schema.last_executed else None,
            'nodes_count': schema.nodes_count,
            'type': 'Шаблон' if schema.is_template else 'Схема'
        } for schema in schemas]