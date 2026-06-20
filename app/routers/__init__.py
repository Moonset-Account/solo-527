from app.routers.dashboard import router as dashboard_router
from app.routers.tenant import router as tenant_router
from app.routers.plan import router as plan_router
from app.routers.usage import router as usage_router
from app.routers.anomaly import router as anomaly_router
from app.routers.billing import router as billing_router
from app.routers.arrears import router as arrears_router
from app.routers.dictionary import router as dictionary_router
from app.routers.reminder import router as reminder_router

__all__ = [
    "dashboard_router",
    "tenant_router",
    "plan_router",
    "usage_router",
    "anomaly_router",
    "billing_router",
    "arrears_router",
    "dictionary_router",
    "reminder_router",
]
