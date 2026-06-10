from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException

from app.models.interview import Interview, InterviewType, InterviewStatus, InterviewResult
from app.models.todo import Todo, TodoType, TodoPriority, TodoStatus
from app.models.user import User
from app.schemas.interview import InterviewCreate, InterviewUpdate, InterviewResultUpdate
from app.services.audit_service import AuditService
from app.models.audit import AuditAction


class InterviewService:
    @staticmethod
    def get_by_id(db: Session, interview_id: int) -> Optional[Interview]:
        return db.query(Interview).filter(Interview.id == interview_id).first()

    @staticmethod
    def list(
        db: Session,
        application_id: int = None,
        interview_type: InterviewType = None,
        status: InterviewStatus = None,
        start_time_from: datetime = None,
        start_time_to: datetime = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Interview]:
        query = db.query(Interview)
        if application_id:
            query = query.filter(Interview.application_id == application_id)
        if interview_type:
            query = query.filter(Interview.interview_type == interview_type)
        if status:
            query = query.filter(Interview.status == status)
        if start_time_from:
            query = query.filter(Interview.start_time >= start_time_from)
        if start_time_to:
            query = query.filter(Interview.start_time <= start_time_to)
        return query.order_by(Interview.start_time.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def check_conflict(
        db: Session,
        start_time: datetime,
        end_time: datetime,
        interviewer_ids: str = None,
        exclude_id: int = None,
    ) -> dict:
        query = db.query(Interview).filter(
            Interview.status.notin_([InterviewStatus.CANCELLED]),
            or_(
                and_(Interview.start_time < end_time, Interview.end_time > start_time),
            )
        )
        if exclude_id:
            query = query.filter(Interview.id != exclude_id)

        conflicts = query.all()
        conflict_list = []
        for c in conflicts:
            conflict_list.append({
                "id": c.id,
                "title": c.title,
                "start_time": c.start_time,
                "end_time": c.end_time,
                "interview_type": c.interview_type,
                "application_id": c.application_id,
            })

        return {
            "has_conflict": len(conflicts) > 0,
            "conflicts": conflict_list,
        }

    @staticmethod
    def create(db: Session, interview_in: InterviewCreate, current_user: User) -> Interview:
        conflict_info = InterviewService.check_conflict(
            db, interview_in.start_time, interview_in.end_time, interview_in.interviewer_ids
        )

        db_interview = Interview(
            **interview_in.model_dump(),
            created_by=current_user.id,
            scheduled_by=current_user.id,
            status=InterviewStatus.SCHEDULED,
        )
        db.add(db_interview)
        db.flush()

        if conflict_info["has_conflict"]:
            todo = Todo(
                title=f"面试冲突提醒: {interview_in.title}",
                description=f"新建面试与已有面试存在时间冲突，请及时处理。冲突面试数: {len(conflict_info['conflicts'])}",
                todo_type=TodoType.INTERVIEW_CONFLICT,
                priority=TodoPriority.HIGH,
                status=TodoStatus.PENDING,
                assigned_to=current_user.id,
                related_entity_type="interview",
                related_entity_id=db_interview.id,
                created_by=current_user.id,
            )
            db.add(todo)

        db.commit()
        db.refresh(db_interview)

        AuditService.log(
            db, current_user, AuditAction.CREATE,
            "interview", db_interview.id,
            description=f"安排面试: {interview_in.title}"
        )

        return db_interview

    @staticmethod
    def update(db: Session, interview_id: int, interview_in: InterviewUpdate, current_user: User) -> Interview:
        db_interview = InterviewService.get_by_id(db, interview_id)
        if not db_interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        if interview_in.start_time and interview_in.end_time:
            conflict_info = InterviewService.check_conflict(
                db, interview_in.start_time, interview_in.end_time,
                interview_in.interviewer_ids, exclude_id=interview_id
            )
            if conflict_info["has_conflict"]:
                todo = Todo(
                    title=f"面试时间调整冲突: {db_interview.title}",
                    description=f"调整后的面试时间与已有面试冲突，请处理。",
                    todo_type=TodoType.INTERVIEW_CONFLICT,
                    priority=TodoPriority.HIGH,
                    status=TodoStatus.PENDING,
                    assigned_to=current_user.id,
                    related_entity_type="interview",
                    related_entity_id=interview_id,
                    created_by=current_user.id,
                )
                db.add(todo)

        update_data = interview_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_interview, field, value)

        db.commit()
        db.refresh(db_interview)

        AuditService.log(
            db, current_user, AuditAction.UPDATE,
            "interview", interview_id,
            description="更新面试信息"
        )

        return db_interview

    @staticmethod
    def update_result(db: Session, interview_id: int, result_in: InterviewResultUpdate, current_user: User) -> Interview:
        db_interview = InterviewService.get_by_id(db, interview_id)
        if not db_interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        db_interview.result = result_in.result
        db_interview.score = result_in.score
        db_interview.feedback = result_in.feedback
        db_interview.status = InterviewStatus.COMPLETED

        db.commit()
        db.refresh(db_interview)

        AuditService.log(
            db, current_user, AuditAction.STATUS_CHANGE,
            "interview", interview_id,
            new_value=f"{result_in.result}",
            description=f"面试结果: {result_in.result}"
        )

        return db_interview

    @staticmethod
    def cancel(db: Session, interview_id: int, current_user: User) -> Interview:
        db_interview = InterviewService.get_by_id(db, interview_id)
        if not db_interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        db_interview.status = InterviewStatus.CANCELLED
        db.commit()
        db.refresh(db_interview)

        AuditService.log(
            db, current_user, AuditAction.STATUS_CHANGE,
            "interview", interview_id,
            old_value=f"{db_interview.status}",
            new_value=f"{InterviewStatus.CANCELLED}",
            description="取消面试"
        )

        return db_interview
