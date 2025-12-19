from backend.app.extension import db

import backend.app.phi_node.models.phi_node_model as phi_mod
import backend.app.user.models.access_table_model as base_table_mod

def filling_phi_node_db():
    # Заполняем стандартные категории нодов
    if not phi_mod.STDNodeCategory.query.first():
        phi_mod.STDNodeCategory.add_row(name='Мои ноды',
                                        icon='📁',
                                        description='Пока не отнесенные к категории ноды',
                                        order=1,
                                        color='#6B7280')
        phi_mod.STDNodeCategory.add_row(name='Логические',
                                        icon='🧠',
                                        description='Логические операции, условия, ветвления',
                                        order=2,
                                        color='#3B82F6')
        phi_mod.STDNodeCategory.add_row(name='Математические',
                                        icon='🧮',
                                        description='Математические операции, вычисления, формулы',
                                        order=3,
                                        color='#EF4444')
        phi_mod.STDNodeCategory.add_row(name='Данные и таблицы',
                                        icon='📊',
                                        description='Работа с данными, фильтрация, сортировка, пагинация',
                                        order=4,
                                        color='#10B981')
        phi_mod.STDNodeCategory.add_row(name='Текстовые',
                                        icon='📝',
                                        description='Обработка текста, форматирование, конкатенация',
                                        order=5,
                                        color='#F59E0B')
        phi_mod.STDNodeCategory.add_row(name='Дата и время',
                                        icon='⏰',
                                        description='Операции с датами, временем, таймстампами',
                                        order=6,
                                        color='#8B5CF6')
        phi_mod.STDNodeCategory.add_row(name='Меню и навигация',
                                        icon='🧭',
                                        description='Создание меню, навигация, роутинг',
                                        order=7,
                                        color='#EC4899')
        phi_mod.STDNodeCategory.add_row(name='Отчеты и экспорт',
                                        icon='📄',
                                        description='Генерация отчетов, экспорт в Excel, Word, PDF',
                                        order=8,
                                        color='#06B6D4')
        phi_mod.STDNodeCategory.add_row(name='Права доступа',
                                        icon='🔐',
                                        description='Управление доступом, роли, разрешения',
                                        order=9,
                                        color='#84CC16')
        phi_mod.STDNodeCategory.add_row(name='Системные',
                                        icon='⚙️',
                                        description='Системные ноды, утилиты, служебные функции',
                                        order=10,
                                        color='#64748B')
        phi_mod.STDNodeCategory.add_row(name='Пользовательский интерфейс',
                                        icon='🎨',
                                        description='UI компоненты, формы, элементы управления',
                                        order=11,
                                        color='#F97316')
        phi_mod.STDNodeCategory.add_row(name='API и интеграции',
                                        icon='🔌',
                                        description='Внешние API, интеграции, веб-сервисы',
                                        order=12,
                                        color='#A855F7')


        int_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='intField').first()
        level_access = base_table_mod.STDLevelAccess.query.filter_by(std_level_access='Full access').first()
        input_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='inputField').first()
        text_field = base_table_mod.STDTypeField.query.filter_by(std_type_field='textField').first()

        # STDNodeCategory - все поля для root (required_permission=0)
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

    if not phi_mod.STDTypeConnectionPhi.query.first():
        phi_mod.STDTypeConnectionPhi.add_row(type_key='number',
                                             show_name='Число',
                                             color='#3B82F6',  # Синий
                                             icon='🔢',
                                             description='Числовые значения: целые, дробные, проценты',
                                             order=1,
                                             is_builtin=True)
        phi_mod.STDTypeConnectionPhi.add_row(type_key='string',
                                             show_name='Строка',
                                             color='#10B981',  # Зеленый
                                             icon='📝',
                                             description='Текстовые данные: строки, символы, текст',
                                             order=2,
                                             is_builtin=True)
        phi_mod.STDTypeConnectionPhi.add_row(type_key='boolean',
                                             show_name='Логический',
                                             color='#8B5CF6',  # Фиолетовый
                                             icon='✅',
                                             description='Логические значения: true/false, да/нет',
                                             order=3,
                                             is_builtin=True)
        phi_mod.STDTypeConnectionPhi.add_row(type_key='array',
                                             show_name='Массив',
                                             color='#F59E0B',  # Оранжевый
                                             icon='📊',
                                             description='Коллекции данных: массивы, списки, наборы',
                                             order=4,
                                             is_builtin=True)
        phi_mod.STDTypeConnectionPhi.add_row(type_key='object',
                                             show_name='Объект',
                                             color='#EC4899',  # Розовый
                                             icon='📦',
                                             description='Сложные структуры: объекты, словари, записи',
                                             order=5,
                                             is_builtin=True)
        phi_mod.STDTypeConnectionPhi.add_row(type_key='date',
                                             show_name='Дата',
                                             color='#06B6D4',  # Бирюзовый
                                             icon='📅',
                                             description='Даты и временные метки',
                                             order=6,
                                             is_builtin=True)
        phi_mod.STDTypeConnectionPhi.add_row(type_key='any',
                                             show_name='Любой тип',
                                             color='#6B7280',  # Серый
                                             icon='🔀',
                                             description='Универсальный тип для любых данных',
                                             order=7,
                                             is_builtin=True)
        phi_mod.STDTypeConnectionPhi.add_row(type_key='table_data',
                                             show_name='Данные таблицы',
                                             color='#6366F1',  # Индиго
                                             icon='📋',
                                             description='Табличные данные с колонками и строками',
                                             order=8,
                                             is_builtin=False)
        phi_mod.STDTypeConnectionPhi.add_row(type_key='user_data',
                                             show_name='Данные пользователя',
                                             color='#84CC16',  # Лаймовый
                                             icon='👤',
                                             description='Информация о пользователях и профили',
                                             order=9,
                                             is_builtin=False)
        phi_mod.STDTypeConnectionPhi.add_row(type_key='file',
                                             show_name='Файл',
                                             color='#F97316',  # Оранжевый
                                             icon='📁',
                                             description='Файлы и бинарные данные',
                                             order=10,
                                             is_builtin=False)
        phi_mod.STDTypeConnectionPhi.add_row(type_key='api_response',
                                             show_name='Ответ API',
                                             color='#A855F7',  # Пурпурный
                                             icon='🌐',
                                             description='Ответы от внешних API и сервисов',
                                             order=11,
                                             is_builtin=False)
        phi_mod.STDTypeConnectionPhi.add_row(type_key='menu_item',
                                             show_name='Элемент меню',
                                             color='#64748B',  # Сланцевый
                                             icon='🍔',
                                             description='Пункты меню и навигационные элементы',
                                             order=12,
                                             is_builtin=False)

        default_types = phi_mod.STDTypeConnectionPhi.query.all()
        any_type = phi_mod.STDTypeConnectionPhi.query.filter_by(type_key="any").first()

        # Каждый тип совместим с собой и с "any"
        for type_obj in default_types:
            # Совместимость с самим собой
            if not phi_mod.CompatibleType.query.filter_by(
                    std_type_id_one=type_obj.id,
                    std_type_id_two=type_obj.id
            ).first():
                db.session.add(phi_mod.CompatibleType(
                    std_type_id_one=type_obj.id,
                    std_type_id_two=type_obj.id
                ))

            # Совместимость с "any" (если не сам "any")
            if any_type and type_obj.id != any_type.id:
                if not phi_mod.CompatibleType.query.filter_by(
                        std_type_id_one=type_obj.id,
                        std_type_id_two=any_type.id
                ).first():
                    db.session.add(phi_mod.CompatibleType(
                        std_type_id_one=type_obj.id,
                        std_type_id_two=any_type.id
                    ))

        db.session.commit()

    if not phi_mod.STDNodeType.query.first():
        phi_mod.STDNodeType.add_row(std_node_type='startNode',
                                    show_name_node_type='Старт')
        phi_mod.STDNodeType.add_row(std_node_type='endNode',
                                    show_name_node_type='Финиш')
        phi_mod.STDNodeType.add_row(std_node_type='textNode',
                                    show_name_node_type='Текст')
        phi_mod.STDNodeType.add_row(std_node_type='numberNode',
                                    show_name_node_type='Число')
        phi_mod.STDNodeType.add_row(std_node_type='logicNode',
                                    show_name_node_type='Логика')
        phi_mod.STDNodeType.add_row(std_node_type='calculatorNode',
                                    show_name_node_type='Калькулятор')
        phi_mod.STDNodeType.add_row(std_node_type='dataTableNode',
                                    show_name_node_type='Таблица')
        phi_mod.STDNodeType.add_row(std_node_type='dateTimeNode',
                                    show_name_node_type='Дата/Время')
        phi_mod.STDNodeType.add_row(std_node_type='menuNode',
                                    show_name_node_type='Меню')
        phi_mod.STDNodeType.add_row(std_node_type='reportNode',
                                    show_name_node_type='Отчет')
        phi_mod.STDNodeType.add_row(std_node_type='accessNode',
                                    show_name_node_type='Доступ')
        phi_mod.STDNodeType.add_row(std_node_type='systemNode',
                                    show_name_node_type='Система')
        phi_mod.STDNodeType.add_row(std_node_type='UINode',
                                    show_name_node_type='Интерфейс')
        phi_mod.STDNodeType.add_row(std_node_type='APINode',
                                    show_name_node_type='API')
        phi_mod.STDNodeType.add_row(std_node_type='customNode',
                                    show_name_node_type='Кастомный')
        phi_mod.STDNodeType.add_row(std_node_type='dataFilterNode',
                                    show_name_node_type='Фильтр')
        phi_mod.STDNodeType.add_row(std_node_type='conditionalBranchNode',
                                    show_name_node_type='Условие')

    if not phi_mod.STDSchemasCategory.query.first():
        phi_mod.STDSchemasCategory.add_row(std_schemas_category='my_schemas',
                                           show_name='Мои схемы',
                                           description='Личные схемы пользователя',
                                           order=1,
                                           icon='📁')
        phi_mod.STDSchemasCategory.add_row(std_schemas_category='data_processing',
                                           show_name='Обработка данных',
                                           description='Схемы для обработки и трансформации данных',
                                           order=2,
                                           icon='🔄')
        phi_mod.STDSchemasCategory.add_row(std_schemas_category='reports',
                                           show_name='Отчеты и аналитика',
                                           description='Схемы для генерации отчетов и аналитики',
                                           order=3,
                                           icon='📊')
        phi_mod.STDSchemasCategory.add_row(std_schemas_category='integrations',
                                           show_name='Интеграции и API',
                                           description='Схемы для работы с внешними API и интеграциями',
                                           order=4,
                                           icon='🔌')
        phi_mod.STDSchemasCategory.add_row(std_schemas_category='ui_forms',
                                           show_name='Формы и интерфейсы',
                                           description='Схемы для создания UI форм и интерфейсов',
                                           order=5,
                                           icon='🎨')
        phi_mod.STDSchemasCategory.add_row(std_schemas_category='system',
                                           show_name='Системные схемы',
                                           description='Системные и служебные схемы',
                                           order=6,
                                           icon='⚙️')
        phi_mod.STDSchemasCategory.add_row(std_schemas_category='templates',
                                           show_name='Шаблоны',
                                           description='Готовые шаблоны схем для быстрого старта',
                                           order=7,
                                           icon='📋')
        phi_mod.STDSchemasCategory.add_row(std_schemas_category='shared',
                                           show_name='Общие схемы',
                                           description='Схемы, доступные для всех пользователей',
                                           order=8,
                                           icon='👥')
