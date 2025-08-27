from backend.app.extension import db
from sqlalchemy import and_
from sqlalchemy.orm import relationship
from backend.app.models.parent_model import ParentModels
from backend.app.models.user_model import STDStatusUser


class MainMenu(ParentModels):
    __tablename__ = "MainMenu"

    id = db.Column(db.Integer, primary_key=True)
    page_system_name = db.Column(db.String(50), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('MainMenu.id', ondelete='CASCADE'))
    text_show = db.Column(db.String(100), nullable=False)
    id_target_type = db.Column(db.Integer, db.ForeignKey('STDTargetType.id', ondelete='CASCADE'))
    target_value = db.Column(db.String(200))
    display_order = db.Column(db.Integer, default=0)
    icon = db.Column(db.String(50))
    required_permission = db.Column(db.Integer, default=0)

    children = relationship("MainMenu",
                            backref=db.backref('parent', remote_side=[id]),
                            order_by="MainMenu.display_order",
                            lazy='dynamic')

    target_type_rel = relationship("STDTargetType", back_populates="menu_items")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    @classmethod
    def get_current_page_menu(cls, page_system_name, current_user):
        """Получение меню для конкретной страницы с проверкой прав"""
        from sqlalchemy.orm import joinedload

        item_status_user = STDStatusUser.query.get(current_user.id_std_status_user)
        user_priority = item_status_user.priority if item_status_user else 999

        # Загружаем корневые элементы с target_type_rel
        menu_root_items = cls.query.filter(
            and_(
                cls.page_system_name == page_system_name,
                cls.parent_id == None,
                cls.required_permission >= user_priority
            )
        ).options(
            joinedload(cls.target_type_rel)  # Загружаем связанный target_type
        ).order_by(cls.display_order).all()

        # Рекурсивно строим дерево
        def build_tree(item):
            # Для dynamic relationship используем отдельный запрос
            children = cls.query.filter(
                and_(
                    cls.parent_id == item.id,
                    cls.required_permission >= user_priority
                )
            ).options(
                joinedload(cls.target_type_rel)  # Загружаем target_type для детей
            ).order_by(cls.display_order).all()

            children_with_permissions = []
            for child in children:
                children_with_permissions.append(build_tree(child))

            item_dict = item.to_dict()
            item_dict['children'] = children_with_permissions
            # Добавляем target_type вручную если to_dict его не включает
            if hasattr(item, 'target_type_rel') and item.target_type_rel:
                item_dict['target_type'] = item.target_type_rel.target_type
            return item_dict

        print(page_system_name, 'Menu', [build_tree(item) for item in menu_root_items])
        return [build_tree(item) for item in menu_root_items]


class STDTargetType(ParentModels):
    __tablename__ = "STDTargetType"

    id = db.Column(db.Integer, primary_key=True)
    target_type = db.Column(db.String(20), nullable=False)

    menu_items = relationship("MainMenu", back_populates="target_type_rel")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
