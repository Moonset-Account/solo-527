import os
import json
import time
from typing import Dict, Any, Optional, List, Callable, Tuple
from dataclasses import dataclass
from datetime import datetime

import numpy as np
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.utils.data import DataLoader
from transformers import get_linear_schedule_with_warmup
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support, confusion_matrix,
    classification_report,
)

from app.ml.model import (
    TicketDataset, TicketClassifier, TrainingSample,
    split_dataset, save_model_artifacts, build_label_mappings,
)
from app.core.config import settings


@dataclass
class TrainingConfig:
    model_name: str = settings.MODEL_NAME
    max_seq_length: int = settings.MAX_SEQ_LENGTH
    train_batch_size: int = settings.TRAIN_BATCH_SIZE
    eval_batch_size: int = settings.EVAL_BATCH_SIZE
    num_epochs: int = settings.NUM_EPOCHS
    learning_rate: float = settings.LEARNING_RATE
    warmup_ratio: float = settings.WARMUP_RATIO
    weight_decay: float = 0.01
    max_grad_norm: float = 1.0
    gradient_accumulation_steps: int = 1
    early_stopping_patience: int = 3
    dropout: float = 0.1
    seed: int = 42
    device: str = "cuda" if torch.cuda.is_available() else "cpu"


ProgressCallback = Optional[Callable[[str, float, Optional[str]], None]]


def set_seed(seed: int):
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def compute_metrics(
    y_true: List[int],
    y_pred: List[int],
    id_to_label: Dict[int, int],
    id_to_info: Dict[int, Tuple[str, str]],
    num_classes: int,
) -> Dict[str, Any]:
    y_true_orig = [id_to_label.get(y, y) for y in y_true]
    y_pred_orig = [id_to_label.get(y, y) for y in y_pred]

    labels_present = sorted(set(y_true_orig) | set(y_pred_orig))

    precision, recall, f1, support = precision_recall_fscore_support(
        y_true_orig, y_pred_orig, labels=labels_present, average=None, zero_division=0,
    )
    precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(
        y_true_orig, y_pred_orig, average="macro", zero_division=0,
    )
    accuracy = accuracy_score(y_true_orig, y_pred_orig)

    per_class = []
    for i, label in enumerate(labels_present):
        info = id_to_info.get(i, ("UNKNOWN", "未知"))
        per_class.append({
            "category_id": label,
            "category_code": info[0],
            "category_name": info[1],
            "precision": float(precision[i]),
            "recall": float(recall[i]),
            "f1": float(f1[i]),
            "support": int(support[i]),
        })

    cm_labels = labels_present
    cm_values = confusion_matrix(y_true_orig, y_pred_orig, labels=cm_labels).tolist()

    return {
        "accuracy": float(accuracy),
        "precision_macro": float(precision_macro),
        "recall_macro": float(recall_macro),
        "f1_macro": float(f1_macro),
        "per_class": per_class,
        "confusion_matrix": {
            "labels": cm_labels,
            "values": cm_values,
        },
    }


def run_training(
    samples: List[TrainingSample],
    categories: List[Tuple[int, str, str]],
    save_dir: str,
    config: Optional[TrainingConfig] = None,
    progress_cb: ProgressCallback = None,
    include_error_samples: bool = True,
    error_source_filter: Optional[List[str]] = None,
) -> Dict[str, Any]:
    cfg = config or TrainingConfig()
    set_seed(cfg.seed)

    if error_source_filter:
        samples = [
            s for s in samples
            if not s.is_error_sample or (s.error_source and s.error_source in error_source_filter)
        ]
    elif not include_error_samples:
        samples = [s for s in samples if not s.is_error_sample]

    used_cats = set(s.category_id for s in samples)
    categories_filtered = [c for c in categories if c[0] in used_cats]

    label_to_id, id_to_label, id_to_info = build_label_mappings(categories_filtered)
    num_classes = len(label_to_id)

    error_sample_count = sum(1 for s in samples if s.is_error_sample)

    if progress_cb:
        progress_cb("正在划分数据集", 0.02, None)

    train_samples, val_samples, test_samples = split_dataset(samples)

    from transformers import AutoTokenizer
    tokenizer = AutoTokenizer.from_pretrained(cfg.model_name)

    train_ds = TicketDataset(train_samples, tokenizer, cfg.max_seq_length, label_to_id)
    val_ds = TicketDataset(val_samples, tokenizer, cfg.max_seq_length, label_to_id)
    test_ds = TicketDataset(test_samples, tokenizer, cfg.max_seq_length, label_to_id)

    train_loader = DataLoader(
        train_ds, batch_size=cfg.train_batch_size, shuffle=True, num_workers=0,
    )
    val_loader = DataLoader(
        val_ds, batch_size=cfg.eval_batch_size, shuffle=False, num_workers=0,
    )
    test_loader = DataLoader(
        test_ds, batch_size=cfg.eval_batch_size, shuffle=False, num_workers=0,
    )

    device = torch.device(cfg.device)
    model = TicketClassifier(cfg.model_name, num_classes, dropout=cfg.dropout).to(device)

    no_decay = ["bias", "LayerNorm.weight"]
    optimizer_grouped_parameters = [
        {
            "params": [p for n, p in model.named_parameters() if not any(nd in n for nd in no_decay)],
            "weight_decay": cfg.weight_decay,
        },
        {
            "params": [p for n, p in model.named_parameters() if any(nd in n for nd in no_decay)],
            "weight_decay": 0.0,
        },
    ]
    optimizer = AdamW(optimizer_grouped_parameters, lr=cfg.learning_rate)

    total_steps = len(train_loader) * cfg.num_epochs // cfg.gradient_accumulation_steps
    warmup_steps = int(total_steps * cfg.warmup_ratio)
    scheduler = get_linear_schedule_with_warmup(
        optimizer, num_warmup_steps=warmup_steps, num_training_steps=total_steps,
    )

    best_val_f1 = -1.0
    epochs_no_improve = 0
    best_state = None
    history = []
    global_step = 0

    if progress_cb:
        progress_cb(
            f"开始训练，训练集{len(train_samples)} 验证集{len(val_samples)} 测试集{len(test_samples)}",
            0.05, None,
        )

    for epoch in range(cfg.num_epochs):
        model.train()
        train_loss = 0.0
        train_preds, train_labels = [], []

        for step, batch in enumerate(train_loader):
            batch = {k: v.to(device) if isinstance(v, torch.Tensor) else v for k, v in batch.items()}
            outputs = model(batch["input_ids"], batch["attention_mask"], batch["labels"])
            loss = outputs["loss"] / cfg.gradient_accumulation_steps
            loss.backward()

            train_loss += loss.item() * cfg.gradient_accumulation_steps
            logits = outputs["logits"].detach().cpu().numpy()
            train_preds.extend(np.argmax(logits, axis=1).tolist())
            train_labels.extend(batch["labels"].cpu().tolist())

            if (step + 1) % cfg.gradient_accumulation_steps == 0:
                nn.utils.clip_grad_norm_(model.parameters(), cfg.max_grad_norm)
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()
                global_step += 1

            if progress_cb and (step % 50 == 0):
                pct = 0.05 + 0.80 * (
                    (epoch * len(train_loader) + step) / (cfg.num_epochs * len(train_loader))
                )
                progress_cb(f"Epoch {epoch + 1}/{cfg.num_epochs} Step {step}", min(pct, 0.85), None)

        avg_train_loss = train_loss / len(train_loader)
        train_metrics = compute_metrics(
            train_labels, train_preds, id_to_label, id_to_info, num_classes,
        )

        if progress_cb:
            progress_cb(f"Epoch {epoch + 1} 训练完成，开始验证", min(0.05 + 0.80 * (epoch + 1) / cfg.num_epochs, 0.90), None)

        model.eval()
        val_loss = 0.0
        val_preds, val_labels = [], []

        with torch.no_grad():
            for batch in val_loader:
                batch = {k: v.to(device) if isinstance(v, torch.Tensor) else v for k, v in batch.items()}
                outputs = model(batch["input_ids"], batch["attention_mask"], batch["labels"])
                val_loss += outputs["loss"].item() if outputs["loss"] is not None else 0.0
                logits = outputs["logits"].cpu().numpy()
                val_preds.extend(np.argmax(logits, axis=1).tolist())
                val_labels.extend(batch["labels"].cpu().tolist())

        avg_val_loss = val_loss / len(val_loader) if len(val_loader) > 0 else 0.0
        val_metrics = compute_metrics(
            val_labels, val_preds, id_to_label, id_to_info, num_classes,
        )

        history.append({
            "epoch": epoch + 1,
            "train_loss": avg_train_loss,
            "train_accuracy": train_metrics["accuracy"],
            "train_f1_macro": train_metrics["f1_macro"],
            "val_loss": avg_val_loss,
            "val_accuracy": val_metrics["accuracy"],
            "val_f1_macro": val_metrics["f1_macro"],
        })

        if val_metrics["f1_macro"] > best_val_f1:
            best_val_f1 = val_metrics["f1_macro"]
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            epochs_no_improve = 0
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= cfg.early_stopping_patience:
                if progress_cb:
                    progress_cb(f"早停触发，{cfg.early_stopping_patience}轮未提升", 0.92, None)
                break

    if best_state is not None:
        model.load_state_dict(best_state)

    if progress_cb:
        progress_cb("开始测试集评估", 0.93, None)

    model.eval()
    test_preds, test_labels, test_confs = [], [], []
    with torch.no_grad():
        for batch in test_loader:
            batch = {k: v.to(device) if isinstance(v, torch.Tensor) else v for k, v in batch.items()}
            outputs = model(batch["input_ids"], batch["attention_mask"])
            logits = outputs["logits"].cpu()
            probs = torch.softmax(logits, dim=1).numpy()
            preds = np.argmax(probs, axis=1)
            test_preds.extend(preds.tolist())
            test_labels.extend(batch["labels"].cpu().tolist())
            test_confs.extend(np.max(probs, axis=1).tolist())

    test_metrics = compute_metrics(
        test_labels, test_preds, id_to_label, id_to_info, num_classes,
    )

    low_conf_count = sum(1 for c in test_confs if c < settings.LOW_CONFIDENCE_THRESHOLD)
    low_conf_ratio = low_conf_count / len(test_confs) if test_confs else 0.0
    test_metrics["low_confidence_ratio"] = float(low_conf_ratio)
    test_metrics["average_confidence"] = float(np.mean(test_confs)) if test_confs else 0.0

    os.makedirs(save_dir, exist_ok=True)

    model_config = {
        "model_name": cfg.model_name,
        "num_classes": num_classes,
        "max_seq_length": cfg.max_seq_length,
        "dropout": cfg.dropout,
        "trained_at": datetime.utcnow().isoformat(),
        "error_sample_count": error_sample_count,
        "error_source_filter": error_source_filter,
        "train_config": {
            k: v for k, v in cfg.__dict__.items() if not k.startswith("_") and k != "device"
        },
    }

    full_metrics = {
        "history": history,
        "test": test_metrics,
        "validation": val_metrics,
        "training": {
            "accuracy": train_metrics["accuracy"],
            "f1_macro": train_metrics["f1_macro"],
            "loss": avg_train_loss,
        },
        "dataset_sizes": {
            "train": len(train_samples),
            "validation": len(val_samples),
            "test": len(test_samples),
            "total": len(samples),
            "error_samples": error_sample_count,
        },
    }

    save_model_artifacts(
        model=model.cpu(),
        tokenizer=tokenizer,
        save_dir=save_dir,
        label_to_id=label_to_id,
        id_to_info=id_to_info,
        config=model_config,
        metrics=full_metrics,
    )

    if progress_cb:
        progress_cb("训练完成", 1.0, None)

    return full_metrics
