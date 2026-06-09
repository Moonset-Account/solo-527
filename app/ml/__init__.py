__all__ = [
    "TextCleaner", "CleanedText", "remove_near_duplicates", "detect_language",
    "TicketDataset", "TicketClassifier", "TicketEmbedder", "TrainingSample",
    "split_dataset", "build_label_mappings", "save_model_artifacts", "load_model_artifacts",
    "TrainingConfig", "run_training", "compute_metrics",
    "InferenceModel", "SimilarCaseRetriever",
]


def __getattr__(name):
    if name in ("TextCleaner", "CleanedText", "remove_near_duplicates", "detect_language"):
        from app.ml import cleaner as _cleaner
        return getattr(_cleaner, name)
    if name in (
        "TicketDataset", "TicketClassifier", "TicketEmbedder", "TrainingSample",
        "split_dataset", "build_label_mappings", "save_model_artifacts", "load_model_artifacts",
    ):
        from app.ml import model as _model
        return getattr(_model, name)
    if name in ("TrainingConfig", "run_training", "compute_metrics"):
        from app.ml import trainer as _trainer
        return getattr(_trainer, name)
    if name in ("InferenceModel", "SimilarCaseRetriever"):
        from app.ml import inference as _inference
        return getattr(_inference, name)
    raise AttributeError(f"module 'app.ml' has no attribute {name!r}")
