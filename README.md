# 电商退货原因与退款周期看板

基于 **React + ECharts + FastAPI + PostgreSQL** 构建的交互式数据可视化平台，帮助售后负责人分析退货原因、优化退款流程、提升客服效率。

## 核心功能

### 📊 看板视图
- **概览KPI卡片**：退货单数、退货率、退货金额、平均退款周期、客服处理时长、重复退货用户数
- **退货原因树图**：三级原因层级可视化，支持点击节点下钻筛选
- **退款周期分布**：柱状图+折线图双轴展示，分析各周期区间的退货量
- **商品退货排行**：TOP15商品，颜色预警标识退货率（绿=正常/黄=关注/红=预警）
- **客服处理时长**：平均时长vs中位时长对比，结合工单量评估人效

### 🔍 交互式分析
- **多维度筛选器**：日期、店铺、品类、仓库、物流商、退货原因
- **图表联动**：点击图表节点自动联动筛选
- **下钻分析**：支持单维度下钻，快速定位问题
- **视图保存**：保存常用筛选口径，日会一键加载
- **筛选状态展示**：实时显示当前应用的筛选条件

### 📋 报告导出
- **多Sheet Excel报告**：包含概览、退货原因、周期分布、商品排行、客服时长、各维度统计
- **筛选条件持久化**：导出的报告自带"筛选条件"Sheet，记录当时分析口径
- **明细导出**：支持退货明细数据导出

### 🔒 隐私保护
- **用户脱敏**：重复退货用户使用 `user_hash` 标识，不暴露真实用户ID
- **共享报表**：导出的报告不包含任何隐私字段

## 技术架构

### 前端
```
React 18 + TypeScript + Vite
├── ECharts (echarts-for-react) - 图表渲染
├── Ant Design 5 - UI组件库
├── Zustand - 状态管理（筛选状态贯穿全局）
├── Axios - HTTP客户端
└── xlsx/file-saver - 报告导出
```

### 后端
```
FastAPI + SQLAlchemy 2.0 + PostgreSQL
├── Pydantic - 数据验证
├── Pandas/OpenPyXL - Excel报告生成
└── 分层架构: API → Service → Model
```

## 项目结构

```
.
├── backend/
│   ├── app/
│   │   ├── api/              # API路由层
│   │   │   ├── analytics.py  # 分析数据接口
│   │   │   └── export.py     # 报告导出接口
│   │   ├── models/           # SQLAlchemy ORM模型
│   │   ├── schemas/          # Pydantic数据模型
│   │   ├── services/         # 业务逻辑层
│   │   ├── database.py       # 数据库连接
│   │   └── main.py           # FastAPI入口
│   ├── generate_test_data.py # 测试数据生成脚本
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── charts/       # 图表组件
    │   │   └── filters/      # 筛选器组件
    │   ├── store/            # Zustand状态管理
    │   ├── services/         # API服务
    │   ├── types/            # TypeScript类型定义
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

## 快速启动

### 1. 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置数据库
cp .env.example .env
# 修改 .env 中的 DATABASE_URL

# 生成测试数据（首次运行）
python generate_test_data.py

# 启动服务
python -m app.main
# 或
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API文档: http://localhost:8000/docs

### 2. 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问: http://localhost:3000

## 数据库设计

核心数据表：

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| orders | 订单表 | order_no, user_hash, store, product, warehouse, logistics |
| return_requests | 退货申请 | return_no, 三级原因, return_amount, status |
| inspections | 质检记录 | inspect_result, damage_level, quality_issue |
| refunds | 退款记录 | refund_no, refund_time, audit_time, status |
| return_logistics | 退件物流 | tracking_no, logistics_provider, received_at |
| customer_services | 客服处理 | agent, handling_duration, satisfaction_score |
| saved_views | 保存视图 | name, filters(JSON), is_public |

## API接口

### 分析接口
- `GET /api/analytics/options` - 获取筛选器选项
- `POST /api/analytics/dashboard` - 获取看板聚合数据
- `GET/POST/DELETE /api/analytics/views` - 保存视图CRUD

### 导出接口
- `POST /api/export/report` - 导出分析报告（含筛选条件）
- `POST /api/export/details` - 导出退货明细

## 筛选状态贯穿设计

1. **Zustand Store** 统一管理筛选状态
2. 所有图表组件订阅同一筛选状态
3. 图表点击事件触发 `setFilters` 更新状态
4. 状态变化自动触发所有图表数据刷新
5. 保存视图时将完整 `filters` 对象序列化存储
6. 导出报告时将 `filters` 写入独立Sheet，保证口径可追溯

## 使用场景

- **每日站会**：加载"昨日数据"视图，快速回顾退货情况
- **问题排查**：按店铺/仓库/物流商下钻，定位异常来源
- **商品优化**：通过商品排行和原因树图，定位高退货率SKU
- **客服考核**：基于处理时长和工单量评估团队人效
- **周报导出**：一键导出完整Excel报告，附带筛选条件说明
