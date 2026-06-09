from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.model import (
    ScoringRequest, ScoringResponse,
    ModelTrainRequest, ModelTrainResponse, ModelVersionResponse, RollbackRequest
)
from app.services.scoring_service import ScoringService
from app.services.model_service import ModelService
from app.models.user import User

router = APIRouter(prefix="/models", tags=["模型管理与评分"])


@router.post("/train", response_model=ModelTrainResponse)
def train_model(
    request: ModelTrainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "data_scientist"])),
):
    result = ModelService.train_model(db, request, current_user.id)
    if not result:
        raise HTTPException(
            status_code=400,
            detail="模型训练失败：请检查是否有足够的已标注数据（actual_status字段）"
        )
    return result


@router.get("/versions", response_model=list)
def list_model_versions(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return ModelService.list_model_versions(db)


@router.post("/versions/{version_id}/activate", response_model=ModelVersionResponse)
def activate_model(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    mv = ModelService.activate_model(db, version_id, current_user.id)
    if not mv:
        raise HTTPException(status_code=404, detail="模型版本不存在")
    return mv


@router.post("/versions/rollback")
def rollback_model(
    request: RollbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    success = ModelService.rollback_model(db, request, current_user.id)
    if not success:
        raise HTTPException(status_code=400, detail="回滚失败，请检查目标版本是否存在")
    return {"success": True, "message": f"已回滚到版本 {request.target_version}"}


@router.post("/versions/{version_id}/review", response_model=ModelVersionResponse)
def review_model(
    version_id: int,
    status: str = Query(..., regex="^(approved|rejected|pending)$"),
    comment: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    mv = ModelService.review_model(db, version_id, status, comment, current_user.id)
    if not mv:
        raise HTTPException(status_code=404, detail="模型版本不存在")
    return mv


@router.post("/score", response_model=ScoringResponse)
def run_scoring(
    request: Optional[ScoringRequest] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(["admin", "operator"])),
):
    ids = request.appointment_ids if request else None
    mv_id = request.model_version_id if request else None
    result = ScoringService.run_scoring(
        db, appointment_ids=ids, model_version_id=mv_id,
        date_from=date_from, date_to=date_to
    )
    return result


@router.get("/scores")
def list_risk_scores(
    skip: int = 0, limit: int = 100,
    risk_level: Optional[str] = None,
    department_id: Optional[int] = None,
    batch_id: Optional[str] = None,
    model_version_id: Optional[int] = None,
    needs_callback: Optional[bool] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return ScoringService.get_risk_scores(
        db, skip=skip, limit=limit, risk_level=risk_level,
        department_id=department_id, batch_id=batch_id,
        model_version_id=model_version_id, needs_callback=needs_callback
    )


@router.get("/scores/{score_id}")
def get_score_detail(
    score_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    detail = ScoringService.get_score_detail(db, score_id)
    if not detail:
        raise HTTPException(status_code=404, detail="评分记录不存在")
    return detail


@router.put("/scores/{score_id}/override")
def override_score(
    score_id: int,
    new_level: str = Query(..., regex="^(low|medium|high|critical)$"),
    new_score: Optional[float] = None,
    reason: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "operator"])),
):
    result = ScoringService.override_score(
        db, score_id, new_level, new_score, reason, current_user.id
    )
    if not result:
        raise HTTPException(status_code=404, detail="评分记录不存在")
    return {"success": True, "message": "已人工覆盖评分结果"}
