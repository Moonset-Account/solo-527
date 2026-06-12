from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.security import get_current_user
from app.services import HarvestChainService, DataScopeService

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


@router.get("/plots", response_model=schemas.PaginatedResponse[schemas.PlotOut])
def list_plots(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = DataScopeService.filter_real_reports(
        db.query(models.Plot).order_by(models.Plot.id.desc())
    )
    items, pagination = _paginate(query, page, page_size)
    return schemas.PaginatedResponse(data=items, pagination=pagination)


@router.post("/plots", response_model=schemas.PlotOut, status_code=status.HTTP_201_CREATED)
def create_plot(
    payload: schemas.PlotCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if db.query(models.Plot).filter(models.Plot.code == payload.code).first():
        raise HTTPException(status_code=400, detail=f"地块编码 {payload.code} 已存在")
    plot = models.Plot(
        **payload.model_dump(),
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(plot)
    db.commit()
    db.refresh(plot)
    return plot


@router.get("/plots/{plot_id}", response_model=schemas.PlotOut)
def get_plot(
    plot_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    plot = db.query(models.Plot).filter(models.Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="地块不存在")
    return plot


@router.get("/varieties", response_model=schemas.PaginatedResponse[schemas.VarietyOut])
def list_varieties(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    plot_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = DataScopeService.filter_real_reports(
        db.query(models.Variety).order_by(models.Variety.id.desc())
    )
    if plot_id is not None:
        query = query.filter(models.Variety.plot_id == plot_id)
    items, pagination = _paginate(query, page, page_size)
    return schemas.PaginatedResponse(data=items, pagination=pagination)


@router.post("/varieties", response_model=schemas.VarietyOut, status_code=status.HTTP_201_CREATED)
def create_variety(
    payload: schemas.VarietyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if db.query(models.Variety).filter(models.Variety.code == payload.code).first():
        raise HTTPException(status_code=400, detail=f"品种编码 {payload.code} 已存在")
    if not db.query(models.Plot).filter(models.Plot.id == payload.plot_id).first():
        raise HTTPException(status_code=404, detail=f"地块 {payload.plot_id} 不存在")

    data = payload.model_dump()
    plant_date_str = data.pop("plant_date", None)
    plant_date = None
    if plant_date_str:
        try:
            plant_date = datetime.strptime(plant_date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="plant_date 格式应为 YYYY-MM-DD")

    variety = models.Variety(
        **data,
        plant_date=plant_date,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(variety)
    db.commit()
    db.refresh(variety)
    return variety


@router.get("/varieties/{variety_id}", response_model=schemas.VarietyOut)
def get_variety(
    variety_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    variety = db.query(models.Variety).filter(models.Variety.id == variety_id).first()
    if not variety:
        raise HTTPException(status_code=404, detail="品种不存在")
    return variety


@router.get("/harvests", response_model=schemas.PaginatedResponse[schemas.HarvestRecordOut])
def list_harvests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    plot_id: Optional[int] = Query(None),
    variety_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = DataScopeService.filter_real_reports(
        db.query(models.HarvestRecord).order_by(models.HarvestRecord.id.desc())
    )
    if plot_id is not None:
        query = query.filter(models.HarvestRecord.plot_id == plot_id)
    if variety_id is not None:
        query = query.filter(models.HarvestRecord.variety_id == variety_id)
    if status_filter is not None:
        query = query.filter(models.HarvestRecord.status == status_filter)
    items, pagination = _paginate(query, page, page_size)
    return schemas.PaginatedResponse(data=items, pagination=pagination)


@router.post("/harvests", response_model=schemas.HarvestRecordOut, status_code=status.HTTP_201_CREATED)
def create_harvest(
    payload: schemas.HarvestRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if db.query(models.HarvestRecord).filter(models.HarvestRecord.code == payload.code).first():
        raise HTTPException(status_code=400, detail=f"采收记录编码 {payload.code} 已存在")
    if not db.query(models.Plot).filter(models.Plot.id == payload.plot_id).first():
        raise HTTPException(status_code=404, detail=f"地块 {payload.plot_id} 不存在")
    if not db.query(models.Variety).filter(models.Variety.id == payload.variety_id).first():
        raise HTTPException(status_code=404, detail=f"品种 {payload.variety_id} 不存在")

    data = payload.model_dump()
    harvest = HarvestChainService.create_harvest(db, data, current_user.id)
    db.commit()
    db.refresh(harvest)
    return harvest


@router.get("/harvests/{harvest_id}", response_model=schemas.HarvestRecordOut)
def get_harvest(
    harvest_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    harvest = db.query(models.HarvestRecord).filter(models.HarvestRecord.id == harvest_id).first()
    if not harvest:
        raise HTTPException(status_code=404, detail="采收记录不存在")
    return harvest


@router.patch("/harvests/{harvest_id}/status", response_model=schemas.HarvestRecordOut)
def update_harvest_status(
    harvest_id: int,
    payload: schemas.HarvestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    harvest = db.query(models.HarvestRecord).filter(models.HarvestRecord.id == harvest_id).first()
    if not harvest:
        raise HTTPException(status_code=404, detail="采收记录不存在")
    try:
        harvest_status = models.HarvestStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"无效的采收状态: {payload.status}")
    harvest.status = harvest_status
    harvest.updated_by = current_user.id
    db.commit()
    db.refresh(harvest)
    return harvest


@router.get("/batches", response_model=schemas.PaginatedResponse[schemas.HarvestBatchOut])
def list_batches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    harvest_id: Optional[int] = Query(None),
    variety_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = DataScopeService.filter_real_reports(
        db.query(models.HarvestBatch).order_by(models.HarvestBatch.id.desc())
    )
    if harvest_id is not None:
        query = query.filter(models.HarvestBatch.harvest_id == harvest_id)
    if variety_id is not None:
        query = query.filter(models.HarvestBatch.variety_id == variety_id)
    if status_filter is not None:
        query = query.filter(models.HarvestBatch.status == status_filter)
    items, pagination = _paginate(query, page, page_size)
    return schemas.PaginatedResponse(data=items, pagination=pagination)


@router.post("/batches", response_model=schemas.HarvestBatchOut, status_code=status.HTTP_201_CREATED)
def create_batch(
    payload: schemas.HarvestBatchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if db.query(models.HarvestBatch).filter(models.HarvestBatch.code == payload.code).first():
        raise HTTPException(status_code=400, detail=f"批次编码 {payload.code} 已存在")
    if not db.query(models.HarvestRecord).filter(models.HarvestRecord.id == payload.harvest_id).first():
        raise HTTPException(status_code=404, detail=f"采收记录 {payload.harvest_id} 不存在")
    if not db.query(models.Variety).filter(models.Variety.id == payload.variety_id).first():
        raise HTTPException(status_code=404, detail=f"品种 {payload.variety_id} 不存在")

    data = payload.model_dump()
    batch = HarvestChainService.create_batch(db, data, current_user.id)
    db.commit()
    db.refresh(batch)
    return batch


@router.get("/batches/{batch_id}", response_model=schemas.HarvestBatchOut)
def get_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    batch = db.query(models.HarvestBatch).filter(models.HarvestBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="采收批次不存在")
    return batch
