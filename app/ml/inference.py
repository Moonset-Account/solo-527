import os
import json
import pickle
from typing import List, Dict, Any, Optional, Tuple

import numpy as np
import torch
from sklearn.metrics.pairwise import cosine_similarity

from app.ml.model import TicketClassifier, load_model_artifacts
from app.ml.cleaner import TextCleaner
from app.core.config import settings


class InferenceModel:
    def __init__(
        self,
        model_dir: str,
        device: Optional[str] = None,
        low_conf_threshold: float = settings.LOW_CONFIDENCE_THRESHOLD,
    ):
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = torch.device(device)
        self.model_dir = model_dir
        self.low_conf_threshold = low_conf_threshold
        self.cleaner = TextCleaner()
        self._loaded = False

    def load(self):
        with open(os.path.join(self.model_dir, "config.json"), "r", encoding="utf-8") as f:
            self.config = json.load(f)

        model_name = self.config["model_name"]
        num_classes = self.config["num_classes"]

        self.model, self.tokenizer, self.label_to_id, self.id_to_info, _cfg, self.metrics = \
            load_model_artifacts(self.model_dir, model_name, num_classes, device=str(self.device))

        self.id_to_label = {v: k for k, v in self.label_to_id.items()}
        self.model.to(self.device)
        self.model.eval()
        self.max_seq_length = self.config.get("max_seq_length", settings.MAX_SEQ_LENGTH)
        self._loaded = True
        return self

    @torch.no_grad()
    def predict_single(
        self,
        text: str,
        top_k: int = 3,
    ) -> Dict[str, Any]:
        if not self._loaded:
            self.load()

        cleaned = self.cleaner.clean_text(text)
        input_text = cleaned.normalized if cleaned.normalized else cleaned.cleaned

        encoding = self.tokenizer(
            input_text,
            truncation=True,
            max_length=self.max_seq_length,
            padding=True,
            return_tensors="pt",
        ).to(self.device)

        outputs = self.model(encoding["input_ids"], encoding["attention_mask"])
        logits = outputs["logits"].cpu()
        pooled = outputs["pooled_output"].cpu().numpy()
        probs = torch.softmax(logits, dim=1).numpy()[0]

        top_indices = np.argsort(probs)[::-1][:top_k]

        top_k_results = []
        for idx in top_indices:
            category_db_id = self.id_to_label.get(int(idx), -1)
            code, name = self.id_to_info.get(int(idx), ("UNKNOWN", "未知分类"))
            top_k_results.append({
                "category_id": category_db_id,
                "category_code": code,
                "category_name": name,
                "confidence": float(probs[idx]),
            })

        best = top_k_results[0]
        return {
            "category_id": best["category_id"],
            "category_code": best["category_code"],
            "category_name": best["category_name"],
            "confidence": best["confidence"],
            "top_k": top_k_results,
            "is_low_confidence": best["confidence"] < self.low_conf_threshold,
            "pooled_embedding": pooled[0],
            "cleaned_text": cleaned.cleaned,
        }

    @torch.no_grad()
    def predict_batch(
        self,
        texts: List[str],
        top_k: int = 3,
        batch_size: int = 32,
    ) -> List[Dict[str, Any]]:
        if not self._loaded:
            self.load()

        cleaned_texts = []
        normalized_texts = []
        for t in texts:
            c = self.cleaner.clean_text(t)
            cleaned_texts.append(c)
            normalized_texts.append(c.normalized if c.normalized else c.cleaned)

        all_results = []
        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch_texts = normalized_texts[i:i + batch_size]
            encoding = self.tokenizer(
                batch_texts,
                truncation=True,
                max_length=self.max_seq_length,
                padding=True,
                return_tensors="pt",
            ).to(self.device)

            outputs = self.model(encoding["input_ids"], encoding["attention_mask"])
            logits = outputs["logits"].cpu()
            pooled = outputs["pooled_output"].cpu().numpy()
            all_embeddings.append(pooled)

            probs = torch.softmax(logits, dim=1).numpy()
            for j in range(probs.shape[0]):
                p = probs[j]
                top_indices = np.argsort(p)[::-1][:top_k]
                top_k_results = []
                for idx in top_indices:
                    category_db_id = self.id_to_label.get(int(idx), -1)
                    code, name = self.id_to_info.get(int(idx), ("UNKNOWN", "未知分类"))
                    top_k_results.append({
                        "category_id": category_db_id,
                        "category_code": code,
                        "category_name": name,
                        "confidence": float(p[idx]),
                    })

                best = top_k_results[0]
                all_results.append({
                    "category_id": best["category_id"],
                    "category_code": best["category_code"],
                    "category_name": best["category_name"],
                    "confidence": best["confidence"],
                    "top_k": top_k_results,
                    "is_low_confidence": best["confidence"] < self.low_conf_threshold,
                    "cleaned_text": cleaned_texts[i + j].cleaned,
                })

        all_embeddings_np = np.vstack(all_embeddings) if all_embeddings else np.array([])
        for r, emb in zip(all_results, all_embeddings_np):
            r["pooled_embedding"] = emb

        return all_results


class SimilarCaseRetriever:
    def __init__(self, embedder=None):
        self.case_ids: List[int] = []
        self.case_titles: Dict[int, str] = {}
        self.case_categories: Dict[int, int] = {}
        self.embeddings: Optional[np.ndarray] = None
        self.embedder = embedder

    def build_index(
        self,
        cases: List[Tuple[int, str, str, int]],
    ):
        self.case_ids = []
        self.case_titles = {}
        self.case_categories = {}
        texts = []

        for ticket_id, title, content, category_id in cases:
            self.case_ids.append(ticket_id)
            self.case_titles[ticket_id] = title
            self.case_categories[ticket_id] = category_id
            texts.append(f"{title}\n{content}")

        if self.embedder:
            self.embeddings = self.embedder.encode(texts)
        else:
            from app.ml.model import TicketEmbedder
            from app.core.config import settings
            emb = TicketEmbedder(settings.MODEL_NAME)
            self.embeddings = emb.encode(texts)

        norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self.embeddings = self.embeddings / norms

        return self

    def search(
        self,
        query_embedding: np.ndarray,
        query_category_id: Optional[int] = None,
        top_k: int = 5,
        min_similarity: float = 0.5,
    ) -> List[Dict[str, Any]]:
        if self.embeddings is None or len(self.case_ids) == 0:
            return []

        query_emb = query_embedding.reshape(1, -1)
        query_norm = np.linalg.norm(query_emb)
        if query_norm == 0:
            return []
        query_emb = query_emb / query_norm

        sims = (self.embeddings @ query_emb.T).flatten()
        top_indices = np.argsort(sims)[::-1][:top_k * 2]

        results = []
        for idx in top_indices:
            score = float(sims[idx])
            if score < min_similarity:
                continue
            ticket_id = self.case_ids[idx]
            results.append({
                "ticket_id": ticket_id,
                "title": self.case_titles.get(ticket_id, ""),
                "category_id": self.case_categories.get(ticket_id),
                "similarity_score": score,
                "category_match": (
                    query_category_id == self.case_categories.get(ticket_id)
                    if query_category_id is not None else None
                ),
            })
            if len(results) >= top_k:
                break

        return results

    def search_by_text(
        self,
        query_text: str,
        query_category_id: Optional[int] = None,
        top_k: int = 5,
        min_similarity: float = 0.5,
    ) -> List[Dict[str, Any]]:
        if self.embedder is None:
            return []
        query_emb = self.embedder.encode([query_text])[0]
        return self.search(query_emb, query_category_id, top_k, min_similarity)
