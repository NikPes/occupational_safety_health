import backend.app.user.models.access_table_model as access_table_mod

def filling_access_status_table_db():
    if not access_table_mod.STDTypeField.query.first():
        access_table_mod.STDTypeField.add_row(std_type_field='inputField')
        access_table_mod.STDTypeField.add_row(std_type_field='intField')
        access_table_mod.STDTypeField.add_row(std_type_field='floatField')
        access_table_mod.STDTypeField.add_row(std_type_field='checkList')
        access_table_mod.STDTypeField.add_row(std_type_field='dropField')
        access_table_mod.STDTypeField.add_row(std_type_field='dateField')
        access_table_mod.STDTypeField.add_row(std_type_field='booField')
        access_table_mod.STDTypeField.add_row(std_type_field='jsonField')
        access_table_mod.STDTypeField.add_row(std_type_field='datetimeField')
        access_table_mod.STDTypeField.add_row(std_type_field='textField')

    if not access_table_mod.STDLevelAccess.query.first():
        access_table_mod.STDLevelAccess.add_row(std_level_access='No access')
        access_table_mod.STDLevelAccess.add_row(std_level_access='Full access')
        access_table_mod.STDLevelAccess.add_row(std_level_access='Edit access')
        access_table_mod.STDLevelAccess.add_row(std_level_access='Read access')

    if not access_table_mod.AccessToStatus.query.first():
        # type of field: inputField, intField, floatField, checkList, dropField, dateField, booField, jsonField,
        # datetimeField, textField
        # status = user_mod.STDStatusUser.query.filter_by(std_status_user='root').first()
        level_access = access_table_mod.STDLevelAccess.query.filter_by(std_level_access='Full access').first()
        input_field = access_table_mod.STDTypeField.query.filter_by(std_type_field='inputField').first()
        int_field = access_table_mod.STDTypeField.query.filter_by(std_type_field='intField').first()
        float_field = access_table_mod.STDTypeField.query.filter_by(std_type_field='floatField').first()
        check_list_field = access_table_mod.STDTypeField.query.filter_by(std_type_field='checkList').first()
        date_field = access_table_mod.STDTypeField.query.filter_by(std_type_field='dateField').first()
        drop_field = access_table_mod.STDTypeField.query.filter_by(std_type_field='dropField').first()
        boo_field = access_table_mod.STDTypeField.query.filter_by(std_type_field='booField').first()
        json_field = access_table_mod.STDTypeField.query.filter_by(std_type_field='jsonField').first()
        date_time_field = access_table_mod.STDTypeField.query.filter_by(std_type_field='datetimeField').first()
        text_field = access_table_mod.STDTypeField.query.filter_by(std_type_field='textField').first()

        access_table_mod.AccessToStatus.add_row(table_name='AccessToStatus',
                                                column_name='table_name',
                                                column_name_show='Таблица',
                                                id_std_type_field=drop_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)
        access_table_mod.AccessToStatus.add_row(table_name='AccessToStatus',
                                                column_name='column_name',
                                                column_name_show='Поле',
                                                id_std_type_field=drop_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)
        access_table_mod.AccessToStatus.add_row(table_name='AccessToStatus',
                                                column_name='column_name_show',
                                                column_name_show='Имя поля',
                                                id_std_type_field=input_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)
        access_table_mod.AccessToStatus.add_row(table_name='AccessToStatus',
                                                column_name='id_std_type_field',
                                                column_name_show='Тип поля',
                                                id_std_type_field=drop_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)
        access_table_mod.AccessToStatus.add_row(table_name='AccessToStatus',
                                                column_name='id_level_access',
                                                column_name_show='Права на',
                                                id_std_type_field=drop_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)
        access_table_mod.AccessToStatus.add_row(table_name='AccessToStatus',
                                                column_name='required_permission',
                                                column_name_show='Уровень доступа',
                                                id_std_type_field=int_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)

        # generation for PageConstruction access to root
        access_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                                column_name='page_name',
                                                column_name_show='Страница',
                                                id_std_type_field=input_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)
        access_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                                column_name='table_name',
                                                column_name_show='Таблица',
                                                id_std_type_field=input_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)
        access_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                                column_name='dependence',
                                                column_name_show='Зависимость',
                                                id_std_type_field=input_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)
        access_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                                column_name='position_tab',
                                                column_name_show='Позиция',
                                                id_std_type_field=input_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)
        access_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                                column_name='count_sheet',
                                                column_name_show='Вывод по',
                                                id_std_type_field=input_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)
        access_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                                column_name='link_column',
                                                column_name_show='Клик по',
                                                id_std_type_field=input_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)
        access_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                                column_name='id_type_data',
                                                column_name_show='Тип',
                                                id_std_type_field=drop_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)
        access_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                                column_name='required_permission',
                                                column_name_show='Уровень доступа',
                                                id_std_type_field=drop_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)
        access_table_mod.AccessToStatus.add_row(table_name='PageConstruction',
                                                column_name='comment',
                                                column_name_show='Комментарий',
                                                id_std_type_field=input_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)


        access_table_mod.AccessToStatus.add_row(table_name='UserConfig',
                                                column_name='id_user',
                                                column_name_show='Пользователь',
                                                id_std_type_field=drop_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)

        access_table_mod.AccessToStatus.add_row(table_name='UserConfig',
                                                column_name='settings',
                                                column_name_show='Конфиг',
                                                id_std_type_field=input_field.id,
                                                id_level_access=level_access.id,
                                                required_permission=0)