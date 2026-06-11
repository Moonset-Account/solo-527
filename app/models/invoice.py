from sqlalchemy import Column, Integer, String, Text
from app.database import Base


class InvoiceStatus(Base):
    __tablename__ = "invoice_status"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    sort_order = Column(Integer, default=0)
    color = Column(String(20))
