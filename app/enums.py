import enum


class SeatStatus(str, enum.Enum):
    AVAILABLE = "available"
    LOCKED = "locked"
    SOLD = "sold"
    REFUNDED = "refunded"
    RESERVED = "reserved"
    BLOCKED = "blocked"


class SeatArea(str, enum.Enum):
    VIP = "vip"
    FRONT = "front"
    MIDDLE = "middle"
    BACK = "back"
    STANDING = "standing"


class TicketType(str, enum.Enum):
    SINGLE = "single"
    COUPLE = "couple"
    GROUP = "group"
    VIP = "vip"
    EARLY_BIRD = "early_bird"
    STUDENT = "student"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PAID = "paid"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUND_PENDING = "refund_pending"
    REFUNDED = "refunded"
    REFUND_REJECTED = "refund_rejected"


class RefundStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    FAILED = "failed"


class RegistrationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class EventStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    SOLD_OUT = "sold_out"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class ConfigStatus(str, enum.Enum):
    DRAFT = "draft"
    ENABLED = "enabled"
    DISABLED = "disabled"


class PaymentMethod(str, enum.Enum):
    ALIPAY = "alipay"
    WECHAT = "wechat"
    CARD = "card"
    BANK = "bank"
    CASH = "cash"
    FREE = "free"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    FINANCE = "finance"
    AUDITOR = "auditor"
    USER = "user"
