from sqlalchemy import Column, String, Float, DateTime, Integer, Boolean, Text
from sqlalchemy.sql import func
from ..core.database import Base


class BookCondition:
    NEW = "全新"
    LIKE_NEW = "九成新"
    GOOD = "八成新"
    FAIR = "七成新"
    POOR = "六成新及以下"
    
    ALL = [NEW, LIKE_NEW, GOOD, FAIR, POOR]


class Channel:
    DOOR_TO_DOOR = "上门回收"
    MAIL_IN = "邮寄回收"
    STORE = "门店回收"
    ONLINE_PLATFORM = "线上平台"
    
    ALL = [DOOR_TO_DOOR, MAIL_IN, STORE, ONLINE_PLATFORM]


class Book(Base):
    __tablename__ = "books"
    
    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String(20), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    author = Column(String(100))
    publisher = Column(String(100))
    publish_date = Column(String(20))
    is_set = Column(Boolean, default=False, comment="是否为套装书")
    set_count = Column(Integer, default=1, comment="套装包含册数")
    category = Column(String(50))
    cover_image = Column(String(500))
    description = Column(Text)
    
    suggested_price_new = Column(Float, comment="全新建议回收价")
    suggested_price_like_new = Column(Float, comment="九成新建议回收价")
    suggested_price_good = Column(Float, comment="八成新建议回收价")
    suggested_price_fair = Column(Float, comment="七成新建议回收价")
    suggested_price_poor = Column(Float, comment="六成新及以下建议回收价")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
