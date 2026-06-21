from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class AdoptionApplication(BaseModel):
    __tablename__ = "adoption_applications"

    applicant_name = Column(String(100), nullable=False)
    applicant_phone = Column(String(20), nullable=False)
    applicant_id_card = Column(String(50), nullable=True)
    address = Column(String(255), nullable=False)
    housing_type = Column(String(50), nullable=False)
    pet_experience = Column(String(255), nullable=False)
    family_members = Column(Integer, nullable=False)
    has_other_pets = Column(Boolean, default=False, nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False, index=True)
    apply_reason = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="pending", index=True)
    review_remark = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    reviewed_at = Column(DateTime, nullable=True)

    pet = relationship("Pet", back_populates="adoption_applications", lazy="selectin")
    follow_up_tasks = relationship("FollowUpTask", lazy="selectin",
                                   primaryjoin="and_(AdoptionApplication.id==FollowUpTask.related_id, "
                                               "FollowUpTask.related_type=='adoption')",
                                   foreign_keys="FollowUpTask.related_id")
