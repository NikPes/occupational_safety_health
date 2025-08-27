from backend.app.models.parent_model import ParentModels
from backend.app.extension import db
from sqlalchemy.orm import relationship

import uuid

NODE_ICONS = {
    'filter': '🔍',
    'sort': '⇅',
    'export': '📤',
    'import': '📥',
    'calculate': '🧮',
    'format': '🎨',
    'validate': '✅',
    'transform': '🔄',
    'aggregate': '📊',
    'group': '👥',
    'join': '🔗',
    'split': '✂️',
    'delay': '⏳',
    'loop': '🔄',
    'condition': '❓',
    'api': '🌐',
    'database': '💾',
    'file': '📁',
    'email': '✉️',
    'notification': '🔔',
    'menu': '🍔',
    'form': '📋',
    'table': '📋',
    'chart': '📈',
    'report': '📄',
    'user': '👤',
    'role': '🎭',
    'permission': '🔐',
    'log': '📝',
    'debug': '🐛'
}


# Таблица для хранения нодов (узлов)
class ReactFlowNode(ParentModels):
    __tablename__ = "ReactFlowNode"

    id = db.Column(db.Integer, primary_key=True)
    created_by = db.Column(db.Integer, db.ForeignKey('User.id', ondelete='CASCADE'))
    node_id = db.Column(db.String(50), unique=True, nullable=False)  # UUID шаблона
    name = db.Column(db.String(100), nullable=False)  # Человеческое название
    type = db.Column(db.String(30), nullable=False)  # Технический тип: 'filter', 'export'
    description = db.Column(db.Text)  # Подробное описание

    # Связь с категорией
    category_id = db.Column(db.Integer, db.ForeignKey('STDNodeCategory.id'))
    category_rel = relationship("STDNodeCategory", back_populates="nodes")

    # Данные шаблона
    data = db.Column(db.JSON, nullable=False, default=dict)  # { icon: "🔍", color: "#ff4757" }
    inputs_schema = db.Column(db.JSON, default=list)  # Схема входных портов
    outputs_schema = db.Column(db.JSON, default=list)  # Схема выходных портов
    execution_logic = db.Column(db.Text)  # JS код выполнения

    # Размеры по умолчанию
    width = db.Column(db.Float, default=200.0)
    height = db.Column(db.Float, default=100.0)

    # Управление версиями
    version = db.Column(db.String(20), default='1.0.0')
    changelog = db.Column(db.Text)  # История изменений
    previous_versions = db.Column(db.JSON, default=list)  # Архив старых версий
    is_deprecated = db.Column(db.Boolean, default=False)  # Устаревший нод

    # Для библиотеки
    is_template = db.Column(db.Boolean, default=True)  # True для шаблонов
    tags = db.Column(db.JSON, default=list)  # ['filter', 'data', 'table']
    required_permission = db.Column(db.Integer, default=0)  # Уровень доступа

    # Статистика
    usage_count = db.Column(db.Integer, default=0)  # Сколько раз использовался
    last_used = db.Column(db.DateTime)  # Последнее использование

    # Связи
    created_by_rel = relationship("User", back_populates="created_nodes")

    master_order = [
        'id', 'node_id', 'name', 'type', 'category_id', 'version',
        'is_template', 'required_permission', 'usage_count', 'last_used'
    ]

    per_page = 50

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.node_id:
            self.node_id = generate_uuid()

    def __repr__(self):
        return f"<ReactFlowNode(id={self.id}, name='{self.name}', type='{self.type}')>"


# Таблица для хранения связей (edges)
class ReactFlowEdge(ParentModels):
    __tablename__ = "ReactFlowEdge"

    id = db.Column(db.Integer, primary_key=True)
    edge_id = db.Column(db.String(50), unique=True, nullable=False)  # UUID связи

    # Статистика использования связей между типами нодов
    source_node_type = db.Column(db.String(30), nullable=False)  # Тип исходного нода
    target_node_type = db.Column(db.String(30), nullable=False)  # Тип целевого нода
    connection_count = db.Column(db.Integer, default=1)  # Количество использований

    # Данные связи
    edge_type = db.Column(db.String(30), default='default')  # Тип связи
    data = db.Column(db.JSON, default=dict)  # Дополнительные данные

    master_order = ['id', 'edge_id', 'source_node_type', 'target_node_type', 'connection_count']
    per_page = 100

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.edge_id:
            self.edge_id = generate_uuid()

    def __repr__(self):
        return f"<ReactFlowEdge(id={self.id}, {self.source_node_type}→{self.target_node_type})>"

# Таблица для хранения схем (сохраненных состояний)
class ReactFlowSchema(ParentModels):
    __tablename__ = "ReactFlowSchema"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)

    # Все данные схемы
    flow_data = db.Column(db.JSON, nullable=False, default=dict)  # { nodes: [], edges: [], viewport: {} }

    # Метаданные
    is_template = db.Column(db.Boolean, default=False)  # Шаблон схемы
    is_public = db.Column(db.Boolean, default=False)  # Публичная схема
    required_permission = db.Column(db.Integer, default=0)  # Уровень доступа

    # Версионность схемы
    version = db.Column(db.String(20), default='1.0.0')
    based_on_template = db.Column(db.String(50))  # UUID шаблона схемы

    # Статистика
    nodes_count = db.Column(db.Integer, default=0)  # Количество нодов
    edges_count = db.Column(db.Integer, default=0)  # Количество связей
    last_executed = db.Column(db.DateTime)  # Последний запуск

    # Связи
    created_by = db.Column(db.Integer, db.ForeignKey('User.id', ondelete='CASCADE'))
    created_by_rel = relationship("User", back_populates="created_schemas")

    master_order = [
        'id', 'name', 'is_template', 'is_public', 'required_permission',
        'version', 'nodes_count', 'edges_count', 'last_executed',
        'created_by', 'created_at', 'updated_at'
    ]

    per_page = 30

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Автоматический подсчет нодов и связей
        if 'flow_data' in kwargs:
            self.update_counts()

    def update_counts(self):
        """Обновляет счетчики нодов и связей"""
        if self.flow_data:
            self.nodes_count = len(self.flow_data.get('nodes', []))
            self.edges_count = len(self.flow_data.get('edges', []))

    def __repr__(self):
        return f"<ReactFlowSchema(id={self.id}, name='{self.name}')>"


class STDNodeCategory(ParentModels):
    __tablename__ = "STDNodeCategory"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)  # 'Логические', 'Данные', 'UI'
    icon = db.Column(db.String(20), default='⚙️')  # Эмодзи или иконка
    description = db.Column(db.Text)  # Описание категории
    order = db.Column(db.Integer, default=0)  # Порядок сортировки
    color = db.Column(db.String(7), default='#6B7280')  # Цвет категории

    # Связи
    nodes = relationship("ReactFlowNode", back_populates="category_rel")

    master_order = ['id', 'name', 'icon', 'order', 'color']
    per_page = 100

    def __repr__(self):
        return f"<STDNodeCategory(id={self.id}, name='{self.name}')>"


def generate_uuid():
    """Генерация UUID для нодов и связей"""
    return str(uuid.uuid4())

def get_default_node_data():
    """Данные по умолчанию для нода"""
    return {
        'icon': '⚙️',
        'color': '#6B7280',
        'defaults': {},
        'config': {}
    }

