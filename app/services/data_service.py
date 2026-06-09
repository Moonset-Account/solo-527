from __future__ import annotations

import os
import json
import hashlib
import logging
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from io import BytesIO

from sqlalchemy.orm import Session

from app.data.models import (
    DataSource, Document, DocumentStatus, ReviewAction, DatasetVersion
)
from app.repositories.data_repo import (
    DataSourceRepository, DocumentRepository, ReviewRepository, DatasetVersionRepository
)
from app.schemas.data import (
    DataSourceCreate, DataSourceUpdate, DocumentCreate, DocumentUpdate,
    DocumentBatchCreate, DocumentReviewCreate, DatasetVersionCreate, CleaningReport
)
from app.services.cleaning_service import DataCleaningService

logger = logging.getLogger(__name__)


class DataManagementService:
    def __init__(self, db: Session):
        self.db = db
        self.ds_repo = DataSourceRepository(db)
        self.doc_repo = DocumentRepository(db)
        self.review_repo = ReviewRepository(db)
        self.dv_repo = DatasetVersionRepository(db)
        self.cleaning_svc = DataCleaningService()

    # === DataSource ===
    def create_data_source(self, obj_in: DataSourceCreate, created_by: Optional[str] = None) -> DataSource:
        data = obj_in.model_dump()
        if created_by:
            data["created_by"] = created_by
        return self.ds_repo.create(data)

    def list_data_sources(self, page: int = 1, page_size: int = 20, **filters) -> Tuple[List[DataSource], int]:
        return self.ds_repo.list(page=page, page_size=page_size, **filters)

    def get_data_source(self, obj_id: int) -> Optional[DataSource]:
        return self.ds_repo.get(obj_id)

    def update_data_source(self, obj_id: int, obj_in: DataSourceUpdate) -> Optional[DataSource]:
        data = obj_in.model_dump(exclude_unset=True)
        return self.ds_repo.update(obj_id, data)

    def delete_data_source(self, obj_id: int) -> bool:
        return self.ds_repo.delete(obj_id)

    # === Documents ===
    def create_document(self, obj_in: DocumentCreate) -> Document:
        data = obj_in.model_dump(exclude={"content_hash"})
        content = data.get("content", "")
        data["content_hash"] = self.cleaning_svc.compute_hash(content)
        data.setdefault("status", DocumentStatus.RAW)
        data.setdefault("metadata_", data.pop("metadata", None))
        return self.doc_repo.create(data)

    def batch_create_documents(self, obj_in: DocumentBatchCreate) -> List[Document]:
        data_source_id = obj_in.data_source_id
        ds = self.ds_repo.get(data_source_id)
        if not ds:
            raise ValueError(f"DataSource {data_source_id} not found")
        data_list = []
        for doc in obj_in.documents:
            d = doc.model_dump(exclude={"content_hash", "data_source_id"})
            d["content_hash"] = self.cleaning_svc.compute_hash(d.get("content", ""))
            d["data_source_id"] = data_source_id
            d.setdefault("status", DocumentStatus.RAW)
            d["metadata_"] = d.pop("metadata", None)
            data_list.append(d)
        return self.doc_repo.bulk_create(data_list)

    def list_documents(self, page: int = 1, page_size: int = 20, **filters) -> Tuple[List[Document], int]:
        return self.doc_repo.list(page=page, page_size=page_size, **filters)

    def get_document(self, obj_id: int) -> Optional[Document]:
        return self.doc_repo.get(obj_id)

    def update_document(self, obj_id: int, obj_in: DocumentUpdate) -> Optional[Document]:
        data = obj_in.model_dump(exclude_unset=True)
        if "metadata" in data:
            data["metadata_"] = data.pop("metadata")
        return self.doc_repo.update(obj_id, data)

    def get_document_stats(self, data_source_id: Optional[int] = None) -> Dict[str, int]:
        return self.doc_repo.count_by_status(data_source_id=data_source_id)

    # === Cleaning Pipeline ===
    def clean_documents(self, data_source_id: Optional[int] = None,
                        document_ids: Optional[List[int]] = None,
                        auto_approve_threshold: float = 0.7) -> CleaningReport:
        report = CleaningReport()
        existing_hashes = set()

        if document_ids:
            docs = [self.doc_repo.get(i) for i in document_ids]
            docs = [d for d in docs if d is not None]
        else:
            filters = {"status": DocumentStatus.RAW}
            if data_source_id:
                filters["data_source_id"] = data_source_id
            all_docs, _ = self.doc_repo.list(page=1, page_size=100000, **filters)
            docs = all_docs

        report.total_documents = len(docs)
        score_sum = 0.0

        for doc in docs:
            result = self.cleaning_svc.clean_document(doc.content, existing_hashes)
            score_sum += result.score
            for issue in result.issues:
                report.quality_issues[issue] = report.quality_issues.get(issue, 0) + 1

            if result.should_reject:
                report.failed_documents += 1
                self.doc_repo.update_status(
                    doc.id, DocumentStatus.ERROR,
                    extra={
                        "cleaning_score": result.score,
                        "cleaning_notes": result.notes,
                        "error_message": result.notes or "清洗失败",
                    }
                )
                continue

            existing_hashes.add(self.cleaning_svc.compute_hash(result.cleaned_content))

            new_status = (
                DocumentStatus.APPROVED
                if result.score >= auto_approve_threshold
                else DocumentStatus.PENDING_REVIEW
            )
            self.doc_repo.update_status(
                doc.id, new_status,
                extra={
                    "content": result.cleaned_content,
                    "content_hash": self.cleaning_svc.compute_hash(result.cleaned_content),
                    "cleaning_score": result.score,
                    "cleaning_notes": result.notes,
                }
            )
            report.cleaned_documents += 1

        report.skipped_documents = max(0, report.total_documents - report.cleaned_documents - report.failed_documents)
        if report.cleaned_documents > 0:
            report.average_score = score_sum / report.total_documents if report.total_documents > 0 else None
        return report

    # === Review ===
    def review_document(self, document_id: int, obj_in: DocumentReviewCreate,
                        reviewer: str) -> Optional[Document]:
        doc = self.doc_repo.get(document_id)
        if not doc:
            return None
        review_data = obj_in.model_dump()
        review_data["document_id"] = document_id
        review_data["reviewer"] = reviewer
        self.review_repo.create(review_data)

        if obj_in.action == ReviewAction.APPROVE:
            new_status = DocumentStatus.APPROVED
        elif obj_in.action == ReviewAction.REJECT:
            new_status = DocumentStatus.REJECTED
        else:
            new_status = DocumentStatus.PENDING_REVIEW

        self.doc_repo.update_status(document_id, new_status)
        return self.doc_repo.get(document_id)

    def list_reviews(self, document_id: int):
        return self.review_repo.list_by_document(document_id)

    # === Dataset Versioning ===
    def create_dataset_version(self, obj_in: DatasetVersionCreate,
                               created_by: Optional[str] = None) -> DatasetVersion:
        ds = self.ds_repo.get(obj_in.data_source_id)
        if not ds:
            raise ValueError(f"DataSource {obj_in.data_source_id} not found")

        approved_docs, _ = self.doc_repo.list(
            page=1, page_size=100000,
            data_source_id=obj_in.data_source_id,
            status=DocumentStatus.APPROVED,
        )
        doc_ids = sorted([d.id for d in approved_docs])
        checksum = hashlib.sha256(
            (obj_in.version_tag + "|" + ",".join(map(str, doc_ids))).encode()
        ).hexdigest()

        version_tag = obj_in.version_tag
        existing = self.dv_repo.get_by_tag(version_tag, obj_in.data_source_id)
        if existing:
            raise ValueError(f"Dataset version {version_tag} already exists for this data source")

        data = {
            "data_source_id": obj_in.data_source_id,
            "version_tag": version_tag,
            "description": obj_in.description,
            "document_count": len(doc_ids),
            "checksum": checksum,
            "storage_path": os.path.join("datasets", str(obj_in.data_source_id), version_tag),
            "created_by": created_by,
        }
        dv = self.dv_repo.create(data)

        for doc in approved_docs:
            self.doc_repo.update(doc.id, {"data_version": version_tag})
        return dv

    def list_dataset_versions(self, page: int = 1, page_size: int = 20,
                              data_source_id: Optional[int] = None) -> Tuple[List[DatasetVersion], int]:
        return self.dv_repo.list(page=page, page_size=page_size, data_source_id=data_source_id)

    def get_dataset_version(self, obj_id: int) -> Optional[DatasetVersion]:
        return self.dv_repo.get(obj_id)
