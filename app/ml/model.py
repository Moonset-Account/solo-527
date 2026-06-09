import os
import json
import pickle
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModel


@dataclass
class TrainingSample:
    ticket_id: int
    text: str
    category_id: int
    category_code: str
    category_name: str
    is_error_sample: bool = False
    error_source: Optional[str] = None
    model_version_id: Optional[int] = None


class TicketDataset(Dataset):
    def __init__(
        self,
        samples: List[TrainingSample],
        tokenizer,
        max_length: int = 256,
        label_to_id: Optional[Dict[int, int]] = None,
    ):
        self.samples = samples
        self.tokenizer = tokenizer
        self.max_length = max_length

        if label_to_id is None:
            unique_cats = sorted(set(s.category_id for s in samples))
            self.label_to_id = {cid: idx for idx, cid in enumerate(unique_cats)}
        else:
            self.label_to_id = label_to_id

        self.id_to_label = {v: k for k, v in self.label_to_id.items()}
        self.num_classes = len(self.label_to_id)

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        sample = self.samples[idx]
        encoding = self.tokenizer(
            sample.text,
            truncation=True,
            max_length=self.max_length,
            padding="max_length",
            return_tensors="pt",
        )

        label_idx = self.label_to_id.get(sample.category_id, 0)

        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "labels": torch.tensor(label_idx, dtype=torch.long),
            "ticket_ids": sample.ticket_id,
            "category_ids": sample.category_id,
        }


class TicketClassifier(nn.Module):
    def __init__(
        self,
        model_name: str,
        num_classes: int,
        dropout: float = 0.1,
        freeze_backbone: bool = False,
    ):
        super().__init__()
        self.backbone = AutoModel.from_pretrained(model_name)
        hidden_size = self.backbone.config.hidden_size

        if freeze_backbone:
            for param in self.backbone.parameters():
                param.requires_grad = False

        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(hidden_size, num_classes)
        self.num_classes = num_classes

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor,
        labels: Optional[torch.Tensor] = None,
    ):
        outputs = self.backbone(input_ids=input_ids, attention_mask=attention_mask)
        pooled = outputs.last_hidden_state[:, 0, :]
        pooled = self.dropout(pooled)
        logits = self.classifier(pooled)

        loss = None
        if labels is not None:
            loss_fct = nn.CrossEntropyLoss(label_smoothing=0.05)
            loss = loss_fct(logits.view(-1, self.num_classes), labels.view(-1))

        return {"logits": logits, "loss": loss, "pooled_output": pooled}


class TicketEmbedder:
    def __init__(self, model_name: str, device: str = "cpu"):
        self.device = torch.device(device)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name).to(self.device)
        self.model.eval()
        self.model_name = model_name

    @torch.no_grad()
    def encode(
        self,
        texts: List[str],
        max_length: int = 256,
        batch_size: int = 32,
        use_cls: bool = True,
    ) -> np.ndarray:
        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            encoding = self.tokenizer(
                batch_texts,
                truncation=True,
                max_length=max_length,
                padding=True,
                return_tensors="pt",
            ).to(self.device)

            outputs = self.model(**encoding)
            if use_cls:
                emb = outputs.last_hidden_state[:, 0, :]
            else:
                mask = encoding["attention_mask"].unsqueeze(-1).float()
                emb = (outputs.last_hidden_state * mask).sum(1) / mask.sum(1).clamp(min=1e-9)

            all_embeddings.append(emb.cpu().numpy())

        return np.vstack(all_embeddings) if all_embeddings else np.array([])


def build_label_mappings(
    categories: List[Tuple[int, str, str]]
) -> Tuple[Dict[int, int], Dict[int, int], Dict[int, Tuple[str, str]]]:
    sorted_cats = sorted(categories, key=lambda x: x[0])
    label_to_id = {cid: idx for idx, (cid, _, _) in enumerate(sorted_cats)}
    id_to_label = {v: k for k, v in label_to_id.items()}
    id_to_info = {idx: (code, name) for idx, (cid, code, name) in enumerate(sorted_cats)}
    return label_to_id, id_to_label, id_to_info


def split_dataset(
    samples: List[TrainingSample],
    train_ratio: float = 0.8,
    val_ratio: float = 0.1,
    test_ratio: float = 0.1,
    stratify: bool = True,
    random_state: int = 42,
) -> Tuple[List[TrainingSample], List[TrainingSample], List[TrainingSample]]:
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6
    np.random.seed(random_state)

    samples = list(samples)
    np.random.shuffle(samples)

    if not stratify:
        n = len(samples)
        n_train = int(n * train_ratio)
        n_val = int(n * val_ratio)
        return samples[:n_train], samples[n_train:n_train + n_val], samples[n_train + n_val:]

    from collections import defaultdict
    by_cat = defaultdict(list)
    for s in samples:
        by_cat[s.category_id].append(s)

    train, val, test = [], [], []
    for cat_id, cat_samples in by_cat.items():
        n = len(cat_samples)
        if n < 3:
            n_train = max(1, int(n * train_ratio))
            train.extend(cat_samples[:n_train])
            val.extend(cat_samples[n_train:n_train + 1])
            test.extend(cat_samples[n_train + 1:])
            continue

        n_train = int(n * train_ratio)
        n_val = int(n * val_ratio)
        train.extend(cat_samples[:n_train])
        val.extend(cat_samples[n_train:n_train + n_val])
        test.extend(cat_samples[n_train + n_val:])

    for lst in [train, val, test]:
        np.random.shuffle(lst)

    return train, val, test


def save_model_artifacts(
    model: nn.Module,
    tokenizer,
    save_dir: str,
    label_to_id: Dict[int, int],
    id_to_info: Dict[int, Tuple[str, str]],
    config: Dict[str, Any],
    metrics: Dict[str, Any],
):
    os.makedirs(save_dir, exist_ok=True)

    model_path = os.path.join(save_dir, "model.pt")
    torch.save(model.state_dict(), model_path)

    tokenizer.save_pretrained(os.path.join(save_dir, "tokenizer"))

    with open(os.path.join(save_dir, "label_mappings.pkl"), "wb") as f:
        pickle.dump({"label_to_id": label_to_id, "id_to_info": id_to_info}, f)

    with open(os.path.join(save_dir, "config.json"), "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

    with open(os.path.join(save_dir, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)


def load_model_artifacts(save_dir: str, model_name: str, num_classes: int, device: str = "cpu"):
    import pickle

    device = torch.device(device)

    with open(os.path.join(save_dir, "label_mappings.pkl"), "rb") as f:
        mappings = pickle.load(f)

    with open(os.path.join(save_dir, "config.json"), "r", encoding="utf-8") as f:
        config = json.load(f)

    with open(os.path.join(save_dir, "metrics.json"), "r", encoding="utf-8") as f:
        metrics = json.load(f)

    tokenizer = AutoTokenizer.from_pretrained(os.path.join(save_dir, "tokenizer"))

    model = TicketClassifier(model_name, num_classes).to(device)
    state_dict = torch.load(os.path.join(save_dir, "model.pt"), map_location=device)
    model.load_state_dict(state_dict)
    model.eval()

    return model, tokenizer, mappings["label_to_id"], mappings["id_to_info"], config, metrics
