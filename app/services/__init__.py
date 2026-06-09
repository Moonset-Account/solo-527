__all__ = [
    "CategoryService", "TicketService", "AnnotationService", "ErrorSampleService",
    "TrainingService", "ModelVersionService",
    "InferenceService", "StatsService",
]


def __getattr__(name):
    if name in ("CategoryService", "TicketService", "AnnotationService", "ErrorSampleService"):
        from app.services import ticket_service as _ts
        return getattr(_ts, name)
    if name in ("TrainingService", "ModelVersionService"):
        from app.services import ml_service as _mls
        return getattr(_mls, name)
    if name in ("InferenceService", "StatsService"):
        from app.services import inference_service as _is
        return getattr(_is, name)
    raise AttributeError(f"module 'app.services' has no attribute {name!r}")
