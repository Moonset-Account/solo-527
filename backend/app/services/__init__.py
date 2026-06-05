from .logging_service import logger

__all__ = ["redis_service", "storage_service", "notification_service", "logger"]

redis_service = None
storage_service = None
notification_service = None

try:
    from .redis_service import redis_service
except ImportError:
    pass

try:
    from .storage_service import storage_service
except ImportError:
    pass

try:
    from .notification_service import notification_service
except ImportError:
    pass
