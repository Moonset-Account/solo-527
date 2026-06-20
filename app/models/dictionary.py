from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Dictionary(Base):
    __tablename__ = "dictionaries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    dict_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    dict_key: Mapped[str] = mapped_column(String(128), nullable=False)
    dict_value: Mapped[str] = mapped_column(String(512), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class DictionaryVersion(Base):
    __tablename__ = "dictionary_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    dictionary_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    dict_type: Mapped[str] = mapped_column(String(64), nullable=False)
    dict_key: Mapped[str] = mapped_column(String(128), nullable=False)
    dict_value: Mapped[str] = mapped_column(String(512), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    operated_by: Mapped[str] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
