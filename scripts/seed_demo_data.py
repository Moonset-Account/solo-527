#!/usr/bin/env python3
"""初始化数据库并填充演示数据。"""
from __future__ import annotations

import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.data.database import init_db, SessionLocal
from app.data.models import DataSourceType, ModelStatus
from app.services.data_service import DataManagementService
from app.services.indexing_service import IndexingService
from app.schemas.data import (
    DataSourceCreate, DocumentCreate, DocumentBatchCreate, DatasetVersionCreate
)
from app.schemas.model import ModelVersionCreate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


SAMPLE_CODE = '''
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="User Service", version="2.3.0")

class User(BaseModel):
    id: int
    name: str
    email: str
    roles: List[str] = []

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

_users_db: dict = {}

@app.post("/api/v1/users", response_model=User, status_code=201)
def create_user(payload: UserCreate):
    """创建用户：校验邮箱唯一性并返回新创建的用户对象。"""
    if any(u["email"] == payload.email for u in _users_db.values()):
        raise HTTPException(status_code=409, detail="Email already exists")
    uid = max(_users_db.keys(), default=0) + 1
    user = {
        "id": uid, "name": payload.name,
        "email": payload.email, "roles": ["user"]
    }
    _users_db[uid] = user
    return user

@app.get("/api/v1/users/{user_id}", response_model=User)
def get_user(user_id: int):
    """按 ID 查询用户，不存在返回 404。"""
    user = _users_db.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/api/v1/users", response_model=List[User])
def list_users(role: Optional[str] = None):
    """按角色过滤列出用户列表。"""
    users = list(_users_db.values())
    if role:
        users = [u for u in users if role in u.get("roles", [])]
    return users
'''


SAMPLE_API_DOC = """# User Service API 文档 v2.3.0

## 概述
User Service 提供用户生命周期管理能力，基于 FastAPI 构建。

## 端点

### POST /api/v1/users
创建新用户。

**请求体**:
- name: string, 必填, 用户姓名
- email: string, 必填, 邮箱地址（全局唯一）
- password: string, 必填, 密码

**响应 (201)**: 返回创建后的 User 对象

**错误**:
- 409 Conflict: 邮箱已存在

### GET /api/v1/users/{user_id}
按 ID 查询用户。

**参数**: user_id (integer)

**响应 (200)**: User 对象
**错误**: 404 Not Found

### GET /api/v1/users
列出用户，支持按角色过滤。

**查询参数**: role (string, 可选)

**响应 (200)**: User[]
"""


SAMPLE_COMMIT_LOG = """
commit a1b2c3d4e5f67890 (HEAD -> main, origin/main)
Author: Alice <alice@dev.internal>
Date:   2026-05-28 14:32:11

    feat(user): 支持按角色过滤列表用户

    - 在 GET /api/v1/users 新增 role 查询参数
    - 更新 list_users 函数实现过滤逻辑
    - 相关 issue: DEV-2048

    Tests: PASS (12/12)

---

commit 0987fedcba654321
Author: Bob <bob@dev.internal>
Date:   2026-05-20 09:15:44

    fix(user): 修复用户创建时邮箱未做唯一性校验的问题

    - 在 create_user 中加入邮箱存在性检查
    - 冲突返回 409 Conflict
    - Fixes: DEV-1987
"""


SAMPLE_TEST_SPEC = """# User Service 测试说明 v1.2

## 单元测试 (tests/test_user.py)

### 用例 U-CREATE-001: 正常创建用户
- 输入: name=Test, email=test@dev.internal, password=secret
- 预期: 返回 201 + User 对象 (id=新值, email=输入值)

### 用例 U-CREATE-002: 重复邮箱
- 步骤:
  1. 创建用户 email=dup@dev.internal
  2. 再次创建相同邮箱
- 预期: 第2步返回 409, detail 含 "already exists"

### 用例 U-GET-001: 查询不存在用户
- GET /api/v1/users/999999
- 预期: 返回 404

### 用例 U-LIST-001: 角色过滤
- 前置: 存在用户 Alice 含 admin 角色, Bob 仅含 user 角色
- 调用: GET /api/v1/users?role=admin
- 预期: 只返回 Alice
"""


SAMPLE_ARCH_NOTE = """# 用户域架构笔记 2026-Q2

## 上下文与边界
User Service 属于身份域 (Identity Domain)，为其他 BFF 提供只读查询和写操作。
- 上游：Gateway, Auth Service
- 下游：PostgreSQL (users 表), Redis (会话缓存)

## 核心模块
1. handlers (FastAPI 路由): 参数校验、鉴权、错误转 HTTP 状态码
2. services: 业务编排 (create_user, assign_roles)
3. repositories: 数据访问层 (UserRepo)
4. domain: 领域对象 (User, Role)

## 关键决策
ADR-017: 采用邮箱作为幂等键，而不是引入独立的外部 ID。
- Rationale: 业务语义强，易与其他系统对齐
- Trade-off: 邮箱变更流程需额外设计 (邮箱迁移 API)

ADR-022: 列表查询默认分页，上限 100 条。

## TODO
- 引入软删除 (status 字段)
- 审计日志接入统一 Kafka Topic
"""


def seed():
    logger.info("Initializing DB...")
    init_db()
    db = SessionLocal()
    try:
        data_svc = DataManagementService(db)
        index_svc = IndexingService(db)

        # --- DataSources ---
        ds_code = data_svc.create_data_source(DataSourceCreate(
            name="User Service Source Code",
            source_type=DataSourceType.CODE_REPO,
            description="用户服务源码仓库 (FastAPI)",
            version="main",
        ), created_by="seed")

        ds_api = data_svc.create_data_source(DataSourceCreate(
            name="User Service API Docs",
            source_type=DataSourceType.API_DOC,
            description="User Service 接口文档",
            version="v2.3.0",
        ), created_by="seed")

        ds_commit = data_svc.create_data_source(DataSourceCreate(
            name="User Service Commits",
            source_type=DataSourceType.COMMIT_LOG,
            description="用户服务 Git 提交记录摘要",
            version="main",
        ), created_by="seed")

        ds_test = data_svc.create_data_source(DataSourceCreate(
            name="User Service Test Specs",
            source_type=DataSourceType.TEST_SPEC,
            description="用户服务测试说明",
            version="v1.2",
        ), created_by="seed")

        ds_arch = data_svc.create_data_source(DataSourceCreate(
            name="User Domain Architecture Notes",
            source_type=DataSourceType.ARCH_NOTE,
            description="用户域架构笔记",
            version="2026-Q2",
        ), created_by="seed")
        logger.info("DataSources created.")

        # --- Documents ---
        docs = [
            DocumentCreate(
                title="user_service.py",
                file_path="src/services/user_service.py",
                source_url="https://git.internal/dev/user-service/blob/main/src/services/user_service.py#L1-L80",
                line_start=1, line_end=80,
                content=SAMPLE_CODE,
                language="python",
                metadata={"module": "user_service", "type": "source_code"},
            ),
            DocumentCreate(
                title="User Service API Documentation",
                file_path="docs/api/user-service-v2.3.0.md",
                source_url="https://docs.internal/user-service/v2.3.0/api",
                line_start=1, line_end=50,
                content=SAMPLE_API_DOC,
                language="markdown",
                metadata={"doc_type": "api_reference", "service": "user_service"},
            ),
            DocumentCreate(
                title="Git Commit Log - 2026 May",
                file_path="CHANGELOG/commit-log-2026-05.md",
                source_url="https://git.internal/dev/user-service/commits/main",
                content=SAMPLE_COMMIT_LOG,
                language="markdown",
                metadata={"type": "commit_log", "month": "2026-05"},
            ),
            DocumentCreate(
                title="User Service Test Specification",
                file_path="docs/test/user-service-tests-v1.2.md",
                source_url="https://docs.internal/user-service/v1.2/tests",
                content=SAMPLE_TEST_SPEC,
                language="markdown",
                metadata={"doc_type": "test_spec", "version": "1.2"},
            ),
            DocumentCreate(
                title="User Domain Architecture Note 2026-Q2",
                file_path="docs/architecture/user-domain-2026-Q2.md",
                source_url="https://confluence.internal/architecture/user-domain-2026-Q2",
                content=SAMPLE_ARCH_NOTE,
                language="markdown",
                metadata={"doc_type": "architecture_note", "quarter": "2026-Q2"},
            ),
        ]

        ds_map = {
            0: ds_code.id, 1: ds_api.id, 2: ds_commit.id, 3: ds_test.id, 4: ds_arch.id
        }

        for idx, doc in enumerate(docs):
            batch = DocumentBatchCreate(data_source_id=ds_map[idx], documents=[doc])
            data_svc.batch_create_documents(batch)
        logger.info("Documents created.")

        # --- Clean ---
        report = data_svc.clean_documents(auto_approve_threshold=0.6)
        logger.info(f"Clean report: {report}")

        # --- Dataset Version ---
        dv = data_svc.create_dataset_version(DatasetVersionCreate(
            data_source_id=ds_code.id,
            version_tag="v1.0.0",
            description="初始数据集版本 (User Service 全量)",
        ), created_by="seed")
        logger.info(f"Dataset version created: {dv.version_tag}, checksum={dv.checksum}")

        # --- Model Version ---
        mv = index_svc.create_model_version(ModelVersionCreate(
            version_tag="v1.0.0",
            model_name="code-qa-base",
            embedding_model="BAAI/bge-small-en-v1.5",
            llm_model="HuggingFaceH4/zephyr-7b-beta",
            description="默认问答模型版本 v1.0.0，基于初始化数据集训练。",
            is_default=True,
            metrics={"initial": True},
            training_config={"chunk_size": 512, "chunk_overlap": 64},
        ), created_by="seed")
        logger.info(f"Model version created: {mv.version_tag}, status={mv.status}")

        # --- Index Build (Training) ---
        logger.info("Starting index build (training) ...")
        job = index_svc.start_index_build(
            model_version_tag=mv.version_tag,
            dataset_version_id=dv.id,
        )
        logger.info(
            f"Index job finished: status={job.status}, "
            f"indexed={job.indexed_count}/{job.document_count}, errors={job.failed_count}"
        )

        logger.info("SEED FINISHED. You can now call the API.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
