# 二手书回收定价看板

基于 React + ECharts + FastAPI + PostgreSQL 的二手书回收定价决策看板系统。

## 功能特性

### 核心功能
- ✅ **价格散点图**: 按 ISBN 和品相分层展示回收价 vs 成交价
- ✅ **品相分组**: 同一本书不同品相自动分层显示（全新/九成新/八成新/七成新/六成新及以下）
- ✅ **ISBN 去重**: 散点图和分析数据按 ISBN + 品相自动聚合
- ✅ **毛利计算**: 自动计算每本书的毛利率，套装书整体计算不拆分
- ✅ **滞销阈值**: 超 30 天未售出自动标记为滞销，红色预警
- ✅ **渠道筛选**: 支持按回收渠道（上门/邮寄/门店/线上平台）筛选
- ✅ **异常价格标记**: 偏离建议价 ±30% 自动标记为异常价格
- ✅ **可追溯明细表**: 点击散点或表格可追溯到原始回收记录
- ✅ **导出报表**: 导出 Excel 报表，保留当前筛选口径和定价版本
- ✅ **改价记录**: 记录改价生效时间、操作人、改价原因
- ✅ **改价对比**: 查看同一 ISBN 改价前后的成交量、成交价、毛利率变化

### 多维度分析图表
- 各书籍平均滞销天数柱状图（带滞销阈值线）
- 毛利率分布柱状图
- 各渠道平均物流成本饼图
- 库存周转率折线图

## 技术栈

### 前端
- React 18 + TypeScript
- ECharts (echarts-for-react)
- Ant Design 5.x
- React Router v6
- Axios
- Vite

### 后端
- FastAPI
- SQLAlchemy 2.0
- PostgreSQL
- Pandas + OpenPyXL (Excel 导出)
- Pydantic v2

## 项目结构

```
.
├── backend/                 # 后端 FastAPI 项目
│   ├── app/
│   │   ├── core/           # 核心配置（数据库、设置）
│   │   ├── models/         # SQLAlchemy 模型
│   │   ├── schemas/        # Pydantic 数据模型
│   │   ├── routers/        # API 路由
│   │   └── main.py         # 应用入口
│   ├── data/
│   │   └── seed_data.py    # 测试数据生成脚本
│   └── requirements.txt    # Python 依赖
│
└── frontend/               # 前端 React 项目
    ├── src/
    │   ├── components/     # 组件（图表、表格、筛选器等）
    │   ├── pages/          # 页面组件
    │   ├── services/       # API 服务层
    │   ├── types/          # TypeScript 类型定义
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

## 快速开始

### 前置要求
- Python 3.9+
- Node.js 18+
- PostgreSQL 13+

### 1. 数据库准备

创建 PostgreSQL 数据库：

```sql
CREATE DATABASE book_recycling;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE book_recycling TO postgres;
```

如需修改数据库连接，请编辑 `backend/app/core/config.py`。

### 2. 启动后端服务

**方式一：使用启动脚本（推荐）**
```bash
# 确保脚本有执行权限（只需执行一次）
chmod +x start-backend.sh start-frontend.sh

# 启动后端
./start-backend.sh
```

**方式二：手动启动（无需脚本权限）**
```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 初始化数据库表
python -c "
from app.core.database import engine, Base
from app.models import Book, RecycleRecord, PricingHistory, SaleRecord
Base.metadata.create_all(bind=engine)
print('数据库表创建完成')
"

# 生成测试数据（可选）
python data/seed_data.py

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端 API 文档: http://localhost:8000/docs

### 3. 启动前端服务

**方式一：使用启动脚本**
```bash
./start-frontend.sh
```

**方式二：手动启动（无需脚本权限）**
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务
npm run dev
```

前端访问: http://localhost:3000

## API 接口列表

### 书籍管理
- `GET /api/v1/books/` - 获取书籍列表
- `GET /api/v1/books/{id}` - 获取书籍详情
- `GET /api/v1/books/isbn/{isbn}` - 按 ISBN 获取书籍
- `POST /api/v1/books/` - 创建书籍
- `PUT /api/v1/books/{id}` - 更新书籍

### 回收记录
- `GET /api/v1/recycle-records/` - 获取回收记录列表
- `GET /api/v1/recycle-records/{id}` - 获取记录详情

### 数据分析
- `POST /api/v1/analytics/price-scatter` - 获取价格散点数据
- `POST /api/v1/analytics/book-analysis` - 获取书籍分析数据
- `GET /api/v1/analytics/summary` - 获取汇总统计

### 定价管理
- `POST /api/v1/pricing/book/{id}/update-price` - 更新定价
- `GET /api/v1/pricing/history/{isbn}` - 获取定价历史
- `GET /api/v1/pricing/comparison/{isbn}` - 获取改价前后对比
- `GET /api/v1/pricing/versions` - 获取所有定价版本

### 报表导出
- `POST /api/v1/export/report` - 导出 Excel 报表（含筛选口径）

## 品相定义

| 品相 | 说明 | 颜色标记 |
|------|------|----------|
| 全新 | 未拆封或几乎全新 | 🟢 绿色 |
| 九成新 | 轻微使用痕迹 | 🔵 蓝色 |
| 八成新 | 正常使用痕迹 | 🟡 黄色 |
| 七成新 | 明显使用痕迹 | 🟠 橙色 |
| 六成新及以下 | 磨损较严重 | 🔴 红色 |

## 渠道定义

- **上门回收**: 运营人员上门收书
- **邮寄回收**: 用户邮寄到仓库
- **门店回收**: 用户送到线下门店
- **线上平台**: 通过第三方平台回收

## 业务规则

1. **ISBN 去重**: 同一 ISBN 视为同一本书，分析数据按 ISBN + 品相聚合
2. **套装书**: `is_set=True` 的书籍按整套计算毛利，不拆分为单册
3. **异常价格**: 实际回收价偏离建议价 ±30% 自动标记为异常
4. **滞销阈值**: 默认 30 天未售出视为滞销，可在后端配置修改
5. **毛利计算**: `(成交价 - 总成本) / 总成本 * 100%`，总成本 = 回收价 + 物流成本 + 其他成本

## 数据库表结构

### books 书籍表
- id, isbn, title, author, publisher, publish_date
- is_set, set_count, category, description
- suggested_price_new/like_new/good/fair/poor (各品相建议回收价)

### recycle_records 回收记录表
- id, record_no, book_id, isbn, condition
- recycle_price, logistics_cost, other_cost, total_cost
- channel, operator, recycle_date, in_stock_date, sale_date
- is_sold, sale_price, days_in_stock
- is_abnormal, abnormal_reason, pricing_version

### pricing_histories 定价历史表
- id, book_id, isbn, condition
- old_price, new_price, price_change, change_percent
- operator, change_reason, effective_date, version

### sale_records 销售记录表
- id, sale_no, recycle_record_id, book_id, isbn, condition
- sale_price, sale_date, channel, operator, pricing_version

## 数据字典导出

导出的 Excel 报表包含两个 Sheet：
1. **回收记录明细**: 所有筛选后的回收记录完整信息
2. **筛选口径**: 导出时使用的所有筛选条件、定价版本、导出时间

## 扩展建议

- [ ] 接入用户权限系统，区分运营/管理员角色
- [ ] 添加价格建议 AI 模型，基于历史数据智能推荐定价
- [ ] 接入实时库存同步接口
- [ ] 添加数据可视化大屏模式
- [ ] 支持更多导出格式（PDF、CSV）
