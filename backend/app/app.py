from backend.app.extension import jwt, b_crypt, db
from flask import Flask
from flask_cors import CORS
from loguru import logger

from config import basedir, JWTConfig, SQLAlchemyMainConfig
from backend.app.user.views.login_views import blu_login
from backend.app.user.views.user_db_views import blu_user_bd_views
from backend.app.main_menu.views.main_menu_views import blu_main_menu
from backend.app.base.views.use_token_views import blu_use_token
from backend.app.base.views.body_construct_views import blu_body_construct
from backend.app.table.views.table_bd_views import blu_table_bd_views
from backend.app.table.views.table_bd_edit_views import blu_table_bd_edit
from backend.app.table.views.table_bd_add_row_views import blu_table_bd_add_row
from backend.app.dependencies.views.specific_api_views import blu_dependencies
from backend.app.phi_node.views.phi_socket_views import blu_phi_socket
from backend.app.phi_node.views.phi_node_views import blu_phi_node


def create_app():
    app = Flask(__name__)

    app.config.from_object(SQLAlchemyMainConfig)
    app.config.from_object(JWTConfig)
    CORS(app)
    logger.add(basedir + '/Logger.log', format='{time} {level} {message}', level='DEBUG', rotation='5 MB')

    jwt.init_app(app)
    b_crypt.init_app(app)
    db.init_app(app)

    app.register_blueprint(blu_login, url_prefix='/WorkOST')
    app.register_blueprint(blu_user_bd_views, url_prefix='/WorkOST/user_bd_views')
    app.register_blueprint(blu_main_menu, url_prefix='/WorkOST/main_menu')
    app.register_blueprint(blu_use_token, url_prefix='/WorkOST/use_token')
    app.register_blueprint(blu_body_construct, url_prefix='/WorkOST/body_construct')
    app.register_blueprint(blu_table_bd_views, url_prefix='/WorkOST/table_bd_views')
    app.register_blueprint(blu_table_bd_edit, url_prefix='/WorkOST/table_bd_edit')
    app.register_blueprint(blu_table_bd_add_row, url_prefix='/WorkOST/table_bd_add_row')
    app.register_blueprint(blu_dependencies, url_prefix='/WorkOST/dependencies')
    app.register_blueprint(blu_phi_socket, url_prefix='/WorkOST/phi_socket')
    app.register_blueprint(blu_phi_node, url_prefix='/WorkOST/phi_node')

    return app

# Самая простая команда для автоматического обновления данных каждые N секунд:
# watch -n 1 nvidia-smi  информация по загрузке видеокарты
# выход через ctrl + C
# pip freeze > requirements.txt
#
# Установка всех пакетов по списку производится при выполнении
# pip install -r requirements.txt
#
# применить изменения в базе данных:
# flask db upgrade
#
# откат:
# flask db downgrade
#
# indicator-cpufreq
# pip install --upgrade setuptools
# pip install --upgrade pip
# cudahome - user
# cudaworking -password
# distinct()
# deactivate
#
# активация venv
# source .venv/bin/activate