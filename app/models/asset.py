import enum
from datetime import datetime
from sqlalchemy import String, Enum, DateTime, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class AssetStatusEnum(str, enum.Enum):
    in_use = "in_use"
    idle = "idle"
    maintenance = "maintenance"
    retired = "retired"


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(64), nullable=False)
    model: Mapped[str | None] = mapped_column(String(256), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True)
    location: Mapped[str | None] = mapped_column(String(256), nullable=True)
    status: Mapped[AssetStatusEnum] = mapped_column(Enum(AssetStatusEnum), default=AssetStatusEnum.in_use, nullable=False)
    config_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
