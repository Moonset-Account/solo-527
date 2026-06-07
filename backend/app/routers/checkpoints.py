from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Checkpoint, User
from app.schemas import Checkpoint as CheckpointSchema, CheckpointCreate
from app.auth import require_authenticated

router = APIRouter(prefix="/api/checkpoints", tags=["checkpoints"])


@router.get("", response_model=List[CheckpointSchema])
def get_checkpoints(
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    checkpoints = db.query(Checkpoint).all()
    return checkpoints


@router.post("", response_model=CheckpointSchema)
def create_checkpoint(
    checkpoint_data: CheckpointCreate,
    current_user: User = Depends(require_authenticated),
    db: Session = Depends(get_db)
):
    checkpoint = Checkpoint(**checkpoint_data.model_dump())
    db.add(checkpoint)
    db.commit()
    db.refresh(checkpoint)
    return checkpoint
