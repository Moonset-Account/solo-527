from fastapi import APIRouter

from app.api import auth
from app.api import apartments
from app.api import appointments
from app.api import deposits
from app.api import risks
from app.api import config
from app.api import dashboard

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(apartments.router)
api_router.include_router(appointments.router)
api_router.include_router(deposits.router)
api_router.include_router(risks.router)
api_router.include_router(config.router)
api_router.include_router(dashboard.router)
