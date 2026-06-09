# 校园作文反馈助手

服务语文教研组的 AI 作文反馈系统。学生提交作文后，系统从**结构、论据、错别字、表达**四个维度给出建议，教师可查看模型依据、改写评价，并通过审核机制筛选出可靠反馈供班级报告引用。

## 技术架构

- **后端框架**: FastAPI + Pydantic v2
- **数据库**: PostgreSQL + SQLAlchemy 2.0
- **AI 模型**: Transformers (RoBERTa 中文模型) + 启发式规则双路策略
- **安全**: JWT 认证 + 数据脱敏 + Fernet 字段级加密

## 核心业务原则

| 原则 | 实现方式 |
|------|---------|
| **不替老师打最终分** | `final_score` 仅由 `TeacherReview` 接口由教师手动录入 |
| **不生成整篇代写** | 仅给出修改建议（`suggestion_text`），不输出重写全文 |
| **教师审核机制** | 每条建议可标为 `APPROVED` / `NEEDS_REVISION` / `REJECTED`，可附 `revised_suggestion` |
| **报告仅用已审核内容** | 班级统计/导出接口默认仅统计 `audit_status=APPROVED` 的建议 |
| **低置信度标记** | 每条反馈与每条建议均计算 `overall_confidence`，低于阈值自动打标 `is_low_confidence` |
| **数据脱敏** | 作文内容、姓名等敏感字段入库前脱敏；导出仅保留聚合+摘要（截断200字） |
| **提示词版本化** | 每条反馈关联 `prompt_version_id`，支持版本切换与审计 |

## 快速启动

### 1. 环境准备

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 2. 配置数据库

```bash
cp .env.example .env
# 编辑 .env 修改 DATABASE_URL
```

```bash
# 启动 PostgreSQL (Docker 示例)
docker run --name essay-pg -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=essay_feedback -p 5432:5432 -d postgres:15
```

### 3. 初始化数据库与种子账号

```bash
python init_db.py
```

将创建以下演示账号：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 教师 | teacher1 | teacher123 |
| 学生 | student01 ~ student05 | student123 |

### 4. 启动服务

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

打开 http://localhost:8000/docs 查看 API 文档。

## 项目结构

```
.
├── main.py                      # FastAPI 入口
├── init_db.py                   # 初始化脚本
├── requirements.txt
├── .env.example
└── app/
    ├── __init__.py
    ├── config.py                # 环境变量配置
    ├── database.py              # SQLAlchemy 引擎/Session
    ├── models.py                # 9 张数据表 ORM 模型
    ├── schemas.py               # Pydantic 请求/响应模型
    ├── security.py              # JWT + 权限校验
    ├── masking.py               # 数据脱敏 + 字段加密
    ├── analyzer.py              # 四维度 AI 分析核心
    └── routers/
        ├── auth.py              # 注册/登录/班级管理
        ├── essays.py            # 作文提交/列表/详情/提示词版本
        ├── feedback.py          # 建议审核/教师评价/待审核列表
        ├── classes.py           # 班级统计/班级报告
        └── export.py            # Excel/JSON 聚合导出 + 审核追踪
```

## 数据模型

| 表 | 用途 | 安全策略 |
|----|------|---------|
| `users` | 账号 | `real_name_encrypted` 使用 Fernet 加密存储 |
| `classes` | 班级 | — |
| `prompt_versions` | 提示词版本 | 支持每类反馈独立版本与激活状态 |
| `essays` | 作文 | `content_masked` 脱敏展示；`content_original_encrypted` 加密存原文（仅供教师解密查看） |
| `essay_feedbacks` | 反馈批次 | 关联 `prompt_version_id`；标记 `is_low_confidence` |
| `feedback_items` | 单条建议 | 含 `audit_status`、`revised_suggestion`、`audited_by/at` |
| `model_evidences` | 模型依据 | 教师角色可见，学生隐藏 |
| `teacher_reviews` | 教师评价 | 最终分与评语由教师手动录入，评语亦脱敏+加密 |
| `audit_logs` | 操作审计 | 全量记录提交/查看/审核等关键动作 |

## 关键 API

### 学生流程

```
POST /api/auth/login                        # 登录
POST /api/essays/submit                     # 提交作文（自动触发分析+入库）
GET  /api/essays/                           # 查看自己的作文列表
GET  /api/feedback/by-essay/{essay_id}      # 查看反馈（仅 APPROVED/NEEDS_REVISION 可见）
```

### 教师流程

```
GET  /api/feedback/pending-audit                      # 待审核作文清单（含低置信度计数）
POST /api/feedback/audit                               # 批量审核建议 [approved/needs_revision/rejected + revised_suggestion]
POST /api/feedback/teacher-review                      # 录入教师最终评价（含最终分）
GET  /api/essays/{essay_id}?include_original=true      # 查看原文+模型依据 evidence_refs
GET  /api/classes/{class_id}/stats                     # 班级统计
GET  /api/classes/{class_id}/report                    # 班级报告（仅引用已审核建议）
POST /api/export/class-report/excel                    # 聚合 Excel 导出
POST /api/export/class-report/json                     # 聚合 JSON 导出
GET  /api/export/audit-trail-summary                   # 审核追踪摘要
```

### 提示词管理

```
POST /api/essays/prompt-versions             # 新增提示词版本（自动替换同分类激活版本）
GET  /api/essays/prompt-versions             # 列出所有版本
```

## 导出数据安全

导出内容严格遵循以下规范：

1. **无个人身份信息**：不导出真实姓名、学号等；学生计数仅保留数字
2. **无原始作文全文**：业务证据摘要单条≤100字且二次脱敏
3. **无教师评价全文**：仅保留四维度平均分与得分分布统计
4. **仅聚合数据**：每个班级一行，包含 18 项统计指标
5. **低置信度可选**：默认剔除，勾选才会被纳入计数
6. **已审核范围**：`audit_scope` 字段明确标注仅 `APPROVED` 状态
7. **Header 安全提示**：Excel 导出 `X-Content-Security-Note` 头标注合规声明

## 置信度体系

- **全局阈值**：`LOW_CONFIDENCE_THRESHOLD`（默认 0.6，可在 `.env` 调整）
- **反馈级**：`EssayFeedback.overall_confidence` 为该分类下所有建议置信度均值
- **建议级**：每条 `FeedbackItem.confidence` 由分析器计算（启发式 / 模型 softmax）
- **低置信度标记**：`is_low_confidence=true` 会在列表接口、待审核接口、统计接口分别高亮或计数
- **教师审核覆盖**：低置信度并不自动剔除，仍由教师审核决定是否纳入报告

## 四维度分析说明

`app/analyzer.py` 中的 `EssayAnalyzer.analyze_full()` 同时执行：

| 维度 | 检测要点 |
|------|---------|
| **结构 (STRUCTURE)** | 段落数、开头/结尾长度、是否有总结标识、整体量化指标 |
| **论据 (EVIDENCE)** | 论据标记词数、名言引用、叙议结合逻辑词、论据分布 |
| **错别字 (TYPO)** | 30+ 常见错别字词典、重复字符、重复标点、编码异常 |
| **表达 (EXPRESSION)** | 句式长短分布、程度副词泛滥、模糊表达、关联词单调、词汇丰富度 |

分析结果包含 `evidence_refs`（模型依据/中间计算数据），仅教师端可见，用于核验建议合理性。
