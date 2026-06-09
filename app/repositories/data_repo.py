from __future__ import annotations

from typing import List, Optional, Tuple, Any, Dict

from sqlalchemy import select, func, update, delete
from sqlalchemy.orm import Session

from app.data.models import (
    DataSource, Document, DocumentReview, DatasetVersion,
    ModelVersion, IndexJob, IndexRecord, QAConversation,
    Citation, QAFeedback, ErrorSample, AuditLog, ApiCallLog
)
from app.data.models import (
    DataSourceType, DocumentStatus, ReviewAction, ConfidenceLevel,
    FeedbackType, ModelStatus
)


class BaseRepository:
    def __init__(self, db: Session):
        self.db = db

    def _paginate(self, stmt, page: int, page_size: int) -> Tuple[List[Any], int]:
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        items = self.db.execute(stmt).scalars().all()
        return list(items), total


class DataSourceRepository(BaseRepository):
    def create(self, obj_in: dict) -> DataSource:
        db_obj = DataSource(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get(self, obj_id: int) -> Optional[DataSource]:
        return self.db.get(DataSource, obj_id)

    def list(self, page: int = 1, page_size: int = 20,
             source_type: Optional[DataSourceType] = None,
             is_active: Optional[bool] = None) -> Tuple[List[DataSource], int]:
        stmt = select(DataSource)
        if source_type:
            stmt = stmt.where(DataSource.source_type == source_type)
        if is_active is not None:
            stmt = stmt.where(DataSource.is_active == is_active)
        stmt = stmt.order_by(DataSource.created_at.desc())
        return self._paginate(stmt, page, page_size)

    def update(self, obj_id: int, obj_in: dict) -> Optional[DataSource]:
        stmt = (update(DataSource).where(DataSource.id == obj_id)
                .values(**obj_in).execution_options(synchronize_session="fetch"))
        self.db.execute(stmt)
        self.db.commit()
        return self.get(obj_id)

    def delete(self, obj_id: int) -> bool:
        stmt = delete(DataSource).where(DataSource.id == obj_id)
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount > 0


class DocumentRepository(BaseRepository):
    def create(self, obj_in: dict) -> Document:
        db_obj = Document(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def bulk_create(self, objects_in: List[dict]) -> List[Document]:
        db_objs = [Document(**obj) for obj in objects_in]
        self.db.add_all(db_objs)
        self.db.commit()
        for obj in db_objs:
            self.db.refresh(obj)
        return db_objs

    def get(self, obj_id: int) -> Optional[Document]:
        return self.db.get(Document, obj_id)

    def get_by_hash(self, content_hash: str) -> Optional[Document]:
        stmt = select(Document).where(Document.content_hash == content_hash)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(self, page: int = 1, page_size: int = 20,
             data_source_id: Optional[int] = None,
             status: Optional[DocumentStatus] = None,
             data_version: Optional[str] = None) -> Tuple[List[Document], int]:
        stmt = select(Document)
        if data_source_id:
            stmt = stmt.where(Document.data_source_id == data_source_id)
        if status:
            stmt = stmt.where(Document.status == status)
        if data_version:
            stmt = stmt.where(Document.data_version == data_version)
        stmt = stmt.order_by(Document.created_at.desc())
        return self._paginate(stmt, page, page_size)

    def list_for_indexing(self, data_source_id: Optional[int] = None,
                          data_version: Optional[str] = None,
                          limit: int = 10000) -> List[Document]:
        stmt = select(Document).where(
            Document.status.in_([DocumentStatus.APPROVED, DocumentStatus.INDEXED])
        )
        if data_source_id:
            stmt = stmt.where(Document.data_source_id == data_source_id)
        if data_version:
            stmt = stmt.where(Document.data_version == data_version)
        stmt = stmt.limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def update_status(self, obj_id: int, status: DocumentStatus,
                      extra: Optional[dict] = None) -> Optional[Document]:
        values = {"status": status}
        if extra:
            values.update(extra)
        stmt = (update(Document).where(Document.id == obj_id)
                .values(**values).execution_options(synchronize_session="fetch"))
        self.db.execute(stmt)
        self.db.commit()
        return self.get(obj_id)

    def update(self, obj_id: int, obj_in: dict) -> Optional[Document]:
        stmt = (update(Document).where(Document.id == obj_id)
                .values(**obj_in).execution_options(synchronize_session="fetch"))
        self.db.execute(stmt)
        self.db.commit()
        return self.get(obj_id)

    def count_by_status(self, data_source_id: Optional[int] = None) -> Dict[str, int]:
        stmt = select(Document.status, func.count(Document.id))
        if data_source_id:
            stmt = stmt.where(Document.data_source_id == data_source_id)
        stmt = stmt.group_by(Document.status)
        result = self.db.execute(stmt).all()
        return {row[0].value if hasattr(row[0], 'value') else str(row[0]): row[1] for row in result}


class ReviewRepository(BaseRepository):
    def create(self, obj_in: dict) -> DocumentReview:
        db_obj = DocumentReview(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def list_by_document(self, document_id: int) -> List[DocumentReview]:
        stmt = (select(DocumentReview)
                .where(DocumentReview.document_id == document_id)
                .order_by(DocumentReview.created_at.desc()))
        return list(self.db.execute(stmt).scalars().all())


class DatasetVersionRepository(BaseRepository):
    def create(self, obj_in: dict) -> DatasetVersion:
        db_obj = DatasetVersion(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get(self, obj_id: int) -> Optional[DatasetVersion]:
        return self.db.get(DatasetVersion, obj_id)

    def get_by_tag(self, version_tag: str,
                   data_source_id: Optional[int] = None) -> Optional[DatasetVersion]:
        stmt = select(DatasetVersion).where(DatasetVersion.version_tag == version_tag)
        if data_source_id:
            stmt = stmt.where(DatasetVersion.data_source_id == data_source_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(self, page: int = 1, page_size: int = 20,
             data_source_id: Optional[int] = None) -> Tuple[List[DatasetVersion], int]:
        stmt = select(DatasetVersion)
        if data_source_id:
            stmt = stmt.where(DatasetVersion.data_source_id == data_source_id)
        stmt = stmt.order_by(DatasetVersion.created_at.desc())
        return self._paginate(stmt, page, page_size)
