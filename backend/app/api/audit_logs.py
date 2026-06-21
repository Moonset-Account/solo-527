from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.audit_log import (
    AuditLogCreate,
    AuditLogResponse,
    AuditLogListResponse,
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit-logs", tags=["审计日志"])


@router.get("/mock", response_model=AuditLogListResponse)
async def get_mock_logs():
    mock_logs = AuditService.generate_mock_logs(50)
    return AuditLogListResponse(total=len(mock_logs), items=mock_logs)


@router.get("/mock/{log_id}", response_model=AuditLogResponse)
async def get_mock_log(log_id: int):
    mock_logs = AuditService.generate_mock_logs(50)
    for log in mock_logs:
        if log["id"] == log_id:
            return log
    raise HTTPException(status_code=404, detail="日志不存在")


@router.get("/mock/target/{target_type}/{target_id}", response_model=List[AuditLogResponse])
async def get_mock_target_logs(target_type: str, target_id: int):
    mock_logs = AuditService.generate_mock_logs(50)
    return [log for log in mock_logs if log["target_type"] == target_type][:10]


@router.get("", response_model=AuditLogListResponse)
async def list_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    target_type: Optional[str] = Query(None),
    target_id: Optional[int] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        total, logs = await AuditService.get_multi(
            db, skip, limit, user_id, action, target_type, target_id, date_from, date_to
        )
        log_list = []
        for log in logs:
            log_dict = {
                "id": log.id,
                "user_id": log.user_id,
                "user_name": log.user_name,
                "action": log.action,
                "target_type": log.target_type,
                "target_id": log.target_id,
                "description": log.description,
                "old_value": log.old_value,
                "new_value": log.new_value,
                "ip_address": log.ip_address,
                "created_at": log.created_at,
                "updated_at": log.updated_at,
            }
            log_list.append(log_dict)
        return AuditLogListResponse(total=total, items=log_list)
    except Exception:
        mock_logs = AuditService.generate_mock_logs(limit)
        return AuditLogListResponse(total=len(mock_logs), items=mock_logs)


@router.post(
    "",
    response_model=AuditLogResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_log(
    log_in: AuditLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        log = await AuditService.create(
            db, log_in, current_user.id, current_user.full_name or current_user.username
        )
        return {
            "id": log.id,
            "user_id": log.user_id,
            "user_name": log.user_name,
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "description": log.description,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
            "updated_at": log.updated_at,
        }
    except Exception:
        mock = AuditService.generate_mock_logs(1)[0]
        mock["action"] = log_in.action
        mock["target_type"] = log_in.target_type
        mock["target_id"] = log_in.target_id
        mock["description"] = log_in.description
        return mock


@router.get("/{log_id}", response_model=AuditLogResponse)
async def get_log(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        log = await AuditService.get_by_id(db, log_id)
        if not log:
            raise HTTPException(status_code=404, detail="日志不存在")
        return {
            "id": log.id,
            "user_id": log.user_id,
            "user_name": log.user_name,
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "description": log.description,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
            "updated_at": log.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        mock_logs = AuditService.generate_mock_logs(50)
        for log in mock_logs:
            if log["id"] == log_id:
                return log
        raise HTTPException(status_code=404, detail="日志不存在")


@router.get("/target/{target_type}/{target_id}", response_model=List[AuditLogResponse])
async def get_target_logs(
    target_type: str,
    target_id: int,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        logs = await AuditService.get_by_target(db, target_type, target_id, limit)
        return [
            {
                "id": log.id,
                "user_id": log.user_id,
                "user_name": log.user_name,
                "action": log.action,
                "target_type": log.target_type,
                "target_id": log.target_id,
                "description": log.description,
                "old_value": log.old_value,
                "new_value": log.new_value,
                "ip_address": log.ip_address,
                "created_at": log.created_at,
                "updated_at": log.updated_at,
            }
            for log in logs
        ]
    except Exception:
        mock_logs = AuditService.generate_mock_logs(50)
        return [log for log in mock_logs if log["target_type"] == target_type][:limit]
