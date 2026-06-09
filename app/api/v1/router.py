from fastapi import APIRouter

from app.config import settings
from app.api.v1.endpoints import (
    documents,
    qa,
    search,
    datasets,
    review,
    dashboard,
    mlops,
    alerts,
    tasks,
)

api_v1_router = APIRouter(prefix=settings.API_PREFIX)

api_v1_router.include_router(documents.router)
api_v1_router.include_router(qa.router)
api_v1_router.include_router(search.router)
api_v1_router.include_router(datasets.router)
api_v1_router.include_router(review.router)
api_v1_router.include_router(dashboard.router)
api_v1_router.include_router(mlops.router)
api_v1_router.include_router(alerts.router)
api_v1_router.include_router(tasks.router)

__all__ = ["api_v1_router"]
