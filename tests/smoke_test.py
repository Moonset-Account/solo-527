import os
import sys
import tempfile
import traceback
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.core.database import init_db, get_sync_session, Base, sync_engine
from app.models.user import User, UserRole
from app.models.dataset import (
    Dataset, DatasetSample, DatasetVersion,
    DatasetType, SampleStatus, SampleType,
)
from app.models.contract import RiskType, RiskLevel, ClauseCategory
from app.services.data.cleaner import DataCleaner, CleanResult
from app.services.data.parser import DocumentParser, ParsedDocument
from app.services.risk.engine import RiskEngine, RiskDetectionResult, SourceReference
from app.services.ai.summarizer import (
    ContractSummarizer, SummaryResult,
    KeyPoint, KeyParty, KeyDate, KeyAmount, KeyObligation,
)
from app.services.data.dataset_manager import DatasetManager
from app.services.ai.vector_store import (
    VectorStoreManager, VectorStoreBackend, IndexedClause,
)

from sqlalchemy import text, select

TOTAL_TESTS = 0
PASSED_TESTS = 0
FAILED_TESTS = 0
SKIPPED_TESTS = 0
FAILED_DETAILS: List[Dict[str, Any]] = []


@dataclass
class TestResult:
    name: str
    status: str
    message: str
    error: Optional[str] = None


def _run_test(name: str, test_fn) -> TestResult:
    global TOTAL_TESTS, PASSED_TESTS, FAILED_TESTS, FAILED_DETAILS
    TOTAL_TESTS += 1
    try:
        test_fn()
        PASSED_TESTS += 1
        result = TestResult(name=name, status="PASS", message="测试通过")
        print(f"  ✅ PASS: {name} - {result.message}")
        return result
    except AssertionError as e:
        FAILED_TESTS += 1
        err_detail = traceback.format_exc()
        FAILED_DETAILS.append({"name": name, "error": str(e), "traceback": err_detail})
        result = TestResult(name=name, status="FAIL", message=str(e), error=err_detail)
        print(f"  ❌ FAIL: {name} - {result.message}")
        return result
    except Exception as e:
        FAILED_TESTS += 1
        err_detail = traceback.format_exc()
        FAILED_DETAILS.append({"name": name, "error": str(e), "traceback": err_detail})
        result = TestResult(name=name, status="FAIL", message=f"异常: {str(e)}", error=err_detail)
        print(f"  ❌ FAIL: {name} - {result.message}")
        return result


def _skip_test(name: str, reason: str) -> TestResult:
    global TOTAL_TESTS, SKIPPED_TESTS
    TOTAL_TESTS += 1
    SKIPPED_TESTS += 1
    result = TestResult(name=name, status="SKIP", message=f"跳过: {reason}")
    print(f"  ⏭️  SKIP: {name} - {result.message}")
    return result


def test_01_config_loading():
    """测试1: 配置加载"""
    assert settings.APP_NAME == "ContractRiskAI", \
        f"APP_NAME 应为 'ContractRiskAI', 实际为 '{settings.APP_NAME}'"
    assert settings.DATABASE_URL is not None, "DATABASE_URL 不应为空"
    assert hasattr(settings, "RISK_THRESHOLD_HIGH"), "缺少 RISK_THRESHOLD_HIGH 配置"


def test_02_database_init():
    """测试2: 数据库连接与初始化"""
    init_db()
    db = get_sync_session()
    try:
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result.fetchall()]
        assert len(tables) > 0, "数据库表未创建成功"

        default_user = db.execute(
            select(User).where(User.username == "admin")
        ).scalar_one_or_none()

        if default_user is None:
            default_user = User(
                username="admin",
                email="admin@contractrisk.ai",
                full_name="系统管理员",
                role=UserRole.ADMIN,
                is_active=True,
                hashed_password="placeholder_hash",
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)

        assert default_user is not None, "默认用户创建失败"
        assert default_user.username == "admin", f"默认用户名应为 admin, 实际为 {default_user.username}"
        assert default_user.role == UserRole.ADMIN, f"默认用户角色应为 ADMIN"
    finally:
        db.close()


def test_03_data_cleaner():
    """测试3: 数据清洗器"""
    cleaner = DataCleaner()
    dirty_text = "这是一个正常的合同条款。\x00\x01\x02垃圾字符\ufffd\ufffd这里有乱码???还有重复重复重复重复重复文本___\n\n\n\n正常内容在这里。第 1 页 / 共 10 页\n仅供参考 DRAFT\n\n\n这是结尾。"
    result = cleaner.clean_text(dirty_text)

    assert isinstance(result, CleanResult), "清洗结果类型不正确"
    assert result.quality_score < 1.0, \
        f"含垃圾字符的文本 quality_score 应 < 1.0, 实际为 {result.quality_score}"
    assert len(result.issues) > 0, "应检测到至少一个质量问题"
    assert "\x00" not in result.cleaned_text, "垃圾字符未被清理"
    assert "\ufffd" not in result.cleaned_text, "编码错误字符未被清理"
    assert len(result.cleaned_text) > 0, "清洗后文本不应为空"


def test_04_document_parser():
    """测试4: 文档解析器 (TXT)"""
    parser = DocumentParser()

    contract_text = """购销合同

合同编号：HT2024001
签订日期：2024年01月15日

甲方：北京科技有限公司
乙方：上海贸易有限公司

第一条 商品信息
甲方同意向乙方购买以下商品：
1. 电脑设备 100台，单价5000元
2. 办公桌椅 50套，单价2000元

第二条 合同金额
合同总金额为人民币陆拾万元整（￥600,000.00元）。

第三条 付款方式
甲方应在合同签订后3个工作日内支付30%预付款，
验收合格后10个工作日内支付剩余70%款项。

第四条 交货时间
乙方应在收到预付款后30个工作日内完成交货。

第五条 违约责任
任何一方违约，应向守约方支付合同总额50%的违约金。

第六条 争议解决
本合同履行过程中发生的争议，双方协商解决；
协商不成的，提交甲方所在地人民法院管辖。

第七条 其他
本合同一式两份，甲乙双方各执一份，具有同等法律效力。

甲方（盖章）：                乙方（盖章）：
日期：2024年01月15日          日期：2024年01月15日
"""

    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
        f.write(contract_text)
        temp_path = f.name

    try:
        doc = parser.parse(temp_path, original_name="测试合同.txt")
        assert isinstance(doc, ParsedDocument), "解析结果类型不正确"
        assert doc.clauses is not None, "条款列表不应为 None"
        assert len(doc.clauses) >= 1, \
            f"解析后的条款数量应 >= 1, 实际为 {len(doc.clauses)}"
        assert len(doc.full_text) > 0, "全文文本不应为空"
        assert doc.file_name == "测试合同.txt", "文件名不正确"
    finally:
        os.unlink(temp_path)


def test_05_risk_engine_penalty():
    """测试5: 风险规则匹配 - 违约金过高"""
    engine = RiskEngine()

    test_text = "第五条 违约责任 任何一方违约，应向守约方支付违约金为合同总额的50%。"

    class MockClause:
        def __init__(self, text, cid=1):
            self.id = cid
            self.cleaned_text = text
            self.original_text = text
            self.clause_number = "第五条"
            self.page_start = 1
            self.char_start = 0
            self.clause_title = "违约责任"
            self.category = ClauseCategory.LIABILITY

    mock_clause = MockClause(test_text)
    results = engine.detect_risks(
        clauses=[mock_clause],
        full_text=test_text,
    )

    penalty_risks = [r for r in results if r.risk_type == RiskType.EXCESSIVE_PENALTY]
    assert len(penalty_risks) > 0, \
        f"应检测到 EXCESSIVE_PENALTY 风险，实际检测到 {len(results)} 条风险：{[r.risk_type.value for r in results]}"

    target_risk = penalty_risks[0]
    assert target_risk.risk_level == RiskLevel.HIGH, \
        f"违约金过高风险级别应为 HIGH，实际为 {target_risk.risk_level.value}"
    assert len(target_risk.source_references) > 0, \
        "SourceReference 不应为空"
    for ref in target_risk.source_references:
        assert isinstance(ref, SourceReference), "来源引用类型不正确"
        assert len(ref.original_snippet) > 0, "来源引用原文片段不应为空"


def test_06_summarizer_mock():
    """测试6: 摘要器 (Mock LLM)"""
    summarizer = ContractSummarizer()

    test_document_id = 999
    test_clauses = [
        {
            "clause_id": 1,
            "clause_title": "合同双方",
            "text": "甲方：北京科技有限公司，乙方：上海贸易有限公司，双方本着平等互利原则签订本合同。",
            "category": "parties",
        },
        {
            "clause_id": 2,
            "clause_title": "合同金额",
            "text": "合同总金额为人民币600,000元整，分两期支付。",
            "category": "price_payment",
        },
    ]

    summary = SummaryResult(
        document_id=test_document_id,
        full_summary="本合同为北京科技有限公司与上海贸易有限公司之间的购销合同，合同总金额600,000元。",
        key_points=[
            KeyPoint(
                content="合同涉及商品购销",
                category="other",
                importance=8,
                source_clause_id=1,
                source_clause_ref="[1:合同双方]",
            )
        ],
        key_parties=[
            KeyParty(name="北京科技有限公司", role="甲方", source_clause_id=1),
            KeyParty(name="上海贸易有限公司", role="乙方", source_clause_id=1),
        ],
        key_dates=[
            KeyDate(description="签订日期", date_value="2024-01-15", source_clause_id=1),
        ],
        key_amounts=[
            KeyAmount(description="合同总金额", amount_value=600000.0, currency="CNY", source_clause_id=2),
        ],
        key_obligations=[
            KeyObligation(
                party="甲方",
                obligation_content="支付货款",
                deadline="验收后10个工作日",
                source_clause_id=2,
            ),
        ],
        model_version="mock-v1.0",
    )

    assert isinstance(summary, SummaryResult), "摘要结果类型不正确"
    assert summary.document_id == test_document_id, f"document_id 应为 {test_document_id}"
    assert len(summary.full_summary) > 0, "full_summary 不应为空"
    assert isinstance(summary.key_points, list), "key_points 应为列表"
    assert isinstance(summary.key_parties, list), "key_parties 应为列表"
    assert isinstance(summary.key_dates, list), "key_dates 应为列表"
    assert isinstance(summary.key_amounts, list), "key_amounts 应为列表"
    assert isinstance(summary.key_obligations, list), "key_obligations 应为列表"
    assert len(summary.key_parties) == 2, "应包含甲乙双方"

    summary_dict = summary.to_dict()
    assert isinstance(summary_dict, dict), "to_dict() 应返回字典"
    assert "document_id" in summary_dict, "字典应包含 document_id"
    assert "key_parties" in summary_dict, "字典应包含 key_parties"


def test_07_dataset_manager():
    """测试7: 数据集Manager - 创建/添加样本/回滚"""
    db = get_sync_session()
    try:
        admin = db.execute(
            select(User).where(User.username == "admin")
        ).scalar_one_or_none()
        owner_id = admin.id if admin else None

        manager = DatasetManager(db=db)

        dataset = manager.create_dataset(
            name="冒烟测试数据集",
            dataset_type=DatasetType.TRAIN,
            description="用于冒烟测试的临时数据集",
            owner_id=owner_id,
            version="1.0",
        )
        assert dataset is not None, "数据集创建失败"
        assert dataset.id is not None, "数据集ID不应为空"
        dataset_id = dataset.id

        sample1 = manager.add_sample(
            dataset_id=dataset_id,
            sample_type=SampleType.RISK_DETECTION,
            input_text="违约金为合同总额的50%",
            reference_output="检测到违约金过高风险，建议调整至30%以内",
            status=SampleStatus.APPROVED,
            difficulty_level=2,
        )
        assert sample1 is not None, "样本1创建失败"
        sample1_id = sample1.id

        sample2 = manager.add_sample(
            dataset_id=dataset_id,
            sample_type=SampleType.CLAUSE_SUMMARY,
            input_text="甲方应在验收后10个工作日内支付剩余70%款项",
            reference_output="付款条款：验收后10个工作日付70%",
            status=SampleStatus.DRAFT,
        )
        assert sample2 is not None, "样本2创建失败"

        refreshed_ds = manager.get_dataset(dataset_id)
        assert refreshed_ds.sample_count >= 2, \
            f"数据集样本数应 >= 2, 实际为 {refreshed_ds.sample_count}"

        versions = manager.list_versions(dataset_id)
        assert len(versions) >= 1, "至少应有初始版本记录"

        manager.update_sample(
            sample_id=sample1_id,
            reference_output="【修改后】检测到违约金过高风险(HIGH)，依据民法典585条建议降至30%",
            status=SampleStatus.APPROVED,
        )

        samples_after_update, _ = manager.get_samples(
            dataset_id=dataset_id, page=1, page_size=100
        )
        original_sample = next((s for s in samples_after_update if s.id == sample1_id), None)
        assert original_sample is not None, "修改后的样本应存在"

    finally:
        db.close()


def test_08_vector_store_faiss():
    """测试8: 向量存储 (内存FAISS)"""
    try:
        import numpy as np
        from unittest.mock import patch, MagicMock

        class MockEmbeddings:
            def embed_documents(self, texts):
                rng = np.random.RandomState(42)
                result = []
                for t in texts:
                    seed = sum(ord(c) for c in t) % 10000
                    local_rng = np.random.RandomState(seed)
                    vec = local_rng.rand(384).astype(np.float32)
                    vec = vec / np.linalg.norm(vec)
                    result.append(vec.tolist())
                return result

            def embed_query(self, text):
                return self.embed_documents([text])[0]

        mock_embeddings = MockEmbeddings()

        with tempfile.TemporaryDirectory() as tmpdir:
            from langchain_community.vectorstores import FAISS
            from langchain_core.documents import Document

            docs = [
                Document(
                    page_content="本合同违约金不得超过合同总金额的30%。",
                    metadata={
                        "clause_id": 1, "document_id": 100, "clause_index": 0,
                        "category": "liability", "quality_score": 0.95,
                        "embedding_id": "e1", "page_start": 1, "page_end": 1,
                        "created_at": datetime.utcnow().isoformat(),
                    },
                ),
                Document(
                    page_content="甲方应于验收合格后10个工作日内支付剩余款项。",
                    metadata={
                        "clause_id": 2, "document_id": 100, "clause_index": 1,
                        "category": "payment", "quality_score": 0.98,
                        "embedding_id": "e2", "page_start": 1, "page_end": 1,
                        "created_at": datetime.utcnow().isoformat(),
                    },
                ),
                Document(
                    page_content="因不可抗力导致无法履行合同的，双方均不承担违约责任。",
                    metadata={
                        "clause_id": 3, "document_id": 100, "clause_index": 2,
                        "category": "force_majeure", "quality_score": 0.9,
                        "embedding_id": "e3", "page_start": 2, "page_end": 2,
                        "created_at": datetime.utcnow().isoformat(),
                    },
                ),
            ]

            vectorstore = FAISS.from_documents(docs, mock_embeddings)

            query = "违约金比例上限是多少？"
            results_with_scores = vectorstore.similarity_search_with_score(query, k=3)

            assert len(results_with_scores) >= 1, \
                f"搜索应返回至少1条结果，实际返回 {len(results_with_scores)} 条"

            found_relevant = False
            for doc, score in results_with_scores:
                if "违约金" in doc.page_content or "违约" in doc.page_content:
                    found_relevant = True
                    break

            assert found_relevant, \
                f"搜索违约金相关问题应返回含违约金的条款，实际返回: {[d.page_content[:50] for d, _ in results_with_scores]}"

            page_contents = [d.page_content for d, _ in results_with_scores]
            assert len(page_contents) > 0, "至少应有一条搜索结果"

    except ImportError as e:
        raise AssertionError(f"缺少必要依赖: {e}")


def print_header(title: str):
    print("\n" + "=" * 70)
    print(f"  🧪 {title}")
    print("=" * 70)


def print_summary():
    global TOTAL_TESTS, PASSED_TESTS, FAILED_TESTS, SKIPPED_TESTS, FAILED_DETAILS
    print("\n" + "=" * 70)
    print("  📊 冒烟测试结果汇总")
    print("=" * 70)
    print(f"  总测试数:  {TOTAL_TESTS}")
    print(f"  ✅ 通过:    {PASSED_TESTS}")
    print(f"  ❌ 失败:    {FAILED_TESTS}")
    print(f"  ⏭️  跳过:    {SKIPPED_TESTS}")
    print(f"  📈 通过率:  {PASSED_TESTS / TOTAL_TESTS * 100:.1f}%" if TOTAL_TESTS > 0 else "  📈 通过率:  N/A")
    print("=" * 70)

    if FAILED_DETAILS:
        print("\n" + "=" * 70)
        print("  🔍 失败用例详细信息")
        print("=" * 70)
        for idx, detail in enumerate(FAILED_DETAILS, 1):
            print(f"\n  [{idx}] {detail['name']}")
            print(f"      错误信息: {detail['error']}")
            print(f"      Traceback:")
            for line in detail['traceback'].split('\n'):
                print(f"        {line}")
        print("=" * 70)

    print("\n")
    return FAILED_TESTS == 0


def run_all():
    global TOTAL_TESTS, PASSED_TESTS, FAILED_TESTS, SKIPPED_TESTS, FAILED_DETAILS
    TOTAL_TESTS = 0
    PASSED_TESTS = 0
    FAILED_TESTS = 0
    SKIPPED_TESTS = 0
    FAILED_DETAILS = []

    print("\n" + "🚀" * 35)
    print("  ContractRiskAI 冒烟测试套件 v1.0")
    print("  测试时间:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("🚀" * 35)

    print_header("基础模块测试")
    _run_test("01_配置加载", test_01_config_loading)
    _run_test("02_数据库初始化", test_02_database_init)

    print_header("数据处理模块测试")
    _run_test("03_数据清洗器", test_03_data_cleaner)
    _run_test("04_文档解析器(TXT)", test_04_document_parser)

    print_header("AI引擎模块测试")
    _run_test("05_风险规则匹配(违约金)", test_05_risk_engine_penalty)
    _run_test("06_摘要器结构(Mock)", test_06_summarizer_mock)

    print_header("数据管理模块测试")
    _run_test("07_数据集Manager(CRUD)", test_07_dataset_manager)

    print_header("向量检索模块测试")
    _run_test("08_向量存储(FAISS)", test_08_vector_store_faiss)

    all_passed = print_summary()
    return 0 if all_passed else 1


if __name__ == "__main__":
    exit_code = run_all()
    sys.exit(exit_code)
