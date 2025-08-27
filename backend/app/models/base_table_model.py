from backend.app.extension import db
from sqlalchemy.orm import relationship

from backend.app.models.parent_model import ParentModels


class AccessToStatus(ParentModels):
    __tablename__ = "AccessToStatus"
    id = db.Column(db.Integer, primary_key=True)
    table_name = db.Column(db.String(30), index=False, unique=False, nullable=True)
    column_name = db.Column(db.String(50), index=False, unique=False, nullable=True)
    column_name_show = db.Column(db.String(50), index=False, unique=False, nullable=True)
    id_std_type_field = db.Column(db.Integer, db.ForeignKey('STDTypeField.id', ondelete='CASCADE'))
    id_level_access = db.Column(db.Integer, db.ForeignKey('STDLevelAccess.id', ondelete='CASCADE'))
    required_permission = db.Column(db.Integer, default=0)

    # level_access
    # 0 - No access
    # 1 - Full access
    # 2 - Edit access
    # 3 - Read access
    # ................................................
    # Единый стиль именования отношений
    # status_user = relationship("STDStatusUser", back_populates="access_statuses")
    type_field = relationship("STDTypeField", back_populates="access_statuses")
    level_access_rel = relationship("STDLevelAccess", back_populates="access_statuses")


    master_order = ['id',
                    'table_name',
                    'column_name',
                    'column_name_show',
                    'id_std_type_field',
                    'id_level_access',
                    'required_permission']

    per_page = 30

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return f"<AccessToStatus(id={self.id}, table_name='{self.table_name}')>"

    @staticmethod
    def get_display_name():
        return None


class STDTypeField(ParentModels):
    __tablename__ = "STDTypeField"
    id = db.Column(db.Integer, primary_key=True)
    std_type_field = db.Column(db.String(20), index=False, unique=False, nullable=True)

    # Добавляем обратное отношение
    access_statuses = relationship("AccessToStatus", back_populates="type_field")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return "<STDTypeField(std_type_field='%s')>" % self.std_type_field

    def get_display_name(self):
        return self.std_type_field


class STDLevelAccess(ParentModels):
    __tablename__ = "STDLevelAccess"
    id = db.Column(db.Integer, primary_key=True)
    std_level_access = db.Column(db.String(24), index=False, unique=False, nullable=True)

    # Добавляем обратное отношение
    access_statuses = relationship("AccessToStatus", back_populates="level_access_rel")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return "<STDLevelAccess(std_level_access='%s')>" % self.std_level_access

    def get_display_name(self):
        return self.std_level_access


class PageConstruction(ParentModels):
    __tablename__ = "PageConstruction"
    id = db.Column(db.Integer, primary_key=True)
    page_name = db.Column(db.String(50), index=False, unique=False, nullable=True)
    table_name = db.Column(db.String(50), index=False, unique=False, nullable=True)
    dependence = db.Column(db.String(6), index=False, unique=False, nullable=True)
    position_tab = db.Column(db.String(5), index=False, unique=False, nullable=True)
    count_sheet = db.Column(db.Integer, index=False, unique=False, nullable=False)
    link_column = db.Column(db.String(50), index=False, unique=False, nullable=True)
    id_type_data = db.Column(db.Integer, db.ForeignKey('STDTypeData.id', ondelete='CASCADE'))
    required_permission = db.Column(db.Integer, default=0)
    comment = db.Column(db.String(60), index=False, unique=False, nullable=True)

    type_data_rel = relationship("STDTypeData", back_populates="page_constructions")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    master_order = ['id',
                    'page_name',
                    'table_name',
                    'dependence',
                    'position_tab',
                    'count_sheet',
                    'link_column',
                    'id_type_data',
                    'required_permission',
                    'comment']

    per_page = 30

    def to_dict(self, relations=True):
        data = super().to_dict(relations)
        if relations:
            if self.type_data_rel:  # Обновляем имя отношения здесь
                data['id_type_data'] = self.type_data_rel.to_dict(relations=False)
        return data

    def __repr__(self):
        return "<PageConstruction(page_name='%s', table_name='%s', dependence='%s')>" % (self.page_name,
                                                                                          self.table_name,
                                                                                          self.dependence)

    @classmethod
    def get_structure(cls, current_user, page_name):
        # Получаем уровень доступа текущего пользователя
        # Предполагаем, что у current_user есть атрибут permission_level
        if current_user and hasattr(current_user, 'status_user') and current_user.status_user:
            user_permission = current_user.status_user.priority
        else:
            user_permission = 999
        print(f'Query: page_name={page_name}, user_permission={user_permission}')
        # Фильтруем по page_name и required_permission
        # Пользователь видит только те страницы, где его уровень доступа >= required_permission
        structure = cls.query.filter_by(
            page_name=page_name
        ).filter(
            cls.required_permission >= user_permission
        ).options(
            db.joinedload(cls.type_data_rel)
        ).order_by(
            cls.position_tab.asc()  # Сортируем по позиции если нужно
        ).all()
        print(f'Found {len(structure)} items for user with permission {user_permission}')
        return [item.to_dict() for item in structure]


class STDTypeData(ParentModels):
    __tablename__ = "STDTypeData"
    id = db.Column(db.Integer, primary_key=True)
    std_type_data = db.Column(db.String(24), index=False, unique=False, nullable=True)

    page_constructions = relationship("PageConstruction", back_populates="type_data_rel")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return "<STDTypeData(std_type_data='%s')>" % self.std_type_data

    def get_display_name(self):
        return self.std_type_data

    @classmethod
    def get_component_name(cls, id_std_type):
        try:
            std_type = db.session.get(cls, int(id_std_type))
            return std_type.std_type_data if std_type else None
        except (ValueError, TypeError):
            return None