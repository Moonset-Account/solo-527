from app.routers.auth import router as auth_router
from app.routers.contracts import router as contracts_router
from app.routers.plans import router as plans_router
from app.routers.inspections import router as inspections_router
from app.routers.satisfaction import router as satisfaction_router
from app.routers.config import router as config_router
from app.routers.reports import router as reports_router
from app.routers.notifications import router as notifications_router
from app.routers.demo import router as demo_router

all_routers = [
    auth_router,
    contracts_router,
    plans_router,
    inspections_router,
    satisfaction_router,
    config_router,
    reports_router,
    notifications_router,
    demo_router,
]
