from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Dict, List, Any
from datetime import datetime, date
from app.database import get_db
from app.core.security import get_current_user
from app.core.permissions import PermissionRequired
from app.models import (
    User, VendorApplication, ApplicationStatus,
    BoothAssignment, AssignmentStatus,
    Deposit, DepositStatus,
    CheckinRecord, CheckinStatus,
    ViolationNote, ViolationStatus,
    Vendor
)

router = APIRouter(prefix="/dashboard", tags=["看板"])


@router.get("/today", dependencies=[Depends(PermissionRequired("view_dashboard"))])
async def get_today_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.combine(date.today(), datetime.min.time())

    new_items = []
    pending_confirm_items = []
    in_progress_items = []
    exception_items = []
    archived_items = []

    new_applications = db.query(VendorApplication).filter(
        VendorApplication.status == ApplicationStatus.NEW
    ).all()
    for app in new_applications:
        vendor = db.query(Vendor).filter(Vendor.id == app.vendor_id).first()
        new_items.append({
            "type": "application",
            "id": app.id,
            "title": f"报名申请 - " + (vendor.name if vendor else "未知摊主"),
            "created_at": app.created_at,
            "status": app.status.value
        })

    pending_applications = db.query(VendorApplication).filter(
        VendorApplication.status == ApplicationStatus.APPROVED
    ).all()
    for app in pending_applications:
        vendor = db.query(Vendor).filter(Vendor.id == app.vendor_id).first()
        pending_confirm_items.append({
            "type": "application_confirm",
            "id": app.id,
            "title": f"待确认 - " + (vendor.name if vendor else "未知摊主"),
            "created_at": app.updated_at,
            "status": app.status.value
        })

    pending_assignments = db.query(BoothAssignment).filter(
        BoothAssignment.status == AssignmentStatus.DRAWN
    ).all()
    for assignment in pending_assignments:
        vendor = db.query(Vendor).filter(Vendor.id == assignment.vendor_id).first()
        pending_confirm_items.append({
            "type": "booth_confirm",
            "id": assignment.id,
            "title": f"摊位确认 - " + (vendor.name if vendor else "未知摊主"),
            "created_at": assignment.assigned_at,
            "status": assignment.status.value
        })

    today_checkins = db.query(CheckinRecord).filter(
        CheckinRecord.event_date >= today,
        CheckinRecord.status == CheckinStatus.PENDING
    ).all()
    for checkin in today_checkins:
        vendor = db.query(Vendor).filter(Vendor.id == checkin.vendor_id).first()
        in_progress_items.append({
            "type": "checkin",
            "id": checkin.id,
            "title": f"待签到 - " + (vendor.name if vendor else "未知摊主"),
            "created_at": checkin.created_at,
            "status": checkin.status.value
        })

    deposits_pending = db.query(Deposit).filter(
        Deposit.status == DepositStatus.PENDING
    ).all()
    for deposit in deposits_pending:
        vendor = db.query(Vendor).filter(Vendor.id == deposit.vendor_id).first()
        in_progress_items.append({
            "type": "deposit_pending",
            "id": deposit.id,
            "title": f"待缴保证金 - " + (vendor.name if vendor else "未知摊主"),
            "created_at": deposit.created_at,
            "status": deposit.status.value
        })

    deposits_under_review = db.query(Deposit).filter(
        Deposit.status == DepositStatus.UNDER_REVIEW
    ).all()
    for deposit in deposits_under_review:
        vendor = db.query(Vendor).filter(Vendor.id == deposit.vendor_id).first()
        exception_items.append({
            "type": "deposit_review",
            "id": deposit.id,
            "title": f"保证金复核 - " + (vendor.name if vendor else "未知摊主"),
            "created_at": deposit.updated_at,
            "status": deposit.status.value
        })

    no_shows = db.query(CheckinRecord).filter(
        CheckinRecord.status == CheckinStatus.NO_SHOW
    ).all()
    for checkin in no_shows:
        vendor = db.query(Vendor).filter(Vendor.id == checkin.vendor_id).first()
        exception_items.append({
            "type": "no_show",
            "id": checkin.id,
            "title": f"未签到 - " + (vendor.name if vendor else "未知摊主"),
            "created_at": checkin.updated_at,
            "status": checkin.status.value
        })

    violations = db.query(ViolationNote).filter(
        ViolationNote.status.in_([ViolationStatus.REPORTED, ViolationStatus.REVIEWING])
    ).all()
    for v in violations:
        vendor = db.query(Vendor).filter(Vendor.id == v.vendor_id).first()
        exception_items.append({
            "type": "violation",
            "id": v.id,
            "title": f"违规处理 - " + (vendor.name if vendor else "未知摊主"),
            "created_at": v.created_at,
            "status": v.status.value
        })

    archived_apps = db.query(VendorApplication).filter(
        VendorApplication.status.in_([ApplicationStatus.REJECTED, ApplicationStatus.CONFIRMED])
    ).limit(20).all()
    for app in archived_apps:
        vendor = db.query(Vendor).filter(Vendor.id == app.vendor_id).first()
        archived_items.append({
            "type": "application",
            "id": app.id,
            "title": f"已处理 - " + (vendor.name if vendor else "未知摊主"),
            "created_at": app.updated_at,
            "status": app.status.value
        })

    return {
        "columns": [
            {
                "key": "new",
                "title": "新建",
                "count": len(new_items),
                "items": new_items
            },
            {
                "key": "pending_confirm",
                "title": "待确认",
                "count": len(pending_confirm_items),
                "items": pending_confirm_items
            },
            {
                "key": "in_progress",
                "title": "执行中",
                "count": len(in_progress_items),
                "items": in_progress_items
            },
            {
                "key": "exception_review",
                "title": "异常复核",
                "count": len(exception_items),
                "items": exception_items
            },
            {
                "key": "archived",
                "title": "已归档",
                "count": len(archived_items),
                "items": archived_items
            }
        ]
    }
