# 高校图书馆自习位利用率分析平台

一个完整的数据分析工作台，用于分析高校图书馆自习位的使用情况。

## 技术栈

- **前端**: React 18 + ECharts + Ant Design + Vite
- **后端**: FastAPI + SQLAlchemy + Pandas
- **数据库**: PostgreSQL

## 功能特性

### 核心入口
- **今天最异常的三件事**: 自动检测并展示当天最显著的数据异常，支持点击下钻

### 可视化图表
1. **座位热力图**: 按区域展示座位利用率分布，支持区域切换
2. **爽约趋势图**: 展示爽约率变化趋势，考试周区域高亮标注
3. **区域对比图**: 多维度对比各区域的利用率、爽约率、平均等待时间
4. **等待队列漏斗**: 展示从浏览到完成使用的转化漏斗

### 下钻维度
- 楼层
- 区域
- 座位类型
- 时间段
- 用户分组

### 分析功能
- 考试周 vs 普通周 对比分析
- 异常检测与标注
- 样本量统计与展示
- 数据更新时间显示
- 当前筛选条件展示

### 导出功能
- CSV 报告导出
- PDF 报告导出

### 数据处理
- 缺失值自动处理（数值用中位数，分类用众数）
- CSV 数据导入
- 隐私字段聚合展示

## 项目结构

```
.
├── backend/                 # 后端项目
│   ├── main.py             # FastAPI 主应用
│   ├── models.py           # 数据库模型
│   ├── schemas.py          # Pydantic 模式
│   ├── database.py         # 数据库连接
│   ├── data_processor.py   # 数据处理逻辑
│   ├── generate_data.py    # 模拟数据生成
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端项目
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── context/        # 全局状态
│   │   ├── services/       # API 服务
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 快速开始

### 1. 数据库准备

确保已安装并启动 PostgreSQL，然后创建数据库：

```sql
CREATE DATABASE library_seat;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE library_seat TO postgres;
```

### 2. 后端启动

```bash
cd backend
pip install -r requirements.txt
python generate_data.py   # 生成模拟数据
python main.py            # 启动服务，默认端口 8000
```

API 文档: http://localhost:8000/docs

### 3. 前端启动

```bash
cd frontend
npm install
npm run dev   # 启动开发服务器，默认端口 3000
```

访问: http://localhost:3000

## 数据库表结构

- **floors**: 楼层信息
- **areas**: 区域信息
- **seats**: 座位信息（含网格坐标）
- **user_groups**: 用户分组
- **reservations**: 预约记录
- **no_show_records**: 爽约记录
- **wait_queue**: 等待队列
- **exam_weeks**: 考试周配置
- **device_repairs**: 设备报修
- **data_import_logs**: 数据导入日志

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/anomalies` | GET | 获取异常数据 |
| `/api/heatmap` | GET | 热力图数据 |
| `/api/no-show-trend` | GET | 爽约趋势 |
| `/api/area-comparison` | GET | 区域对比 |
| `/api/funnel` | GET | 漏斗数据 |
| `/api/exam-week-comparison` | GET | 考试周对比 |
| `/api/report/csv` | GET | 导出 CSV |
| `/api/report/pdf` | GET | 导出 PDF |
| `/api/import` | POST | 导入 CSV 数据 |

## 隐私说明

所有用户相关数据均以聚合形式展示，不暴露个人身份信息。
