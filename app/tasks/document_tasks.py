from __future__ import annotations

import traceback
from typing import Any, Dict, List, Optional

from loguru import logger
from sqlalchemy import select

from app.core.celery_app import celery_app
from app.core.database import get_sync_session
from app.models.task import Task, TaskResult, TaskStatus
from app.models.contract import (
    ContractDocument,
    ContractClause,
    ContractStatus,
    ClauseCategory,
)
from app.models.dataset import Dataset, DatasetSample, SampleStatus
from app.tasks.base import ContractAIBaseTask
from app.services.data.parser import DocumentParser
from app.services.data.cleaner import DataCleaner
from app.config import settings


@celery.task(
    bind=True,
    base=ContractAIBaseTask,
    name="data.parse_document",
    queue="data_queue",
    autoretry_for=(Exception,),
    retry_backoff=2,
    retry_kwargs={"max_retries": 3},
    time_limit=600,
    soft_time_limit=540,
    rate_limit="10/m",
)
def parse_document_task(
    self,
    task_id_str: str,
    file_path: str,
    original_name: str,
    contract_id: Optional[int] = None,
    uploader_id: Optional[int] = None,
) -> Dict[str, Any]:
    try:
        self.update_progress(5, "初始化文档解析器")
        parser = DocumentParser(upload_dir=settings.UPLOAD_DIR)
        cleaner = DataCleaner()

        self.update_progress(10, f"开始解析文档: {original_name}")
        parsed_doc = parser.parse(file_path, original_name)

        if parsed_doc.error_message:
            raise RuntimeError(f"文档解析失败: {parsed_doc.error_message}")

        self.update_progress(30, "解析完成，开始清洗条款文本")
        clause_count = len(parsed_doc.clauses)
        total_chars = 0
        quality_scores: List[float] = []

        for idx, clause in enumerate(parsed_doc.clauses):
            clean_result = cleaner.clean_text(clause.text)
            clause.text = clean_result.cleaned_text
            quality_scores.append(clean_result.quality_score)
            total_chars += len(clause.text)

            if (idx + 1) % max(1, clause_count // 10) == 0:
                progress = 30 + int((idx + 1) / max(1, clause_count) * 40)
                self.update_progress(
                    progress,
                    f"清洗进度: {idx + 1}/{clause_count}",
                    {"cleaned": idx + 1, "total": clause_count},
                )

        quality_avg = (
            sum(quality_scores) / len(quality_scores) if quality_scores else 0.0
        )

        self.update_progress(72, "保存到数据库")

        db = self.db

        if contract_id:
            contract_doc = db.get(ContractDocument, contract_id)
            if contract_doc:
                contract_doc.status = ContractStatus.PARSING
                contract_doc.title = parsed_doc.title or contract_doc.title
                contract_doc.page_count = parsed_doc.page_count
                contract_doc.word_count = parsed_doc.word_count
                contract_doc.file_hash = parsed_doc.file_hash
                contract_doc.mime_type = parsed_doc.mime_type
                contract_doc.file_size = parsed_doc.file_size
                contract_doc.total_amount = parsed_doc.total_amount
                contract_doc.currency = parsed_doc.currency
                contract_doc.party_a = parsed_doc.parties.get("party_a")
                contract_doc.party_b = parsed_doc.parties.get("party_b")
                if parsed_doc.key_dates.get("sign_date"):
                    contract_doc.sign_date = parsed_doc.key_dates["sign_date"]
            else:
                contract_doc = None
        else:
            contract_doc = None

        if contract_doc is None:
            contract_doc = ContractDocument(
                title=parsed_doc.title or original_name,
                status=ContractStatus.PARSING,
                file_name=original_name,
                file_path=file_path,
                file_size=parsed_doc.file_size,
                file_hash=parsed_doc.file_hash,
                mime_type=parsed_doc.mime_type,
                page_count=parsed_doc.page_count,
                word_count=parsed_doc.word_count,
                total_amount=parsed_doc.total_amount,
                currency=parsed_doc.currency,
                party_a=parsed_doc.parties.get("party_a"),
                party_b=parsed_doc.parties.get("party_b"),
                sign_date=parsed_doc.key_dates.get("sign_date"),
                uploader_id=uploader_id,
                raw_metadata=parsed_doc.metadata,
            )
            db.add(contract_doc)
            db.flush()

        existing_clauses_q = select(ContractClause).where(
            ContractClause.document_id == contract_doc.id
        )
        existing_clauses = db.execute(existing_clauses_q).scalars().all()
        for ec in existing_clauses:
            db.delete(ec)
        db.flush()

        clause_objs: List[ContractClause] = []
        for idx, parsed_clause in enumerate(parsed_doc.clauses):
            qs = quality_scores[idx] if idx < len(quality_scores) else 1.0
            clause_obj = ContractClause(
                document_id=contract_doc.id,
                clause_index=parsed_clause.index,
                clause_title=parsed_clause.title,
                clause_number=parsed_clause.number,
                category=ClauseCategory.OTHER,
                original_text=parsed_clause.text,
                cleaned_text=parsed_clause.text,
                page_start=parsed_clause.page_start,
                page_end=parsed_clause.page_end,
                char_start=parsed_clause.char_start,
                char_end=parsed_clause.char_end,
                quality_score=qs,
                embedding_status="pending",
            )
            clause_objs.append(clause_obj)

        db.bulk_save_objects(clause_objs)
        db.flush()

        contract_doc.clause_count = len(clause_objs)
        contract_doc.status = ContractStatus.PARSED

        db.commit()
        db.refresh(contract_doc)

        self.update_progress(90, "触发向量索引构建任务")

        try:
            from app.tasks.ai_tasks import build_vector_index_task

            build_vector_index_task.delay(
                "", contract_id=contract_doc.id, clause_ids=None
            )
        except Exception as e:
            logger.warning(f"触发build_vector_index子任务失败: {e}")

        self.update_progress(100, "文档解析任务完成")

        result = {
            "contract_id": contract_doc.id,
            "clause_count": clause_count,
            "total_chars": total_chars,
            "quality_avg": round(quality_avg, 4),
        }

        self.save_task_result(
            result_data=result,
            metrics={
                "clause_count": clause_count,
                "total_chars": total_chars,
                "quality_avg": quality_avg,
            },
        )

        return result

    except Exception as e:
        logger.error(f"parse_document_task失败: {e}\n{traceback.format_exc()}")
        raise


@celery.task(
    bind=True,
    base=ContractAIBaseTask,
    name="data.clean_dataset",
    queue="data_queue",
    autoretry_for=(Exception,),
    retry_backoff=2,
    retry_kwargs={"max_retries": 3},
    time_limit=1800,
    soft_time_limit=1740,
    rate_limit="5/h",
)
def clean_dataset_task(
    self,
    task_id_str: str,
    dataset_id: int,
    min_quality: float = 0.5,
) -> Dict[str, Any]:
    try:
        self.update_progress(5, "加载数据集和样本")
        db = self.db

        dataset = db.get(Dataset, dataset_id)
        if not dataset:
            raise ValueError(f"数据集不存在: {dataset_id}")

        stmt = select(DatasetSample).where(DatasetSample.dataset_id == dataset_id)
        samples = db.execute(stmt).scalars().all()

        total_samples = len(samples)
        if total_samples == 0:
            return {"cleaned": 0, "rejected": 0, "avg_quality": 0.0}

        cleaner = DataCleaner()

        self.update_progress(10, f"开始批量清洗 {total_samples} 条样本")

        cleaned_count = 0
        rejected_count = 0
        quality_scores: List[float] = []

        batch_size = settings.BATCH_SIZE_PROCESS

        for batch_start in range(0, total_samples, batch_size):
            batch_end = min(batch_start + batch_size, total_samples)
            batch = samples[batch_start:batch_end]

            for sample in batch:
                input_clean = cleaner.clean_text(sample.input_text or "")
                quality_scores.append(input_clean.quality_score)

                if input_clean.cleaned_text:
                    sample.input_text = input_clean.cleaned_text

                if sample.reference_output:
                    ref_clean = cleaner.clean_text(sample.reference_output)
                    if ref_clean.cleaned_text:
                        sample.reference_output = ref_clean.cleaned_text
                    quality_scores.append(ref_clean.quality_score)

                sample.quality_score = (
                    input_clean.quality_score
                    if not sample.reference_output
                    else (input_clean.quality_score + (ref_clean.quality_score if sample.reference_output else 0)) / 2
                )

                if sample.quality_score < min_quality:
                    sample.status = SampleStatus.REJECTED
                    rejected_count += 1
                else:
                    cleaned_count += 1

            progress = 10 + int(batch_end / total_samples * 85)
            self.update_progress(
                progress,
                f"清洗进度: {batch_end}/{total_samples}",
                {
                    "cleaned": cleaned_count,
                    "rejected": rejected_count,
                    "total": total_samples,
                },
            )

            if batch_end % (batch_size * 2) == 0:
                db.commit()

        db.commit()

        avg_quality = (
            sum(quality_scores) / len(quality_scores) if quality_scores else 0.0
        )

        dataset.stats = {
            "cleaned_count": cleaned_count,
            "rejected_count": rejected_count,
            "avg_quality": round(avg_quality, 4),
            "total_processed": total_samples,
        }
        db.commit()

        self.update_progress(100, "数据集清洗任务完成")

        result = {
            "cleaned": cleaned_count,
            "rejected": rejected_count,
            "avg_quality": round(avg_quality, 4),
        }

        self.save_task_result(
            result_data=result,
            metrics={
                "total_samples": total_samples,
                "cleaned": cleaned_count,
                "rejected": rejected_count,
                "avg_quality": avg_quality,
                "min_quality_threshold": min_quality,
            },
        )

        return result

    except Exception as e:
        logger.error(f"clean_dataset_task失败: {e}\n{traceback.format_exc()}")
        raise
