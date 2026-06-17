from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Dictionary(BaseModel):
    __tablename__ = "dictionaries"

    name = Column(String(100), nullable=False, comment="字典名称")
    code = Column(String(50), unique=True, nullable=False, comment="字典编码")
    description = Column(String(255), nullable=True, comment="描述")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否启用")
    version = Column(Integer, default=1, nullable=False, comment="版本号")

    items = relationship("DictionaryItem", back_populates="dictionary", cascade="all, delete-orphan")


class DictionaryItem(BaseModel):
    __tablename__ = "dictionary_items"

    dictionary_id = Column(Integer, ForeignKey("dictionaries.id"), nullable=False, comment="字典ID")
    label = Column(String(100), nullable=False, comment="显示标签")
    value = Column(String(100), nullable=False, comment="值")
    sort_order = Column(Integer, default=0, nullable=False, comment="排序")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否启用")
    color = Column(String(20), nullable=True, comment="颜色")
    remark = Column(String(255), nullable=True, comment="备注")

    dictionary = relationship("Dictionary", back_populates="items")


class ValidationRule(BaseModel):
    __tablename__ = "validation_rules"

    name = Column(String(100), nullable=False, comment="规则名称")
    code = Column(String(50), unique=True, nullable=False, comment="规则编码")
    field_name = Column(String(50), nullable=False, comment="字段名称")
    rule_type = Column(String(20), nullable=False, comment="规则类型")
    rule_config = Column(JSON, nullable=True, comment="规则配置")
    error_message = Column(String(255), nullable=False, comment="错误提示")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否启用")
    description = Column(Text, nullable=True, comment="描述")
