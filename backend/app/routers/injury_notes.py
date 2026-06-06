from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/injury-notes", tags=["injury_notes"])


@router.get("/", response_model=List[schemas.InjuryNoteResponse])
def list_injury_notes(
    runner_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    query = db.query(models.InjuryNote)
    if runner_id:
        query = query.filter(models.InjuryNote.runner_id == runner_id)
    notes = query.all()
    return notes


@router.post("/", response_model=schemas.InjuryNoteResponse)
def create_injury_note(
    note: schemas.InjuryNoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    runner = db.query(models.User).filter(models.User.id == note.runner_id).first()
    if not runner:
        raise HTTPException(status_code=404, detail="Runner not found")

    db_note = models.InjuryNote(
        **note.model_dump(),
        reported_by=current_user.id
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


@router.get("/my-injuries", response_model=List[schemas.InjuryNoteResponse])
def get_my_injuries(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    notes = db.query(models.InjuryNote).filter(
        models.InjuryNote.runner_id == current_user.id
    ).all()
    return notes


@router.get("/{note_id}", response_model=schemas.InjuryNoteResponse)
def get_injury_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    note = db.query(models.InjuryNote).filter(models.InjuryNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Injury note not found")
    if current_user.role == models.UserRole.RUNNER and note.runner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this injury note")
    return note


@router.patch("/{note_id}", response_model=schemas.InjuryNoteResponse)
def update_injury_note(
    note_id: int,
    update: schemas.InjuryNoteUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    note = db.query(models.InjuryNote).filter(models.InjuryNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Injury note not found")

    if update.is_resolved and not note.is_resolved:
        note.resolved_at = datetime.utcnow()

    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(note, key, value)

    db.commit()
    db.refresh(note)
    return note
