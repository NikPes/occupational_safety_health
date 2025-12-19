from backend.app.extension import db
from sqlalchemy.orm import relationship

from backend.app.base.models.parent_model import ParentModels


class PageConstruction(ParentModels):
    __tablename__ = "PageConstruction"
    id = db.Column(db.Integer, primary_key=True)
    page_name = db.Column(db.String(50), index=False, unique=False, nullable=True)
    table_name = db.Column(db.String(50), index=False, unique=False, nullable=True)
    dependence = db.Column(db.String(6), index=False, unique=False, nullable=True)
    position_tab = db.Column(db.String(5), index=False, unique=False, nullable=True)
    count_sheet = db.Column(db.Integer, index=False, unique=False, nullable=False)
    link_column = db.Column(db.String(50), index=False, unique=False, nullable=True)
    id_std_component_name = db.Column(db.Integer, db.ForeignKey('STDComponentName.id', ondelete='CASCADE'))
    required_permission = db.Column(db.Integer, default=0)
    comment = db.Column(db.String(60), index=False, unique=False, nullable=True)

    type_data_rel = relationship("STDComponentName", back_populates="page_constructions")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
# Надо поменять id_type_data на id_component_name
    master_order = ['id',
                    'page_name',
                    'table_name',
                    'dependence',
                    'position_tab',
                    'count_sheet',
                    'link_column',
                    'id_std_component_name',
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

        if current_user.priority_permission is not None:
            user_permission = current_user.priority_permission
        else:
            user_permission = 999
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
        return [item.to_dict() for item in structure]


class STDComponentName(ParentModels):
    __tablename__ = "STDComponentName"
    id = db.Column(db.Integer, primary_key=True)
    std_component_name = db.Column(db.String(24), index=False, unique=False, nullable=True)

    page_constructions = relationship("PageConstruction", back_populates="type_data_rel")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return "<STDComponentName(std_component_name='%s')>" % self.std_component_name

    def get_display_name(self):
        return self.std_component_name

    @classmethod
    def get_component_name(cls, id_std_type):
        try:
            std_name = db.session.get(cls, int(id_std_type))
            return std_name.std_component_name if std_name else None
        except (ValueError, TypeError):
            return None