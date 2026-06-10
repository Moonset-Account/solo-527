from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base


class DictionaryType(Base):
    __tablename__ = "dictionary_types"

    id = Column(Integer, primary_key=True, index=True)
    type_code = Column(String(50), unique=True, nullable=False)
    type_name = Column(String(100), nullable=False)
    description = Column(String(500))
    is_system = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class DictionaryItem(Base):
    __tablename__ = "dictionary_items"

    id = Column(Integer, primary_key=True, index=True)
    type_id = Column(Integer, ForeignKey("dictionary_types.id"), nullable=False)
    item_code = Column(String(50), nullable=False)
    item_value = Column(String(200), nullable=False)
    item_label = Column(String(200))
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    remark = Column(String(500))
    extra_data = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(100), unique=True, nullable=False)
    config_value = Column(Text)
    config_label = Column(String(200))
    config_type = Column(String(20), default="string")
    description = Column(String(500))
    group_name = Column(String(50))
    is_active = Column(Boolean, default=True)
    updated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
