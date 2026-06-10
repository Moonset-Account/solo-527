from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.position import Position
from app.models.user import User
from app.schemas.position import PositionCreate, PositionUpdate


class PositionService:
    @staticmethod
    def get_by_id(db: Session, position_id: int) -> Optional[Position]:
        return db.query(Position).filter(Position.id == position_id).first()

    @staticmethod
    def list(
        db: Session,
        keyword: str = None,
        department: str = None,
        job_type: str = None,
        city: str = None,
        is_active: bool = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Position]:
        query = db.query(Position)
        if keyword:
            query = query.filter(Position.title.like(f"%{keyword}%"))
        if department:
            query = query.filter(Position.department == department)
        if job_type:
            query = query.filter(Position.job_type == job_type)
        if city:
            query = query.filter(Position.city == city)
        if is_active is not None:
            query = query.filter(Position.is_active == is_active)
        return query.order_by(Position.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, position_in: PositionCreate, created_by: int) -> Position:
        db_position = Position(
            **position_in.model_dump(),
            created_by=created_by,
        )
        db.add(db_position)
        db.commit()
        db.refresh(db_position)
        return db_position

    @staticmethod
    def update(db: Session, position_id: int, position_in: PositionUpdate) -> Position:
        db_position = PositionService.get_by_id(db, position_id)
        if not db_position:
            raise HTTPException(status_code=404, detail="Position not found")

        update_data = position_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_position, field, value)

        db.commit()
        db.refresh(db_position)
        return db_position

    @staticmethod
    def delete(db: Session, position_id: int) -> bool:
        db_position = PositionService.get_by_id(db, position_id)
        if not db_position:
            raise HTTPException(status_code=404, detail="Position not found")
        db.delete(db_position)
        db.commit()
        return True
