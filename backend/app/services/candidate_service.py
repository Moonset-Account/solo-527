from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.candidate import Candidate
from app.models.user import User
from app.schemas.candidate import CandidateCreate, CandidateUpdate


class CandidateService:
    @staticmethod
    def get_by_id(db: Session, candidate_id: int) -> Optional[Candidate]:
        return db.query(Candidate).filter(Candidate.id == candidate_id).first()

    @staticmethod
    def get_by_user_id(db: Session, user_id: int) -> Optional[Candidate]:
        return db.query(Candidate).filter(Candidate.user_id == user_id).first()

    @staticmethod
    def list(
        db: Session,
        keyword: str = None,
        university: str = None,
        major: str = None,
        source_channel: str = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Candidate]:
        query = db.query(Candidate)
        if keyword:
            query = query.filter(
                Candidate.name.like(f"%{keyword}%") |
                Candidate.university.like(f"%{keyword}%")
            )
        if university:
            query = query.filter(Candidate.university == university)
        if major:
            query = query.filter(Candidate.major == major)
        if source_channel:
            query = query.filter(Candidate.source_channel == source_channel)
        return query.order_by(Candidate.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, candidate_in: CandidateCreate) -> Candidate:
        if candidate_in.user_id:
            existing = CandidateService.get_by_user_id(db, candidate_in.user_id)
            if existing:
                raise HTTPException(status_code=400, detail="Candidate profile already exists for this user")

        db_candidate = Candidate(**candidate_in.model_dump())
        db.add(db_candidate)
        db.commit()
        db.refresh(db_candidate)
        return db_candidate

    @staticmethod
    def update(db: Session, candidate_id: int, candidate_in: CandidateUpdate) -> Candidate:
        db_candidate = CandidateService.get_by_id(db, candidate_id)
        if not db_candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        update_data = candidate_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_candidate, field, value)

        db.commit()
        db.refresh(db_candidate)
        return db_candidate

    @staticmethod
    def delete(db: Session, candidate_id: int) -> bool:
        db_candidate = CandidateService.get_by_id(db, candidate_id)
        if not db_candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        db.delete(db_candidate)
        db.commit()
        return True
