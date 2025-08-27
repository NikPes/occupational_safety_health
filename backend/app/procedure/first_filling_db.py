import backend.app.models.base_table_model as base_table_mod
import backend.app.models.main_menu_model as menu_mod
import backend.app.models.react_flow_model as react_flow_mod
import backend.app.models.user_model as user_mod
from backend.app.extension import b_crypt
from backend.app.extension import db


from sqlalchemy import and_

import backend.app.models.user_model as user_mod
import backend.app.models.main_menu_model as menu_mod
import backend.app.models.base_table_model as base_table_mod

from backend.app.extension import b_crypt
from backend.app.extension import db


def main_starting_first():
    db.create_all()
    if not user_mod.STDStatusUser.query.first():
        user_mod.STDStatusUser.add_row(std_status_user='root',
                                       priority=0,
                                       description='Полный доступ ко всему')
        user_mod.STDStatusUser.add_row(std_status_user='admin',
                                       priority=100,
                                       description='Администратор подразделения')
        user_mod.STDStatusUser.add_row(std_status_user='user',
                                       priority=200,
                                       description='Зарегистрированный пользователь подразделения')

    if not user_mod.User.query.filter_by(user_login='root').first():
        status_user = user_mod.STDStatusUser.query.filter_by(std_status_user='root').first()
        hash_pass_user = b_crypt.generate_password_hash('root').decode('utf-8')

        user_mod.User.add_row(user_login='root',
                              hash_pass_user=hash_pass_user,
                              id_std_status_user=status_user.id,
                              access_user='all')

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

    if not base_table_mod.STDTypeField.query.first():
        base_table_mod.STDTypeField.add_row(std_type_field='inputField')
        base_table_mod.STDTypeField.add_row(std_type_field='intField')
        base_table_mod.STDTypeField.add_row(std_type_field='floatField')
        base_table_mod.STDTypeField.add_row(std_type_field='checkList')
        base_table_mod.STDTypeField.add_row(std_type_field='dropField')
        base_table_mod.STDTypeField.add_row(std_type_field='dateField')
        base_table_mod.STDTypeField.add_row(std_type_field='booField')
        base_table_mod.STDTypeField.add_row(std_type_field='jsonField')
        base_table_mod.STDTypeField.add_row(std_type_field='datetimeField')
        base_table_mod.STDTypeField.add_row(std_type_field='textField')

    if not base_table_mod.STDLevelAccess.query.first():
        base_table_mod.STDLevelAccess.add_row(std_level_access='No access')
        base_table_mod.STDLevelAccess.add_row(std_level_access='Full access')
        base_table_mod.STDLevelAccess.add_row(std_level_access='Edit access')
        base_table_mod.STDLevelAccess.add_row(std_level_access='Read access')

    if not base_table_mod.AccessToStatus.query.first():
        # type of field: inputField, intField, floatField, checkList, dropField, dateField, booField, jsonField,
        # datetimeField, textField
        # status = user_mod.STDStatusUser.query.filter_by(std_status_user='root').first()
        level_access = base_table_mod.STDLevelAccess.query.filter_by(std_level_access='Full access').first()
        input_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='inputField').first()
        int_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='intField').first()
        float_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='floatField').first()
        check_list_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='checkList').first()
        date_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='dateField').first()
        drop_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='dropField').first()
        boo_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='booField').first()
        json_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='jsonField').first()
        date_time_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='datetimeField').first()
        text_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='textField').first()
        base_table_mod.AccessToStatus.add_row(table_name='AccessToStatus',
                                              column_name='table_name',
                                              column_name_show='Таблица',
                                              id_std_type_field=drop_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='AccessToStatus',
                                              column_name='column_name',
                                              column_name_show='Поле',
                                              id_std_type_field=drop_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='AccessToStatus',
                                              column_name='column_name_show',
                                              column_name_show='Имя поля',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='AccessToStatus',
                                              column_name='id_std_type_field',
                                              column_name_show='Тип поля',
                                              id_std_type_field=drop_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='AccessToStatus',
                                              column_name='id_level_access',
                                              column_name_show='Уровень доступа',
                                              id_std_type_field=drop_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='AccessToStatus',
                                              column_name='required_permission',
                                              column_name_show='Уровень доступа',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

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

        # generation for PageConstruction access to root
        base_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                              column_name='page_name',
                                              column_name_show='Страница',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                              column_name='table_name',
                                              column_name_show='Таблица',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                              column_name='dependence',
                                              column_name_show='Зависимость',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                              column_name='position_tab',
                                              column_name_show='Позиция',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                              column_name='count_sheet',
                                              column_name_show='Вывод по',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                              column_name='link_column',
                                              column_name_show='Клик по',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                              column_name='id_type_data',
                                              column_name_show='Тип',
                                              id_std_type_field=drop_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                              column_name='required_permission',
                                              column_name_show='Уровень доступа',
                                              id_std_type_field=drop_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                              column_name='comment',
                                              column_name_show='Комментарий',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        # ReactFlowNode - поля для админов (required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='id',
                                              column_name_show='ID',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='node_id',
                                              column_name_show='ID нода',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='name',
                                              column_name_show='Название',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='type',
                                              column_name_show='Тип нода',
                                              id_std_type_field=drop_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='description',
                                              column_name_show='Описание',
                                              id_std_type_field=text_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='category_id',
                                              column_name_show='Категория',
                                              id_std_type_field=drop_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='data',
                                              column_name_show='Данные нода',
                                              id_std_type_field=json_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='inputs_schema',
                                              column_name_show='Схема входов',
                                              id_std_type_field=json_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='outputs_schema',
                                              column_name_show='Схема выходов',
                                              id_std_type_field=json_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='execution_logic',
                                              column_name_show='Логика выполнения',
                                              id_std_type_field=text_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='width',
                                              column_name_show='Ширина',
                                              id_std_type_field=float_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='height',
                                              column_name_show='Высота',
                                              id_std_type_field=float_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='version',
                                              column_name_show='Версия',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='changelog',
                                              column_name_show='История изменений',
                                              id_std_type_field=text_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='previous_versions',
                                              column_name_show='Предыдущие версии',
                                              id_std_type_field=json_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='is_deprecated',
                                              column_name_show='Устаревший',
                                              id_std_type_field=boo_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='is_template',
                                              column_name_show='Шаблон',
                                              id_std_type_field=boo_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='tags',
                                              column_name_show='Теги',
                                              id_std_type_field=json_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='required_permission',
                                              column_name_show='Уровень доступа',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='usage_count',
                                              column_name_show='Счетчик использования',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='last_used',
                                              column_name_show='Последнее использование',
                                              id_std_type_field=date_time_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowNode',
                                              column_name='created_by',
                                              column_name_show='Создатель',
                                              id_std_type_field=drop_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        # ReactFlowEdge - все поля для админов (required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowEdge',
                                              column_name='id',
                                              column_name_show='ID',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowEdge',
                                              column_name='edge_id',
                                              column_name_show='ID связи',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowEdge',
                                              column_name='source_node_type',
                                              column_name_show='Тип исходного нода',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowEdge',
                                              column_name='target_node_type',
                                              column_name_show='Тип целевого нода',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowEdge',
                                              column_name='connection_count',
                                              column_name_show='Количество подключений',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowEdge',
                                              column_name='edge_type',
                                              column_name_show='Тип связи',
                                              id_std_type_field=drop_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowEdge',
                                              column_name='data',
                                              column_name_show='Данные связи',
                                              id_std_type_field=json_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        # ReactFlowSchema - все поля для админов (required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowSchema',
                                              column_name='id',
                                              column_name_show='ID',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowSchema',
                                              column_name='name',
                                              column_name_show='Название схемы',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowSchema',
                                              column_name='description',
                                              column_name_show='Описание схемы',
                                              id_std_type_field=text_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowSchema',
                                              column_name='flow_data',
                                              column_name_show='Данные схемы',
                                              id_std_type_field=json_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowSchema',
                                              column_name='is_template',
                                              column_name_show='Шаблон',
                                              id_std_type_field=boo_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowSchema',
                                              column_name='is_public',
                                              column_name_show='Публичная',
                                              id_std_type_field=boo_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowSchema',
                                              column_name='required_permission',
                                              column_name_show='Уровень доступа',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowSchema',
                                              column_name='version',
                                              column_name_show='Версия',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowSchema',
                                              column_name='based_on_template',
                                              column_name_show='Основан на шаблоне',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowSchema',
                                              column_name='nodes_count',
                                              column_name_show='Количество нодов',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowSchema',
                                              column_name='edges_count',
                                              column_name_show='Количество связей',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowSchema',
                                              column_name='last_executed',
                                              column_name_show='Последний запуск',
                                              id_std_type_field=date_time_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='ReactFlowSchema',
                                              column_name='created_by',
                                              column_name_show='Создатель',
                                              id_std_type_field=drop_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        # STDNodeCategory - все поля для админов (required_permission=0)
        base_table_mod.AccessToStatus.add_row(table_name='STDNodeCategory',
                                              column_name='id',
                                              column_name_show='ID',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='STDNodeCategory',
                                              column_name='name',
                                              column_name_show='Название категории',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='STDNodeCategory',
                                              column_name='icon',
                                              column_name_show='Иконка',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='STDNodeCategory',
                                              column_name='description',
                                              column_name_show='Описание',
                                              id_std_type_field=text_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='STDNodeCategory',
                                              column_name='order',
                                              column_name_show='Порядок',
                                              id_std_type_field=int_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

        base_table_mod.AccessToStatus.add_row(table_name='STDNodeCategory',
                                              column_name='color',
                                              column_name_show='Цвет',
                                              id_std_type_field=input_field.id,
                                              id_level_access=level_access.id,
                                              required_permission=0)

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

    if not base_table_mod.STDTypeData.query.first():
        base_table_mod.STDTypeData.add_row(std_type_data='ComReactFlow')
        base_table_mod.STDTypeData.add_row(std_type_data='ComTable')
        base_table_mod.STDTypeData.add_row(std_type_data='ComGraphics')
        base_table_mod.STDTypeData.add_row(std_type_data='ComConsole')

    if not base_table_mod.PageConstruction.query.first():
        # status_user = user_mod.STDStatusUser.query.filter_by(std_status_user='root').first()
        type_data = base_table_mod.STDTypeData.query.filter_by(std_type_data='ComTable').first()
        base_table_mod.PageConstruction.add_row(page_name='config_menu',
                                                table_name='User',
                                                dependence='master',
                                                position_tab='tab_1',
                                                count_sheet='30',
                                                link_column=None,
                                                id_type_data=type_data.id,
                                                required_permission=0,
                                                comment='editDel')
        base_table_mod.PageConstruction.add_row(page_name='root',
                                                table_name='AccessToStatus',
                                                dependence='master',
                                                position_tab='tab_2',
                                                count_sheet='30',
                                                link_column=None,
                                                id_type_data=type_data.id,
                                                required_permission=0,
                                                comment='editDel')
        base_table_mod.PageConstruction.add_row(page_name='tools',
                                                table_name='MainMenu',
                                                dependence='master',
                                                position_tab='tab_1',
                                                count_sheet='30',
                                                link_column=None,
                                                id_type_data=type_data.id,
                                                required_permission=0,
                                                comment='editDel')
        base_table_mod.PageConstruction.add_row(page_name='tools',
                                                table_name='PageConstruction',
                                                dependence='master',
                                                position_tab='tab_2',
                                                count_sheet='30',
                                                link_column=None,
                                                id_type_data=type_data.id,
                                                required_permission=0,
                                                comment='editDel')

        """Заполняем стандартные категории нодов"""
    if not react_flow_mod.STDNodeCategory.query.first():
        react_flow_mod.STDNodeCategory.add_row(name='Мои ноды',
                                               icon='📁',
                                               description='Пока не отнесенные к категории ноды',
                                               order=1,
                                               color='#6B7280')
        react_flow_mod.STDNodeCategory.add_row(name='Логические',
                                               icon='🧠',
                                               description='Логические операции, условия, ветвления',
                                               order=2,
                                               color='#3B82F6')
        react_flow_mod.STDNodeCategory.add_row(name='Математические',
                                               icon='🧮',
                                               description='Математические операции, вычисления, формулы',
                                               order=3,
                                               color='#EF4444')
        react_flow_mod.STDNodeCategory.add_row(name='Данные и таблицы',
                                               icon='📊',
                                               description='Работа с данными, фильтрация, сортировка, пагинация',
                                               order=4,
                                               color='#10B981')
        react_flow_mod.STDNodeCategory.add_row(name='Текстовые',
                                               icon='📝',
                                               description='Обработка текста, форматирование, конкатенация',
                                               order=5,
                                               color='#F59E0B')
        react_flow_mod.STDNodeCategory.add_row(name='Дата и время',
                                               icon='⏰',
                                               description='Операции с датами, временем, таймстампами',
                                               order=6,
                                               color='#8B5CF6')
        react_flow_mod.STDNodeCategory.add_row(name='Меню и навигация',
                                               icon='🧭',
                                               description='Создание меню, навигация, роутинг',
                                               order=7,
                                               color='#EC4899')
        react_flow_mod.STDNodeCategory.add_row(name='Отчеты и экспорт',
                                               icon='📄',
                                               description='Генерация отчетов, экспорт в Excel, Word, PDF',
                                               order=8,
                                               color='#06B6D4')
        react_flow_mod.STDNodeCategory.add_row(name='Права доступа',
                                               icon='🔐',
                                               description='Управление доступом, роли, разрешения',
                                               order=9,
                                               color='#84CC16')
        react_flow_mod.STDNodeCategory.add_row(name='Системные',
                                               icon='⚙️',
                                               description='Системные ноды, утилиты, служебные функции',
                                               order=10,
                                               color='#64748B')
        react_flow_mod.STDNodeCategory.add_row(name='Пользовательский интерфейс',
                                               icon='🎨',
                                               description='UI компоненты, формы, элементы управления',
                                               order=11,
                                               color='#F97316')
        react_flow_mod.STDNodeCategory.add_row(name='API и интеграции',
                                               icon='🔌',
                                               description='Внешние API, интеграции, веб-сервисы',
                                               order=12,
                                               color='#A855F7')
