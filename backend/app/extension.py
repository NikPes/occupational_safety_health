from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy

b_crypt = Bcrypt()
db = SQLAlchemy()
jwt = JWTManager()