import backend.app.user.models.user_model as user_mod
import backend.app.user.models.access_table_model as base_table_mod

from backend.app.extension import b_crypt

def filling_user_db():
    if not user_mod.STDStatusUser.query.first():
        user_mod.STDStatusUser.add_row(std_status_user='root',
                                       priority_permission=0,
                                       description='Полный доступ ко всему')
        user_mod.STDStatusUser.add_row(std_status_user='admin',
                                       priority_permission=100,
                                       description='Администратор подразделения')
        user_mod.STDStatusUser.add_row(std_status_user='user',
                                       priority_permission=200,
                                       description='Зарегистрированный пользователь подразделения')

    if not user_mod.User.query.filter_by(user_login='root').first():
        status_user = user_mod.STDStatusUser.query.filter_by(std_status_user='root').first()
        hash_pass_user = b_crypt.generate_password_hash('root').decode('utf-8')

        user_mod.User.add_row(user_login='root',
                              hash_pass_user=hash_pass_user,
                              id_std_status_user=status_user.id,
                              priority_permission=0,
                              access_user='all')

        level_access = base_table_mod.STDLevelAccess.query.filter_by(std_level_access='Full access').first()
        input_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='inputField').first()

        # User - все поля для админов (required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='User',
                                              column_name='user_login',
                                              column_name_show='Логин',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='User',
                                              column_name='user_login',
                                              column_name_show='Логин',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='User',
                                              column_name='hash_pass_user',
                                              column_name_show='Пароль',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='User',
                                              column_name='id_std_status_user',
                                              column_name_show='Статус',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='User',
                                              column_name='access_user',
                                              column_name_show='Метка',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

    root_settings = {
        "theme": "dark",
        "uiPhiNode": {
            "scale": 1.0,
            "animations": True,
            "gridMode": "lines"
        }
    }
    print('tut')
    select_root = user_mod.User.query.filter_by(user_login='root').first()
    if not user_mod.UserConfig.query.filter_by(id_user=select_root.id).first():
        user_mod.UserConfig.add_row(id_user=select_root.id,
                                    settings=root_settings)