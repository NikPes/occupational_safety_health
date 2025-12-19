from backend.app.extension import db
from sqlalchemy import or_, and_
import backend.app.node.models.node_model as rete_mod


class NodeBuilderLogic:

    # ===== КАТЕГОРИИ КОМПОНЕНТОВ =====
    @staticmethod
    def get_component_categories():
        """Получить все категории компонентов"""
        categories = rete_mod.STDComponentCategory.query.order_by('order').all()
        return [{'id': c.id, 'name': c.name, 'icon': c.icon, 'color': c.color} for c in categories]

    # ===== ТИПЫ КОМПОНЕНТОВ =====
    @staticmethod
    def get_component_types():
        """Получить все типы компонентов"""
        types = rete_mod.STDComponentType.query.all()
        return [{'id': t.id, 'type_key': t.std_node_type, 'show_name': t.show_name_node_type} for t in types]

    # ===== ТИПЫ СОКЕТОВ =====
    @staticmethod
    def get_socket_types():
        """Получить все типы данных для сокетов"""
        types = rete_mod.STDTypeConnectionRete.query.order_by('order').all()
        return [t.to_dict() for t in types]

    # ===== СОВМЕСТИМОСТЬ ТИПОВ =====
    @staticmethod
    def get_type_compatibilities():
        """Получить матрицу совместимости типов"""
        compatibilities = rete_mod.CompatibleType.query.all()
        return [c.to_dict() for c in compatibilities]

    # ===== КОМПОНЕНТЫ =====
    @staticmethod
    def get_all_components():
        """Получить все компоненты"""
        components = rete_mod.ReteComponent.query.all()
        return [c.to_rete_dict() for c in components]

    @staticmethod
    def get_component_by_key(component_key):
        """Получить компонент по ключу"""
        return rete_mod.ReteComponent.query.filter_by(component_key=component_key).first()

    @staticmethod
    def create_component(data, user_id):
        """Создать новый компонент"""
        # Проверка уникальности component_key
        if rete_mod.ReteComponent.query.filter_by(component_key=data['component_key']).first():
            raise ValueError('Component key already exists')

        component = rete_mod.ReteComponent(
            component_key=data['component_key'],
            name=data['name'],
            category_id=data.get('category_id'),
            component_type_id=data.get('component_type_id'),
            icon=data.get('icon'),
            color=data.get('color'),
            inputs=data.get('inputs', []),
            outputs=data.get('outputs', []),
            controls=data.get('controls', []),
            executor=data.get('executor', ''),
            description=data.get('description'),
            created_by=user_id
        )

        db.session.add(component)
        db.session.commit()
        return component

    @staticmethod
    def update_component(component_key, data, user_id):
        """Обновить компонент"""
        component = rete_mod.ReteComponent.query.filter_by(component_key=component_key).first()
        if not component:
            raise ValueError('Component not found')

        # Проверка прав доступа
        if component.created_by != user_id:
            raise PermissionError('Access denied')

        component.name = data.get('name', component.name)
        component.category_id = data.get('category_id', component.category_id)
        component.icon = data.get('icon', component.icon)
        component.color = data.get('color', component.color)
        component.inputs = data.get('inputs', component.inputs)
        component.outputs = data.get('outputs', component.outputs)
        component.controls = data.get('controls', component.controls)
        component.executor = data.get('executor', component.executor)
        component.description = data.get('description', component.description)
        component.version = data.get('version', component.version)

        db.session.commit()
        return component

    @staticmethod
    def delete_component(component_key, user_id):
        """Удалить компонент"""
        component = rete_mod.ReteComponent.query.filter_by(component_key=component_key).first()
        if not component:
            raise ValueError('Component not found')

        if component.created_by != user_id:
            raise PermissionError('Access denied')

        db.session.delete(component)
        db.session.commit()
        return True

    # ===== ВАЛИДАЦИЯ =====
    @staticmethod
    def validate_component_data(data):
        """Валидация данных компонента"""
        errors = []

        # Проверка обязательных полей
        if not data.get('component_key'):
            errors.append('Component key is required')
        if not data.get('name'):
            errors.append('Name is required')

        # Проверка уникальности component_key (для новых компонентов)
        if 'id' not in data and rete_mod.ReteComponent.query.filter_by(component_key=data['component_key']).first():
            errors.append('Component key must be unique')

        # Валидация структуры портов
        for i, port in enumerate(data.get('inputs', [])):
            if not port.get('key'):
                errors.append(f"Input port {i} must have a key")
            if not port.get('name'):
                errors.append(f"Input port {i} must have a name")

        for i, port in enumerate(data.get('outputs', [])):
            if not port.get('key'):
                errors.append(f"Output port {i} must have a key")
            if not port.get('name'):
                errors.append(f"Output port {i} must have a name")

        # Валидация контролов
        for i, control in enumerate(data.get('controls', [])):
            if not control.get('key'):
                errors.append(f"Control {i} must have a key")
            if not control.get('type'):
                errors.append(f"Control {i} must have a type")

        return errors

        # ===== ПОИСК И ФИЛЬТРАЦИЯ =====
        @staticmethod
        def search_components(search_query=None, category_id=None, component_type_id=None,
                              tags=None, user_id=None, limit=50, offset=0):
            """
            Поиск и фильтрация компонентов
            """
            query = rete_mod.ReteComponent.query

            # Поиск по тексту (название, описание, ключ)
            if search_query:
                search_filter = or_(
                    rete_mod.ReteComponent.name.ilike(f'%{search_query}%'),
                    rete_mod.ReteComponent.description.ilike(f'%{search_query}%'),
                    rete_mod.ReteComponent.component_key.ilike(f'%{search_query}%')
                )
                query = query.filter(search_filter)

            # Фильтр по категории
            if category_id:
                query = query.filter(rete_mod.ReteComponent.category_id == category_id)

            # Фильтр по типу компонента
            if component_type_id:
                query = query.filter(rete_mod.ReteComponent.component_type_id == component_type_id)

            # Фильтр по тегам
            if tags:
                tag_filters = []
                for tag in tags:
                    tag_filters.append(rete_mod.ReteComponent.tags.contains([tag]))
                query = query.filter(and_(*tag_filters))

            # Фильтр по пользователю
            if user_id:
                query = query.filter(rete_mod.ReteComponent.created_by == user_id)

            # Сортировка и пагинация
            components = query.order_by(rete_mod.ReteComponent.name.asc()).limit(limit).offset(offset).all()
            total_count = query.count()

            return {
                'components': [comp.to_rete_dict() for comp in components],
                'total_count': total_count,
                'limit': limit,
                'offset': offset
            }