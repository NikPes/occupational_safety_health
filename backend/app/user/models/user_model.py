from backend.app.base.models.parent_model import ParentModels
from backend.app.extension import db, b_crypt
from sqlalchemy.orm import relationship
from sqlalchemy import JSON

class STDStatusUser(ParentModels):
    __tablename__ = "STDStatusUser"
    id = db.Column(db.Integer, primary_key=True)
    std_status_user = db.Column(db.String(60), index=False, unique=True, nullable=True)
    description = db.Column(db.String(200))
    priority_permission = db.Column(db.Integer, unique=True)  # 100, 200, 300 для сравнения

    user_records = relationship("User", back_populates="status_user")
    # page_construction_records = relationship("PageConstruction", back_populates="status_user")
    # main_menu_records = relationship("MainMenu", back_populates="status_user")
    # currency_data_records = relationship("CurrencyData", back_populates="status_user")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return f"<STDStatusUser(id={self.id}, std_status_user='{self.std_status_user}')>"

    def get_display_name(self):
        return self.std_status_user


class User(ParentModels):
    __tablename__ = "User"
    id = db.Column(db.Integer, primary_key=True)
    user_login = db.Column(db.String(60), unique=True, nullable=True)
    hash_pass_user = db.Column(db.String(512), index=False, unique=False, nullable=True)
    id_std_status_user = db.Column(db.Integer, db.ForeignKey('STDStatusUser.id', ondelete='CASCADE'))
    access_user = db.Column(db.String(32), unique=False, nullable=True)
    priority_permission = db.Column(db.Integer, unique=True)  # 100, 200, 300 для сравнения

    # Изменяем backref на уникальное имя, например 'user_relations'
    status_user = relationship("STDStatusUser", back_populates="user_records")
    phi_schemas = relationship("PhiSchema", back_populates="created_by_rel")
    created_node = relationship("PhiNode", back_populates="created_by_rel")
    config = relationship("UserConfig", back_populates="user", uselist=False)

    def __repr__(self):
        return f"<User(id={self.id}, user_login='{self.user_login}')>"

    master_order = ['id',
                    'user_login',
                    'hash_pass_user',
                    'status_user',
                    'access_user']

    pass_user = ''
    per_page = 30

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def check_password(self, password):
        return b_crypt.check_password_hash(self.hash_pass_user, password)

    @staticmethod
    def generate_hash_password(password):
        return b_crypt.generate_password_hash(password)

    @classmethod
    def add_row(cls, **kwargs):
        obj = cls(**kwargs)
        db.session.add(obj)
        db.session.commit()

    @classmethod
    def get_status_user(cls, **kwargs):
        user = cls.query.filter_by(**kwargs).first()
        if user is None:
            return None
        return user.status_user.std_status_user if user.status_user else None

class UserConfig(ParentModels):
    __tablename__ = "UserConfig"
    DEFAULT_SETTINGS = {
        "theme": "dark",
        "uiPhiNode": {
            "scale": 1.0,
            "animations": True,
            "gridMode": "lines"
        }
    }

    id = db.Column(db.Integer, primary_key=True)
    id_user = db.Column(db.Integer, db.ForeignKey('User.id', ondelete='CASCADE'))
    settings = db.Column(JSON, nullable=True, default=lambda: UserConfig.DEFAULT_SETTINGS.copy())

    user = relationship("User", back_populates="config")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def __repr__(self):
        return f"<UserConfig(id={self.id}, id_user={self.id_user})>"