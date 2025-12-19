from backend.app.extension import db

import backend.app.base.models.page_construction as page_construct_mod

from backend.app.phi_node.procedure.first_filling_phi_node_db import filling_phi_node_db
from backend.app.user.procedure.first_filling_user_db import filling_user_db
from backend.app.main_menu.procedure.first_filling_main_menu_db import first_filling_main_menu_db
from backend.app.user.procedure.first_filling_access_table_db import filling_access_status_table_db

def main_starting_first():
    db.create_all()
    filling_user_db()
    first_filling_main_menu_db()
    filling_access_status_table_db()

    if not page_construct_mod.STDComponentName.query.first():
        page_construct_mod.STDComponentName.add_row(std_component_name='ComPhiStructure')
        page_construct_mod.STDComponentName.add_row(std_component_name='ComTable')
        page_construct_mod.STDComponentName.add_row(std_component_name='ComGraphics')
        page_construct_mod.STDComponentName.add_row(std_component_name='ComConsole')


    if not page_construct_mod.PageConstruction.query.first():
        type_data = page_construct_mod.STDComponentName.query.filter_by(std_component_name='ComTable').first()
        page_construct_mod.PageConstruction.add_row(page_name='config_menu',
                                                    table_name='User',
                                                    dependence='master',
                                                    position_tab='tab_1',
                                                    count_sheet='30',
                                                    link_column=None,
                                                    id_type_data=type_data.id,
                                                    required_permission=0,
                                                    comment='editDel')
        page_construct_mod.PageConstruction.add_row(page_name='root',
                                                    table_name='AccessToStatus',
                                                    dependence='master',
                                                    position_tab='tab_2',
                                                    count_sheet='30',
                                                    link_column=None,
                                                    id_type_data=type_data.id,
                                                    required_permission=0,
                                                    comment='editDel')
        page_construct_mod.PageConstruction.add_row(page_name='tools',
                                                    table_name='MainMenu',
                                                    dependence='master',
                                                    position_tab='tab_1',
                                                    count_sheet='30',
                                                    link_column=None,
                                                    id_type_data=type_data.id,
                                                    required_permission=0,
                                                    comment='editDel')
        page_construct_mod.PageConstruction.add_row(page_name='tools',
                                                    table_name='PageConstruction',
                                                    dependence='master',
                                                    position_tab='tab_2',
                                                    count_sheet='30',
                                                    link_column=None,
                                                    id_type_data=type_data.id,
                                                    required_permission=0,
                                                    comment='editDel')

    filling_phi_node_db()
