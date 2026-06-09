from __future__ import annotations

import traceback
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from loguru import logger
from sqlalchemy import select

from app.core.celery_app import celery_app
from app.models.task import Task, TaskResult, TaskStatus
from app.models.contract import (
    ContractDocument,
    ContractClause,
    ContractSummary,
    RiskAlert,
    ContractStatus,
    RiskLevel,
)
from app.models.ml import ModelVersion
from app.tasks.base import ContractAIBaseTask
from app.services.ai.summarizer import ContractSummarizer
from app.services.risk.engine import RiskEngine, RiskDetectionResult, SourceReference
from app.services.ai.vector_store import VectorStoreManager, IndexedClause
from app.services.ai.llm_factory import LLMFactory
from app.config import settings


@celery.task(
    bind=True,
    base=ContractAIBaseTask,
    name="ai.generate_summary",
    queue="ai_queue",
    autoretry_for=(Exception,),
    retry_backoff=3,
    retry_kwargs={"max_retries": 3},
    time_limit=1200,
    soft_time_limit=1140,
    rate_limit="20/h",
)
def generate_summary_task(
    self,
    task_id_str: str,
    contract_id: int,
    model_version_id: Optional[int] = None,
    summary_type: str = "full",
) -> Dict[str, Any]:
    try:
        self.update_progress(5, "加载合同数据")
        db = self.db

        contract = db.get(ContractDocument, contract_id)
        if not contract:
            raise ValueError(f"合同不存在: {contract_id}")

        contract.status = ContractStatus.ANALYZING
        db.commit()

        stmt = select(ContractClause).where(
            ContractClause.document_id == contract_id
        ).order_by(ContractClause.clause_index)
        clauses = db.execute(stmt).scalars().all()

        if not clauses:
            raise ValueError(f"合同 {contract_id} 没有条款数据")

        self.update_progress(15, f"加载完成，共 {len(clauses)} 条条款")

        llm_factory = LLMFactory()
        if model_version_id:
            mv = db.get(ModelVersion, model_version_id)
            if mv:
                llm_factory.default_model = mv.base_model or mv.model_name

        summarizer = ContractSummarizer(llm_factory=llm_factory)

        clause_dicts: List[Dict[str, Any]] = []
        for c in clauses:
            clause_dicts.append(
                {
                    "clause_id": c.id,
                    "id": c.id,
                    "clause_title": c.clause_title or f"第{c.clause_index}条",
                    "title": c.clause_title or f"第{c.clause_index}条",
                    "text": c.cleaned_text or c.original_text,
                    "original_text": c.cleaned_text or c.original_text,
                    "category": c.category.value if c.category else "other",
                }
            )

        full_text_parts = []
        for c in clauses:
            title = c.clause_title or f"第{c.clause_index}条"
            text = c.cleaned_text or c.original_text
            full_text_parts.append(f"[{c.id}:{title}]\n{text}")
        full_contract_text = "\n\n".join(full_text_parts)

        self.update_progress(25, "开始生成摘要...")

        summary_result = summarizer.generate_full_summary(
            document_id=contract_id,
            clauses=clause_dicts,
            full_contract_text=full_contract_text,
            include_structured=True,
            include_clause_summaries=True,
        )

        self.update_progress(75, "摘要生成完成，保存到数据库")

        summary = ContractSummary(
            document_id=contract_id,
            summary_type=summary_type,
            summary_text=summary_result.full_summary,
            key_points=[kp.to_dict() for kp in summary_result.key_points],
            key_parties=[kp.to_dict() for kp in summary_result.key_parties],
            key_dates=[kd.to_dict() for kd in summary_result.key_dates],
            key_amounts=[ka.to_dict() for ka in summary_result.key_amounts],
            key_obligations=[ko.to_dict() for ko in summary_result.key_obligations],
            model_version=summary_result.model_version,
            prompt_version=summary_result.prompt_version,
            tokens_used=summary_result.total_tokens,
            latency_ms=summary_result.total_latency_ms,
            quality_score=None,
            human_revised=False,
        )
        db.add(summary)
        db.flush()

        contract.status = ContractStatus.ANALYZED
        contract.analyzed_at = datetime.utcnow()
        contract.model_version = summary_result.model_version
        db.commit()
        db.refresh(summary)

        self.update_progress(100, "摘要任务完成")

        result = {
            "summary_id": summary.id,
            "tokens": summary_result.total_tokens,
            "latency": round(summary_result.total_latency_ms, 2),
            "model_version": summary_result.model_version,
        }

        self.save_task_result(
            result_data=result,
            result_text=summary_result.full_summary,
            metrics={
                "tokens": summary_result.total_tokens,
                "latency_ms": summary_result.total_latency_ms,
                "cost_usd": summary_result.total_cost_usd,
                "key_points_count": len(summary_result.key_points),
                "key_parties_count": len(summary_result.key_parties),
                "clause_summaries_count": len(summary_result.clause_summaries),
            },
            tokens_used=summary_result.total_tokens,
            latency_ms=summary_result.total_latency_ms,
            cost_usd=summary_result.total_cost_usd,
            model_version=summary_result.model_version,
        )

        return result

    except Exception as e:
        logger.error(f"generate_summary_task失败: {e}\n{traceback.format_exc()}")
        try:
            db = self.db
            contract = db.get(ContractDocument, contract_id)
            if contract:
                contract.status = ContractStatus.ERROR
                contract.error_message = str(e)[:500]
                db.commit()
        except Exception:
            pass
        raise


@celery.task(
    bind=True,
    base=ContractAIBaseTask,
    name="ai.detect_risks",
    queue="ai_queue",
    autoretry_for=(Exception,),
    retry_backoff=3,
    retry_kwargs={"max_retries": 3},
    time_limit=1200,
    soft_time_limit=1140,
    rate_limit="20/h",
)
def detect_risks_task(
    self,
    task_id_str: str,
    contract_id: int,
    model_version_id: Optional[int] = None,
) -> Dict[str, Any]:
    try:
        self.update_progress(5, "加载合同条款数据")
        db = self.db

        contract = db.get(ContractDocument, contract_id)
        if not contract:
            raise ValueError(f"合同不存在: {contract_id}")

        stmt = select(ContractClause).where(
            ContractClause.document_id == contract_id
        ).order_by(ContractClause.clause_index)
        clauses = db.execute(stmt).scalars().all()

        if not clauses:
            raise ValueError(f"合同 {contract_id} 没有条款数据")

        self.update_progress(15, f"加载完成，共 {len(clauses)} 条条款，开始风险检测")

        full_text_parts = []
        for c in clauses:
            title = c.clause_title or f"第{c.clause_index}条"
            text = c.cleaned_text or c.original_text
            full_text_parts.append(f"[{c.id}:{title}]\n{text}")
        full_text = "\n\n".join(full_text_parts)

        risk_engine = RiskEngine()
        risk_results: List[RiskDetectionResult] = risk_engine.detect_risks(
            clauses=clauses,
            contract_type=contract.contract_type.value if contract.contract_type else None,
            template_id=contract.template_id,
            full_text=full_text,
        )

        self.update_progress(60, f"检测到 {len(risk_results)} 条风险，保存到数据库")

        existing_q = select(RiskAlert).where(RiskAlert.document_id == contract_id)
        existing_risks = db.execute(existing_q).scalars().all()
        for er in existing_risks:
            db.delete(er)
        db.flush()

        high_count = 0
        medium_count = 0
        low_count = 0

        for rr in risk_results:
            level = rr.risk_level
            if level == RiskLevel.HIGH:
                high_count += 1
            elif level == RiskLevel.MEDIUM:
                medium_count += 1
            else:
                low_count += 1

            source_paragraph = ""
            source_clause_ref = ""
            source_page = 1
            source_char_start = None
            source_char_end = None
            clause_id_ref = None

            if rr.source_references:
                ref = rr.source_references[0]
                source_paragraph = ref.original_snippet or ""
                source_clause_ref = (
                    f"[{ref.clause_id}:{ref.clause_title}]"
                    if ref.clause_id
                    else ref.clause_number
                )
                source_page = ref.page_number or 1
                source_char_start = ref.char_start
                source_char_end = ref.char_end
                clause_id_ref = ref.clause_id

            alert = RiskAlert(
                document_id=contract_id,
                clause_id=clause_id_ref,
                risk_type=rr.risk_type,
                risk_level=level,
                risk_score=rr.risk_score,
                title=rr.title,
                description=rr.description,
                suggestion=rr.suggestion,
                rule_id=rr.rule_id,
                source_paragraph=source_paragraph or "无法定位原文段落",
                source_clause_ref=source_clause_ref,
                source_char_start=source_char_start,
                source_char_end=source_char_end,
                source_page=source_page,
                confidence=rr.confidence,
                detection_method=rr.detection_method,
            )
            db.add(alert)

        db.commit()

        self.update_progress(100, "风险检测任务完成")

        total_count = len(risk_results)
        result = {
            "risk_count": total_count,
            "high": high_count,
            "medium": medium_count,
            "low": low_count,
        }

        self.save_task_result(
            result_data=result,
            metrics={
                "risk_count": total_count,
                "high": high_count,
                "medium": medium_count,
                "low": low_count,
                "contract_id": contract_id,
            },
        )

        return result

    except Exception as e:
        logger.error(f"detect_risks_task失败: {e}\n{traceback.format_exc()}")
        raise


@celery.task(
    bind=True,
    base=ContractAIBaseTask,
    name="ai.build_vector_index",
    queue="ai_queue",
    autoretry_for=(Exception,),
    retry_backoff=2,
    retry_kwargs={"max_retries": 3},
    time_limit=1800,
    soft_time_limit=1740,
    rate_limit="30/m",
)
def build_vector_index_task(
    self,
    task_id_str: str,
    contract_id: Optional[int] = None,
    clause_ids: Optional[List[int]] = None,
) -> Dict[str, Any]:
    try:
        self.update_progress(5, "加载条款数据")
        db = self.db

        stmt = select(ContractClause)
        conditions = []

        if contract_id:
            conditions.append(ContractClause.document_id == contract_id)
        if clause_ids:
            conditions.append(ContractClause.id.in_(clause_ids))

        if conditions:
            from sqlalchemy import and_

            stmt = stmt.where(and_(*conditions))

        clauses = db.execute(stmt).scalars().all()

        if not clauses:
            return {"indexed_count": 0}

        self.update_progress(15, f"加载完成，共 {len(clauses)} 条条款待索引")

        vs_manager = VectorStoreManager()

        indexed_clauses: List[IndexedClause] = []
        for idx, clause in enumerate(clauses):
            text = clause.cleaned_text or clause.original_text
            if not text or not text.strip():
                continue

            embedding_id = clause.embedding_id or str(uuid.uuid4())

            ic = IndexedClause(
                clause_id=clause.id,
                document_id=clause.document_id,
                clause_index=clause.clause_index,
                category=clause.category.value if clause.category else "other",
                original_text=text,
                cleaned_text=clause.cleaned_text,
                quality_score=clause.quality_score or 1.0,
                embedding_id=embedding_id,
                page_start=clause.page_start or 1,
                page_end=clause.page_end or 1,
                created_at=clause.created_at or datetime.utcnow(),
                metadata={
                    "clause_title": clause.clause_title or "",
                    "clause_number": clause.clause_number or "",
                },
            )
            indexed_clauses.append(ic)

        total_to_index = len(indexed_clauses)
        if total_to_index == 0:
            return {"indexed_count": 0}

        self.update_progress(30, f"开始构建向量索引，共 {total_to_index} 条有效条款")

        batch_size = 50
        indexed_count = 0

        for batch_start in range(0, total_to_index, batch_size):
            batch_end = min(batch_start + batch_size, total_to_index)
            batch = indexed_clauses[batch_start:batch_end]

            try:
                embedding_ids = vs_manager.build_index(batch)
                indexed_count += len(embedding_ids)

                for ic in batch:
                    clause = next(
                        (c for c in clauses if c.id == ic.clause_id), None
                    )
                    if clause:
                        clause.embedding_id = ic.embedding_id
                        clause.embedding_status = "done"

                if batch_end % (batch_size * 2) == 0 or batch_end == total_to_index:
                    db.commit()

            except Exception as e:
                logger.warning(
                    f"批量索引失败 batch={batch_start}-{batch_end}: {e}"
                )
                continue

            progress = 30 + int(batch_end / total_to_index * 65)
            self.update_progress(
                progress,
                f"索引进度: {batch_end}/{total_to_index}",
                {"indexed": indexed_count, "total": total_to_index},
            )

        db.commit()

        self.update_progress(100, f"向量索引构建完成，共索引 {indexed_count} 条")

        result = {"indexed_count": indexed_count}

        self.save_task_result(
            result_data=result,
            metrics={
                "indexed_count": indexed_count,
                "total_clauses": len(clauses),
                "contract_id": contract_id,
            },
        )

        return result

    except Exception as e:
        logger.error(f"build_vector_index_task失败: {e}\n{traceback.format_exc()}")
        raise
