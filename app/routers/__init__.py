from fastapi import APIRouter
from app.routers import auth, purchase, supplier, approval, price, notification, delivery, admin, pages

api_router = APIRouter()

api_router.include_router(auth.router, tags=["认证"])
api_router.include_router(purchase.router, prefix="/purchase", tags=["采购需求"])
api_router.include_router(supplier.router, prefix="/supplier", tags=["供应商管理"])
api_router.include_router(approval.router, prefix="/approval", tags=["审批管理"])
api_router.include_router(price.router, prefix="/prices", tags=["价格管理"])
api_router.include_router(notification.router, prefix="/notification", tags=["通知中心"])
api_router.include_router(delivery.router, prefix="/deliveries", tags=["交付管理"])
api_router.include_router(admin.router, prefix="/admin", tags=["系统管理"])
api_router.include_router(pages.router, tags=["页面"])
