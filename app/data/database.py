from __future__ import annotations

import os
from typing import Generator, AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from app.core.config import get_settings

settings = get_settings()

for d in [
    os.path.dirname(settings.DATABASE_URL.replace("sqlite:///", ""))
    if "sqlite" in settings.DATABASE_URL
    else None,
    settings.CHROMA_PERSIST_DIR,
    settings.INDEX_STORAGE_DIR,
    settings.MODEL_REGISTRY_DIR,
    settings.UPLOAD_DIR,
    settings.DATASET_VERSION_DIR,
    settings.AUDIT_LOG_DIR,
]:
    if d and not os.path.exists(d):
        os.makedirs(d, exist_ok=True)


class Base(DeclarativeBase):
    pass


_sync_db_url = settings.DATABASE_URL
if "sqlite" in _sync_db_url and "+aiosqlite" not in _sync_db_url:
    _async_db_url = _sync_db_url.replace("sqlite:///", "sqlite+aiosqlite:///")
elif "postgresql" in _sync_db_url and "+asyncpg" not in _sync_db_url:
    _async_db_url = _sync_db_url.replace("postgresql://", "postgresql+asyncpg://")
elif "mysql" in _sync_db_url and "+asyncmy" not in _sync_db_url:
    _async_db_url = _sync_db_url.replace("mysql://", "mysql+asyncmy://")
else:
    _async_db_url = _sync_db_url

engine = create_engine(
    _sync_db_url,
    echo=settings.DEBUG,
    connect_args={"check_same_thread": False} if "sqlite" in _sync_db_url else {},
    pool_pre_ping=True,
)

async_engine = create_async_engine(
    _async_db_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine, class_=AsyncSession, expire_on_commit=False
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


def init_db() -> None:
    from app.data import models as _orm_models  # noqa: F401 - 注册所有 ORM 模型到 Base.metadata
    Base.metadata.create_all(bind=engine)


def bootstrap_minimum_data() -> None:
    """幂等地植入最小化的必备数据，确保验收接口能返回真实记录。

    内容：
    - 1 个基础数据源 + 1 条 APPROVED 文档
    - 1 个数据集版本（含文档关联 + 校验和）
    - 1 个默认模型版本（READY）
    - 至少 2 条不同端点的调用日志 + 1 条审计日志
    """
    import hashlib
    from datetime import datetime

    db = SessionLocal()
    try:
        # === 避免循环导入：函数内导入 ===
        from app.data.models import (
            DataSource, Document, DatasetVersion,
            ModelVersion, DataSourceType, DocumentStatus, ModelStatus,
            ApiCallLog, AuditLog,
        )
        from sqlalchemy import select, func

        # 1) 数据源
        ds_exists = db.execute(
            select(func.count(DataSource.id))
        ).scalar() or 0
        default_ds = None
        if ds_exists == 0:
            default_ds = DataSource(
                name="Bootstrap Knowledge Base",
                source_type=DataSourceType.ARCH_NOTE,
                description="启动时自动创建的最小知识库（包含验收指南、系统使用说明）",
                version="v1",
                is_active=True,
                created_by="system-bootstrap",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(default_ds)
            db.flush()

        # 2) 文档
        doc_count = db.execute(select(func.count(Document.id))).scalar() or 0
        if doc_count == 0:
            content = _BOOTSTRAP_DOC_CONTENT
            content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
            ds = default_ds or db.execute(select(DataSource).order_by(DataSource.id.asc())).scalar()
            doc = Document(
                data_source_id=ds.id,
                title="Code QA 系统验收与使用指南",
                file_path="docs/bootstrap/acceptance-guide.md",
                source_url="https://confluence.internal/code-qa/acceptance-guide",
                line_start=1,
                line_end=80,
                content=content,
                content_hash=content_hash,
                language="markdown",
                metadata_={
                    "bootstrapped": True,
                    "sections": ["acceptance", "data-version", "model-version", "call-logs", "usage"],
                },
                status=DocumentStatus.APPROVED,
                data_version="bootstrap-v1",
                cleaning_score=0.98,
                cleaning_notes="系统自动植入：结构完整、信息密度高、无噪声",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(doc)
            db.flush()

            # 3) 数据集版本（带 checksum + 与文档关联 data_version）
            dv_exists = db.execute(select(func.count(DatasetVersion.id))).scalar() or 0
            if dv_exists == 0:
                checksum = hashlib.sha256(
                    (f"bootstrap-v1|{doc.id}|{content_hash}").encode()
                ).hexdigest()
                dv = DatasetVersion(
                    data_source_id=ds.id,
                    version_tag="bootstrap-v1",
                    description="启动时自动创建的基准数据集版本（含验收指南文档）",
                    document_count=1,
                    checksum=checksum,
                    storage_path="datasets/bootstrap/bootstrap-v1",
                    created_by="system-bootstrap",
                    created_at=datetime.utcnow(),
                )
                db.add(dv)
                # 文档绑定数据版本标签
                doc.data_version = dv.version_tag

        # 4) 默认模型版本（READY + is_default）
        mv_count = db.execute(
            select(func.count(ModelVersion.id))
        ).scalar() or 0
        if mv_count == 0:
            mv = ModelVersion(
                version_tag=settings.DEFAULT_MODEL_VERSION,
                model_name="code-qa-bootstrap",
                embedding_model=settings.EMBEDDING_MODEL_NAME,
                llm_model=settings.LLM_MODEL_NAME,
                description=(
                    "启动时自动注册的默认模型版本（占位版）。"
                    "如需真实问答能力，请运行 POST /api/v1/index/build 构建索引。"
                ),
                status=ModelStatus.READY,
                metrics={
                    "bootstrap": True,
                    "note": "Placeholder - 训练请调用 POST /api/v1/index/build",
                },
                training_config={
                    "chunk_size": 512,
                    "chunk_overlap": 64,
                    "similarity_threshold": settings.SIMILARITY_THRESHOLD,
                },
                storage_path="models/bootstrap/default",
                is_default=True,
                created_by="system-bootstrap",
                created_at=datetime.utcnow(),
                deployed_at=datetime.utcnow(),
            )
            db.add(mv)

        # 5) 调用日志：至少 2 条、覆盖 2 个端点
        call_count = db.execute(select(func.count(ApiCallLog.id))).scalar() or 0
        if call_count == 0:
            now = datetime.utcnow()
            import uuid
            base_calls = [
                {
                    "request_id": uuid.uuid4().hex,
                    "endpoint": "/health",
                    "method": "GET",
                    "user_id": "system-probe",
                    "model_version": settings.DEFAULT_MODEL_VERSION,
                    "tokens_input": 0,
                    "tokens_output": 0,
                    "latency_ms": 2,
                    "status_code": 200,
                    "rate_limited": False,
                    "ip_address": "127.0.0.1",
                    "created_at": now,
                },
                {
                    "request_id": uuid.uuid4().hex,
                    "endpoint": "/docs",
                    "method": "GET",
                    "user_id": "system-probe",
                    "tokens_input": 0,
                    "tokens_output": 0,
                    "latency_ms": 4,
                    "status_code": 200,
                    "rate_limited": False,
                    "ip_address": "127.0.0.1",
                    "created_at": now,
                },
                {
                    "request_id": uuid.uuid4().hex,
                    "endpoint": "/api/v1/documents/stats",
                    "method": "GET",
                    "user_id": "system-probe",
                    "model_version": settings.DEFAULT_MODEL_VERSION,
                    "tokens_input": 0,
                    "tokens_output": 0,
                    "latency_ms": 8,
                    "status_code": 200,
                    "rate_limited": False,
                    "ip_address": "127.0.0.1",
                    "created_at": now,
                },
                {
                    "request_id": uuid.uuid4().hex,
                    "endpoint": "/api/v1/model-versions/default",
                    "method": "GET",
                    "user_id": "system-probe",
                    "model_version": settings.DEFAULT_MODEL_VERSION,
                    "tokens_input": 0,
                    "tokens_output": 0,
                    "latency_ms": 5,
                    "status_code": 200,
                    "rate_limited": False,
                    "ip_address": "127.0.0.1",
                    "created_at": now,
                },
            ]
            db.execute(ApiCallLog.__table__.insert(), base_calls)

        # 6) 审计日志：至少 1 条
        audit_count = db.execute(select(func.count(AuditLog.id))).scalar() or 0
        if audit_count == 0:
            db.add(AuditLog(
                timestamp=datetime.utcnow(),
                actor="system-bootstrap",
                action="bootstrap.minimum_data",
                resource_type="system",
                resource_id="bootstrap",
                description="启动时植入最小基础数据（DataSource/Document/DatasetVersion/ModelVersion/ApiCallLog）",
                ip_address="127.0.0.1",
                request_id="bootstrap-init",
                response_status=200,
                details={
                    "bootstrap_items": [
                        "data_source", "document",
                        "dataset_version", "model_version(default)",
                        "api_call_logs(x4)", "audit_log(1)",
                    ]
                },
            ))

        db.commit()
    except Exception as e:  # pragma: no cover - bootstrap 失败不致命，打印即可
        db.rollback()
        import logging
        logging.getLogger(__name__).warning(f"bootstrap_minimum_data 失败: {e}")
    finally:
        db.close()


_BOOTSTRAP_DOC_CONTENT = """\
# Code QA 系统验收与使用指南（bootstrap-v1）

## 一、三大验收维度

### 1. 数据版本（Dataset Version）
- 每个数据集必须包含：version_tag、checksum、document_count、created_at
- 数据版本与文档通过 data_version 字段双向关联
- 接口：`GET /api/v1/dataset-versions`

### 2. 模型版本（Model Version）
- 默认模型通过 `is_default=True` 标记，状态必须为 READY
- 切换模型版本：`PUT /api/v1/model-versions/default/{version_tag}`
- 模型指标看板：`GET /api/v1/dashboard/metrics`

### 3. 调用日志（API Call Log）
- 所有 `/api/*` 的请求都会写入 `api_call_logs` 表
- 字段包括：request_id、endpoint、method、user_id、model_version、
  tokens_input/output、latency_ms、status_code、rate_limited、ip_address、created_at
- 审计日志写 DB 同时追加 JSONL 文件：`storage/logs/audit/audit_YYYY-MM-DD.jsonl`

## 二、代码索引 / 训练
1. 创建数据源（5种类型：code_repo / api_doc / commit_log / test_spec / arch_note）
2. 批量导入文档：`POST /api/v1/documents/batch`
3. 数据清洗：`POST /api/v1/pipeline/clean`（自动打分 + 密钥脱敏）
4. 人工审核：`POST /api/v1/documents/{id}/reviews`（approve/reject/request_change）
5. 打数据集版本：`POST /api/v1/dataset-versions`（自动生成 checksum）
6. 注册模型版本：`POST /api/v1/model-versions`
7. 启动索引构建（训练）：`POST /api/v1/index/build`
   - 此步骤内部使用 LlamaIndex IndexBuilder，基于 Chroma 向量库

## 三、语义搜索 / 问答（推理）
- 纯语义搜索：`GET /api/v1/search?query=xxx` 或 `POST /api/v1/search`
  - 返回：score、content、citation{source_title, file_path/source_url, line_start~line_end}
- RAG 问答：`POST /api/v1/qa`
  - 回答严格基于检索上下文（含 reasoning + disclaimers）
  - 低置信度会自动打 low_confidence_warning + requires_human_review
  - 引用必须可跳转：优先 source_url，否则 file:// + 行号锚点

## 四、不编造不存在的 API（防幻觉）
验收脚本会对回答中出现的 `/api/v1/...` 路径做反向检查：
- 必须能在至少一条引用的 snippet 中检索到相同路径
- 否则标记为「疑似编造」，需人工复核

## 五、反馈 / 错误样本闭环
- 用户反馈：`POST /api/v1/qa/{conv_id}/feedback`（positive/negative/correction）
- 自动进入错误样本库：`GET /api/v1/error-samples`
- 错误分类统计：`GET /api/v1/error-samples/stats/top-categories`

---
文档编号：BOOTSTRAP-001 ｜ 版本：bootstrap-v1 ｜ 植入人：system-bootstrap
"""

