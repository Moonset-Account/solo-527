# 冷链疫苗温度合规分析平台

疾控中心仓库复盘专用仪表盘，基于 Python Dash + Plotly + TimescaleDB 构建。

## 功能特性

### 📊 核心仪表盘
- **超温时长趋势**：逐日展示超温/低温时长与平均合规率趋势
- **路线合规分布**：各运输路线的平均合规率横向对比
- **站点合规对比**：各疾控站点的合规率气泡图（气泡大小表示运输量）
- **批次合规明细**：完整的批次列表，含状态颜色标记

### ✅ 数据处理能力
- **时序清洗**：自动识别并剔除缺失值、传感器故障、统计异常值
- **阈值配置**：可动态调整最低/最高温度阈值、最少样本数
- **样本量校验**：采样少于 3 次的运输标记为"待复核"，不参与排名
- **剔除标记**：报表中明确标出被剔除的缺失值和异常采样

### 🔍 异常下钻
- 点击批次表格任意行，弹出采样曲线详情
- 区分显示有效采样点（绿色）和已剔除点（红色×）
- 展示复核状态和申诉记录
- 支持查看签收照片（需接入实际存储）

### 📋 合规管理
- **复核状态**：复核中、申诉中的批次不参与月度合规率计算
- **状态筛选**：可按正常/待复核/申诉中/复核中筛选
- **路线/站点筛选**：多维度数据过滤

### 📤 报告导出
- 一键导出 Excel 格式合规报告
- 包含：汇总概览、合规排名、待复核批次、申诉复核、剔除数据明细

## 快速开始

### 方式一：使用启动脚本（推荐）
```bash
./run.sh
```

### 方式二：手动启动
```bash
# 1. 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 启动应用
python app.py
```

### 访问应用
打开浏览器访问：`http://localhost:8050`

## 项目结构

```
.
├── app.py                 # Dash 主应用（含所有图表和交互）
├── compliance_engine.py   # 合规计算核心引擎
├── data_generator.py      # 模拟数据生成器（TimescaleDB兼容）
├── report_exporter.py     # 报告导出模块
├── requirements.txt       # Python 依赖
├── run.sh                 # 启动脚本
├── .env.example           # 环境变量示例
└── README.md              # 项目说明
```

## 连接 TimescaleDB（可选）

默认使用内置模拟数据运行。如需连接真实的 TimescaleDB：

1. 复制环境变量文件：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 填入数据库连接信息

3. 修改 `app.py` 中的数据加载逻辑，使用 SQLAlchemy 连接 TimescaleDB：
   ```python
   from sqlalchemy import create_engine
   engine = create_engine("postgresql://user:pass@host:port/db")
   df_shipments = pd.read_sql("SELECT * FROM shipments", engine)
   df_samples = pd.read_sql("SELECT * FROM temperature_samples", engine)
   ```

## 核心模块说明

### compliance_engine.py
- `TimeSeriesCleaner`：时序数据清洗器，支持缺失值、传感器故障、Z-score异常检测
- `ComplianceCalculator`：合规率计算器，按时间加权计算超温时长占比
- 支持按批次输出完整合规报告，含剔除明细

### report_exporter.py
- 多 Sheet Excel 报告生成
- CSV 格式导出
- 自动汇总统计和状态标记

## 温度合规规则

| 条件 | 处理方式 |
|------|----------|
| 温度 < 2°C 或 > 8°C | 记为超温/低温，计入不合规时长 |
| 温度为空值 | 标记为"缺失值"，剔除 |
| 温度 < -50°C 或 > 50°C | 标记为"传感器故障"，剔除 |
| Z-score > 3（样本>10时） | 标记为"统计异常值"，剔除 |
| 有效样本 < 3 | 标记为"待复核"，不参与排名 |
| 复核状态为 pending/appealed | 不参与月度合规率统计 |

## 技术栈

- **Dash 2.14**：Web 应用框架
- **Plotly 5.18**：交互式图表
- **Pandas 2.1**：数据处理
- **NumPy / SciPy**：科学计算
- **Dash Bootstrap Components**：UI 组件
- **TimescaleDB**：时序数据库（可选）
- **OpenPyXL / XlsxWriter**：Excel 导出
