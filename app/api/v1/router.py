from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import data, indexing, qa, feedback, audit

api_router = APIRouter()

api_router.include_router(data.router)
api_router.include_router(indexing.router)
api_router.include_router(qa.router)
api_router.include_router(feedback.router)
api_router.include_router(audit.router)
