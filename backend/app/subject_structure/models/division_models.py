from backend.app.extension import db


class Division(db.Model):
    __tablename__ = "Division"
    id = db.Column(db.Integer, primary_key=True)
    division = db.Column(db.String(150), index=False, unique=False, nullable=True)
    warehouse_number = db.Column(db.String(32), unique=False, nullable=True)
    access_status = db.Column(db.String(32), unique=False, nullable=True)

    order = ['id', 'division', 'warehouse_number', 'access_status']

    in_page = 30
    page = 0

    def __init__(self, division=None, warehouse_number=None, access_status=None):
        self.division = division
        self.warehouse_number = warehouse_number
        self.access_status = access_status

    def __repr__(self):
        return "<Division(division='%s', access_status='%s')>" % (self.division,
                                                                  self.access_status)


class AllPosition(db.Model):
    __tablename__ = "AllPosition"
    id = db.Column(db.Integer, primary_key=True)
    position = db.Column(db.String(100), index=False, unique=False, nullable=True)
    id_meaning_pos = db.Column(db.Integer, db.ForeignKey('STDMeaningPos.id', ondelete='CASCADE'))
    id_position_type = db.Column(db.Integer, db.ForeignKey('STDPosType.id', ondelete='CASCADE'))
    id_group_siz = db.Column(db.Integer, db.ForeignKey('GroupSiz.id', ondelete='CASCADE'))
    access_status = db.Column(db.String(32), unique=False, nullable=True)

    order = ['id', 'position', 'id_meaning_pos', 'id_position_type', 'id_group_siz', 'access_status']

    in_page = 10
    page = 0

    def __init__(self, position=None, id_meaning_pos=None, id_position_type=None, id_group_siz=None,
                 access_status=None):
        self.position = position
        self.id_meaning_pos = id_meaning_pos
        self.id_position_type = id_position_type
        self.id_group_siz = id_group_siz
        self.access_status = access_status

    def __repr__(self):
        return "<AllPosition(position='%s', id_meaning_pos='%s', id_position_type='%s')>" % (self.position,
                                                                                             self.id_meaning_pos,
                                                                                             self.id_position_type)


class DivPosition(db.Model):
    __tablename__ = "DivPosition"
    id = db.Column(db.Integer, primary_key=True)
    id_division = db.Column(db.Integer, db.ForeignKey('Division.id', ondelete='CASCADE'))
    id_position = db.Column(db.Integer, db.ForeignKey('AllPosition.id', ondelete='CASCADE'))

    order = ['id', 'id_division', 'id_position']

    in_page = 10
    page = 0

    def __init__(self, id_division, id_position):
        self.id_division = id_division
        self.id_position = id_position

    def __repr__(self):
        return "<DivPosition(id_division='%s', id_position='%s')>" % (self.id_division,
                                                                      self.id_position)


class STDMeaningPos(db.Model):
    __tablename__ = "STDMeaningPos"
    id = db.Column(db.Integer, primary_key=True)
    meaning = db.Column(db.String(48), unique=True, nullable=False)

    def __init__(self, meaning):
        self.meaning = meaning

    def __repr__(self):
        return "<STDMeaningPos(meaning='%s')>" % self.meaning


class STDPosType(db.Model):
    __tablename__ = "STDPosType"
    id = db.Column(db.Integer, primary_key=True)
    pos_type = db.Column(db.String(16), unique=True, nullable=False)

    def __init__(self, pos_type):
        self.pos_type = pos_type

    def __repr__(self):
        return "<STDMeaningPos(pos_type='%s')>" % self.pos_type
