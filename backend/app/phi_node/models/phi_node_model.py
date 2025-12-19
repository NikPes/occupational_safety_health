from backend.app.base.models.parent_model import ParentModels
from backend.app.extension import db
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

def generate_uuid():
    """Генерация UUID для нодов и связей"""
    return str(uuid.uuid4())


class PhiNodeInstance(ParentModels):
    __tablename__ = "PhiNodeInstance"

    id = db.Column(db.Integer, primary_key=True)

    # Уникальный ID нода (UUID для клиент-серверной синхронизации)
    node_id = db.Column(db.String(36), unique=True, nullable=False)

    # Ссылка на схему
    schema_id = db.Column(db.Integer, db.ForeignKey('PhiSchema.id', ondelete='CASCADE'))

    # Ссылка на компонент (шаблон)
    component_key = db.Column(db.String(50), nullable=False)

    # Позиция на канвасе
    position_x = db.Column(db.Float, default=0.0)
    position_y = db.Column(db.Float, default=0.0)

    # Данные нода (значения контролов, состояние)
    node_data = db.Column(db.JSON, default=dict)

    # Временные метки
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связи
    schema = relationship("PhiSchema", back_populates="nodes")

    # Связи для соединений (входные и выходные)
    input_connections = relationship("PhiConnection",
                                     foreign_keys="PhiConnection.target_node_id",
                                     back_populates="target_node",
                                     cascade="all, delete-orphan")

    output_connections = relationship("PhiConnection",
                                      foreign_keys="PhiConnection.source_node_id",
                                      back_populates="source_node",
                                      cascade="all, delete-orphan")

    master_order = [
        'id', 'node_id', 'schema_id', 'component_key', 'position_x', 'position_y',
        'node_data', 'created_at', 'updated_at', 'input_connections', 'output_connections'
    ]

    per_page = 100

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.node_id:
            self.node_id = str(uuid.uuid4())

    def to_phi_dict(self):
        """Преобразуем нод в словарь для JSON"""
        return {
            'id': self.node_id,
            'componentKey': self.component_key,
            'position': {
                'x': self.position_x,
                'y': self.position_y
            },
            'data': self.node_data or {}
        }

    @classmethod
    def from_dict(cls, data):
        """Создаем нод из словаря"""
        node = cls()
        node.node_id = data.get('id', str(uuid.uuid4()))
        node.component_key = data.get('componentKey')

        position = data.get('position', {})
        node.position_x = position.get('x', 0.0)
        node.position_y = position.get('y', 0.0)

        node.node_data = data.get('data', {})
        return node

    def get_inputs(self):
        """Получаем все входные соединения"""
        return self.input_connections

    def get_outputs(self):
        """Получаем все выходные соединения"""
        return self.output_connections

    def __repr__(self):
        return (f"<PhiNodeInstance(id={self.id}, component='{self.component_key}', "
                f"position=({self.position_x}, {self.position_y}))>")


class PhiConnection(ParentModels):
    __tablename__ = "PhiConnection"

    id = db.Column(db.Integer, primary_key=True)

    # Уникальный ID соединения
    connection_id = db.Column(db.String(36), unique=True, nullable=False)

    # Ссылка на схему
    schema_id = db.Column(db.Integer, db.ForeignKey('PhiSchema.id', ondelete='CASCADE'))

    # Источник (исходящий нод)
    source_node_id = db.Column(db.String(36), db.ForeignKey('PhiNodeInstance.node_id'))
    source_socket = db.Column(db.String(50), nullable=False)

    # Цель (входящий нод)
    target_node_id = db.Column(db.String(36), db.ForeignKey('PhiNodeInstance.node_id'))
    target_socket = db.Column(db.String(50), nullable=False)

    # Дополнительные данные соединения
    connection_data = db.Column(db.JSON, default=dict)

    # Временные метки
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Связи
    schema = relationship("PhiSchema", back_populates="connections")

    source_node = relationship("PhiNodeInstance",
                               foreign_keys=[source_node_id],
                               back_populates="output_connections")

    target_node = relationship("PhiNodeInstance",
                               foreign_keys=[target_node_id],
                               back_populates="input_connections")

    master_order = [
        'id', 'connection_id', 'schema_id', 'source_node_id', 'source_socket',
        'target_node_id', 'target_socket', 'connection_data', 'created_at',
        'source_node', 'target_node'
    ]

    per_page = 200

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.connection_id:
            self.connection_id = str(uuid.uuid4())

    def to_phi_dict(self):
        """Преобразуем соединение в словарь для JSON"""
        return {
            'id': self.connection_id,
            'source': self.source_node_id,
            'sourceSocket': self.source_socket,
            'target': self.target_node_id,
            'targetSocket': self.target_socket,
            'data': self.connection_data or {}
        }

    @classmethod
    def from_dict(cls, data):
        """Создаем соединение из словаря"""
        connection = cls()
        connection.connection_id = data.get('id', str(uuid.uuid4()))
        connection.source_node_id = data.get('source')
        connection.source_socket = data.get('sourceSocket')
        connection.target_node_id = data.get('target')
        connection.target_socket = data.get('targetSocket')
        connection.connection_data = data.get('data', {})
        return connection

    def is_valid(self):
        """Проверяем валидность соединения"""
        return (self.source_node_id and self.target_node_id and
                self.source_socket and self.target_socket)

    def __repr__(self):
        return (f"<PhiConnection(id={self.id}, "
                f"{self.source_node_id}.{self.source_socket} → "
                f"{self.target_node_id}.{self.target_socket})>")


class PhiSchema(ParentModels):
    __tablename__ = "PhiSchema"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)

    # Визуальные настройки канваса
    viewport_zoom = db.Column(db.Float, default=1.0)
    viewport_x = db.Column(db.Float, default=0.0)
    viewport_y = db.Column(db.Float, default=0.0)

    # Метаданные и версионность
    version = db.Column(db.String(20), default='1.0.0')
    is_template = db.Column(db.Boolean, default=False)
    is_public = db.Column(db.Boolean, default=False)
    required_permission = db.Column(db.Integer, default=0)

    # Статистика
    nodes_count = db.Column(db.Integer, default=0)
    connections_count = db.Column(db.Integer, default=0)
    last_executed = db.Column(db.DateTime)

    # Временные метки
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связи
    created_by = db.Column(db.Integer, db.ForeignKey('User.id', ondelete='SET NULL'))
    category_id = db.Column(db.Integer, db.ForeignKey('STDSchemasCategory.id'))

    # Relationships
    nodes = relationship("PhiNodeInstance", back_populates="schema",
                         cascade="all, delete-orphan", lazy='select')
    connections = relationship("PhiConnection", back_populates="schema",
                               cascade="all, delete-orphan", lazy='select')
    created_by_rel = relationship("User", back_populates="phi_schemas")
    category_rel = relationship("STDSchemasCategory", back_populates="phi_schemas")

    master_order = [
        'id', 'name', 'description', 'viewport_zoom', 'viewport_x', 'viewport_y',
        'version', 'is_template', 'is_public', 'required_permission', 'nodes_count',
        'connections_count', 'last_executed', 'created_at', 'updated_at', 'created_by',
        'category_id', 'created_by_rel', 'category_rel'
    ]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.update_counts()

    def update_counts(self):
        """Обновляем счетчики нодов и связей"""
        self.nodes_count = len(self.nodes) if self.nodes else 0
        self.connections_count = len(self.connections) if self.connections else 0

    def to_phi_json(self):
        """Преобразуем схему в JSON для Phi редактора"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'nodes': [node.to_phi_dict() for node in self.nodes],
            'connections': [conn.to_phi_dict() for conn in self.connections],
            'viewport': {
                'zoom': self.viewport_zoom,
                'x': self.viewport_x,
                'y': self.viewport_y
            },
            'metadata': {
                'version': self.version,
                'is_template': self.is_template,
                'is_public': self.is_public,
                'nodes_count': self.nodes_count,
                'connections_count': self.connections_count,
                'last_executed': self.last_executed.isoformat() if self.last_executed else None,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            }
        }

    @classmethod
    def from_phi_json(cls, data, user_id=None):
        """Создаем/обновляем схему из JSON редактора"""
        schema_id = data.get('id')

        if schema_id:
            # Обновляем существующую схему
            schema = cls.query.get(schema_id)
            if not schema:
                raise ValueError(f"Schema with id {schema_id} not found")
        else:
            # Создаем новую схему
            schema = cls()
            schema.created_by = user_id

        # Обновляем основные поля
        schema.name = data.get('name', 'Unnamed Schema')
        schema.description = data.get('description')

        # Обновляем viewport
        viewport = data.get('viewport', {})
        schema.viewport_zoom = viewport.get('zoom', 1.0)
        schema.viewport_x = viewport.get('x', 0.0)
        schema.viewport_y = viewport.get('y', 0.0)

        # Метаданные
        metadata = data.get('metadata', {})
        schema.version = metadata.get('version', '1.0.0')
        schema.is_template = metadata.get('is_template', False)
        schema.is_public = metadata.get('is_public', False)

        schema.updated_at = datetime.utcnow()

        return schema

    def __repr__(self):
        return f"<PhiSchema(id={self.id}, name='{self.name}', nodes={self.nodes_count})>"


class PhiSocket(ParentModels):
    __tablename__ = "PhiSocket"

    id = db.Column(db.Integer, primary_key=True)

    # Уникальный технический идентификатор порта
    name = db.Column(db.String(50), unique=True, nullable=False)

    # Ссылка на стандартный тип данных
    std_type_id = db.Column(db.Integer, db.ForeignKey('STDTypeConnectionPhi.id', ondelete='CASCADE'))

    # Дополнительные метаданные
    description = db.Column(db.Text)
    is_deprecated = db.Column(db.Boolean, default=False)

    # Временные метки
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связи
    std_type_rel = relationship("STDTypeConnectionPhi", back_populates="sockets")

    master_order = [
        'id', 'name', 'std_type_id', 'description',
        'is_deprecated', 'created_at', 'updated_at', 'std_type_rel'
    ]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def get_compatible_types(self):
        """Получаем ID совместимых типов из таблицы CompatibleType"""
        if not self.std_type_rel:
            return []

        # Ищем все совместимости для данного типа
        compatibilities = CompatibleType.query.filter(
            (CompatibleType.std_type_id_one == self.std_type_id) |
            (CompatibleType.std_type_id_two == self.std_type_id)
        ).all()

        compatible_types = []
        for comp in compatibilities:
            if comp.std_type_id_one == self.std_type_id:
                compatible_types.append(comp.std_type_id_two)
            else:
                compatible_types.append(comp.std_type_id_one)

        return list(set(compatible_types))  # Убираем дубликаты

    def get_compatible_type_keys(self):
        """Получаем ключи совместимых типов"""
        compatible_types = self.get_compatible_types()
        return [
            STDTypeConnectionPhi.query.get(type_id).type_key
            for type_id in compatible_types
            if STDTypeConnectionPhi.query.get(type_id)
        ]

    def is_compatible_with(self, other_socket):
        """Проверяем совместимость через таблицу CompatibleType"""
        if not self.std_type_rel or not other_socket.std_type_rel:
            return False

        # Проверяем существование записи о совместимости
        compatibility_exists = CompatibleType.query.filter(
            ((CompatibleType.std_type_id_one == self.std_type_id) &
             (CompatibleType.std_type_id_two == other_socket.std_type_id)) |
            ((CompatibleType.std_type_id_one == other_socket.std_type_id) &
             (CompatibleType.std_type_id_two == self.std_type_id))
        ).first()

        return compatibility_exists is not None

    def to_phi_dict(self):
        """Формируем JSON для клиента с цветом и иконкой из STDTypeConnectionPhi"""
        base_type = self.std_type_rel

        if base_type:
            # Берем цвет и иконку из связанного стандартного типа
            color = base_type.color
            icon = base_type.icon
            type_key = base_type.type_key
        else:
            # Значения по умолчанию если тип не указан
            color = "#808080"
            icon = "🔵"
            type_key = "any"

        return {
            'name': self.name,
            'type': type_key,
            'compatibleWith': self.get_compatible_type_keys(),
            'color': color,
            'icon': icon,
            'description': self.description
        }

    def to_phi_socket(self):
        """Для регистрации в Phi.ts (только технические данные)"""
        return {
            'name': self.name,
            'compatible': self.get_compatible_type_keys()
        }

    def get_visual_props(self):
        """Получаем визуальные свойства из стандартного типа"""
        if not self.std_type_rel:
            return {"color": "#808080", "icon": "🔵"}

        return {
            "color": self.std_type_rel.color,
            "icon": self.std_type_rel.icon,
            "type_name": self.std_type_rel.show_name
        }

    def __repr__(self):
        type_name = self.std_type_rel.type_key if self.std_type_rel else 'unknown'
        return f"<PhiSocket(name='{self.name}', type='{type_name}')>"


class PhiNode(ParentModels):
    __tablename__ = "PhiNode"

    id = db.Column(db.Integer, primary_key=True)

    # Технический идентификатор компонента
    node_key = db.Column(db.String(50), unique=True, nullable=False)

    # Человеческое название
    name = db.Column(db.String(100), nullable=False)

    # КАТЕГОРИЯ - для визуальной группировки в интерфейсе
    std_node_category_id = db.Column(db.Integer, db.ForeignKey('STDNodeCategory.id'))

    # ТИП - для технической классификации и логики выполнения
    std_node_type_id = db.Column(db.Integer, db.ForeignKey('STDNodeType.id'))

    # Визуальные настройки
    icon = db.Column(db.String(20))
    color = db.Column(db.String(7))
    width = db.Column(db.Float, default=200.0)
    height = db.Column(db.Float, default=100.0)

    # Структура компонента (JSON для гибкости)
    inputs = db.Column(db.JSON, default=list)  # Входные порты
    outputs = db.Column(db.JSON, default=list)  # Выходные порты
    controls = db.Column(db.JSON, default=list)  # Элементы управления

    # Логика выполнения
    executor = db.Column(db.Text)  # JS код выполнения
    init_code = db.Column(db.Text)  # Код инициализации

    # Метаданные и версионность
    description = db.Column(db.Text)
    version = db.Column(db.String(20), default='1.0.0')
    is_deprecated = db.Column(db.Boolean, default=False)
    tags = db.Column(db.JSON, default=list)

    # Права доступа
    required_permission = db.Column(db.Integer, default=0)

    # Статистика
    usage_count = db.Column(db.Integer, default=0)
    last_used = db.Column(db.DateTime)

    # Временные метки
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Связи
    created_by = db.Column(db.Integer, db.ForeignKey('User.id', ondelete='SET NULL'))

    # Реляционные связи
    category_rel = relationship("STDNodeCategory", back_populates="phi_node")
    type_rel = relationship("STDNodeType", back_populates="phi_node")
    created_by_rel = relationship("User", back_populates="created_node")

    master_order = [
        'id', 'node_key', 'name', 'std_node_category_id', 'std_node_type_id',
        'icon', 'color', 'width', 'height', 'inputs', 'outputs', 'controls',
        'executor', 'init_code', 'description', 'version', 'is_deprecated',
        'tags', 'required_permission', 'usage_count', 'last_used', 'created_at',
        'updated_at', 'created_by', 'category_rel', 'type_rel', 'created_by_rel'
    ]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_phi_dict(self):
        """Для отображения в библиотеке компонентов"""
        return {
            'key': self.node_key,
            'name': self.name,
            'category': self.category_rel.name if self.category_rel else None,
            'type': self.type_rel.show_name_component_type if self.type_rel else None,
            'icon': self.icon,
            'color': self.color,
            'description': self.description,
            'inputs': self.inputs,
            'outputs': self.outputs,
            'controls': self.controls,
            'version': self.version,
            'tags': self.tags
        }

    def to_phi_node(self):
        """Для регистрации в Phi.ts редакторе"""
        return {
            'key': self.node_key,
            'name': self.name,
            'inputs': self._prepare_sockets(self.inputs),
            'outputs': self._prepare_sockets(self.outputs),
            'controls': self._prepare_controls(),
            'executor': self.executor
        }

    def _prepare_sockets(self, sockets_config):
        """Подготавливаем сокеты для Phi"""
        return {
            socket['key']: {
                'name': socket['name'],
                'socket': socket['socketType'],
                'displayName': socket.get('displayName', socket['name'])
            }
            for socket in sockets_config
        }

    def _prepare_controls(self):
        """Подготавливаем контролы для Phi"""
        return {
            control['key']: {
                'type': control['type'],
                'props': control.get('props', {})
            }
            for control in self.controls
        }

    def get_visual_props(self):
        """Получаем визуальные свойства из категории или собственные"""
        if self.category_rel and not self.icon:
            return {
                "color": self.category_rel.color,
                "icon": self.category_rel.icon
            }
        return {
            "color": self.color,
            "icon": self.icon
        }

    def __repr__(self):
        return (f"<PhiNode(key='{self.node_key}', name='{self.name}',"
                f"category='{self.category_rel.name if self.category_rel else None}')>")


class STDSchemasCategory(ParentModels):
    __tablename__ = "STDSchemasCategory"

    id = db.Column(db.Integer, primary_key=True)
    std_schemas_category = db.Column(db.String(50), nullable=False, unique=True)  # Техническое название
    show_name = db.Column(db.String(50), nullable=False, unique=True)  # Отображаемое название
    description = db.Column(db.Text)  # Описание категории
    order = db.Column(db.Integer, default=0)  # Порядок сортировки
    icon = db.Column(db.String(20), default='📁')  # Иконка категории

    # Связи
    phi_schemas = relationship("PhiSchema", back_populates="category_rel")

    master_order = ['id', 'std_schemas_category', 'show_name', 'description', 'order', 'icon']

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return f"<STDSchemasCategory(id={self.id}, show_name='{self.show_name}')>"


class STDNodeCategory(ParentModels):
    __tablename__ = "STDNodeCategory"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)  # 'Логические', 'Данные', 'UI'
    icon = db.Column(db.String(20), default='⚙️')  # Эмодзи или иконка
    description = db.Column(db.Text)  # Описание категории
    order = db.Column(db.Integer, default=0)  # Порядок сортировки
    color = db.Column(db.String(7), default='#6B7280')  # Цвет категории

    # Связи
    phi_node = relationship("PhiNode", back_populates="category_rel")

    master_order = ['id', 'name', 'icon', 'order', 'color']

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return f"<STDNodeCategory(id={self.id}, name='{self.name}')>"


class STDNodeType(ParentModels):
    __tablename__ = "STDNodeType"

    id = db.Column(db.Integer, primary_key=True)
    std_node_type = db.Column(db.String(50), nullable=False, unique=True)  # 'Логические', 'Данные', 'UI'
    show_name_node_type = db.Column(db.String(50), nullable=True)

    # Связи
    phi_node = relationship("PhiNode", back_populates="type_rel")

    master_order = ['id', 'std_node_type', 'show_name_node_type']

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return f"<STDNodeType(id={self.id}, std_node_type='{self.std_node_type}')>"


class STDTypeConnectionPhi(ParentModels):
    __tablename__ = "STDTypeConnectionPhi"

    id = db.Column(db.Integer, primary_key=True)
    type_key = db.Column(db.String(50), unique=True, nullable=False)
    show_name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(7), default="#808080")
    icon = db.Column(db.String(20))
    description = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)
    is_builtin = db.Column(db.Boolean, default=True)

    # Связи
    sockets = relationship("PhiSocket", back_populates="std_type_rel")

    master_order = [
        'id', 'type_key', 'show_name', 'color', 'icon',
        'description', 'order', 'is_builtin'
    ]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_phi_dict(self):
        return {
            'typeKey': self.type_key,
            'showName': self.show_name,
            'color': self.color,
            'icon': self.icon,
            'description': self.description
        }

    def __repr__(self):
        return f"<STDTypeConnectionPhi(key='{self.type_key}', name='{self.show_name}')>"


class CompatibleType(ParentModels):
    __tablename__ = "CompatibleType"

    id = db.Column(db.Integer, primary_key=True)
    std_type_id_one = db.Column(db.Integer, db.ForeignKey('STDTypeConnectionPhi.id', ondelete='CASCADE'),
                                nullable=False)
    std_type_id_two = db.Column(db.Integer, db.ForeignKey('STDTypeConnectionPhi.id', ondelete='CASCADE'),
                                nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Связи
    type_one_rel = relationship("STDTypeConnectionPhi", foreign_keys=[std_type_id_one])
    type_two_rel = relationship("STDTypeConnectionPhi", foreign_keys=[std_type_id_two])

    # Уникальная constraint -避免 дубликатов
    __table_args__ = (
        db.UniqueConstraint('std_type_id_one', 'std_type_id_two', name='uq_type_compatibility'),
    )

    master_order = [
        'id', 'std_type_id_one', 'std_type_id_two', 'created_at',
        'type_one_rel', 'type_two_rel'
    ]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        type1 = self.type_one_rel.type_key if self.type_one_rel else 'unknown'
        type2 = self.type_two_rel.type_key if self.type_two_rel else 'unknown'
        return f"<CompatibleType({type1} ↔ {type2})>"