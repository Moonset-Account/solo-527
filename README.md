# 会议纪要行动项提取系统 (Meeting Action Extractor)

面向 **项目经理** 的AI驱动会议纪要系统。自动从会议录音转写中提取行动项、负责人、截止日期、项目里程碑，支持**谨慎模式**（不确定时标记为待确认，不凭空编造），提供完整的标注工作台、模型管理、样本验证、回滚审计等MLOps能力。

## ✨ 核心特性

### 项目经理工作台
- 📊 **仪表盘**：全局统计、快速入口、任务队列实时监控
- 📅 **会议管理**：支持粘贴文本 / 上传文件（TXT/VTT/SRT）导入转写，自动识别发言人
- ✅ **行动项列表**：多维筛选（待复核、里程碑、负责人、项目、状态）
- 🔍 **标注工作台**：待确认项批量处理、一致性检查、多人复核队列

### 谨慎抽取 (Cautious Extraction)
- **零编造**：负责人/截止日期/里程碑不确定时绝不编造
- **置信度**：每个关键字段给出 0-1 置信度评分
- **待确认标记**：低于阈值自动标记 pending，并附原因说明
- **复核建议**：`review_reason` 字段列出所有需人工复核的点
- **阈值可配置**：`CONFIDENCE_THRESHOLD_ASSIGNEE/DEADLINE/MILESTONE`

### MLOps 完整链路
- 🧠 **模型注册**：多版本管理、P/R/F1指标、一键提升活跃版本
- 🏋️ **训练任务**：Bull队列异步训练，进度可视化
- 📚 **样本集管理**：CRUD + 批量导入 + 标签
- 🎯 **验证运行**：模型 x 数据集 x 样本集 → 自动计算精度/召回/F1，字段级准确率
- 📖 **样本解释**：预测 vs 期望，匹配/遗漏/误报逐项分析 + 检测建议/复核建议
- ↩️ **回滚**：行动项编辑自动快照，支持任意版本回滚
- 📜 **审计日志**：所有实体变更全记录

### 系统能力
- 🔗 **可调用API**：完整 REST 接口（推理、导入、查询、同步、模型、验证）
- 📋 **任务队列**：Bull + Redis (无Redis时内置降级)，6类队列
- 📈 **监控**：/metrics (Prometheus) + 队列实时状态 + 同步日志
- 🔄 **任务同步**：内置 Mock / Webhook / Jira 适配器

## 🚀 快速启动

### 方式 1: 一键启动 (推荐)
```bash
chmod +x start.sh
./start.sh
```

### 方式 2: 手动启动
```bash
# 1. 安装依赖
npm install

# 2. 配置环境
cp .env.example .env
# 编辑 .env: 至少配置 OPENAI_API_KEY

# 3. 初始化演示数据
npm run seed

# 4. 启动服务 (主进程 + 内嵌worker)
npm start

# 5. (可选) 独立worker进程 (生产环境推荐)
# npm run worker
```

启动后访问:
- **前端界面**: http://localhost:3000
- **健康检查**: http://localhost:3000/health
- **Prometheus 指标**: http://localhost:3000/metrics

## 🔧 环境配置 (.env)

| 变量 | 说明 | 默认值 |
|---|---|---|
| `PORT` | 服务端口 | 3000 |
| `OPENAI_API_KEY` | OpenAI API Key (必填) | - |
| `OPENAI_MODEL` | 推理模型 | gpt-4o |
| `CONFIDENCE_THRESHOLD_ASSIGNEE` | 负责人置信阈值 (低于则待确认) | 0.75 |
| `CONFIDENCE_THRESHOLD_DEADLINE` | 截止日期置信阈值 | 0.70 |
| `CONFIDENCE_THRESHOLD_MILESTONE` | 里程碑置信阈值 | 0.80 |
| `REDIS_HOST/PORT` | Redis 地址 (可选，无Redis则降级) | 127.0.0.1:6379 |
| `DB_PATH` | SQLite 路径 | ./data/app.db |

## 📡 API 调用示例

### 1. 直接推理（无需先导入）
```bash
curl -X POST http://localhost:3000/api/v1/inference/extract \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_title": "产品研发周会",
    "project_name": "电商v2.0",
    "meeting_date": "2026-06-09",
    "segments": [
      {"speaker": "李明", "content": "张伟，你这边登录模块6月15号前要完成"},
      {"speaker": "王芳", "content": "测试我来安排，尽快出方案"},
      {"speaker": "刘洋", "content": "v2.0版本验收是6月18号，这个是里程碑"}
    ]
  }'
```

### 2. 导入会议转写
```bash
curl -X POST http://localhost:3000/api/v1/meetings/import \
  -H "Content-Type: application/json" \
  -d '{
    "title": "周会", "meeting_date": "2026-06-09",
    "format": "speaker-tagged",
    "content": "[李明] 张伟完成登录模块开发，下周一前\n[王芳] 测试我来做"
  }'
```

### 3. 批量确认待确认项
```bash
curl -X POST http://localhost:3000/api/v1/action-items/workbench/batch-review \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {"action_item_id": "xxx", "field_type": "assignee", "value": "张三"},
      {"action_item_id": "xxx", "field_type": "deadline", "value": "2026-06-15"}
    ]
  }'
```

## 📁 项目结构

```
.
├── server/
│   ├── index.js              # Express 服务入口
│   ├── config/               # 配置加载
│   ├── db/                   # SQLite 初始化 (19张表)
│   ├── utils/                # 日志、通用工具
│   ├── audit/                # 审计日志
│   ├── rollback/             # 快照与回滚
│   ├── monitoring/           # Prometheus 指标
│   ├── queue/                # Bull 任务队列 (6类队列)
│   ├── worker/               # Worker 处理器
│   ├── routes/               # 4套路由
│   │   ├── meetings.js       # 会议/转写
│   │   ├── actionItems.js    # 行动项/工作台
│   │   ├── mlops.js          # 模型/样本/验证/回滚
│   │   └── inference.js      # 对外推理API
│   ├── services/             # 9大业务服务
│   │   ├── dataCleaning.js       # 数据清洗 (VTT/SRT/发言人)
│   │   ├── extractionService.js  # OpenAI抽取核心 + 谨慎模式
│   │   ├── meetingService.js     # 会议CRUD
│   │   ├── actionItemService.js  # 行动项、确认、复核
│   │   ├── annotationWorkbench.js# 批量审核、一致性检查
│   │   ├── taskSyncService.js    # Mock/Webhook/Jira同步
│   │   ├── modelService.js       # 模型注册/训练/验证/P/R/F1
│   │   └── sampleValidationService.js # 样本/解释/验证
│   ├── scripts/seed.js       # 演示数据种子
│
├── public/                   # 前端 SPA (原生HTML/CSS/JS, 无构建)
│   ├── index.html
│   ├── styles.css
│   ├── app.js                # 基础工具 + 路由
│   ├── pages.js              # 仪表盘/会议/行动项/工作台
│   └── pages2.js             # 模型/样本/回滚/监控/API文档
│
├── start.sh                  # 一键启动
├── package.json
└── .env.example
```

## 🧪 数据模型 (19张表)

| 表 | 说明 |
|---|---|
| `meetings` | 会议 |
| `speakers` | 发言人（支持确认）|
| `transcript_segments` | 转写段落 |
| `action_items` | 行动项（含 assignee/deadline/milestone 的置信度和待确认标记）|
| `topics` | 议题 |
| `review_tasks` | 人工复核队列 |
| `audit_logs` | 审计日志 |
| `registered_models` | 注册模型 |
| `training_tasks` | 训练任务 |
| `datasets` | 数据集 |
| `validation_runs` | 验证运行记录 |
| `rollback_records` | 快照/回滚 |
| `task_sync_logs` | 任务同步日志 |

## ⚠️ 谨慎模式详细说明

系统严格遵循**不编造**原则：

1. **负责人不确定时**：
   - `assignee_pending = 1`
   - `assignee_note = "原文只说相关同事跟进，未明确具体人员"`
   - `needs_review = 1`
   - 自动进入复核队列 + 待确认数量统计

2. **截止日期不确定时**：
   - `deadline_pending = 1`
   - `deadline_note = "原文提到尽快完成，无具体时间"`
   - 同上

3. **里程碑不确定时**：
   - `is_milestone = 0`（降级为普通任务）
   - `milestone_note = "存在一定置信度，但低于阈值，建议复核"`
   - 创建 `field_type=milestone` 的复核任务

4. **复核原因示例**：
   > `review_reason = "负责人待确认: 原文只说相关同事跟进；截止日期待确认: 原文提到尽快完成"`

## 📊 验证指标计算

- **TP**：预测与期望匹配（标题相似度≥0.6）
- **FP**：预测未匹配到期望
- **FN**：期望未被预测命中
- **Precision / Recall / F1**：标准公式
- **字段级准确率**：assignee / deadline / milestone 各自统计正确数
- **待确认准确率**：正确标记 pending 的比例

样本解释功能还会输出：
- ✅ 匹配项（字段级差异对比）
- ❌ 遗漏项（检测建议：为何没识别出来）
- ⚠️ 误报项（复核建议：是否真的误报）

## 📝 License

MIT
