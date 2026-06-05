from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.core.security import get_current_user
from app.core.permissions import PermissionRequired
from app.models import (
    User, Vendor, VendorApplication, VendorStatus, ApplicationStatus
)
from app.schemas.vendor import (
    VendorCreate, VendorResponse,
    VendorApplicationCreate, VendorApplicationResponse
)

router = APIRouter(prefix="/vendors", tags=["摊主管理"])


@router.get("/", response_model=List[VendorResponse], dependencies=[Depends(PermissionRequired("manage_vendors"))])
def list_vendors(
    status: VendorStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Vendor)
    if status:
        query = query.filter(Vendor.status == status)
    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=VendorResponse, dependencies=[Depends(PermissionRequired("manage_vendors"))])
def create_vendor(
    vendor_in: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vendor = Vendor(**vendor_in.model_dump())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/{vendor_id}", response_model=VendorResponse, dependencies=[Depends(PermissionRequired("view_vendors"))])
def get_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="摊主不存在")
    return vendor


@router.put("/{vendor_id}/status", response_model=VendorResponse, dependencies=[Depends(PermissionRequired("manage_vendors"))])
def update_vendor_status(
    vendor_id: int,
    status: VendorStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="摊主不存在")
    vendor.status = status
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/applications/", response_model=List[VendorApplicationResponse], dependencies=[Depends(PermissionRequired("review_applications"))])
def list_applications(
    status: ApplicationStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(VendorApplication)
    if status:
        query = query.filter(VendorApplication.status == status)
    return query.order_by(VendorApplication.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/applications/", response_model=VendorApplicationResponse)
def create_application(
    app_in: VendorApplicationCreate,
    db: Session = Depends(get_db)
):
    application = VendorApplication(**app_in.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.put("/applications/{app_id}/review", response_model=VendorApplicationResponse, dependencies=[Depends(PermissionRequired("review_applications"))])
def review_application(
    app_id: int,
    status: ApplicationStatus,
    review_notes: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    application = db.query(VendorApplication).filter(VendorApplication.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="申请不存在")
    application.status = status
    application.review_notes = review_notes
    application.reviewed_by = current_user.id
    application.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(application)
    return application
