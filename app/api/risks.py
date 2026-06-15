from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas import ContractRiskResponse, ContractRiskCreate, ContractRiskHandle
from app.services.auth import get_current_user, RoleChecker
from app.services.risk_service import (
    get_risk,
    get_risks,
    count_risks,
    create_risk,
    handle_risk,
    update_risk_status
)
from app.models import User

router = APIRouter(prefix="/risks", tags=["合同风险"])


@router.get("/", response_model=List[ContractRiskResponse])
def list_risks(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    risk_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "customer_service"]))
):
    risks = get_risks(
        db, skip=skip, limit=limit,
        status=status, risk_type=risk_type,
        risk_level=risk_level, keyword=keyword
    )
    return risks


@router.get("/stats")
def risk_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pending_count = count_risks(db, status="pending")
    processing_count = count_risks(db, status="processing")
    resolved_count = count_risks(db, status="resolved")
    high_count = count_risks(db, risk_level="high")
    return {
        "pending": pending_count,
        "processing": processing_count,
        "resolved": resolved_count,
        "high_risk": high_count
    }


@router.get("/{risk_id}", response_model=ContractRiskResponse)
def get_risk_detail(
    risk_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "customer_service"]))
):
    risk = get_risk(db, risk_id)
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    return risk


@router.post("/", response_model=ContractRiskResponse)
def create_new_risk(
    risk: ContractRiskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "customer_service"]))
):
    return create_risk(db, risk, current_user.id)


@router.post("/{risk_id}/handle", response_model=ContractRiskResponse)
def handle_risk_by_id(
    risk_id: int,
    handle_data: ContractRiskHandle,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "customer_service"]))
):
    risk = handle_risk(db, risk_id, handle_data, current_user.id)
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    return risk


@router.patch("/{risk_id}/status")
def change_risk_status(
    risk_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "customer_service"]))
):
    risk = update_risk_status(db, risk_id, status, current_user.id)
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    return {"message": "Risk status updated successfully", "status": status}
