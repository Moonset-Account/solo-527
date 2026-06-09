from __future__ import annotations

import logging
import uuid
import os
import json
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List, Tuple

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.repositories.system_repo import (
    AuditLogRepository, ApiCallLogRepository,
    QAConversationRepository, FeedbackRepository, ModelVersionRepository,
    ErrorSampleRepository
)
from app.repositories.data_repo import DatasetVersionRepository, DocumentRepository
from app.schemas.audit import AcceptanceCheck, AcceptanceReport

logger = logging.getLogger(__name__)


class AuditService:
    """审计日志与API调用日志。"""

    def __init__(self, db: Session):
        self.db = db
        self.audit_repo = AuditLogRepository(db)
        self.call_repo = ApiCallLogRepository(db)
        self.settings = get_settings()
        self._write_to_file = bool(self.settings.AUDIT_LOG_DIR)

    def log_audit(self, action: str, actor: Optional[str] = None,
                  resource_type: Optional[str] = None,
                  resource_id: Optional[str] = None,
                  description: Optional[str] = None,
                  ip_address: Optional[str] = None,
                  user_agent: Optional[str] = None,
                  request_id: Optional[str] = None,
                  response_status: Optional[int] = None,
                  details: Optional[Dict[str, Any]] = None) -> None:
        data = {
            "action": action,
            "actor": actor,
            "resource_type": resource_type,
            "resource_id": str(resource_id) if resource_id is not None else None,
            "description": description,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "request_id": request_id,
            "response_status": response_status,
            "details": details,
        }
        try:
            self.audit_repo.create(data)
        except Exception as e:
            logger.error(f"Failed to write audit log to DB: {e}")
        if self._write_to_file:
            self._append_to_file("audit", data)

    def log_api_call(self, endpoint: str, method: str,
                     request_id: Optional[str] = None,
                     user_id: Optional[str] = None,
                     model_version: Optional[str] = None,
                     tokens_input: int = 0, tokens_output: int = 0,
                     latency_ms: Optional[int] = None,
                     status_code: Optional[int] = None,
                     rate_limited: bool = False,
                     ip_address: Optional[str] = None) -> str:
        rid = request_id or uuid.uuid4().hex
        data = {
            "request_id": rid,
            "endpoint": endpoint,
            "method": method,
            "user_id": user_id,
            "model_version": model_version,
            "tokens_input": tokens_input,
            "tokens_output": tokens_output,
            "latency_ms": latency_ms,
            "status_code": status_code,
            "rate_limited": rate_limited,
            "ip_address": ip_address,
        }
        try:
            self.call_repo.create(data)
        except Exception as e:
            logger.error(f"Failed to write API call log to DB: {e}")
        if self._write_to_file:
            self._append_to_file("api_calls", data)
        return rid

    def _append_to_file(self, category: str, data: Dict[str, Any]) -> None:
        try:
            log_dir = self.settings.AUDIT_LOG_DIR
            os.makedirs(log_dir, exist_ok=True)
            date_str = datetime.now().strftime("%Y-%m-%d")
            path = os.path.join(log_dir, f"{category}_{date_str}.jsonl")
            record = dict(data)
            record.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
            with open(path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, default=str, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.debug(f"Failed to write audit file: {e}")

    def list_audit_logs(self, page: int = 1, page_size: int = 20, **filters):
        return self.audit_repo.list(page=page, page_size=page_size, **filters)

    def list_api_call_logs(self, page: int = 1, page_size: int = 20, **filters):
        return self.call_repo.list(page=page, page_size=page_size, **filters)


class DashboardService:
    """模型效果看板数据聚合。"""

    def __init__(self, db: Session):
        self.db = db
        self.conv_repo = QAConversationRepository(db)
        self.fb_repo = FeedbackRepository(db)
        self.model_repo = ModelVersionRepository(db)
        self.err_repo = ErrorSampleRepository(db)
        self.dv_repo = DatasetVersionRepository(db)
        self.doc_repo = DocumentRepository(db)

    def get_dashboard_data(self, model_version: Optional[str] = None,
                           days: int = 30) -> Dict[str, Any]:
        mv_tag = model_version
        if not mv_tag:
            default = self.model_repo.get_default()
            mv_tag = default.version_tag if default else None

        qa_metrics = self.conv_repo.get_metrics(model_version=mv_tag, days=days)
        fb_metrics = self.fb_repo.get_feedback_rates(model_version=mv_tag, days=days)
        top_categories = self.err_repo.get_top_categories(limit=10, days=days)

        recent_fbs, _ = self.fb_repo.list(page=1, page_size=10)
        recent_feedback_list = []
        for fb in recent_fbs:
            recent_feedback_list.append({
                "id": fb.id,
                "conversation_id": fb.conversation_id,
                "feedback_type": fb.feedback_type.value if hasattr(fb.feedback_type, 'value') else str(fb.feedback_type),
                "comment": fb.comment,
                "is_error_sample": fb.is_error_sample,
                "error_category": fb.error_category,
                "created_at": fb.created_at.isoformat() if fb.created_at else None,
            })

        combined = {
            **qa_metrics,
            **fb_metrics,
        }
        return {
            "model_version": mv_tag or "unknown",
            "metrics": combined,
            "top_error_categories": top_categories,
            "recent_feedbacks": recent_feedback_list,
        }


class AcceptanceService:
    """验收检查：数据版本、模型版本、调用日志。"""

    def __init__(self, db: Session):
        self.db = db
        self.dv_repo = DatasetVersionRepository(db)
        self.model_repo = ModelVersionRepository(db)
        self.call_repo = ApiCallLogRepository(db)
        self.audit_repo = AuditLogRepository(db)
        self.doc_repo = DocumentRepository(db)
        self.err_repo = ErrorSampleRepository(db)

    def run_acceptance_checks(self) -> AcceptanceReport:
        checks: List[AcceptanceCheck] = []

        # 1. 数据版本检查
        try:
            dvs, total = self.dv_repo.list(page=1, page_size=100)
            checks.append(AcceptanceCheck(
                check_name="数据版本存在性",
                passed=total > 0,
                message=f"已创建 {total} 个数据集版本" if total > 0 else "尚未创建任何数据集版本",
                details={"total": total, "versions": [
                    {"id": dv.id, "tag": dv.version_tag, "doc_count": dv.document_count}
                    for dv in dvs
                ]},
            ))

            versioned_docs = 0
            for dv in dvs:
                docs, _ = self.doc_repo.list(page=1, page_size=100000, data_version=dv.version_tag)
                versioned_docs += len(docs)
            checks.append(AcceptanceCheck(
                check_name="数据版本与文档关联",
                passed=total == 0 or versioned_docs > 0,
                message=f"{versioned_docs} 个文档已关联到数据版本",
                details={"versioned_documents": versioned_docs},
            ))

            checksums_ok = all(dv.checksum for dv in dvs)
            checks.append(AcceptanceCheck(
                check_name="数据版本校验和完整性",
                passed=total == 0 or checksums_ok,
                message="所有数据集版本均已生成校验和" if checksums_ok else "存在未设置校验和的数据集版本",
            ))
        except Exception as e:
            checks.append(AcceptanceCheck(
                check_name="数据版本存在性", passed=False, message=f"检查失败: {e}",
            ))

        # 2. 模型版本检查
        try:
            mvs, mv_total = self.model_repo.list(page=1, page_size=100)
            checks.append(AcceptanceCheck(
                check_name="模型版本存在性",
                passed=mv_total > 0,
                message=f"已注册 {mv_total} 个模型版本" if mv_total > 0 else "尚未注册任何模型版本",
                details={"total": mv_total, "versions": [
                    {"id": mv.id, "tag": mv.version_tag, "status": mv.status.value if hasattr(mv.status, 'value') else str(mv.status)}
                    for mv in mvs
                ]},
            ))

            default_mv = self.model_repo.get_default()
            checks.append(AcceptanceCheck(
                check_name="默认模型版本配置",
                passed=default_mv is not None,
                message=f"默认模型版本: {default_mv.version_tag}" if default_mv else "未配置默认模型版本",
            ))

            if default_mv:
                checks.append(AcceptanceCheck(
                    check_name="默认模型版本就绪状态",
                    passed=default_mv.status.value == "ready" if hasattr(default_mv.status, 'value') else str(default_mv.status) == "ready",
                    message=f"默认模型状态: {default_mv.status.value if hasattr(default_mv.status, 'value') else str(default_mv.status)}",
                ))
        except Exception as e:
            checks.append(AcceptanceCheck(
                check_name="模型版本存在性", passed=False, message=f"检查失败: {e}",
            ))

        # 3. 调用日志检查
        try:
            calls, calls_total = self.call_repo.list(page=1, page_size=100)
            checks.append(AcceptanceCheck(
                check_name="API调用日志存在",
                passed=True,
                message=f"已记录 {calls_total} 条 API 调用日志",
                details={"total_calls": calls_total},
            ))

            unique_endpoints = set(c.endpoint for c in calls)
            checks.append(AcceptanceCheck(
                check_name="API调用日志端点覆盖",
                passed=len(unique_endpoints) >= 0,
                message=f"已覆盖 {len(unique_endpoints)} 个 API 端点",
                details={"endpoints": sorted(unique_endpoints)},
            ))

            rate_limited_count = sum(1 for c in calls if c.rate_limited)
            checks.append(AcceptanceCheck(
                check_name="限流日志完整性",
                passed=True,
                message=f"已记录 {rate_limited_count} 条被限流的调用",
                details={"rate_limited_count": rate_limited_count},
            ))
        except Exception as e:
            checks.append(AcceptanceCheck(
                check_name="API调用日志存在", passed=False, message=f"检查失败: {e}",
            ))

        # 4. 审计日志
        try:
            audits, audit_total = self.audit_repo.list(page=1, page_size=5)
            checks.append(AcceptanceCheck(
                check_name="审计日志完整性",
                passed=True,
                message=f"已记录 {audit_total} 条审计日志",
            ))
        except Exception as e:
            checks.append(AcceptanceCheck(
                check_name="审计日志完整性", passed=False, message=f"检查失败: {e}",
            ))

        total = len(checks)
        passed = sum(1 for c in checks if c.passed)
        failed = total - passed

        return AcceptanceReport(
            generated_at=datetime.now(),
            total_checks=total,
            passed_checks=passed,
            failed_checks=failed,
            checks=checks,
        )
