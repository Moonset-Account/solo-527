# ContractRiskAI 项目结构说明

> 合同智能风控与审核平台 - 基于 FastAPI + LangChain + SQLAlchemy 的企业级合同管理系统

## 目录结构总览

```
question-327/
├── .env                          # 实际环境配置文件（数据库、API密钥等敏感信息）
├── .env.example                  # 环境变量模板文件（供新用户复制参考）
├── requirements.txt              # Python项目依赖清单
├── start.sh                      # 生产环境启动脚本
├── dev-start.sh                  # 开发模式启动脚本（含Celery/Flower）
├── alembic.ini                   # Alembic数据库迁移配置文件
├── alembic/                      # 数据库迁移文件目录
│   ├── env.py                    # 迁移环境配置（读取DB连接、加载模型）
│   ├── script.py.mako            # 迁移脚本模板
│   └── versions/                 # 各版本迁移脚本存放目录
├── app/                          # 应用主目录
│   ├── __init__.py               # 应用包初始化
│   ├── config.py                 # Pydantic Settings全局配置管理
│   ├── main.py                   # FastAPI应用入口 + 中间件 + 路由注册
│   ├── core/                     # 核心基础设施模块
│   │   ├── __init__.py
│   │   ├── database.py           # SQLAlchemy引擎/会话工厂/Base模型
│   │   └── celery_app.py         # Celery异步任务队列应用配置
│   ├── models/                   # ORM数据模型层（6个文件，20+表）
│   │   ├── __init__.py           # 统一导出所有模型
│   │   ├── user.py               # 用户、角色、权限相关模型
│   │   ├── contract.py           # 合同/条款/摘要/风险/模板/审批模型
│   │   ├── dataset.py            # 数据集/样本/标签/错误样本/版本模型
│   │   ├── ml.py                 # 模型版本/指标/AB测试/评估结果模型
│   │   └── task.py               # 任务/结果/反馈/审计/告警模型
│   ├── schemas/                  # Pydantic请求/响应数据模型
│   │   ├── __init__.py
│   │   ├── base.py               # 基础Schema（分页、通用响应等）
│   │   ├── alert.py              # 告警相关Schema
│   │   ├── contract.py           # 合同相关Schema
│   │   ├── dashboard.py          # 看板指标相关Schema
│   │   ├── dataset.py            # 数据集相关Schema
│   │   ├── mlops.py              # MLOps相关Schema
│   │   ├── qa.py                 # 问答对话相关Schema
│   │   ├── review.py             # 审核工作流相关Schema
│   │   ├── search.py             # 检索相关Schema
│   │   └── task.py               # 任务相关Schema
│   ├── api/                      # API路由层
│   │   ├── __init__.py
│   │   ├── deps.py               # 依赖注入（DB会话/用户认证/权限校验）
│   │   └── v1/                   # API v1版本
│   │       ├── __init__.py
│   │       ├── router.py         # v1路由聚合入口
│   │       └── endpoints/        # 各业务模块REST API端点
│   │           ├── __init__.py
│   │           ├── documents.py  # 合同上传/解析/风险检测/对比API
│   │           ├── qa.py         # 问答对话/反馈收集API
│   │           ├── search.py     # 条款/合同混合检索API
│   │           ├── datasets.py   # 数据集CRUD/导入导出/版本回滚API
│   │           ├── review.py     # 审核任务分配/锁定/提交/升级API
│   │           ├── dashboard.py  # 看板指标/漏斗/分布/趋势API
│   │           ├── mlops.py      # 模型注册/发布/AB测试/评估API
│   │           ├── alerts.py     # 告警列表/确认/解决/健康检查API
│   │           └── tasks.py      # 异步任务状态查询/取消/重试API
│   ├── services/                 # 业务服务层（核心逻辑）
│   │   ├── __init__.py
│   │   ├── data/                 # 数据处理服务
│   │   │   ├── __init__.py
│   │   │   ├── parser.py          # PDF/DOCX/TXT解析 + 条款智能切分
│   │   │   ├── cleaner.py         # 14类质量问题清洗 + 质量评分
│   │   │   ├── dataset_manager.py # 数据集/样本/版本/回滚/克隆管理
│   │   │   └── error_sample_manager.py # 错误样本Bad Case库管理
│   │   ├── ai/                   # AI智能服务（基于LangChain）
│   │   │   ├── __init__.py
│   │   │   ├── llm_factory.py     # LLM工厂 + 成本/用量追踪
│   │   │   ├── vector_store.py    # 向量存储 + 混合检索（稠密+稀疏）
│   │   │   ├── summarizer.py      # Map-Reduce摘要 + 结构化信息提取
│   │   │   ├── diff_comparator.py # 条款级差异对比 + LLM语义评估
│   │   │   └── qa_engine.py       # RAG问答引擎 + 强制来源引用
│   │   ├── risk/                 # 风险检测引擎
│   │   │   ├── __init__.py
│   │   │   └── engine.py          # 32条内置规则 + 来源标注 + 风险分级
│   │   ├── review/               # 审核工作流引擎
│   │   │   ├── __init__.py
│   │   │   └── workflow.py        # 状态机 + 改标 + 三级回滚机制
│   │   ├── metrics/              # 指标追踪服务
│   │   │   ├── __init__.py
│   │   │   └── tracker.py         # 指标写入/查询/异常检测/看板聚合
│   │   ├── mlops/                # MLOps模型运维服务
│   │   │   ├── __init__.py
│   │   │   └── registry.py        # 模型注册/发布检查/AB分流/一键回滚
│   │   └── alerting/             # 告警通知服务
│   │       ├── __init__.py
│   │       └── alerter.py         # 策略匹配 + 多渠道通知 + 健康巡检
│   ├── tasks/                    # Celery异步任务定义
│   │   ├── __init__.py
│   │   ├── base.py               # 任务基类（状态管理/进度上报/自动重试）
│   │   ├── document_tasks.py     # 合同解析/清洗/转换任务
│   │   ├── ai_tasks.py           # 摘要生成/风险检测/向量建索引任务
│   │   ├── eval_tasks.py         # 模型评估/AB测试/数据分析任务
│   │   └── notify_tasks.py       # 告警推送/邮件/消息通知任务
│   └── static/                   # 前端静态页面（纯HTML+JS）
│       ├── index.html            # 系统首页（导航入口）
│       ├── dashboard.html        # 模型效果监控看板
│       ├── review.html           # 人工审核工作台
│       ├── search.html           # 条款检索与智能问答
│       ├── upload.html           # 合同上传与解析页面
│       └── models.html           # 模型发布与AB测试管理
├── tests/                        # 测试目录
│   └── smoke_test.py             # 冒烟测试脚本（核心功能快速验证）
├── data/                         # 运行时数据目录（自动创建）
│   ├── uploads/                  # 用户上传的原始合同文件
│   ├── vector_store/             # FAISS/Chroma向量数据库文件
│   ├── datasets/                 # 数据集导出文件
│   └── exports/                  # 各类导出报表文件
└── logs/                         # 日志目录（自动创建）
    ├── app.log                   # 应用主日志
    ├── celery_worker.log         # Celery Worker日志
    └── celery_flower.log         # Flower监控日志
```

## 模块说明

### 1. 核心基础设施 (app/core)
- **database.py**: 封装SQLAlchemy同步/异步引擎，提供会话工厂，定义Base模型类
- **celery_app.py**: 配置Celery应用，定义四个任务队列（AI/数据/评估/通知）

### 2. 数据模型层 (app/models)
- **user.py**: 用户、角色、权限、部门等组织架构模型
- **contract.py**: 合同文档、条款、摘要、风险告警、模板、审批记录等
- **dataset.py**: 数据集、样本、标签、错误样本、数据集版本快照
- **ml.py**: 模型版本、评估指标、AB实验、评估结果
- **task.py**: 异步任务、任务结果、用户反馈、审计日志、告警事件

### 3. API接口层 (app/api/v1/endpoints)
9个REST API模块覆盖全业务流程，遵循统一的响应格式和分页规范

### 4. 业务服务层 (app/services)
- **data/**: 非结构化数据入湖流水线（解析→清洗→质量评分）
- **ai/**: LLM能力封装（RAG、摘要、对比、向量检索）
- **risk/**: 规则引擎+LLM双重风险检测，支持自定义规则扩展
- **review/**: 审核工作流状态机，支持机审→人审→仲裁三级流转
- **metrics/**: Prometheus兼容的指标体系，支持异常检测
- **mlops/**: 模型全生命周期管理，支持灰度发布和一键回滚
- **alerting/**: 多渠道告警（Webhook/邮件），支持告警聚合降噪

### 5. 异步任务 (app/tasks)
基于Celery的分布式任务系统，支持任务重试、进度追踪、结果持久化

### 6. 前端页面 (app/static)
零依赖纯HTML前端，开箱即用，覆盖核心业务场景

---

## 架构设计原则

1. **分层架构**: API → Services → Models 三层解耦，便于单元测试
2. **依赖注入**: 通过FastAPI Depends管理DB会话和用户上下文
3. **异步优先**: IO密集型操作（文件解析、LLM调用）全部异步化
4. **可观测性**: 全链路日志 + 指标追踪 + 审计日志三驾马车
5. **可扩展性**: 策略模式+工厂模式，支持LLM/向量库/存储后端平滑切换
