from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .reagents import router as reagents_router
from .storage import router as storage_router
from .requisitions import router as requisitions_router
from .inventory import router as inventory_router
from .notifications import router as notifications_router
from .attachments import router as attachments_router
from .audit import router as audit_router
from .offline import router as offline_router
from .reports import router as reports_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(users_router, prefix="/users", tags=["用户管理"])
api_router.include_router(reagents_router, prefix="/reagents", tags=["试剂管理"])
api_router.include_router(storage_router, prefix="/storage", tags=["柜位管理"])
api_router.include_router(requisitions_router, prefix="/requisitions", tags=["领用管理"])
api_router.include_router(inventory_router, prefix="/inventory", tags=["盘点管理"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["通知"])
api_router.include_router(attachments_router, prefix="/attachments", tags=["附件"])
api_router.include_router(audit_router, prefix="/audit", tags=["审计日志"])
api_router.include_router(offline_router, prefix="/offline", tags=["离线同步"])
api_router.include_router(reports_router, prefix="/reports", tags=["报表"])
