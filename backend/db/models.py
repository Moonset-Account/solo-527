from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric, Text, Time, CheckConstraint
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class Store(Base):
    __tablename__ = 'stores'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    city = Column(String(50))
    address = Column(String(255))
    created_at = Column(DateTime, default=datetime.now)

class Coach(Base):
    __tablename__ = 'coaches'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    store_id = Column(Integer, ForeignKey('stores.id'))
    specialty = Column(String(100))
    level = Column(String(20))
    hire_date = Column(Date)
    created_at = Column(DateTime, default=datetime.now)
    store = relationship('Store')

class Course(Base):
    __tablename__ = 'courses'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50))
    duration = Column(Integer)
    capacity = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)

class MemberType(Base):
    __tablename__ = 'member_types'
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    description = Column(Text)
    price_monthly = Column(Numeric(10, 2))
    created_at = Column(DateTime, default=datetime.now)

class Member(Base):
    __tablename__ = 'members'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20))
    gender = Column(String(10))
    age = Column(Integer)
    member_type_id = Column(Integer, ForeignKey('member_types.id'))
    store_id = Column(Integer, ForeignKey('stores.id'))
    join_date = Column(Date, nullable=False)
    expire_date = Column(Date)
    status = Column(String(20), default='active')
    created_at = Column(DateTime, default=datetime.now)
    member_type = relationship('MemberType')
    store = relationship('Store')

class MembershipCard(Base):
    __tablename__ = 'membership_cards'
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey('members.id'))
    card_type = Column(String(50))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_times = Column(Integer)
    used_times = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)

class Suspension(Base):
    __tablename__ = 'suspensions'
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey('members.id'))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(String(255))
    status = Column(String(20), default='approved')
    created_at = Column(DateTime, default=datetime.now)

class Booking(Base):
    __tablename__ = 'bookings'
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey('members.id'))
    course_id = Column(Integer, ForeignKey('courses.id'))
    coach_id = Column(Integer, ForeignKey('coaches.id'))
    store_id = Column(Integer, ForeignKey('stores.id'))
    booking_date = Column(Date, nullable=False)
    booking_time = Column(Time, nullable=False)
    status = Column(String(20), default='booked')
    created_at = Column(DateTime, default=datetime.now)

class Checkin(Base):
    __tablename__ = 'checkins'
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey('members.id'))
    store_id = Column(Integer, ForeignKey('stores.id'))
    checkin_time = Column(DateTime, nullable=False)
    checkout_time = Column(DateTime)
    booking_id = Column(Integer, ForeignKey('bookings.id'))
    created_at = Column(DateTime, default=datetime.now)

class BodyMeasurement(Base):
    __tablename__ = 'body_measurements'
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey('members.id'))
    coach_id = Column(Integer, ForeignKey('coaches.id'))
    measure_date = Column(Date, nullable=False)
    height = Column(Numeric(5, 2))
    weight = Column(Numeric(5, 2))
    body_fat = Column(Numeric(5, 2))
    muscle_mass = Column(Numeric(5, 2))
    bmi = Column(Numeric(5, 2))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

class PTPurchase(Base):
    __tablename__ = 'pt_purchases'
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey('members.id'))
    coach_id = Column(Integer, ForeignKey('coaches.id'))
    purchase_date = Column(Date, nullable=False)
    sessions = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    used_sessions = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)

class Feedback(Base):
    __tablename__ = 'feedbacks'
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey('members.id'))
    coach_id = Column(Integer)
    course_id = Column(Integer)
    rating = Column(Integer, CheckConstraint('rating BETWEEN 1 AND 5'))
    content = Column(Text)
    feedback_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
