import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"
DB_PATH = BASE_DIR / "transfer_orders.duckdb"

MAX_FILE_SIZE = 10 * 1024 * 1024

ALLOWED_FILE_TYPES = {
    "PACKING_PHOTO": [".jpg", ".jpeg", ".png"],
    "RECEIPT": [".pdf", ".jpg", ".jpeg", ".png"],
    "WAYBILL": [".pdf", ".jpg", ".jpeg", ".png"],
}

ATTACHMENT_TYPE_NAMES = {
    "PACKING_PHOTO": "装箱照片",
    "RECEIPT": "签收回执",
    "WAYBILL": "承运单",
}

STATUS_NAMES = {
    "DRAFT": "草稿",
    "PENDING_REVIEW": "待复核",
    "SUPPLEMENT": "待补证",
    "APPROVED": "已通过",
    "REJECTED": "已驳回",
    "SETTLED": "已结算",
}

STATUS_COLORS = {
    "DRAFT": "bg-gray-100 text-gray-700",
    "PENDING_REVIEW": "bg-orange-100 text-orange-700",
    "SUPPLEMENT": "bg-yellow-100 text-yellow-700",
    "APPROVED": "bg-green-100 text-green-700",
    "REJECTED": "bg-red-100 text-red-700",
    "SETTLED": "bg-blue-100 text-blue-700",
}

ROLE_NAMES = {
    "WATCHER": "值班员",
    "SUPERVISOR": "主管",
    "FINANCE": "财务",
}

MOCK_USERS = [
    {"id": "user1", "username": "watcher1", "password": "123456", "role": "WATCHER", "full_name": "张三"},
    {"id": "user2", "username": "supervisor1", "password": "123456", "role": "SUPERVISOR", "full_name": "李主管"},
    {"id": "user3", "username": "finance1", "password": "123456", "role": "FINANCE", "full_name": "王会计"},
]

FINANCE_FIELDS = [
    "order_no", "batch_no", "transfer_date", "from_warehouse", 
    "to_warehouse", "amount", "carrier", "status", "created_at", "reviewed_at"
]
