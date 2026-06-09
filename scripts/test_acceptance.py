#!/usr/bin/env python3
"""验收测试脚本：围绕数据版本、模型版本、调用日志三大验收维度。

用法:
    python -m pytest scripts/test_acceptance.py -v   # 作为 pytest 执行
    python scripts/test_acceptance.py                # 直接执行并打印报告
"""
from __future__ import annotations

import sys
import os
import json
import time
import logging
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.data.database import init_db, SessionLocal
from app.services.audit_service import AcceptanceService
from app.services.data_service import DataManagementService
from app.services.indexing_service import IndexingService
from app.services.qa_service import QAService
from app.services.feedback_service import FeedbackService
from app.schemas.data import (
    DataSourceCreate, DocumentCreate, DocumentBatchCreate, DatasetVersionCreate
)
from app.schemas.model import ModelVersionCreate
from app.schemas.qa import QARequest, SemanticSearchRequest
from app.schemas.feedback import QAFeedbackCreate, ErrorSampleCreate
from app.data.models import DataSourceType, FeedbackType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _ensure_env():
    init_db()
    db = SessionLocal()
    return db


class TestAcceptance:
    """验收测试类，可由 pytest 收集。"""

    def setup_method(self):
        self.db = _ensure_env()
        self.data_svc = DataManagementService(self.db)
        self.index_svc = IndexingService(self.db)
        self.qa_svc = QAService(self.db)
        self.fb_svc = FeedbackService(self.db)
        self.accept_svc = AcceptanceService(self.db)

    def teardown_method(self):
        self.db.close()

    # === 数据版本验收 ===

    def test_dataset_version_presence_and_checksum(self):
        """验收：数据版本存在，且所有版本均有校验和。"""
        dvs, total = self.data_svc.list_dataset_versions(page=1, page_size=100)
        if total == 0:
            ds = self.data_svc.create_data_source(DataSourceCreate(
                name="acceptance-ds", source_type=DataSourceType.CODE_REPO,
                version="v1"
            ), created_by="acceptance")
            batch = DocumentBatchCreate(
                data_source_id=ds.id,
                documents=[DocumentCreate(
                    title="dummy.py",
                    content="def hello():\n    return 42\n",
                    file_path="dummy.py",
                )]
            )
            self.data_svc.batch_create_documents(batch)
            self.data_svc.clean_documents(auto_approve_threshold=0.0)
            self.data_svc.create_dataset_version(DatasetVersionCreate(
                data_source_id=ds.id, version_tag="acceptance-v1", description="测试"
            ))
            dvs, total = self.data_svc.list_dataset_versions(page=1, page_size=100)

        assert total > 0, "必须至少存在一个数据集版本"
        for dv in dvs:
            assert dv.checksum, f"数据集版本 {dv.version_tag} 未设置 checksum"

    def test_dataset_version_linked_to_documents(self):
        """验收：数据版本与文档已关联。"""
        dvs, total = self.data_svc.list_dataset_versions(page=1, page_size=100)
        if total == 0:
            self.test_dataset_version_presence_and_checksum()
            dvs, total = self.data_svc.list_dataset_versions(page=1, page_size=100)

        any_linked = False
        for dv in dvs:
            docs, cnt = self.data_svc.list_documents(
                page=1, page_size=10, data_version=dv.version_tag,
            )
            if cnt > 0:
                any_linked = True
                break
        # 不强制要求所有版本都有文档，但至少一个有
        assert any_linked, "至少有一个数据集版本已关联文档"

    # === 模型版本验收 ===

    def test_model_version_presence(self):
        """验收：模型版本存在且默认可用。"""
        mvs, total = self.index_svc.list_model_versions(page=1, page_size=100)
        if total == 0:
            self.index_svc.create_model_version(ModelVersionCreate(
                version_tag="acceptance-model-v1",
                model_name="test-model",
                description="acceptance",
                is_default=True,
            ))
            mvs, total = self.index_svc.list_model_versions(page=1, page_size=100)
        assert total > 0, "必须至少注册一个模型版本"

        default = self.index_svc.get_default_model_version()
        assert default is not None, "必须配置默认模型版本"
        status_val = default.status.value if hasattr(default.status, "value") else str(default.status)
        assert status_val in ("ready", "training"), f"默认模型状态应为 ready，当前: {status_val}"

    # === 调用日志验收 ===

    def test_api_call_logs_exist_after_endpoint_call(self):
        """验收：调用问答接口后会产出调用日志（并验证不编造API）。"""
        from app.repositories.system_repo import ApiCallLogRepository

        call_repo = ApiCallLogRepository(self.db)
        before = call_repo.count_in_period()

        # 触发一次问答与一次语义搜索
        self.qa_svc.semantic_search(SemanticSearchRequest(query="如何创建用户？", top_k=3))
        self.qa_svc.answer_question(QARequest(question="list_users 支持什么参数？", top_k_context=3))

        # 反馈
        convs, _ = self.qa_svc.list_conversations(page=1, page_size=1)
        if convs:
            conv = convs[0]
            self.fb_svc.submit_feedback(
                conv.id,
                QAFeedbackCreate(
                    feedback_type=FeedbackType.POSITIVE,
                    comment="回答准确",
                    is_error_sample=False,
                ),
                user_id="acceptance-user"
            )

            citations = self.qa_svc.get_conversation_citations(conv.id)
            for cit in citations:
                # 验证引用字段存在，可用于跳转
                assert cit.source_title, "引用必须包含来源标题"
                # 不能同时没有 file_path 和 source_url（至少一种可跳转方式）
                assert (cit.file_path or cit.source_url), \
                    f"引用 {cit.source_title} 必须提供 file_path 或 source_url 用于跳转"

        after = call_repo.count_in_period()
        assert after > before, "问答和搜索应产生调用日志记录"

    # === 引用跳转与不编造 API 验收 ===

    def test_qa_response_has_citations_and_no_hallucination(self):
        """验收：回答包含可跳转引用；若回答某API，需在引用中能找到对应描述。"""
        answer = self.qa_svc.answer_question(QARequest(
            question="用户创建的端点是什么？",
            top_k_context=5,
            include_citations=True,
            return_reasoning=True,
        ))
        # 引用列表类型正确
        assert isinstance(answer.citations, list), "回答必须返回 citations 列表"
        # 置信度标记存在
        assert answer.confidence_level is not None
        # 如果回答提到某具体路径，应能在引用片段中找到
        ans_text = answer.answer.lower()
        import re
        endpoints_mentioned = re.findall(r"/api/v1/[\w/{}]+", ans_text)
        if endpoints_mentioned:
            cited_text = " ".join((c.snippet or "").lower() for c in answer.citations)
            for ep in endpoints_mentioned:
                # endpoint 中的 {xxx} 替换为 xxx 通配匹配，片段中可能只写路径不写变量
                assert any(
                    part in cited_text
                    for part in [ep.lower(), ep.replace("{user_id}", "").strip("/")]
                ), (
                    f"回答中提及 {ep}，但在引用片段中未发现对应描述，"
                    "疑似编造不存在的 API"
                )

    # === 综合验收报告 ===

    def test_acceptance_report_smoke(self):
        """验收：AcceptanceReport 能生成，且字段完整。"""
        report = self.accept_svc.run_acceptance_checks()
        assert report.total_checks >= 8, "验收项应至少 8 项"
        assert report.total_checks == report.passed_checks + report.failed_checks
        for c in report.checks:
            assert c.check_name
            assert isinstance(c.passed, bool)
            assert c.message


def main():
    """脚本模式入口：直接运行并打印验收结果。"""
    t = TestAcceptance()
    t.setup_method()
    all_passed = True
    results = []
    tests = [
        ("数据版本: 数据集版本存在且有校验和", t.test_dataset_version_presence_and_checksum),
        ("数据版本: 数据版本与文档已关联", t.test_dataset_version_linked_to_documents),
        ("模型版本: 模型版本存在且默认可用", t.test_model_version_presence),
        ("调用日志: 问答/搜索产生调用日志且引用可跳转", t.test_api_call_logs_exist_after_endpoint_call),
        ("不编造API: 回答中提及的API可在引用中溯源", t.test_qa_response_has_citations_and_no_hallucination),
        ("综合验收报告: 字段完整", t.test_acceptance_report_smoke),
    ]
    for name, fn in tests:
        try:
            fn()
            results.append((name, True, "OK", None))
            print(f"[PASS] {name}")
        except AssertionError as e:
            all_passed = False
            results.append((name, False, "FAIL", str(e)))
            print(f"[FAIL] {name}: {e}")
        except Exception as e:
            all_passed = False
            results.append((name, False, "ERROR", f"{type(e).__name__}: {e}"))
            print(f"[ERROR] {name}: {type(e).__name__}: {e}")

    print("\n=== 验收摘要 ===")
    passed = sum(1 for _, ok, _, _ in results if ok)
    print(f"通过: {passed}/{len(results)}")
    print(f"状态: {'全部通过' if all_passed else '存在未通过项，请根据上面日志排查'}")
    t.teardown_method()
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
