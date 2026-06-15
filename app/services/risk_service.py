from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import ContractRisk
from app.schemas import ContractRiskCreate, ContractRiskHandle


def get_risk(db: Session, risk_id: int) -> Optional[ContractRisk]:
    return db.query(ContractRisk).filter(ContractRisk.id == risk_id).first()


def get_risks(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    risk_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    keyword: Optional[str] = None,
) -> List[ContractRisk]:
    query = db.query(ContractRisk)

    if status:
        query = query.filter(ContractRisk.status == status)
    if risk_type:
        query = query.filter(ContractRisk.risk_type == risk_type)
    if risk_level:
        query = query.filter(ContractRisk.risk_level == risk_level)
    if keyword:
        query = query.filter(
            (ContractRisk.tenant_name.contains(keyword)) |
            (ContractRisk.description.contains(keyword))
        )

    return query.order_by(ContractRisk.created_at.desc()).offset(skip).limit(limit).all()


def count_risks(
    db: Session,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
) -> int:
    query = db.query(func.count(ContractRisk.id))
    if status:
        query = query.filter(ContractRisk.status == status)
    if risk_level:
        query = query.filter(ContractRisk.risk_level == risk_level)
    return query.scalar()


def create_risk(
    db: Session,
    risk: ContractRiskCreate,
    created_by_id: int = None
) -> ContractRisk:
    risk_no = _generate_risk_no(db)
    db_risk = ContractRisk(
        **risk.model_dump(),
        risk_no=risk_no,
        created_by_id=created_by_id
    )
    db.add(db_risk)
    db.commit()
    db.refresh(db_risk)
    return db_risk


def handle_risk(
    db: Session,
    risk_id: int,
    handle_data: ContractRiskHandle,
    handled_by_id: int
) -> Optional[ContractRisk]:
    db_risk = get_risk(db, risk_id)
    if not db_risk:
        return None

    db_risk.handle_result = handle_data.handle_result
    db_risk.handle_reason = handle_data.handle_reason
    db_risk.status = handle_data.status
    db_risk.handled_by_id = handled_by_id

    if handle_data.status in ["resolved", "closed"]:
        db_risk.closed_at = datetime.utcnow()

    db.commit()
    db.refresh(db_risk)
    return db_risk


def update_risk_status(
    db: Session,
    risk_id: int,
    status: str,
    operator_id: int = None
) -> Optional[ContractRisk]:
    db_risk = get_risk(db, risk_id)
    if not db_risk:
        return None

    db_risk.status = status
    if status in ["resolved", "closed"]:
        db_risk.closed_at = datetime.utcnow()

    db.commit()
    db.refresh(db_risk)
    return db_risk


def _generate_risk_no(db: Session) -> str:
    today = datetime.today()
    date_str = today.strftime("%Y%m%d")
    prefix = f"RISK{date_str}"

    last_risk = (
        db.query(ContractRisk)
        .filter(ContractRisk.risk_no.like(f"{prefix}%"))
        .order_by(ContractRisk.risk_no.desc())
        .first()
    )

    if last_risk and last_risk.risk_no:
        seq = int(last_risk.risk_no[-4:]) + 1
    else:
        seq = 1

    return f"{prefix}{seq:04d}"
