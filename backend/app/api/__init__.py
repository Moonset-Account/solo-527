from fastapi import APIRouter

from app.auth.routes import router as auth_router
from app.api.orders import router as orders_router
from app.api.pets import router as pets_router
from app.api.adoptions import router as adoptions_router
from app.api.follow_ups import router as follow_ups_router
from app.api.schedules import router as schedules_router
from app.api.audit_logs import router as audit_logs_router
from app.api.dashboard import router as dashboard_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(orders_router)
api_router.include_router(pets_router)
api_router.include_router(adoptions_router)
api_router.include_router(follow_ups_router)
api_router.include_router(schedules_router)
api_router.include_router(audit_logs_router)
api_router.include_router(dashboard_router)
