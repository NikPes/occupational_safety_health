from backend.app.extension import db
from sqlalchemy.orm import relationship

from backend.app.base.models.parent_model import ParentModels


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
