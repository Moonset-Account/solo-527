from fastapi import APIRouter

from app.api.tickets import (
    router as categories_router,
    tickets_router,
    annotations_router,
    error_router,
)
from app.api.ml import (
    router as training_router,
    versions_router,
    rollback_router,
    stats_router,
)
from app.api.inference import router as inference_router

api_router = APIRouter()

api_router.include_router(categories_router)
api_router.include_router(tickets_router)
api_router.include_router(annotations_router)
api_router.include_router(error_router)
api_router.include_router(training_router)
api_router.include_router(versions_router)
api_router.include_router(rollback_router)
api_router.include_router(stats_router)
api_router.include_router(inference_router)
