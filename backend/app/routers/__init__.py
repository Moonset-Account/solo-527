from fastapi import APIRouter
from app.routers.auth import router as auth_router
from app.routers.suppliers import router as suppliers_router
from app.routers.medicines import router as medicines_router
from app.routers.locations import router as locations_router
from app.routers.batches import router as batches_router
from app.routers.stocks import router as stocks_router
from app.routers.reminders import router as reminders_router
from app.routers.risks import router as risks_router
from app.routers.replenish import router as replenish_router
from app.routers.abnormal import router as abnormal_router
from app.routers.dictionaries import router as dictionaries_router
from app.routers.strategies import router as strategies_router
from app.routers.reports import router as reports_router
from app.routers.sign_differences import router as sign_diff_router
from app.routers.users import router as users_router
from app.routers.dashboard import router as dashboard_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(suppliers_router)
api_router.include_router(medicines_router)
api_router.include_router(locations_router)
api_router.include_router(batches_router)
api_router.include_router(stocks_router)
api_router.include_router(reminders_router)
api_router.include_router(risks_router)
api_router.include_router(replenish_router)
api_router.include_router(abnormal_router)
api_router.include_router(dictionaries_router)
api_router.include_router(strategies_router)
api_router.include_router(reports_router)
api_router.include_router(sign_diff_router)
api_router.include_router(users_router)
api_router.include_router(dashboard_router)
