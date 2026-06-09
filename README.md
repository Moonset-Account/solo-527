# 社区热线诉求分拨助手 · 模型工作台

面向街道热线主管的可上线试运行的 AI 工单分拨系统。基于 **OpenAI API + Node.js + 向量数据库** 架构，支持诉求分类、紧急程度判断、相似工单检索、承办科室建议四大核心功能，内置高风险拦截、低置信度复核、RBAC 权限控制和验收评估闭环。

---

## 一、快速启动

### 1. 环境要求
- Node.js ≥ 18
- 有效的 OpenAI API Key（支持 gpt-4o-mini / gpt-4o / text-embedding-3-small）

### 2. 一键启动
```bash
./start.sh              # 开发模式（首次会提示配置 .env）
./start.sh prod         # 生产模式
```

或者手动执行：
```bash
cp .env.example .env     # 复制并编辑配置
# 编辑 .env，填入 OPENAI_API_KEY 和 JWT_SECRET
npm install
npm run dev             # 启动: http://localhost:3000
```

### 3. 默认账号（首次自动创建）
| 角色 | 邮箱 | 密码 | 权限说明 |
|------|------|------|----------|
| 管理员 | admin@community.gov | Admin@123 | 全部权限，含用户管理、系统配置 |
| 主管 | supervisor@community.gov | Super@123 | 工单复核、关闭、验收评估 |
| 接线员 | operator@community.gov | Operate@123 | 工单分拨、查看、推理 |

---

## 二、架构拆分（6 大模块）

```
┌──────────────────────────────────────────────────────────────────┐
│                      前端评估面板 (SPA - /)                      │
└─────────────┬──────────────────┬──────────────────┬──────────────┘
              │ 登录认证         │ 工单/推理/复核   │ 验收+向量
    ┌─────────▼────────┐ ┌──────▼────────┐ ┌───────▼───────────┐
    │  权限隔离 RBAC   │ │  在线推理 API  │ │  数据/评估面板    │
    │  authService.js  │ │inferenceEngine│ │  data.js + tickets│
    └─────────┬────────┘ └──────┬────────┘ └───────┬───────────┘
              │                 │                   │
    ┌─────────▼─────────────────▼───────────────────▼───────────┐
    │          业务服务层 (services/*.js)                        │
    │  ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌────────────┐ │
    │  │数据清洗  │ │向量存储   │ │工单服务    │ │OpenAI 客户 │ │
    │  │cleaner   │ │vectorStore│ │ticketService│ │openaiClient│ │
    │  └──────────┘ └───────────┘ └────────────┘ └────────────┘ │
    └──────────┬──────────────────┬───────────────────┬─────────┘
               │                  │                   │
     ┌─────────▼──────┐  ┌───────▼─────────┐  ┌──────▼──────────┐
     │ SQLite (业务库)│  │ 向量索引 JSON   │  │ 批处理脚本 CLI  │
     │ 10张表+8索引   │  │ cosine top-K    │  │ src/scripts/*.js│
     └────────────────┘  └─────────────────┘  └─────────────────┘
```

### 模块职责

| 模块 | 关键文件 | 说明 |
|------|----------|------|
| 🧹 数据清洗 | `services/dataCleaner.js` | 文本归一化、PII 脱敏、去噪、中文分词、关键词/位置抽取、高风险关键词检测 |
| 📦 向量存储 | `services/vectorStore.js` | 本地 JSON 索引，余弦相似度 Top-K 检索、增量/批量构建 |
| ⚙️ 批处理任务 | `src/scripts/*.js` | 7 个 CLI 脚本：数据清洗、批量导入、建索引、验收样本播种、模型评估、验收清单 |
| 🤖 在线推理 | `services/inferenceEngine.js` | Prompt工程 + 置信度分层 + 关键词兜底 + 复核判定规则 |
| 📊 评估面板 | `public/app.js` + `routes/*.js` | 9 大功能区：看板/推理/复核/工单/历史/验收/向量/元数据/用户 |
| 🔐 权限隔离 | `services/authService.js` | 3 角色 RBAC + JWT + 20+ 细粒度权限点 |

---

## 三、核心业务逻辑

### 1. 分拨推理流水线
```
来电文本 → 清洗+PII脱敏 → 向量化 → 相似工单Top3检索
                              ↓
    ┌─────────────────────────────────────────────┐
    │  LLM Prompt 工程（严格 JSON 输出）           │
    │  · 17个候选类别及描述                       │
    │  · 12个承办科室及职责映射                    │
    │  · 历史相似工单Top3作为 few-shot             │
    │  · 4级紧急度（特急/紧急/一般/缓办+响应时限） │
    └─────────────┬───────────────────────────────┘
                  ↓ 三维度输出 + 置信度 + 推理依据
          复核判定规则引擎
          ├─ 任一维度置信度 <0.70 → 待复核队列
          ├─ 关键词/LLM 判定高风险 → 强制人工确认
          ├─ 0.70~0.85 → 二次判定+复核
          └─ ≥0.85 且非高风险 → 自动分拨
```

### 2. 高风险民生诉求拦截（双保险）
- **规则层**：6 类强正则模式（信访维稳/安全生产/重大疫情/群体性堵路/涉腐举报/治安人命）
- **模型层**：LLM 独立判定
- **处置**：自动标记 `is_high_risk=1`，状态置为 `escalated`（升级），禁止自动关闭，必须人工确认

### 3. 置信度阈值分层
| 置信度区间 | 处置方式 |
|-----------|----------|
| ≥ 0.85 | 自动分拨，可直接派单 |
| 0.70 ~ 0.85 | 二次判断，建议复核 |
| < 0.70 | 强制进入待复核队列 |

---

## 四、验收样本体系（4 类场景）

样本数 ≥ 18 条，通过 `npm run seed-data` 或前端【验收样本】一键播种。

| 类型 | 样本数 | 典型场景 | 期望结果 |
|------|--------|----------|----------|
| ✅ **正确判断** | 5 | 垃圾清运、路灯坏、电梯坏、油烟扰民、业务咨询 | 分类/科室/紧急度全部匹配，可自动分拨 |
| ⚠️ **低置信度** | 4 | 语义极度模糊（"那边不好快来"）、推诿扯皮（"都不管"）、跨类别边界 | 任一维度置信度<0.7，进入复核队列 |
| ✏️ **人工改标** | 4 | 停车收费→市场监管、施工噪声→环保、教师补课→教育、过期食品→市监 | 模型易误分，需人工改标 |
| 🚫 **无法回答** | 6 | 廉政举报、群体上访、安全事故、跳楼讨薪、堵路、传染病聚集 | 高风险，必须人工处理 |

### 运行验收
```bash
npm run seed-data          # 播种18条验收样本+50条历史工单
npm run acceptance-check   # 运行10项验收检查清单（规则层，不调用LLM）
npm run evaluate           # 运行全部样本的LLM推理评估（消耗API额度）
```

前端面板的【验收评估】页支持：
- 在线创建/编辑样本
- 一键运行全量测试
- 查看通过率、混淆分析、失败原因

---

## 五、API 速览

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录，返回 JWT |
| GET | `/api/auth/me` | 当前用户信息 |
| GET | `/api/auth/users` | 用户列表（admin） |

### 工单
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/tickets/infer?dry=1` | 推理工单分拨（dry=1仅预览不入库） |
| GET | `/api/tickets` | 工单列表（分页/筛选） |
| GET | `/api/tickets/:id` | 工单详情（含复核记录） |
| POST | `/api/tickets/similar` | 相似工单检索 |
| POST | `/api/tickets/:id/review` | 复核操作（通过/改标/退回/升级） |
| POST | `/api/tickets/:id/close` | 关闭工单（高风险禁止自动关闭） |
| POST | `/api/tickets/:id/escalate` | 升级工单 |
| GET | `/api/tickets/dashboard/stats` | 看板统计数据 |

### 数据与评估
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/data/clean` | 数据清洗接口 |
| POST | `/api/data/import` | 批量导入历史工单（multipart或JSON） |
| POST | `/api/data/build-index` | 重建向量索引 |
| GET | `/api/data/meta` | 元数据（类别/科室/阈值/高风险类型） |
| GET/POST | `/api/data/evaluation/samples` | 验收样本 CRUD |
| GET | `/api/data/evaluation/summary` | 验收汇总统计 |
| GET | `/api/data/vector/stats` | 向量索引统计 |

---

## 六、命令行脚本

```bash
npm run clean-data -- input.json output.json          # 清洗JSON文件
npm run import-data -- --demo=50 --build-index         # 导入50条演示+建索引
npm run import-data -- --file=records.json             # 从文件导入
npm run build-index [200]                              # 重建向量索引，批大小200
npm run seed-data                                       # 播种验收样本+演示数据
npm run acceptance-check                                # 运行10项验收检查清单
npm run evaluate                                        # 运行全部样本LLM评估
```

---

## 七、数据模型（SQLite 10 张表）

| 表名 | 关键字段 | 说明 |
|------|----------|------|
| users | email, role, password_hash, is_active | 系统用户 |
| role_permissions | role, permission | 权限矩阵 |
| tickets | ticket_no, content, category, urgency, department_code, status, needs_review, is_high_risk, category_confidence | 工单主表 |
| ticket_reviews | ticket_id, reviewer_id, action(approve/modify/reject/escalate), corrected_* | 复核记录 |
| historical_tickets | content, category, department_code, resolution, followup_score | 历史工单（RAG知识源） |
| inference_logs | ticket_id, model_version, tokens_used, latency_ms, input_text, raw_response | 推理审计日志 |
| evaluation_samples | sample_type, content, expected_*, test_result, test_passed, tested_at | 验收样本 |

8 个复合索引覆盖高频查询（工单状态+街区、创建时间、高风险+待复核、历史工单类别+科室等）。

---

## 八、安全与合规
- ✅ **PII 脱敏**：手机号、身份证号、邮箱、URL 自动脱敏后入库与调用 LLM
- ✅ **JWT 认证**：所有 API 需 Bearer Token，7 天过期
- ✅ **RBAC 权限隔离**：接线员不可复核、不可管理用户；主管不可管理系统配置；admin 全权限
- ✅ **审计日志**：每次 LLM 调用记录入参、出参、Token、耗时
- ✅ **高风险永不自动关闭**：`is_high_risk=1` 的工单调用 `/close` 返回 403

---

## 九、目录结构

```
.
├── public/                     # 前端评估面板（原生JS SPA）
│   ├── index.html
│   ├── app.js                  # 1500+行 9大功能区
│   └── styles.css              # 2000+行 主题系统
├── src/
│   ├── config/index.js         # 17类别/4紧急度/12科室/3默认账号
│   ├── server.js               # Express入口
│   ├── routes/                 # auth / tickets / data
│   ├── services/               # 6大业务服务
│   ├── utils/                  # logger / database
│   └── scripts/                # 7个CLI脚本
├── .env.example                # 15+配置项
├── package.json                # 9个npm scripts
├── start.sh                    # 一键启动
└── README.md
```

---

## 十、上线检查清单
- [ ] `OPENAI_API_KEY` 配置为生产专用 Key，开启用量告警
- [ ] `JWT_SECRET` 使用 ≥32 位随机字符串
- [ ] 反向代理（Nginx）配置 HTTPS 与限流
- [ ] SQLite `data/` 目录加入定期备份
- [ ] 向量索引 `vector_store.json` 定期落盘备份
- [ ] `logs/` 目录纳入日志采集（error.log / combined.log）
- [ ] 高风险工单短信/钉钉告警对接
- [ ] 运行 `npm run acceptance-check` 全部通过

---

**交付标准**：架构符合 6 模块拆分、高风险双规则拦截有效、低置信度正确入复核队列、4 类验收样本覆盖、10 项检查清单通过、RBAC 权限三角色分离。
