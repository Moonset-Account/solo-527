from flask import Blueprint

api_bp = Blueprint('api', __name__)

from app.api.auth import *
from app.api.users import *
from app.api.mentors import *
from app.api.students import *
from app.api.appointments import *
from app.api.feedback import *
from app.api.industries import *
from app.api.notifications import *
from app.api.dashboard import *
from app.api.uploads import *
from app.api.audit import *
