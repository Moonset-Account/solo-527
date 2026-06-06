from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/training-plans", tags=["training_plans"])


@router.get("/", response_model=List[schemas.TrainingPlanResponse])
def list_training_plans(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    plans = db.query(models.TrainingPlan).filter(
        models.TrainingPlan.is_published == True
    ).offset(skip).limit(limit).all()
    return plans


@router.post("/", response_model=schemas.TrainingPlanResponse)
def create_training_plan(
    plan: schemas.TrainingPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    db_plan = models.TrainingPlan(
        **plan.model_dump(),
        created_by=current_user.id
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


@router.get("/{plan_id}", response_model=schemas.TrainingPlanResponse)
def get_training_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")
    return plan


@router.put("/{plan_id}", response_model=schemas.TrainingPlanResponse)
def update_training_plan(
    plan_id: int,
    plan_update: schemas.TrainingPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")
    for key, value in plan_update.model_dump().items():
        setattr(plan, key, value)
    db.commit()
    db.refresh(plan)
    return plan


@router.post("/{plan_id}/publish", response_model=schemas.TrainingPlanResponse)
def publish_training_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")
    plan.is_published = True
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_training_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_admin)
):
    plan = db.query(models.TrainingPlan).filter(models.TrainingPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Training plan not found")
    db.delete(plan)
    db.commit()
