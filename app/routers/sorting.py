from typing import Optional, Dict
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.security import get_current_user
from app.services import SortingService, DataScopeService

router = APIRouter()


def _paginate(query, page: int, page_size: int):
    total = query.count()
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    pagination = schemas.Pagination(
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )
    return items, pagination


@router.get("/differences", response_model=schemas.PaginatedResponse[schemas.SortingDiffOut])
def list_differences(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    batch_id: Optional[int] = Query(None),
    harvest_id: Optional[int] = Query(None),
    variety_id: Optional[int] = Query(None),
    result: Optional[str] = Query(None),
    social_impact: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = DataScopeService.filter_real_reports(
        db.query(models.SortingDifference).order_by(models.SortingDifference.id.desc())
    )
    if batch_id is not None:
        query = query.filter(models.SortingDifference.batch_id == batch_id)
    if harvest_id is not None:
        query = query.filter(models.SortingDifference.harvest_id == harvest_id)
    if variety_id is not None:
        query = query.filter(models.SortingDifference.variety_id == variety_id)
    if result is not None:
        query = query.filter(models.SortingDifference.result == result)
    if social_impact is not None:
        query = query.filter(models.SortingDifference.social_impact == social_impact)
    items, pagination = _paginate(query, page, page_size)
    return schemas.PaginatedResponse(data=items, pagination=pagination)


@router.post("/differences", response_model=schemas.SortingDiffOut, status_code=status.HTTP_201_CREATED)
def create_difference(
    payload: schemas.SortingDiffCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not payload.remarks:
        raise HTTPException(status_code=400, detail="remarks 不能为空")
    if not payload.result:
        raise HTTPException(status_code=400, detail="result 不能为空")
    if not payload.social_impact:
        raise HTTPException(status_code=400, detail="social_impact 不能为空")

    if not db.query(models.HarvestBatch).filter(models.HarvestBatch.id == payload.batch_id).first():
        raise HTTPException(status_code=404, detail=f"采收批次 {payload.batch_id} 不存在")
    if not db.query(models.HarvestRecord).filter(models.HarvestRecord.id == payload.harvest_id).first():
        raise HTTPException(status_code=404, detail=f"采收记录 {payload.harvest_id} 不存在")
    if not db.query(models.Variety).filter(models.Variety.id == payload.variety_id).first():
        raise HTTPException(status_code=404, detail=f"品种 {payload.variety_id} 不存在")

    data = payload.model_dump()
    diff = SortingService.create_sorting_diff(db, data, current_user.id)
    db.commit()
    db.refresh(diff)
    return diff


@router.get("/differences/{diff_id}", response_model=schemas.SortingDiffOut)
def get_difference(
    diff_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    diff = db.query(models.SortingDifference).filter(models.SortingDifference.id == diff_id).first()
    if not diff:
        raise HTTPException(status_code=404, detail="分选差异不存在")
    return diff


@router.get("/stats", response_model=Dict)
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = DataScopeService.filter_real_reports(db.query(models.SortingDifference))
    items = query.all()

    social_impact_counter = Counter()
    result_counter = Counter()

    total = len(items)
    accepted = 0
    rejected = 0
    reworked = 0
    discounted = 0
    with_impact = 0

    for item in items:
        impact_val = item.social_impact.value if hasattr(item.social_impact, "value") else str(item.social_impact)
        result_val = item.result.value if hasattr(item.result, "value") else str(item.result)
        social_impact_counter[impact_val] += 1
        result_counter[result_val] += 1

        if result_val == "accepted":
            accepted += 1
        elif result_val == "rejected":
            rejected += 1
        elif result_val == "reworked":
            reworked += 1
        elif result_val == "discounted":
            discounted += 1

        if impact_val != "none":
            with_impact += 1

    return {
        "total": total,
        "accepted": accepted,
        "rejected": rejected,
        "reworked": reworked,
        "discounted": discounted,
        "with_impact": with_impact,
        "social_impact": dict(social_impact_counter),
        "result": dict(result_counter),
    }
