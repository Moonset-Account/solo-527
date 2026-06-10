from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.models.assessment import QuestionType, DifficultyLevel
from app.schemas.assessment import (
    QuestionCreate, QuestionUpdate, QuestionResponse,
    AssessmentRecordResponse,
)
from app.services.assessment_service import AssessmentService
from app.services.candidate_service import CandidateService

router = APIRouter(prefix="/assessments", tags=["测评管理"])


@router.get("/questions", response_model=List[QuestionResponse])
def list_questions(
    keyword: str = None,
    question_type: QuestionType = None,
    difficulty: DifficultyLevel = None,
    category: str = None,
    is_active: bool = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return AssessmentService.list_questions(
        db, keyword=keyword, question_type=question_type,
        difficulty=difficulty, category=category, is_active=is_active,
        skip=skip, limit=limit,
    )


@router.get("/questions/{question_id}", response_model=QuestionResponse)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    question = AssessmentService.get_question_by_id(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.post("/questions", response_model=QuestionResponse)
def create_question(
    question_in: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return AssessmentService.create_question(db, question_in, current_user)


@router.put("/questions/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: int,
    question_in: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return AssessmentService.update_question(db, question_id, question_in, current_user)


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    AssessmentService.delete_question(db, question_id, current_user)
    return {"message": "Question deleted successfully"}


@router.get("/records", response_model=List[AssessmentRecordResponse])
def list_records(
    candidate_id: int = None,
    application_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.RECRUITER)),
):
    return AssessmentService.list_records(
        db, candidate_id=candidate_id, application_id=application_id,
        skip=skip, limit=limit,
    )


@router.get("/records/my", response_model=List[AssessmentRecordResponse])
def get_my_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(status_code=400, detail="Only candidates have assessment records")
    candidate = CandidateService.get_by_user_id(db, current_user.id)
    if not candidate:
        return []
    return AssessmentService.list_records(db, candidate_id=candidate.id)
