import json
import logging
from typing import List, Optional, Dict, Any, Tuple, Generator
from pathlib import Path
from datetime import datetime
from enum import Enum

from loguru import logger
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_

from app.core.database import get_sync_session
from app.models.dataset import (
    Dataset, DatasetSample, SampleLabel, DatasetVersion,
    DatasetType, SampleStatus, SampleType, LabelType,
)
from app.models.user import User


class DatasetManager:
    """
    数据集管理器
    功能：CRUD、版本管理、样本导入导出、质检流水线、分配标注
    支持：数据集克隆、样本复核、样本回滚
    """

    def __init__(self, db: Optional[Session] = None, export_dir: str = "./data/exports"):
        self.db = db or get_sync_session()
        self.export_dir = Path(export_dir)
        self.export_dir.mkdir(parents=True, exist_ok=True)

    def close(self):
        if self.db:
            self.db.close()

    def create_dataset(
        self,
        name: str,
        dataset_type: DatasetType = DatasetType.TRAIN,
        description: Optional[str] = None,
        owner_id: Optional[int] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict] = None,
        version: str = "1.0",
    ) -> Dataset:
        dataset = Dataset(
            name=name,
            dataset_type=dataset_type,
            description=description,
            owner_id=owner_id,
            tags=tags,
            metadata=metadata,
            version=version,
        )
        self.db.add(dataset)
        self.db.flush()

        ds_version = DatasetVersion(
            dataset_id=dataset.id,
            version=version,
            change_log="初始创建",
            created_by_id=owner_id,
            stats_snapshot={"sample_count": 0},
        )
        self.db.add(ds_version)
        self.db.commit()
        self.db.refresh(dataset)

        logger.info(f"创建数据集: id={dataset.id}, name={name}")
        return dataset

    def list_datasets(
        self,
        dataset_type: Optional[DatasetType] = None,
        owner_id: Optional[int] = None,
        is_active: Optional[bool] = True,
        keyword: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[Dataset], int]:
        query = select(Dataset)
        conditions = []
        if dataset_type:
            conditions.append(Dataset.dataset_type == dataset_type)
        if owner_id is not None:
            conditions.append(Dataset.owner_id == owner_id)
        if is_active is not None:
            conditions.append(Dataset.is_active == is_active)
        if keyword:
            like = f"%{keyword}%"
            conditions.append(or_(Dataset.name.like(like), Dataset.description.like(like)))

        if conditions:
            query = query.where(and_(*conditions))

        count_query = select(func.count()).select_from(query.subquery())
        total = self.db.execute(count_query).scalar_one()

        query = query.order_by(Dataset.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        items = list(self.db.execute(query).scalars().all())

        return items, total

    def get_dataset(self, dataset_id: int) -> Optional[Dataset]:
        return self.db.get(Dataset, dataset_id)

    def create_sample_version(
        self,
        dataset_id: int,
        version: str,
        change_log: str,
        created_by_id: Optional[int] = None,
    ) -> DatasetVersion:
        dataset = self.get_dataset(dataset_id)
        if not dataset:
            raise ValueError(f"数据集不存在: {dataset_id}")

        existing = self.db.execute(
            select(DatasetVersion).where(
                and_(DatasetVersion.dataset_id == dataset_id, DatasetVersion.version == version)
            )
        ).scalar_one_or_none()
        if existing:
            raise ValueError(f"版本号已存在: {version}")

        stats = self._compute_dataset_stats(dataset_id)
        ds_version = DatasetVersion(
            dataset_id=dataset_id,
            version=version,
            change_log=change_log,
            sample_count=dataset.sample_count,
            stats_snapshot=stats,
            created_by_id=created_by_id,
        )
        self.db.add(ds_version)

        dataset.version = version
        dataset.updated_at = datetime.utcnow()
        dataset.published_at = datetime.utcnow()
        dataset.stats = stats

        self.db.commit()
        self.db.refresh(ds_version)

        logger.info(f"数据集版本快照: dataset_id={dataset_id}, version={version}")
        return ds_version

    def list_versions(self, dataset_id: int) -> List[DatasetVersion]:
        query = (
            select(DatasetVersion)
            .where(DatasetVersion.dataset_id == dataset_id)
            .order_by(DatasetVersion.created_at.desc())
        )
        return list(self.db.execute(query).scalars().all())

    def add_sample(
        self,
        dataset_id: int,
        sample_type: SampleType,
        input_text: str,
        reference_output: Optional[str] = None,
        source_contract_id: Optional[int] = None,
        source_clause_id: Optional[int] = None,
        source_risk_id: Optional[int] = None,
        input_metadata: Optional[Dict] = None,
        reference_metadata: Optional[Dict] = None,
        difficulty_level: int = 1,
        weight: float = 1.0,
        assignee_id: Optional[int] = None,
        status: SampleStatus = SampleStatus.DRAFT,
        labels: Optional[List[Tuple[LabelType, str, float]]] = None,
    ) -> DatasetSample:
        dataset = self.get_dataset(dataset_id)
        if not dataset:
            raise ValueError(f"数据集不存在: {dataset_id}")

        sample = DatasetSample(
            dataset_id=dataset_id,
            sample_type=sample_type,
            status=status,
            source_contract_id=source_contract_id,
            source_clause_id=source_clause_id,
            source_risk_id=source_risk_id,
            input_text=input_text,
            reference_output=reference_output,
            input_metadata=input_metadata,
            reference_metadata=reference_metadata,
            difficulty_level=difficulty_level,
            weight=weight,
            assignee_id=assignee_id,
        )
        self.db.add(sample)
        self.db.flush()

        if labels:
            for label_type, label_value, confidence in labels:
                lbl = SampleLabel(
                    sample_id=sample.id,
                    clause_id=source_clause_id,
                    label_type=label_type,
                    label_value=label_value,
                    label_confidence=confidence,
                )
                self.db.add(lbl)

        dataset.sample_count += 1
        if status == SampleStatus.APPROVED:
            dataset.approved_count += 1
        if labels:
            dataset.labeled_count += 1

        self.db.commit()
        self.db.refresh(sample)
        return sample

    def get_samples(
        self,
        dataset_id: Optional[int] = None,
        sample_type: Optional[SampleType] = None,
        status: Optional[SampleStatus] = None,
        assignee_id: Optional[int] = None,
        source_clause_id: Optional[int] = None,
        keyword: Optional[str] = None,
        page: int = 1,
        page_size: int = 100,
        include_labels: bool = True,
    ) -> Tuple[List[DatasetSample], int]:
        query = select(DatasetSample)
        conditions = []
        if dataset_id:
            conditions.append(DatasetSample.dataset_id == dataset_id)
        if sample_type:
            conditions.append(DatasetSample.sample_type == sample_type)
        if status:
            conditions.append(DatasetSample.status == status)
        if assignee_id is not None:
            conditions.append(DatasetSample.assignee_id == assignee_id)
        if source_clause_id:
            conditions.append(DatasetSample.source_clause_id == source_clause_id)
        if keyword:
            like = f"%{keyword}%"
            conditions.append(or_(DatasetSample.input_text.like(like), DatasetSample.reference_output.like(like)))

        if conditions:
            query = query.where(and_(*conditions))

        count_query = select(func.count()).select_from(query.subquery())
        total = self.db.execute(count_query).scalar_one()

        query = query.order_by(DatasetSample.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        items = list(self.db.execute(query).scalars().all())
        return items, total

    def update_sample(
        self,
        sample_id: int,
        *,
        reference_output: Optional[str] = None,
        status: Optional[SampleStatus] = None,
        reviewer_id: Optional[int] = None,
        review_comment: Optional[str] = None,
        approved_at: Optional[datetime] = None,
        reviewed_at: Optional[datetime] = None,
        assignee_id: Optional[int] = None,
        update_fields: Optional[Dict] = None,
    ) -> Optional[DatasetSample]:
        sample = self.db.get(DatasetSample, sample_id)
        if not sample:
            return None

        old_status = sample.status
        if reference_output is not None:
            sample.reference_output = reference_output
        if status is not None:
            sample.status = status
        if reviewer_id is not None:
            sample.reviewer_id = reviewer_id
        if review_comment is not None:
            sample.review_comment = review_comment
        if approved_at is not None:
            sample.approved_at = approved_at
        if reviewed_at is not None:
            sample.reviewed_at = reviewed_at
        if assignee_id is not None:
            sample.assignee_id = assignee_id
        if update_fields:
            for k, v in update_fields.items():
                if hasattr(sample, k):
                    setattr(sample, k, v)

        dataset = sample.dataset
        if dataset and old_status != SampleStatus.APPROVED and status == SampleStatus.APPROVED:
            dataset.approved_count += 1
            sample.approved_at = approved_at or datetime.utcnow()

        self.db.commit()
        self.db.refresh(sample)
        return sample

    def rollback_sample(
        self,
        sample_id: int,
        rollback_reason: str,
        rolled_back_by_id: Optional[int] = None,
    ) -> Optional[DatasetSample]:
        sample = self.db.get(DatasetSample, sample_id)
        if not sample:
            return None
        if not sample.previous_sample_id:
            raise ValueError("该样本无历史版本可回滚")

        target = self.db.get(DatasetSample, sample.previous_sample_id)
        if not target:
            raise ValueError("目标历史版本不存在")

        new_sample = DatasetSample(
            dataset_id=sample.dataset_id,
            sample_type=sample.sample_type,
            status=SampleStatus.DRAFT,
            source_contract_id=sample.source_contract_id,
            source_clause_id=sample.source_clause_id,
            source_risk_id=sample.source_risk_id,
            input_text=target.input_text,
            reference_output=target.reference_output,
            input_metadata=target.input_metadata,
            reference_metadata=target.reference_metadata,
            difficulty_level=target.difficulty_level,
            weight=target.weight,
            previous_sample_id=sample.id,
            rollback_to_id=target.id,
            is_rollback=True,
            rollback_reason=rollback_reason,
            rolled_back_at=datetime.utcnow(),
        )
        self.db.add(new_sample)

        sample.status = SampleStatus.SUPERSEDED
        self.db.commit()
        self.db.refresh(new_sample)

        logger.info(f"样本回滚: sample_id={sample_id} -> {new_sample.id}")
        return new_sample

    def add_label(
        self,
        sample_id: int,
        label_type: LabelType,
        label_value: str,
        annotator_id: Optional[int] = None,
        confidence: float = 1.0,
        is_gold_label: bool = False,
        label_metadata: Optional[Dict] = None,
    ) -> SampleLabel:
        label = SampleLabel(
            sample_id=sample_id,
            label_type=label_type,
            label_value=label_value,
            label_confidence=confidence,
            annotator_id=annotator_id,
            is_gold_label=is_gold_label,
            label_metadata=label_metadata,
        )
        self.db.add(label)
        self.db.commit()
        self.db.refresh(label)
        return label

    def clone_dataset(
        self,
        source_dataset_id: int,
        new_name: str,
        new_owner_id: Optional[int] = None,
        include_samples: bool = True,
        sample_status_filter: Optional[List[SampleStatus]] = None,
    ) -> Dataset:
        source = self.get_dataset(source_dataset_id)
        if not source:
            raise ValueError(f"源数据集不存在: {source_dataset_id}")

        new_ds = Dataset(
            name=new_name,
            dataset_type=source.dataset_type,
            description=f"克隆自 {source.name}(id={source.id})",
            owner_id=new_owner_id,
            tags=source.tags,
            version="1.0",
        )
        self.db.add(new_ds)
        self.db.flush()

        if include_samples:
            q = select(DatasetSample).where(DatasetSample.dataset_id == source_dataset_id)
            if sample_status_filter:
                q = q.where(DatasetSample.status.in_(sample_status_filter))
            source_samples = list(self.db.execute(q).scalars().all())

            for s in source_samples:
                new_s = DatasetSample(
                    dataset_id=new_ds.id,
                    sample_type=s.sample_type,
                    status=SampleStatus.DRAFT,
                    source_contract_id=s.source_contract_id,
                    source_clause_id=s.source_clause_id,
                    source_risk_id=s.source_risk_id,
                    input_text=s.input_text,
                    reference_output=s.reference_output,
                    input_metadata=s.input_metadata,
                    reference_metadata=s.reference_metadata,
                    difficulty_level=s.difficulty_level,
                    weight=s.weight,
                )
                self.db.add(new_s)
                new_ds.sample_count += 1

        ds_version = DatasetVersion(
            dataset_id=new_ds.id,
            version="1.0",
            change_log=f"克隆自数据集 {source_dataset_id}",
            created_by_id=new_owner_id,
        )
        self.db.add(ds_version)
        self.db.commit()
        self.db.refresh(new_ds)
        return new_ds

    def export_to_jsonl(
        self,
        dataset_id: int,
        file_name: Optional[str] = None,
        status_filter: Optional[List[SampleStatus]] = None,
        include_labels: bool = True,
    ) -> Path:
        dataset = self.get_dataset(dataset_id)
        if not dataset:
            raise ValueError(f"数据集不存在: {dataset_id}")

        if not file_name:
            file_name = f"dataset_{dataset_id}_{dataset.version}_{datetime.now().strftime('%Y%m%d')}.jsonl"
        export_path = self.export_dir / file_name

        samples, _ = self.get_samples(
            dataset_id=dataset_id,
            page=1,
            page_size=100000,
        )
        if status_filter:
            samples = [s for s in samples if s.status in status_filter]

        with open(export_path, "w", encoding="utf-8") as f:
            for s in samples:
                record = {
                    "id": s.id,
                    "sample_type": s.sample_type.value,
                    "input_text": s.input_text,
                    "reference_output": s.reference_output,
                    "input_metadata": s.input_metadata,
                    "reference_metadata": s.reference_metadata,
                    "difficulty_level": s.difficulty_level,
                    "weight": s.weight,
                    "status": s.status.value,
                }
                if include_labels:
                    record["labels"] = [
                        {"type": l.label_type.value, "value": l.label_value, "confidence": l.label_confidence}
                        for l in s.labels
                    ]
                f.write(json.dumps(record, ensure_ascii=False) + "\n")

        logger.info(f"导出数据集: {dataset_id} -> {export_path}, count={len(samples)}")
        return export_path

    def import_from_jsonl(
        self,
        dataset_id: int,
        file_path: str,
        default_sample_type: SampleType = SampleType.CLAUSE_SUMMARY,
        status: SampleStatus = SampleStatus.DRAFT,
    ) -> int:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(file_path)

        count = 0
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    sample = DatasetSample(
                        dataset_id=dataset_id,
                        sample_type=SampleType(data.get("sample_type", default_sample_type.value)),
                        status=status,
                        input_text=data["input_text"],
                        reference_output=data.get("reference_output"),
                        input_metadata=data.get("input_metadata"),
                        reference_metadata=data.get("reference_metadata"),
                        difficulty_level=data.get("difficulty_level", 1),
                        weight=data.get("weight", 1.0),
                    )
                    self.db.add(sample)
                    count += 1
                except Exception as e:
                    logger.warning(f"导入样本失败: {e}, line={line[:100]}")

        dataset = self.get_dataset(dataset_id)
        if dataset:
            dataset.sample_count += count

        self.db.commit()
        logger.info(f"导入数据集: {file_path} -> dataset_id={dataset_id}, count={count}")
        return count

    def _compute_dataset_stats(self, dataset_id: int) -> Dict:
        samples, _ = self.get_samples(dataset_id=dataset_id, page=1, page_size=100000)
        if not samples:
            return {}

        status_counts = {}
        type_counts = {}
        difficulty_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        avg_ref_len = 0
        avg_input_len = 0

        for s in samples:
            st = s.status.value
            status_counts[st] = status_counts.get(st, 0) + 1
            tp = s.sample_type.value
            type_counts[tp] = type_counts.get(tp, 0) + 1
            difficulty_dist[s.difficulty_level] = difficulty_dist.get(s.difficulty_level, 0) + 1
            avg_input_len += len(s.input_text or "")
            avg_ref_len += len(s.reference_output or "")

        n = len(samples)
        return {
            "total": n,
            "by_status": status_counts,
            "by_type": type_counts,
            "difficulty_distribution": difficulty_dist,
            "avg_input_length": round(avg_input_len / n, 2),
            "avg_reference_length": round(avg_ref_len / n, 2),
        }

    def assign_review_tasks(
        self,
        dataset_id: int,
        reviewer_ids: List[int],
        sample_type: Optional[SampleType] = None,
        max_per_reviewer: int = 50,
    ) -> int:
        samples, _ = self.get_samples(
            dataset_id=dataset_id,
            sample_type=sample_type,
            status=SampleStatus.PENDING_REVIEW,
            page=1,
            page_size=10000,
        )
        assigned = 0
        for idx, sample in enumerate(samples):
            if assigned >= max_per_reviewer * len(reviewer_ids):
                break
            reviewer_id = reviewer_ids[idx % len(reviewer_ids)]
            sample.assignee_id = reviewer_id
            assigned += 1

        self.db.commit()
        logger.info(f"分配审核任务: dataset_id={dataset_id}, assigned={assigned}")
        return assigned
