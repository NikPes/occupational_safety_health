from flask import current_app
from sqlalchemy.exc import SQLAlchemyError

from backend.app.extension import db


class ParentModels(db.Model):
    __abstract__ = True

    # def __init__(self, **kwargs):
    #     # Автоматически устанавливаем все переданные атрибуты
    #     for key, value in kwargs.items():
    #         setattr(self, key, value)

    @classmethod
    def add_row(cls, **kwargs):
        obj = cls(**kwargs)
        db.session.add(obj)
        db.session.commit()

    def to_dict(self, relations=False):
        """Универсальная сериализация с поддержкой связей"""
        result = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        if relations and hasattr(self, '__mapper__'):
            for rel in self.__mapper__.relationships:
                try:
                    related = getattr(self, rel.key)
                    if related is not None:
                        if isinstance(related, list):
                            result[rel.key] = [r.to_dict(relations=False) for r in related]
                        else:
                            result[rel.key] = related.to_dict(relations=False)
                except Exception as e:
                    current_app.logger.error(f"Relation error {rel.key}: {str(e)}")
        return result

    def to_relation_dict(self):
        """Сериализация для связанных объектов"""
        return {
            c.name: getattr(self, c.name)
            for c in self.__table__.columns
            if not c.name.startswith('_')  # Исключаем служебные поля
        }
