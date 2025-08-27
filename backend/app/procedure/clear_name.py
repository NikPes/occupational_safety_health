def format_display_field_name(name):
    """Централизованное форматирование имен полей"""
    if not name:
        return ''

    # Специальные правила
    replacements = {
        'id': 'ID',
        'url': 'URL',
        'ip': 'IP'
    }

    # Применяем замены перед общим форматированием
    for k, v in replacements.items():
        name = name.replace(f'_{k}_', f'_{v}_').replace(f'{k}_', f'{v}_')

    return (
        name.replace('_', ' ')
        .title()
        .replace(' Id ', ' ID ')
    )
