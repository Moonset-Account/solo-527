from __future__ import annotations

from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.audit import AuditLogOut, ApiCallLogOut, AcceptanceReport
from app.services.audit_service import AuditService, DashboardService, AcceptanceService
from app.api.deps import get_audit_service, get_dashboard_service, get_acceptance_service

router = APIRouter(tags=["Audit, Dashboard & Acceptance"])


# ========= Dashboard =========

@router.get("/dashboard/metrics", response_model=dict)
def get_model_dashboard(
    model_version: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=365),
    svc: DashboardService = Depends(get_dashboard_service),
):
    """模型效果看板：问答量、置信度分布、反馈正负比例、低置信度比例、Top错误类别。"""
    return svc.get_dashboard_data(model_version=model_version, days=days)


# ========= Audit Logs =========

@router.get("/audit-logs", response_model=dict)
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    actor: Optional[str] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    svc: AuditService = Depends(get_audit_service),
):
    items, total = svc.list_audit_logs(
        page=page, page_size=page_size,
        actor=actor, action=action, resource_type=resource_type,
        since=since, until=until,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


# ========= API Call Logs =========

@router.get("/api-call-logs", response_model=dict)
def list_api_call_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    user_id: Optional[str] = None,
    endpoint: Optional[str] = None,
    model_version: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    svc: AuditService = Depends(get_audit_service),
):
    items, total = svc.list_api_call_logs(
        page=page, page_size=page_size,
        user_id=user_id, endpoint=endpoint, model_version=model_version,
        since=since, until=until,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


# ========= Acceptance Checks =========

@router.get("/acceptance/check", response_model=AcceptanceReport)
def run_acceptance_checks(
    svc: AcceptanceService = Depends(get_acceptance_service),
):
    """验收检查：围绕数据版本、模型版本、调用日志三大维度。"""
    return svc.run_acceptance_checks()


@router.get("/acceptance/summary", response_model=dict)
def acceptance_summary(
    svc: AcceptanceService = Depends(get_acceptance_service),
):
    """简化的验收摘要。"""
    report = svc.run_acceptance_checks()
    return {
        "generated_at": report.generated_at,
        "total": report.total_checks,
        "passed": report.passed_checks,
        "failed": report.failed_checks,
        "pass_rate": (
            f"{(report.passed_checks / report.total_checks * 100):.1f}%"
            if report.total_checks > 0 else "N/A"
        ),
        "failed_checks": [
            {"name": c.check_name, "message": c.message}
            for c in report.checks if not c.passed
        ],
    }
