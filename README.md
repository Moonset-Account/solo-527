# 健身房会员训练留存分析系统

## 技术栈
- 前端：React 18 + TypeScript + ECharts 5 + Ant Design
- 后端：FastAPI + Python 3.11
- 数据库：PostgreSQL 15 + Redis 7
- 数据处理：Pandas + NumPy

## 项目结构
```
gym-retention-analytics/
├── frontend/          # React 前端
├── backend/           # FastAPI 后端
│   ├── api/           # API 路由
│   ├── db/            # 数据库模型和初始化
│   ├── data/          # 数据清洗和脚本
│   ├── cache/         # 缓存策略
│   └── export/        # 导出任务
└── docker-compose.yml
```

## 快速开始

### 1. 启动数据库
```bash
docker-compose up -d
```

### 2. 启动后端
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 3. 启动前端
```bash
cd frontend
npm install
npm run dev
```

## 核心功能
- 异常摘要：自动识别数据异常并优先展示
- 多维度筛选：会员类型、教练、课程、月份、门店
- 留存 Cohort 分析
- 课程热度分析
- 教练负载分析
- 流失预警列表
