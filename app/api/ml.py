from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ml import (
    TrainingTaskCreate, TrainingTaskResponse, TrainingTaskListResponse,
    ModelVersionResponse, DeployModelRequest,
    RollbackRequest, RollbackResponse, RollbackLogResponse,
    EvaluationSummaryResponse, DashboardStatsResponse,
)

router = APIRouter(prefix="/training", tags=["训练管理"])


@router.get("", response_model=TrainingTaskListResponse)
def list_training_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    from app.services.ml_service import TrainingService
    items, total = TrainingService.list_tasks(db, page, page_size, status=status)
    return TrainingTaskListResponse(
        items=items, total=total, page=page, page_size=page_size,
    )


@router.post("", response_model=TrainingTaskResponse, status_code=202)
def create_training_task(
    data: TrainingTaskCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    use_queue: bool = True,
):
    from app.services.ml_service import TrainingService
    task = TrainingService.create_task(db, data)

    if use_queue:
        try:
            from app.core.queue import get_training_queue
            queue = get_training_queue()
            job = queue.enqueue(
                "app.workers.tasks.execute_training_task",
                task_id=task.id,
                job_timeout="12h",
            )
            TrainingService.update_status(
                db, task.id, task.status, None, None, job.id,
            )
        except Exception:
            background_tasks.add_task(_sync_run_training, task.id)
    else:
        background_tasks.add_task(_sync_run_training, task.id)

    db.refresh(task)
    return task


def _sync_run_training(task_id: int):
    from app.core.database import SessionLocal
    from app.services.ml_service import TrainingService
    db = SessionLocal()
    try:
        TrainingService.execute_training_task(db, task_id)
    finally:
        db.close()


@router.get("/{task_id}", response_model=TrainingTaskResponse)
def get_training_task(task_id: int, db: Session = Depends(get_db)):
    from app.services.ml_service import TrainingService
    task = TrainingService.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="训练任务不存在")
    return task


versions_router = APIRouter(prefix="/model-versions", tags=["模型版本"])


@versions_router.get("")
def list_model_versions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    from app.services.ml_service import ModelVersionService
    items, total = ModelVersionService.list_versions(db, page, page_size, status=status)
    return {
        "items": [ModelVersionResponse.model_validate(x) for x in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@versions_router.get("/current", response_model=ModelVersionResponse)
def get_current_model(db: Session = Depends(get_db)):
    from app.services.ml_service import ModelVersionService
    current = ModelVersionService.get_current(db)
    if not current:
        raise HTTPException(status_code=404, detail="没有已部署的模型")
    return current


@versions_router.get("/{version_id}", response_model=ModelVersionResponse)
def get_model_version(version_id: int, db: Session = Depends(get_db)):
    from app.services.ml_service import ModelVersionService
    version = ModelVersionService.get_by_id(db, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="模型版本不存在")
    return version


@versions_router.post("/deploy", response_model=ModelVersionResponse)
def deploy_model(data: DeployModelRequest, db: Session = Depends(get_db)):
    from app.services.ml_service import ModelVersionService
    deployed = ModelVersionService.deploy(
        db, data.model_version_id, data.operator_name,
    )
    if not deployed:
        raise HTTPException(status_code=404, detail="模型版本不存在")
    return deployed


rollback_router = APIRouter(prefix="/rollback", tags=["回滚管理"])


@rollback_router.post("", response_model=RollbackResponse)
def rollback_model(data: RollbackRequest, db: Session = Depends(get_db)):
    from app.services.ml_service import ModelVersionService
    result, err = ModelVersionService.rollback(db, data)
    if err:
        raise HTTPException(status_code=400, detail=err)
    return RollbackResponse(**result)


@rollback_router.get("/logs", response_model=List[RollbackLogResponse])
def list_rollback_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    from app.services.ml_service import ModelVersionService
    items, _ = ModelVersionService.list_rollback_logs(db, page, page_size)
    result = []
    for log in items:
        result.append(RollbackLogResponse(
            id=log.id,
            from_version_id=log.from_version_id,
            from_version_tag=log.from_version.version_tag if log.from_version else "",
            to_version_id=log.to_version_id,
            to_version_tag=log.to_version.version_tag if log.to_version else "",
            reason=log.reason,
            operator_id=log.operator_id,
            operator_name=log.operator_name,
            rollback_type=log.rollback_type,
            affected_ticket_count=log.affected_ticket_count,
            created_at=log.created_at,
        ))
    return result


stats_router = APIRouter(prefix="/stats", tags=["评估面板"])


@stats_router.get("/dashboard", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    from app.services.inference_service import StatsService
    return StatsService.get_dashboard_stats(db, days=days)


@stats_router.get("/evaluation/{model_version_id}", response_model=EvaluationSummaryResponse)
@stats_router.get("/evaluation", response_model=EvaluationSummaryResponse)
def get_model_evaluation(
    model_version_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    from app.services.inference_service import StatsService
    result, err = StatsService.get_model_evaluation(db, model_version_id)
    if err:
        raise HTTPException(status_code=400, detail=err)
    return EvaluationSummaryResponse(**result)
