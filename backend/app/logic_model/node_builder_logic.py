from backend.app.extension import db
from sqlalchemy import or_
from datetime import datetime

import backend.app.models.react_flow_model as react_flow_mod


class ActionNodeBuilder:

    @staticmethod
    def get_categories():
        """Получить все категории нодов"""
        return react_flow_mod.STDNodeCategory.query.order_by(
            react_flow_mod.STDNodeCategory.order.asc()
        ).all()

    @staticmethod
    def get_nodes(page=1, per_page=50, category_id=None, search='', tags=None):
        """Получить ноды с фильтрацией и пагинацией"""
        query = react_flow_mod.ReactFlowNode.query.filter_by(is_template=True)

        if category_id:
            query = query.filter_by(category_id=category_id)

        if search:
            query = query.filter(or_(
                react_flow_mod.ReactFlowNode.name.ilike(f'%{search}%'),
                react_flow_mod.ReactFlowNode.description.ilike(f'%{search}%')
            ))

        if tags:
            for tag in tags:
                query = query.filter(react_flow_mod.ReactFlowNode.tags.contains([tag]))

        return query.order_by(react_flow_mod.ReactFlowNode.name.asc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    @staticmethod
    def get_node_by_id(node_id):
        """Получить нод по ID"""
        return react_flow_mod.ReactFlowNode.query.filter_by(
            node_id=node_id, is_template=True
        ).first()

    @staticmethod
    def create_node(data, created_by):
        """Создать новый нод"""
        node = react_flow_mod.ReactFlowNode(
            name=data['name'],
            type=data['type'],
            category_id=data['category_id'],
            description=data.get('description', ''),
            data=data.get('data', {}),
            inputs_schema=data.get('inputs_schema', []),
            outputs_schema=data.get('outputs_schema', []),
            execution_logic=data.get('execution_logic', ''),
            width=data.get('width', 200.0),
            height=data.get('height', 100.0),
            tags=data.get('tags', []),
            required_permission=data.get('required_permission', 0),
            created_by=created_by,
            created_at=datetime.now().isoformat()
        )

        db.session.add(node)
        db.session.commit()
        return node

    @staticmethod
    def update_node(node, data):
        """Обновить существующий нод"""
        # Сохраняем предыдущую версию
        previous_version = {
            'version': node.version,
            'data': node.data,
            'inputs_schema': node.inputs_schema,
            'outputs_schema': node.outputs_schema,
            'execution_logic': node.execution_logic,
            'updated_at': datetime.now().isoformat()
        }

        # Обновляем поля
        if 'name' in data: node.name = data['name']
        if 'description' in data: node.description = data['description']
        if 'category_id' in data: node.category_id = data['category_id']
        if 'data' in data: node.data = data['data']
        if 'inputs_schema' in data: node.inputs_schema = data['inputs_schema']
        if 'outputs_schema' in data: node.outputs_schema = data['outputs_schema']
        if 'execution_logic' in data: node.execution_logic = data['execution_logic']
        if 'tags' in data: node.tags = data['tags']
        if 'required_permission' in data: node.required_permission = data['required_permission']

        # Управление версиями
        if 'version' in data:
            if not node.previous_versions:
                node.previous_versions = []
            node.previous_versions.append(previous_version)
            node.version = data['version']

        node.updated_at = db.func.current_timestamp()
        db.session.commit()
        return node

    @staticmethod
    def delete_node(node):
        """Мягкое удаление нода"""
        node.is_template = False
        node.updated_at = db.func.current_timestamp()
        db.session.commit()
        return node

    @staticmethod
    def search_nodes(search='', tags=None):
        """Поиск нодов"""
        query = react_flow_mod.ReactFlowNode.query.filter_by(is_template=True)

        if search:
            query = query.filter(or_(
                react_flow_mod.ReactFlowNode.name.ilike(f'%{search}%'),
                react_flow_mod.ReactFlowNode.description.ilike(f'%{search}%'),
                react_flow_mod.ReactFlowNode.tags.contains([search])
            ))

        if tags:
            query = query.filter(react_flow_mod.ReactFlowNode.tags.contains(tags))

        return query.limit(20).all()

    @staticmethod
    def get_all_tags():
        """Получить все уникальные теги"""
        nodes = react_flow_mod.ReactFlowNode.query.filter_by(is_template=True).all()
        tags = set()

        for node in nodes:
            if node.tags:
                tags.update(node.tags)

        return sorted(list(tags))

    @staticmethod
    def get_stats():
        """Статистика по нодам"""
        total_nodes = react_flow_mod.ReactFlowNode.query.filter_by(is_template=True).count()
        total_categories = react_flow_mod.STDNodeCategory.query.count()

        # Статистика по категориям
        categories_stats = db.session.query(
            react_flow_mod.STDNodeCategory.name,
            db.func.count(react_flow_mod.ReactFlowNode.id)
        ).outerjoin(
            react_flow_mod.ReactFlowNode,
            react_flow_mod.ReactFlowNode.category_id == react_flow_mod.STDNodeCategory.id
        ).group_by(react_flow_mod.STDNodeCategory.name).all()

        return {
            'total_nodes': total_nodes,
            'total_categories': total_categories,
            'categories': [{'name': name, 'count': count} for name, count in categories_stats]
        }

    @staticmethod
    def get_most_used_nodes(limit=5):
        """Самые популярные ноды"""
        nodes = react_flow_mod.ReactFlowNode.query.filter_by(
            is_template=True
        ).order_by(
            react_flow_mod.ReactFlowNode.usage_count.desc()
        ).limit(limit).all()

        return [{
            'name': node.name,
            'usage_count': node.usage_count,
            'type': node.type
        } for node in nodes]