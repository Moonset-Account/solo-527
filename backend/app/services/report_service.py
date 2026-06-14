from typing import Optional
from datetime import date
from calendar import monthrange

from sqlalchemy import select, func, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import InspectionTask, InspectionRecord, Contract
from app.services.base import model_to_dict


async def get_quality_report(
    db: AsyncSession,
    year: Optional[int] = None,
    month: Optional[int] = None,
    contract_id: Optional[int] = None,
) -> dict:
    query = select(InspectionRecord).join(InspectionTask)
    conditions = []

    if year and month:
        start_date = date(year, month, 1)
        end_date = date(year, month, monthrange(year, month)[1])
        conditions.append(InspectionRecord.created_at >= start_date)
        conditions.append(InspectionRecord.created_at <= end_date)
    elif year:
        conditions.append(extract("year", InspectionRecord.created_at) == year)

    if contract_id:
        conditions.append(InspectionTask.contract_id == contract_id)

    if conditions:
        query = query.where(and_(*conditions))

    result = await db.execute(query)
    records = result.scalars().all()

    if not records:
        return {
            "avg_score": 0,
            "issue_count": 0,
            "delay_count": 0,
            "details": [],
            "pass_count": 0,
            "fail_count": 0,
            "conditional_pass_count": 0,
        }

    total_records = len(records)
    scores = [r.quality_score for r in records if r.quality_score is not None]
    avg_score = sum(scores) / len(scores) if scores else 0

    pass_count = sum(1 for r in records if r.conclusion == "pass")
    fail_count = sum(1 for r in records if r.conclusion == "fail")
    conditional_pass_count = sum(1 for r in records if r.conclusion == "conditional_pass")

    delay_query = select(InspectionTask).where(InspectionTask.is_delayed == True)
    if contract_id:
        delay_query = delay_query.where(InspectionTask.contract_id == contract_id)
    delay_result = await db.execute(delay_query)
    delay_count = len(delay_result.scalars().all())

    details = []
    for r in records:
        task_result = await db.execute(select(InspectionTask).where(InspectionTask.id == r.task_id))
        task = task_result.scalar_one_or_none()
        contract_result = await db.execute(select(Contract).where(Contract.id == task.contract_id)) if task else None
        contract = contract_result.scalar_one_or_none() if contract_result else None
        details.append({
            "id": r.id,
            "task_id": r.task_id,
            "node_name": task.node_name if task else "",
            "contract_name": contract.name if contract else "",
            "quality_score": r.quality_score,
            "conclusion": r.conclusion,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return {
        "avg_score": round(avg_score, 2),
        "issue_count": fail_count + conditional_pass_count,
        "delay_count": delay_count,
        "details": details,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "conditional_pass_count": conditional_pass_count,
    }


async def get_delay_report(
    db: AsyncSession,
    year: Optional[int] = None,
    month: Optional[int] = None,
    contract_id: Optional[int] = None,
) -> dict:
    query = select(InspectionTask).where(InspectionTask.is_delayed == True)
    conditions = []

    if year and month:
        start_date = date(year, month, 1)
        end_date = date(year, month, monthrange(year, month)[1])
        conditions.append(InspectionTask.deadline >= start_date)
        conditions.append(InspectionTask.deadline <= end_date)
    elif year:
        conditions.append(extract("year", InspectionTask.deadline) == year)

    if contract_id:
        conditions.append(InspectionTask.contract_id == contract_id)

    if conditions:
        query = query.where(and_(*conditions))

    result = await db.execute(query)
    delayed_tasks = result.scalars().all()

    total_query = select(func.count()).select_from(InspectionTask)
    if contract_id:
        total_query = total_query.where(InspectionTask.contract_id == contract_id)
    total_result = await db.execute(total_query)
    total_tasks = total_result.scalar() or 0

    delayed_count = len(delayed_tasks)

    by_reason = {}
    items = []
    for task in delayed_tasks:
        contract_result = await db.execute(select(Contract).where(Contract.id == task.contract_id))
        contract = contract_result.scalar_one_or_none()
        reason = "未标注原因"
        by_reason[reason] = by_reason.get(reason, 0) + 1
        items.append({
            "id": task.id,
            "node_name": task.node_name,
            "contract_name": contract.name if contract else "",
            "deadline": task.deadline.isoformat() if task.deadline else None,
            "status": task.status,
            "inspector_id": task.inspector_id,
        })

    return {
        "total": delayed_count,
        "by_reason": by_reason,
        "items": items,
        "total_tasks": total_tasks,
    }
