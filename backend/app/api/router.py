from fastapi import APIRouter
from app.api import auth, data_routes, model_routes, business_routes

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(data_routes.router)
api_router.include_router(model_routes.router)
api_router.include_router(business_routes.router)
