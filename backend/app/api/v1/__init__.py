from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.base_data import router as base_data_router
from app.api.v1.leases import router as leases_router
from app.api.v1.bills import router as bills_router
from app.api.v1.exception_orders import router as exception_router
from app.api.v1.system import router as system_router
from app.api.v1.operation_logs import router as logs_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(base_data_router)
api_router.include_router(leases_router)
api_router.include_router(bills_router)
api_router.include_router(exception_router)
api_router.include_router(system_router)
api_router.include_router(logs_router)
