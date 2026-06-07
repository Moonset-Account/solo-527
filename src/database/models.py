from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from .connection import Base
from datetime import datetime


class Window(Base):
    __tablename__ = 'windows'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    floor = Column(Integer, nullable=False)
    canteen = Column(String(100), nullable=False)
    category = Column(String(50))
    is_active = Column(Boolean, default=True)
    capacity = Column(Integer, default=1)
    
    def __repr__(self):
        return f"<Window {self.name}>"


class Dish(Base):
    __tablename__ = 'dishes'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    window_id = Column(Integer, ForeignKey('windows.id'))
    price = Column(Float)
    category = Column(String(50))
    avg_prep_time = Column(Integer)
    
    def __repr__(self):
        return f"<Dish {self.name}>"


class Order(Base):
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True)
    order_no = Column(String(50), unique=True, nullable=False)
    window_id = Column(Integer, ForeignKey('windows.id'), nullable=False)
    dish_id = Column(Integer, ForeignKey('dishes.id'))
    student_id = Column(String(50))
    
    queue_start_time = Column(DateTime, nullable=False, index=True)
    payment_time = Column(DateTime)
    serve_time = Column(DateTime, index=True)
    
    amount = Column(Float)
    item_count = Column(Integer, default=1)
    is_abnormal = Column(Boolean, default=False, index=True)
    abnormal_reason = Column(String(200))
    
    wait_queue = Column(Integer)
    wait_payment = Column(Integer)
    wait_serve = Column(Integer)
    total_wait = Column(Integer)
    
    time_slot = Column(String(20), index=True)
    floor = Column(Integer, index=True)
    is_big_break = Column(Boolean, default=False, index=True)
    
    extra = Column(JSONB, default={})


class Review(Base):
    __tablename__ = 'reviews'
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'))
    window_id = Column(Integer, ForeignKey('windows.id'), index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    create_time = Column(DateTime, default=datetime.now, index=True)
    
    sentiment = Column(String(20))
    keywords = Column(JSONB, default=[])


class WindowOutage(Base):
    __tablename__ = 'window_outages'
    
    id = Column(Integer, primary_key=True)
    window_id = Column(Integer, ForeignKey('windows.id'), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, index=True)
    reason = Column(String(200))
    is_planned = Column(Boolean, default=False)
    affected_order_count = Column(Integer, default=0)


Index('idx_orders_window_time', Order.window_id, Order.queue_start_time)
Index('idx_orders_floor_slot', Order.floor, Order.time_slot, Order.queue_start_time)
Index('idx_reviews_window_rating', Review.window_id, Review.rating, Review.create_time)
