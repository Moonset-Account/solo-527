from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin, require_security_officer, create_audit_log
from app.models import User, Vulnerability, VulnerabilityStatus, VulnerabilitySeverity, LogAction, UserRole
from app.schemas.request import (
    VulnerabilityCreate, VulnerabilityUpdate, VulnerabilityResponse,
    VulnerabilityFix
)

router = APIRouter(prefix="/vulnerabilities", tags=["漏洞管理"])


@router.get("", response_model=List[VulnerabilityResponse])
def list_vulnerabilities(
    skip: int = 0,
    limit: int = 100,
    status: Optional[VulnerabilityStatus] = None,
    severity: Optional[VulnerabilitySeverity] = None,
    keyword: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Vulnerability)
    if status:
        query = query.filter(Vulnerability.status == status)
    if severity:
        query = query.filter(Vulnerability.severity == severity)
    if keyword:
        query = query.filter(
            (Vulnerability.title.ilike(f"%{keyword}%")) |
            (Vulnerability.cve_id.ilike(f"%{keyword}%"))
        )
    vulns = query.order_by(Vulnerability.created_at.desc()).offset(skip).limit(limit).all()
    return vulns


@router.post("", response_model=VulnerabilityResponse)
def create_vulnerability(
    request: Request,
    vuln_data: VulnerabilityCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    new_vuln = Vulnerability(
        **vuln_data.model_dump(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    db.add(new_vuln)
    db.commit()
    db.refresh(new_vuln)

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.UPDATE_CONFIG,
        resource_type="vulnerability",
        resource_id=new_vuln.id,
        description=f"创建漏洞记录: {vuln_data.title}",
        ip_address=client_ip
    )

    return new_vuln


@router.get("/{vuln_id}", response_model=VulnerabilityResponse)
def get_vulnerability(
    vuln_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vuln = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="漏洞不存在"
        )
    return vuln


@router.put("/{vuln_id}", response_model=VulnerabilityResponse)
def update_vulnerability(
    request: Request,
    vuln_id: int,
    vuln_data: VulnerabilityUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    vuln = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="漏洞不存在"
        )

    update_data = vuln_data.model_dump(exclude_unset=True)
    update_data["updated_by"] = current_user.id
    for key, value in update_data.items():
        setattr(vuln, key, value)

    db.commit()
    db.refresh(vuln)

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.UPDATE_CONFIG,
        resource_type="vulnerability",
        resource_id=vuln_id,
        description=f"更新漏洞记录: {vuln.title}",
        details=update_data,
        ip_address=client_ip
    )

    return vuln


@router.post("/{vuln_id}/fix", response_model=VulnerabilityResponse)
def fix_vulnerability(
    request: Request,
    vuln_id: int,
    data: VulnerabilityFix,
    current_user: User = Depends(require_security_officer),
    db: Session = Depends(get_db)
):
    vuln = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="漏洞不存在"
        )

    if vuln.status == VulnerabilityStatus.FIXED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="漏洞已修复"
        )

    vuln.status = VulnerabilityStatus.FIXED
    vuln.fix_result = data.fix_result
    vuln.fixed_by = current_user.id
    vuln.fixed_at = datetime.utcnow()
    vuln.updated_by = current_user.id

    db.commit()
    db.refresh(vuln)

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.UPDATE_CONFIG,
        resource_type="vulnerability",
        resource_id=vuln_id,
        description=f"修复漏洞: {vuln.title}",
        ip_address=client_ip
    )

    return vuln


@router.delete("/{vuln_id}")
def delete_vulnerability(
    request: Request,
    vuln_id: int,
    current_user: User = Depends(require_security_officer),
    db: Session = Depends(get_db)
):
    vuln = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="漏洞不存在"
        )

    vuln_title = vuln.title
    db.delete(vuln)
    db.commit()

    client_ip = request.client.host if request.client else None
    create_audit_log(
        db=db,
        user=current_user,
        action=LogAction.DELETE_CONFIG,
        resource_type="vulnerability",
        resource_id=vuln_id,
        description=f"删除漏洞记录: {vuln_title}",
        ip_address=client_ip
    )

    return {"message": "删除成功"}
