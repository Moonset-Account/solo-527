from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.assessment import AssessmentQuestion, AssessmentRecord, QuestionType, DifficultyLevel
from app.models.user import User
from app.schemas.assessment import QuestionCreate, QuestionUpdate
from app.services.audit_service import AuditService
from app.models.audit import AuditAction


class AssessmentService:
    @staticmethod
    def get_question_by_id(db: Session, question_id: int) -> Optional[AssessmentQuestion]:
        return db.query(AssessmentQuestion).filter(AssessmentQuestion.id == question_id).first()

    @staticmethod
    def list_questions(
        db: Session,
        keyword: str = None,
        question_type: QuestionType = None,
        difficulty: DifficultyLevel = None,
        category: str = None,
        is_active: bool = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[AssessmentQuestion]:
        query = db.query(AssessmentQuestion)
        if keyword:
            query = query.filter(AssessmentQuestion.question_text.like(f"%{keyword}%"))
        if question_type:
            query = query.filter(AssessmentQuestion.question_type == question_type)
        if difficulty:
            query = query.filter(AssessmentQuestion.difficulty == difficulty)
        if category:
            query = query.filter(AssessmentQuestion.category == category)
        if is_active is not None:
            query = query.filter(AssessmentQuestion.is_active == is_active)
        return query.order_by(AssessmentQuestion.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create_question(db: Session, question_in: QuestionCreate, current_user: User) -> AssessmentQuestion:
        db_question = AssessmentQuestion(
            **question_in.model_dump(),
            created_by=current_user.id,
        )
        db.add(db_question)
        db.commit()
        db.refresh(db_question)

        AuditService.log(
            db, current_user, AuditAction.CREATE,
            "assessment_question", db_question.id,
            description=f"创建测评题目: {question_in.question_text[:50]}"
        )

        return db_question

    @staticmethod
    def update_question(db: Session, question_id: int, question_in: QuestionUpdate, current_user: User) -> AssessmentQuestion:
        db_question = AssessmentService.get_question_by_id(db, question_id)
        if not db_question:
            raise HTTPException(status_code=404, detail="Question not found")

        update_data = question_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_question, field, value)

        db.commit()
        db.refresh(db_question)

        AuditService.log(
            db, current_user, AuditAction.UPDATE,
            "assessment_question", question_id,
            description="更新测评题目"
        )

        return db_question

    @staticmethod
    def delete_question(db: Session, question_id: int, current_user: User) -> bool:
        db_question = AssessmentService.get_question_by_id(db, question_id)
        if not db_question:
            raise HTTPException(status_code=404, detail="Question not found")

        db.delete(db_question)
        db.commit()

        AuditService.log(
            db, current_user, AuditAction.DELETE,
            "assessment_question", question_id,
            description="删除测评题目"
        )

        return True

    @staticmethod
    def list_records(
        db: Session,
        candidate_id: int = None,
        application_id: int = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[AssessmentRecord]:
        query = db.query(AssessmentRecord)
        if candidate_id:
            query = query.filter(AssessmentRecord.candidate_id == candidate_id)
        if application_id:
            query = query.filter(AssessmentRecord.application_id == application_id)
        return query.order_by(AssessmentRecord.created_at.desc()).offset(skip).limit(limit).all()
