import backend.app.user.models.user_model as usr_mod


class ServiceClassModel:
    @staticmethod
    def get_current_user(identity):
        """Получение текущего пользователя по identity"""
        return usr_mod.User.query.filter_by(user_login=identity).first()