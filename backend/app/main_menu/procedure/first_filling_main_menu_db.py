import backend.app.base.main_menu.models.main_menu_model as menu_mod
import backend.app.user.models.access_table_model as base_table_mod

def first_filling_main_menu_db():
    if not menu_mod.STDTargetType.query.first():
        menu_mod.STDTargetType.add_row(target_type='PAGE')
        menu_mod.STDTargetType.add_row(target_type='URL')
        menu_mod.STDTargetType.add_row(target_type='ACTION')
        menu_mod.STDTargetType.add_row(target_type='None')

    if not menu_mod.MainMenu.query.first():
        type_action = menu_mod.STDTargetType.query.filter_by(target_type='None').first()
        menu_mod.MainMenu.add_row(page_system_name='root',
                                  parent_id=None,
                                  text_show='Меню',
                                  id_target_type=type_action.id,
                                  target_value=None,
                                  display_order=1,
                                  icon=None,
                                  required_permission=0)

        menu_root_page = menu_mod.MainMenu.query.filter_by(page_system_name='root').first()
        type_action = menu_mod.STDTargetType.query.filter_by(target_type='PAGE').first()
        menu_mod.MainMenu.add_row(page_system_name='root',
                                  parent_id=menu_root_page.id,
                                  text_show='Редактор меню',
                                  id_target_type=type_action.id,
                                  target_value=None,
                                  display_order=1,
                                  icon=None,
                                  required_permission=0)
        menu_mod.MainMenu.add_row(page_system_name='root',
                                  parent_id=menu_root_page.id,
                                  text_show='Редактор страниц',
                                  id_target_type=type_action.id,
                                  target_value=None,
                                  display_order=2,
                                  icon=None,
                                  required_permission=0)


        drop_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='dropField').first()
        level_access = base_table_mod.STDLevelAccess.query.filter_by(std_level_access='Full access').first()
        input_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='inputField').first()
        int_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='intField').first()

        # generation for MainMenu access to root
        base_table_mod.AccessToStatus.add_row(table_name='MainMenu',
                                              column_name='page_system_name',
                                              column_name_show='Страница',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='MainMenu',
                                              column_name='parent_id',
                                              column_name_show='Мастер меню',
                                              id_std_type_field=drop_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='MainMenu',
                                              column_name='text_show',
                                              column_name_show='Отображаем',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='MainMenu',
                                              column_name='id_target_type',
                                              column_name_show='Тип действия',
                                              id_std_type_field=drop_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='MainMenu',
                                              column_name='target_value',
                                              column_name_show='Цель действия',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='MainMenu',
                                              column_name='display_order',
                                              column_name_show='Порядок',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='MainMenu',
                                              column_name='icon',
                                              column_name_show='Иконка',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='MainMenu',
                                              column_name='required_permission',
                                              column_name_show='Уровень доступа',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)