from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ExportModule(str, Enum):
    ar_collection = "ar_collection"
    refund_dispute = "refund_dispute"
    processing_record = "processing_record"


class ExportFormat(str, Enum):
    xlsx = "xlsx"
    csv = "csv"


class ExportRequest(BaseModel):
    module: ExportModule
    filters: Optional[dict] = Field(default_factory=dict)
    format: ExportFormat = Field(default=ExportFormat.xlsx)
