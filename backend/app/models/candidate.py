from sqlalchemy import Column, Integer, String, DateTime, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String(50), nullable=False)
    gender = Column(String(10))
    birth_date = Column(Date)
    id_card = Column(String(20))
    phone = Column(String(20))
    email = Column(String(100))
    university = Column(String(100))
    major = Column(String(100))
    degree = Column(String(20))
    graduation_year = Column(Integer)
    gpa = Column(String(20))
    resume_url = Column(String(255))
    avatar = Column(String(255))
    source_channel = Column(String(50))
    expected_salary = Column(String(50))
    city = Column(String(50))
    skills = Column(Text)
    introduction = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="candidate_profile")
    applications = relationship("Application", back_populates="candidate")
