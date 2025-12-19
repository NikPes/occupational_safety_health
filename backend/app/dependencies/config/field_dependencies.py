FIELD_DEPENDENCIES = {
    'Working': {
        'id_all_position': {
            'depends_on': 'id_division',
            'endpoint': '/WorkOST/dependencies/getDivisionPositions',
            'method': 'GET',
            'param_name': 'division_id'
        }
    },
    'AccessToStatus': {
        'column_name': {
            'depends_on': 'table_name',
            'endpoint': '/WorkOST/dependencies/getTableFields',
            'method': 'GET',
            'param_name': 'table_name'
        }
    }
    # Добавляем другие зависимости здесь
}

def get_dependencies_for_table(table_name):
    """Возвращает конфигурацию зависимостей для таблицы"""
    return FIELD_DEPENDENCIES.get(table_name, {})