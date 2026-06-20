from app.routers.auth import router as auth_router
from app.routers.members import router as members_router
from app.routers.points import router as points_router
from app.routers.coupons import router as coupons_router
from app.routers.products import router as products_router
from app.routers.campaigns import router as campaigns_router
from app.routers.system import router as system_router

all_routers = [
    auth_router,
    members_router,
    points_router,
    coupons_router,
    products_router,
    campaigns_router,
    system_router,
]

__all__ = ["all_routers"]
