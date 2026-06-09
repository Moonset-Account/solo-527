from __future__ import annotations

from typing import Generator, Optional

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.data.database import get_db
from app.services.data_service import DataManagementService
from app.services.indexing_service import IndexingService
from app.services.qa_service import QAService
from app.services.feedback_service import FeedbackService
from app.services.audit_service import AuditService, DashboardService, AcceptanceService


def get_current_user_id(request: Request) -> Optional[str]:
    return request.headers.get("X-User-ID") or request.headers.get("X-Actor")


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "")


def get_data_service(db: Session = Depends(get_db)) -> DataManagementService:
    return DataManagementService(db)


def get_indexing_service(db: Session = Depends(get_db)) -> IndexingService:
    return IndexingService(db)


def get_qa_service(db: Session = Depends(get_db)) -> QAService:
    return QAService(db)


def get_feedback_service(db: Session = Depends(get_db)) -> FeedbackService:
    return FeedbackService(db)


def get_audit_service(db: Session = Depends(get_db)) -> AuditService:
    return AuditService(db)


def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(db)


def get_acceptance_service(db: Session = Depends(get_db)) -> AcceptanceService:
    return AcceptanceService(db)
