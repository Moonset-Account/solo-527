from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.requests import router as requests_router
from app.api.devices import router as devices_router
from app.api.alerts import router as alerts_router
from app.api.vulnerabilities import router as vulnerabilities_router
from app.api.logs import router as logs_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(requests_router)
api_router.include_router(devices_router)
api_router.include_router(alerts_router)
api_router.include_router(vulnerabilities_router)
api_router.include_router(logs_router)
