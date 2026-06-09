from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), unique=True, index=True, nullable=False)
    model_name = Column(String(100), default="LightGBM")
    description = Column(Text, nullable=True)
    hyperparameters = Column(JSON, nullable=True)
    feature_columns = Column(JSON, nullable=True)
    training_sample_count = Column(Integer, default=0)
    training_date_range_start = Column(DateTime, nullable=True)
    training_date_range_end = Column(DateTime, nullable=True)
    metrics_auc = Column(Float, nullable=True)
    metrics_accuracy = Column(Float, nullable=True)
    metrics_precision = Column(Float, nullable=True)
    metrics_recall = Column(Float, nullable=True)
    metrics_f1 = Column(Float, nullable=True)
    metrics_ks = Column(Float, nullable=True)
    is_active = Column(Boolean, default=False)
    is_rollback = Column(Boolean, default=False)
    rollback_from_version = Column(String(50), nullable=True)
    model_file_path = Column(String(500), nullable=True)
    feature_importance_path = Column(String(500), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_status = Column(String(20), default="pending")
    review_comment = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
