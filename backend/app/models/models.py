from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Numeric, Boolean, Date, JSON
from sqlalchemy.orm import relationship
import uuid
from passlib.context import CryptContext
from app.core.database import Base

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100))
    role = Column(String(20), nullable=False, default="viewer")  # director, admin, team_leader, viewer
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.hashed_password)
    
    def set_password(self, password: str):
        self.hashed_password = pwd_context.hash(password)


class HazardType(Base):
    __tablename__ = "hazard_types"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    default_fine_amount = Column(Numeric(12, 2), default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Team(Base):
    __tablename__ = "teams"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    leader = Column(String(50), nullable=False)
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InspectionPoint(Base):
    __tablename__ = "inspection_points"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    floor = Column(Integer, nullable=False)
    area = Column(String(100))
    description = Column(Text)
    coordinates = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Hazard(Base):
    __tablename__ = "hazards"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    type_id = Column(String, ForeignKey("hazard_types.id"))
    level = Column(String(20), nullable=False)
    inspection_point_id = Column(String, ForeignKey("inspection_points.id"))
    team_id = Column(String, ForeignKey("teams.id"))
    status = Column(String(20), nullable=False, default="pending")
    discoverer_id = Column(String, ForeignKey("users.id"))
    discovered_at = Column(DateTime, nullable=False)
    deadline = Column(DateTime, nullable=False)
    closed_at = Column(DateTime)
    fine_amount = Column(Numeric(12, 2))
    fine_status = Column(String(20))  # pending, confirmed, rejected
    reject_reasons = Column(JSON, default=list)
    
    team_name = Column(String(100))
    type_name = Column(String(100))
    inspection_point_floor = Column(Integer)
    inspection_point_name = Column(String(100))
    discoverer_name = Column(String(100))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    type = relationship("HazardType", lazy="joined")
    inspection_point = relationship("InspectionPoint", lazy="joined")
    team = relationship("Team", lazy="joined")
    discoverer = relationship("User", lazy="joined")
    
    @property
    def is_overdue(self) -> bool:
        if self.status == "closed":
            return False
        if not self.deadline:
            return False
        return datetime.utcnow() > self.deadline


class StatusHistory(Base):
    __tablename__ = "status_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hazard_id = Column(String, ForeignKey("hazards.id", ondelete="CASCADE"))
    from_status = Column(String(20))
    to_status = Column(String(20), nullable=False)
    remark = Column(Text)
    operator_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class RectificationRecord(Base):
    __tablename__ = "rectification_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hazard_id = Column(String, ForeignKey("hazards.id", ondelete="CASCADE"))
    description = Column(Text, nullable=False)
    submitted_by = Column(String(100))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    review_result = Column(String(20))  # pass, reject
    review_reason = Column(Text)
    reviewed_by = Column(String(100))
    reviewed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class AppealRecord(Base):
    __tablename__ = "appeal_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hazard_id = Column(String, ForeignKey("hazards.id", ondelete="CASCADE"))
    reason = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, approved, rejected
    handled_by = Column(String(100))
    handled_at = Column(DateTime)
    handle_remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class Fine(Base):
    __tablename__ = "fines"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hazard_id = Column(String, ForeignKey("hazards.id", ondelete="CASCADE"))
    team_id = Column(String, ForeignKey("teams.id"))
    team_name = Column(String(100))
    amount = Column(Numeric(12, 2), nullable=False)
    reason = Column(Text)
    status = Column(String(20), nullable=False, default="pending")
    confirmed_by = Column(String, ForeignKey("users.id"))
    confirmed_at = Column(DateTime)
    rejected_at = Column(DateTime)
    reject_reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    type = Column(String(20), nullable=False)  # image, document
    related_type = Column(String(50), nullable=False)
    related_id = Column(String, nullable=False)
    sensitive = Column(Boolean, default=False)
    uploaded_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class WeatherRecord(Base):
    __tablename__ = "weather_records"
    
    date = Column(Date, primary_key=True)
    weather = Column(String(50), nullable=False)
    temperature = Column(Integer)
    wind_level = Column(Integer)
    rain_volume = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)


class StopWorkRecord(Base):
    __tablename__ = "stop_work_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
