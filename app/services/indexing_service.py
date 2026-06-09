from __future__ import annotations

import os
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple

from sqlalchemy.orm import Session

from app.data.models import (
    ModelVersion, IndexJob, Document, DocumentStatus, ModelStatus
)
from app.repositories.system_repo import (
    ModelVersionRepository, IndexJobRepository, IndexRecordRepository
)
from app.repositories.data_repo import DocumentRepository, DatasetVersionRepository
from app.schemas.model import ModelVersionCreate
from app.engines.rag_engine import IndexBuilder, QueryEngine, IndexedDocument

logger = logging.getLogger(__name__)


class IndexingService:
    """索引管理服务：管理模型版本、触发索引构建（训练）。"""

    def __init__(self, db: Session):
        self.db = db
        self.model_repo = ModelVersionRepository(db)
        self.job_repo = IndexJobRepository(db)
        self.record_repo = IndexRecordRepository(db)
        self.doc_repo = DocumentRepository(db)
        self.dv_repo = DatasetVersionRepository(db)
        self.index_builder = IndexBuilder()

    def create_model_version(self, obj_in: ModelVersionCreate,
                             created_by: Optional[str] = None) -> ModelVersion:
        tag = obj_in.version_tag
        existing = self.model_repo.get_by_tag(tag)
        if existing:
            raise ValueError(f"Model version {tag} already exists")
        data = obj_in.model_dump()
        data["created_by"] = created_by
        data.setdefault("status", ModelStatus.READY)
        return self.model_repo.create(data)

    def list_model_versions(self, page: int = 1, page_size: int = 20,
                            status: Optional[ModelStatus] = None) -> Tuple[List[ModelVersion], int]:
        return self.model_repo.list(page=page, page_size=page_size, status=status)

    def get_model_version(self, obj_id: Optional[int] = None,
                          version_tag: Optional[str] = None) -> Optional[ModelVersion]:
        if version_tag:
            return self.model_repo.get_by_tag(version_tag)
        if obj_id:
            return self.model_repo.get(obj_id)
        return self.model_repo.get_default()

    def get_default_model_version(self) -> Optional[ModelVersion]:
        return self.model_repo.get_default()

    def set_default_model(self, version_tag: str) -> Optional[ModelVersion]:
        mv = self.model_repo.get_by_tag(version_tag)
        if not mv:
            raise ValueError(f"Model version {version_tag} not found")
        if mv.status != ModelStatus.READY:
            raise ValueError(f"Model version {version_tag} is not ready")
        return self.model_repo.set_default(version_tag)

    def update_model_status(self, obj_id: int, status: ModelStatus) -> Optional[ModelVersion]:
        return self.model_repo.update_status(obj_id, status)

    def _collect_documents(self, data_source_id: Optional[int] = None,
                           data_version: Optional[str] = None) -> List[IndexedDocument]:
        docs = self.doc_repo.list_for_indexing(
            data_source_id=data_source_id,
            data_version=data_version,
        )
        indexed: List[IndexedDocument] = []
        for d in docs:
            if not d.content or not d.content.strip():
                continue
            metadata = d.metadata_ or {}
            metadata["data_source_id"] = d.data_source_id
            metadata["doc_status"] = d.status.value
            indexed.append(IndexedDocument(
                doc_id=d.id,
                title=d.title,
                file_path=d.file_path,
                source_url=d.source_url,
                line_start=d.line_start,
                line_end=d.line_end,
                content=d.content,
                metadata=metadata,
                language=d.language,
                data_version=d.data_version,
            ))
        return indexed

    def start_index_build(self, model_version_tag: str,
                          dataset_version_id: Optional[int] = None,
                          data_source_id: Optional[int] = None,
                          data_version: Optional[str] = None) -> IndexJob:
        mv = self.model_repo.get_by_tag(model_version_tag)
        if not mv:
            raise ValueError(f"Model version {model_version_tag} not found")

        dv = None
        if dataset_version_id:
            dv = self.dv_repo.get(dataset_version_id)
            if not dv:
                raise ValueError(f"Dataset version {dataset_version_id} not found")

        docs_for_index = self._collect_documents(
            data_source_id=(dv.data_source_id if dv else data_source_id),
            data_version=(dv.version_tag if dv else data_version),
        )

        job = self.job_repo.create({
            "model_version_id": mv.id,
            "dataset_version_id": dv.id if dv else (dataset_version_id or 0),
            "status": "running",
            "document_count": len(docs_for_index),
            "indexed_count": 0,
            "failed_count": 0,
            "started_at": datetime.utcnow(),
            "config": {
                "data_source_id": dv.data_source_id if dv else data_source_id,
                "data_version": dv.version_tag if dv else data_version,
                "embedding_model": mv.embedding_model,
            },
        })

        try:
            build_result, node_records = self.index_builder.build_index(
                documents=docs_for_index,
                model_version=model_version_tag,
            )

            records_data = []
            for node_id, doc_id, chunk_idx in node_records:
                records_data.append({
                    "document_id": doc_id,
                    "node_id": node_id,
                    "index_version": model_version_tag,
                    "chunk_index": chunk_idx,
                    "chunk_size": 0,
                    "embedding_status": "done",
                })
            self.record_repo.bulk_create(records_data)

            doc_ids_to_mark = list({r["document_id"] for r in records_data})
            for did in doc_ids_to_mark:
                self.doc_repo.update_status(did, DocumentStatus.INDEXED)

            self.job_repo.update(job.id, {
                "status": "completed" if build_result.failed_count == 0 else "partial",
                "indexed_count": build_result.indexed_count,
                "failed_count": build_result.failed_count,
                "finished_at": build_result.finished_at or datetime.utcnow(),
                "error_message": "; ".join(build_result.error_messages) if build_result.error_messages else None,
            })

            if mv.status == ModelStatus.TRAINING:
                self.model_repo.update_status(mv.id, ModelStatus.READY)
            QueryEngine.clear_cache(model_version_tag)

        except Exception as e:
            logger.exception("Index build failed in service")
            self.job_repo.update(job.id, {
                "status": "failed",
                "finished_at": datetime.utcnow(),
                "error_message": str(e),
            })

        return self.job_repo.get(job.id)

    def list_index_jobs(self, page: int = 1, page_size: int = 20,
                        model_version_id: Optional[int] = None,
                        status: Optional[str] = None) -> Tuple[List[IndexJob], int]:
        return self.job_repo.list(page=page, page_size=page_size,
                                   model_version_id=model_version_id, status=status)

    def get_index_job(self, job_id: int) -> Optional[IndexJob]:
        return self.job_repo.get(job_id)
