from backend.app.extension import jwt, b_crypt, db
from flask import Flask
from flask_cors import CORS
from loguru import logger

from config import basedir, JWTConfig, SQLAlchemyMainConfig
from views.login_views import blu_login
from views.main_menu_views import blu_main_menu
from views.use_token_views import blu_use_token
from views.body_construct_views import blu_body_construct
from views.table_bd_views import blu_table_bd_views
from views.node_builder_views import blu_node_builder




def create_app():
    app = Flask(__name__)

    app.config.from_object(SQLAlchemyMainConfig)
    app.config.from_object(JWTConfig)
    CORS(app)
    logger.add(basedir + '/Logger.log', format='{time} {level} {message}', level='DEBUG', rotation='5 MB')

    jwt.init_app(app)
    b_crypt.init_app(app)
    db.init_app(app)

    app.register_blueprint(blu_login, url_prefix='/')
    app.register_blueprint(blu_main_menu, url_prefix='/main_menu')
    app.register_blueprint(blu_use_token, url_prefix='/use_token')
    app.register_blueprint(blu_body_construct, url_prefix='/body_construct')
    app.register_blueprint(blu_table_bd_views, url_prefix='/table_views')
    app.register_blueprint(blu_node_builder, url_prefix='/node_builder')



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