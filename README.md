# 📋 合同条款风险标注工具

> 法务助理专用的智能合同风险标注系统，使用 OpenAI API + Node.js + PostgreSQL + 向量数据库 技术栈。

---

## ✨ 核心功能

| 模块 | 功能说明 |
|------|---------|
| **合同管理** | 多版本合同上传、条款自动拆分、版本回滚、元数据管理 |
| **风险检测** | 自动识别**付款/违约/保密/自动续约**四类风险，引用原文作为证据 |
| **向量检索** | 基于语义的相似条款检索，引用历史修改意见作为证据 |
| **人工改标** | 法务人员可推翻AI判断、调整风险类型/等级、添加复核备注 |
| **二审队列** | 低置信度（< 0.7）或高风险条款自动进入二审队列，带SLA管理 |
| **条款清单** | 法务复核通过后才能生成条款清单，支持 JSON/Markdown/CSV 导出 |
| **版本管理** | 合同原文 + 向量索引双版本记录，一键回滚 |
| **审计日志** | 全操作留痕，支持按合同/用户/时间维度检索 |
| **异常告警** | 区分**数据缺失/模型漂移/服务调用失败**三类告警 |
| **权限控制** | 管理员/法务助理/复核人 三级角色权限 |

> ⚠️ **免责声明**：本系统AI输出仅供参考，不构成法律意见。

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端 (React 18)                       │
│  ┌───────┐ ┌─────────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │仪表盘 │ │合同管理  │ │二审  │ │告警  │ │审计  │ ... │
│  └───────┘ └─────────┘ └──────┘ └──────┘ └──────┘      │
└──────────────────────────┬──────────────────────────────┘
                           │ REST API + JWT
┌──────────────────────────▼──────────────────────────────┐
│                 后端 (Node.js + Express)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │认证中间件│ │  服务层   │ │  路由层   │ │审计/告警服务│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└──────────────────┬──────────────────────┬────────────────┘
                   │                      │
          ┌────────▼───────┐    ┌────────▼───────┐
          │  PostgreSQL    │    │   OpenAI API    │
          │  (数据存储)     │    │  (风险分析+嵌入) │
          │  + PGVector    │    │                │
          │  (向量索引)     │    └────────────────┘
          └────────────────┘
```

---

## 📁 项目结构

```
question-326/
├── server/                         # 后端服务
│   ├── config/index.js            # 应用配置
│   ├── db/                         # 数据库
│   │   ├── connection.js          # 数据库连接
│   │   ├── migrate.js             # 迁移脚本
│   │   └── seed.js                # 种子数据
│   ├── models/                     # Sequelize ORM 模型 (10个表)
│   │   ├── User.js                # 用户
│   │   ├── Contract.js            # 合同主表
│   │   ├── ContractVersion.js     # 合同版本
│   │   ├── Clause.js              # 条款
│   │   ├── RiskAnnotation.js      # 风险标注
│   │   ├── VectorIndexVersion.js  # 向量索引版本
│   │   ├── AuditLog.js            # 审计日志
│   │   ├── Alert.js               # 告警记录
│   │   ├── ReviewQueue.js         # 二审队列
│   │   ├── ClauseList.js          # 条款清单
│   │   └── index.js               # 模型关联
│   ├── services/                   # 业务服务
│   │   ├── openaiService.js       # OpenAI API封装 (含模拟模式)
│   │   ├── vectorStoreService.js  # 向量存储 (PGVector+内存回退)
│   │   ├── riskDetectionService.js# 风险检测核心逻辑
│   │   ├── contractService.js     # 合同管理 + 版本控制
│   │   ├── reviewQueueService.js  # 二审队列
│   │   ├── clauseListService.js   # 条款清单生成
│   │   ├── alertService.js        # 告警系统
│   │   ├── auditService.js        # 审计日志
│   │   └── authService.js         # 认证授权
│   ├── middleware/auth.js         # 认证/权限/限流中间件
│   ├── routes/                     # REST API 路由
│   ├── utils/logger.js            # 日志配置
│   └── index.js                   # Express 入口
│
├── client/                         # 前端应用
│   ├── public/index.html
│   └── src/
│       ├── api/index.js           # API 客户端
│       ├── context/               # React Context
│       ├── components/            # UI 组件
│       ├── pages/                 # 页面组件
│       ├── styles.css             # 全局样式
│       ├── App.jsx                # 路由配置
│       └── index.js               # React 入口
│
├── tests/                          # Jest 测试
├── package.json                    # 根依赖
├── .env.example                    # 环境变量模板
├── start.sh / start.bat           # 一键启动脚本
└── jest.config.js                  # Jest 配置
```

---

## 🚀 快速开始

### 方式一：使用启动脚本 (推荐)

**macOS/Linux:**
```bash
chmod +x start.sh && ./start.sh
```

**Windows:**
```cmd
start.bat
```

### 方式二：手动启动

#### 1. 环境要求
- Node.js **18+**
- PostgreSQL **14+** （推荐安装 PGVector 扩展）
- OpenAI API Key （生产必需，开发可用模拟模式）

#### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env，配置以下关键项:
# - DB_USER / DB_PASSWORD: PostgreSQL 登录
# - DB_NAME: 数据库名 (需预先创建)
# - OPENAI_API_KEY: sk-xxxxx (可选，留空使用模拟模式)
```

#### 3. 安装依赖
```bash
# 后端
npm install

# 前端
cd client && npm install && cd ..
```

#### 4. 初始化数据库
```bash
# 创建数据库 (PostgreSQL)
createdb contract_risk_db

# 执行迁移 + 种子数据
npm run db:migrate
npm run db:seed
```

#### 5. 启动应用
```bash
# 开发模式 (前后端同时启动)
npm run dev

# 或分别启动:
npm run dev:server   # 后端 http://localhost:3001
npm run dev:client   # 前端 http://localhost:3000
```

#### 6. 访问应用
打开浏览器访问 **http://localhost:3000**

默认账号（种子数据初始化后可用）:

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `Admin@123` |
| 法务助理 | `assistant1` | `Assistant@123` |
| 复核人 | `reviewer1` | `Reviewer@123` |

---

## 🔌 API 概览

### 认证接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录获取 JWT |
| POST | `/api/auth/me` | 获取当前用户 |
| POST | `/api/auth/change-password` | 修改密码 |

### 合同接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/contracts` | 合同列表 (支持搜索/筛选/分页) |
| POST | `/api/contracts/upload` | 上传新合同 (multipart) |
| GET | `/api/contracts/:id` | 合同详情 (含条款+风险) |
| POST | `/api/contracts/:id/new-version` | 上传新版本 |
| POST | `/api/contracts/:id/rollback` | 回滚到指定版本 |
| POST | `/api/contracts/:id/approve` | 法务复核通过合同 |
| POST | `/api/contracts/semantic-search` | 合同内语义搜索 |

### 风险标注接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/risks/contract/:id` | 获取合同所有风险 |
| POST | `/api/risks/:id/override` | 人工改标 (通过/修改/拒绝) |
| POST | `/api/risks/contract/:id/approve-all` | 批量通过全部风险 |

### 二审队列接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/review-queue` | 队列列表 |
| POST | `/api/review-queue/:id/assign-me` | 领取任务 |
| POST | `/api/review-queue/:id/complete` | 完成复核 (4种结果) |
| GET | `/api/review-queue/stats` | 复核人统计 |

### 其他接口
| 模块 | 前缀 | 说明 |
|------|------|------|
| 条款清单 | `/api/clause-lists` | 生成/验证/导出 (JSON/MD/CSV) |
| 告警 | `/api/alerts` | 列表/确认/解决/汇总 |
| 审计 | `/api/audit` | 操作日志查询 |

**详细说明**: 所有接口均需 JWT Bearer Token，按角色控制访问权限。

---

## 🎯 业务流程

```
上传合同
    │
    ▼
[系统] 自动拆分条款 ──► 构建向量索引
    │
    ▼
[AI] 风险检测 (4类风险)
    │
    ├─► 置信度 ≥ 0.7 ──► 待复核队列
    │                           │
    │                           ├─► 法务助理通过/修改/拒绝
    │                           │        │
    │                           │        ▼
    │                           │   记录审计日志
    │                           │
    └─► 置信度 < 0.7 ──► 二审队列 ──► 复核人确认
                                        │
                                        ▼
                              所有风险复核完成?
                                 │         │
                                否         是
                                 │         │
                                 ▼         ▼
                            继续处理   生成条款清单
                                        │
                                        ▼
                                   JSON/MD/CSV 导出
```

### 版本控制流程
```
合同V1 上传 → 版本记录 + 向量索引V1
    │
    ▼ (修改后上传)
合同V2 上传 → 版本记录 + 向量索引V2 (设为活跃)
    │
    ▼ (发现问题)
回滚到V1 → 自动创建V3(内容=V1) + 切换向量索引V1
```

### 告警分级
| 类型 | 触发条件 | 处理人 |
|------|---------|--------|
| 🔴 服务调用失败 | OpenAI API / 数据库 / 向量库异常 | 管理员 |
| 🟠 模型漂移 | 置信度分布变化 > 15% | 管理员/复核人 |
| 🟡 数据缺失 | 合同必要字段为空 | 法务助理 |
| ⚪ 处理超时 / 验证错误 | 一般性异常 | 对应处理人 |

---

## 🧪 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- tests/openaiService.test.js

# 带覆盖率
npm test -- --coverage
```

内置测试覆盖：
- AlertService：告警创建、数据缺失检测、模型漂移检测
- OpenAIService：模拟模式下的嵌入生成、4类风险检测、批量分析

---

## 🔐 安全与合规

1. **数据隔离**: 向量索引版本绑定合同版本，不可跨版本污染
2. **操作留痕**: 全量审计日志（含IP、UserAgent、请求ID）
3. **JWT 认证**: 24小时过期令牌
4. **速率限制**: API 15分钟1000次、登录接口10次防暴力破解
5. **角色权限**: 三级角色严格按功能隔离
6. **文件校验**: 类型/大小白名单校验 + SHA256哈希去重

---

## ⚙️ 关键配置项 (.env)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `OPENAI_API_KEY` | 必填 | OpenAI API Key |
| `OPENAI_MODEL` | `gpt-4o` | 风险分析模型 |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | 嵌入模型 |
| `LOW_CONFIDENCE_THRESHOLD` | `0.7` | 低置信度阈值 (进入二审) |
| `MODEL_DRIFT_THRESHOLD` | `0.15` | 模型漂移告警阈值 |
| `VECTOR_SEARCH_LIMIT` | `5` | 语义检索返回条数 |
| `RISK_TYPES` | 4类 | 检测的风险类型列表 |
| `ALERT_WEBHOOK_URL` | 可选 | 告警通知 Webhook |

---

## 🛠️ 常见问题

**Q: 没有 OpenAI API Key 能试用吗？**
A: 可以！系统内置**模拟模式**，自动检测未配置 Key 时启用，所有AI功能使用确定性算法模拟，可完整走通流程。

**Q: 不想安装 PGVector 扩展？**
A: 没问题。向量服务内置了**内存向量存储**作为 Fallback，自动检测 PGVector 是否可用。生产环境建议安装 PGVector。

**Q: 如何扩展新的风险类型？**
A: 
1. 在 `.env` 的 `RISK_TYPES` 中添加
2. 在 `Clause.js` / `RiskAnnotation.js` 的 ENUM 中添加
3. 在 `OpenAIService._inferRiskType` 中添加关键词
4. 前端标签映射同步更新

**Q: 合同解析支持哪些格式？**
A: 默认实现支持 `.txt` 和 `.md`。`.pdf` 和 `.docx` 需自行集成解析库（如 pdf-parse / mammoth），代码已预留 `_extractText` 方法接口。

---

## 📜 License

MIT License
