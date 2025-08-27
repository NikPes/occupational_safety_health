import os

import yaml
from sqlalchemy import create_engine

basedir = os.path.abspath(os.path.dirname(__file__))

bad_symbol = ['\\', ':', '*', '?', '"', '<', '>', '|', '+', '%', '!', '@']

cfg = yaml.load(open(basedir + '/config.yml'), Loader=yaml.FullLoader)

configs = {
    'user': cfg['user'],
    'password': cfg['password'],
    'host': cfg['host'],
    'database': cfg['db']
}
engine = create_engine('postgresql://' +
                       configs['user'] + ':' +
                       configs['password'] + '@' +
                       configs['host'] + '/' +
                       configs['database'])

class JWTConfig(object):
    JWT_SECRET_KEY = "please-remember-to-change-me"
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 час в секундах
    JWT_REFRESH_TOKEN_EXPIRES = 3600  # 1 час в секундах

class SQLAlchemyMainConfig(object):
    SECRET_KEY = 'ThisSecretKeyCudaHome'
    SQLALCHEMY_DATABASE_URI = 'postgresql://' + \
                                configs['user'] + ':' + \
                                configs['password'] + '@' + \
                                configs['host'] + '/' + \
                                configs['database']
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_MIGRATE_REPO = os.path.join(basedir, 'db_repository')