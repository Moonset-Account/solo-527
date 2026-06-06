from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from .. import models, schemas, auth, tasks as app_tasks
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
    background_tasks: BackgroundTasks,
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

    injury_task = models.Task(
        title=f"伤病跟踪: {runner.full_name or runner.username} - {db_note.injury_type}",
        task_type=models.TaskType.INJURY_REPORT,
        status=models.TaskStatus.NEW,
        assigned_user_id=note.runner_id,
        related_id=db_note.id,
        priority=2,
        due_date=db_note.expected_recovery_date,
        notes=f"伤病类型: {db_note.injury_type}\n严重程度: {db_note.severity}\n备注: {db_note.notes or ''}"
    )
    db.add(injury_task)

    recovery_hint = ""
    if db_note.expected_recovery_date:
        recovery_date = db_note.expected_recovery_date.strftime("%Y-%m-%d")
        recovery_hint = f"建议休息至 {recovery_date}。"
    notification_msg = f"教练已为您记录伤病：{db_note.injury_type}。{recovery_hint}请遵医嘱进行恢复。"

    notification = app_tasks.create_notification(
        db,
        user_id=note.runner_id,
        title=f"伤病记录已创建: {db_note.injury_type}",
        message=notification_msg,
        notification_type="injury"
    )

    db.commit()

    background_tasks.add_task(app_tasks.process_notification, notification.id)

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
