# 工业传感器异常预测系统

面向设备工程师的工业传感器异常预测系统，用于提前标记疑似**轴承磨损**或**传感器漂移**，支持人工确认闭环和全链路可追溯。

---

## ✨ 核心特性

### 🔬 数据与特征
- **多源数据融合**: 温度、振动、电流、转速四类传感器 + 维修记录 + 班次信息
- **停机检修过滤**: 停机检修期间的数据自动排除，不作为故障样本训练
- **丰富特征工程**: 时域(15项) + 频域(7项) + 趋势(3项) + 传感器相关性(12项) + 班次编码，共110+维特征
- **滑动窗口**: 60点窗口、10点步长，多粒度覆盖异常演化过程

### 🤖 模型与训练
- **算法选型**: Gradient Boosting / Random Forest 可选
- **MLflow 全链路**: 实验追踪、参数记录、指标对比、模型注册、版本管理
- **闭环训练**: 工程师确认的反馈数据自动纳入下次训练
- **完整评估**: 分类别指标、混淆矩阵、5折交叉验证、ROC AUC

### 🔔 告警与人工确认
- **告警队列**: 置信度阈值可调，同窗口告警自动去重
- **三类反馈**:
  - 🔧 **真实故障**: 确认为轴承磨损等机械故障
  - 📡 **传感器漂移**: 确认为传感器异常漂移
  - ✅ **误报**: 实际设备正常
- **人工改标**: 支持工程师对历史反馈重新标记，改标记录全留痕

### 📊 监控与可追溯
- **反馈趋势**: 三类反馈的日/小时趋势图，支持时间范围筛选
- **模型版本对比**: 每次训练的指标、样本、数据版本完整记录
- **数据版本管理**: 每次训练的数据集快照、关联反馈ID列表
- **改标记录**: 所有标签变更的时间、原因、操作人均可追溯

---

## 🏗️ 技术架构

```
                  ┌─────────────────────────────────────────────────┐
                  │                Web UI (Flask + HTML/JS)         │
                  │   仪表盘 · 告警管理 · 模型监控 · 后台管理        │
                  └────────────────────┬────────────────────────────┘
                                       │ REST API
┌──────────────┐  ┌───────────────────▼─────────────────────────────┐
│  PostgreSQL  │◄─┤                  Flask App                      │
│   (9张表)    │  │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │
└──────┬───────┘  │  │ 推理引擎 │ │告警管理 │ │训练/MLflow管理 │  │
       │          │  └─────┬────┘ └─────┬────┘ └────────┬────────┘  │
       │          └────────┼────────────┼────────────────┼───────────┘
       │                   │            │                │
       │          ┌────────▼────────────▼────────────────▼───────────┐
       │          │               核心模块层                          │
       │          │  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
       └──────────┤  │ 特征工程     │  │ 模型训练   │  │ 数据生成  │ │
                  │  │(时域/频域...) │  │(sklearn)   │  │(模拟器)   │ │
                  │  └──────────────┘  └─────┬──────┘  └───────────┘ │
                  └──────────────────────────┼───────────────────────┘
                                             │
                                  ┌──────────▼──────────┐
                                  │     MLflow Registry  │
                                  │  (or Local Registry) │
                                  └─────────────────────┘
```

---

## 📁 项目结构

```
question-321/
├── config.py                  # 全局配置（数据库、MLflow、服务端口等）
├── database.py                # 数据库ORM模型、连接管理、9张表定义
├── data_generator.py          # 传感器数据模拟器、数据加载器
├── feature_engineer.py        # 特征工程（时域/频域/滑动窗口）
├── model_trainer.py           # scikit-learn 模型训练与评估
├── mlflow_manager.py          # MLflow注册与本地后备方案
├── inference_engine.py        # 推理引擎 + 告警队列 + 人工确认接口
├── app.py                     # Flask Web服务主程序
├── requirements.txt           # Python依赖
├── .env                       # 环境变量配置
│
├── templates/                 # 前端页面
│   ├── index.html            # 仪表盘（系统概览、趋势图）
│   ├── alerts.html           # 告警管理（列表、筛选、人工确认弹窗）
│   ├── monitoring.html       # 模型监控（反馈趋势、版本对比、性能）
│   └── admin.html            # 后台管理（数据版本、改标记录）
│
├── static/                    # 静态资源
│   ├── style.css             # 全局样式
│   └── app.js                # 通用JS工具（API请求、Toast、模态框等）
│
├── models/                    # 本地模型注册表（MLflow不可用时）
│   └── model_registry.json
│
├── scripts/                   # 脚本工具
│   ├── init_db.py            # 数据库初始化脚本
│   └── run_demo.py           # 完整演示脚本（一键跑通全流程）
│
├── data/                      # 数据文件目录
├── logs/                      # 日志目录
└── mlruns/                    # MLflow 本地存储（如启用）
```

---

## 🗄️ 数据库表结构

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `sensor_readings` | 传感器原始数据 | equipment_id, timestamp, temp/vib/curr/rpm, is_downtime, shift, raw_label |
| `maintenance_records` | 维修记录 | equipment_id, start/end_time, maintenance_type |
| `shift_records` | 班次配置 | shift_name, start/end_hour |
| `feature_records` | 提取的特征记录 | equipment_id, window_start/end, features(JSON), data_version |
| `alerts` | 告警队列 | equipment_id, alert_type, confidence, model_version, status, feedback_type |
| `feedback_records` | 人工反馈记录 | alert_id, feedback_type(故障/漂移/误报), is_used_for_training |
| `model_versions` | 模型版本 | version, mlflow_run_id, metrics, is_deployed, training_data_version |
| `data_versions` | 数据版本 | version, record_count, included_feedback_ids(JSON) |
| `relabel_records` | 人工改标记录 | alert_id, original/new_label, relabel_reason, relabel_user |

---

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆并进入项目
cd question-321

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置 PostgreSQL

**方法A：使用本地PostgreSQL**

```bash
# 确保PostgreSQL服务运行，创建数据库
createdb -U postgres sensor_prediction

# 编辑 .env 文件（默认已配置本地）
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=sensor_prediction
# DB_USER=postgres
# DB_PASSWORD=postgres
```

**方法B：使用Docker启动PostgreSQL**

```bash
docker run -d \
  --name sensor-pg \
  -e POSTGRES_DB=sensor_prediction \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. 一键运行完整演示（推荐首次使用）

```bash
# 自动完成：初始化库 → 生成数据 → 特征 → 训练 → 注册 → 推理 → 反馈 → 重训
python scripts/run_demo.py
```

### 4. 分步骤手动初始化

```bash
# Step 1: 初始化数据库表结构
python scripts/init_db.py

# Step 2（可选）: 带 --drop 清空重建
python scripts/init_db.py --drop

# Step 3: 启动 Web 服务
python app.py

# Step 4: 浏览器访问 http://localhost:8080
# 进入「后台管理」→「系统管理」按顺序点击4步初始化按钮
```

### 5. 启动MLflow服务（可选，系统不依赖MLflow可运行）

```bash
mlflow server \
  --backend-store-uri sqlite:///mlflow.db \
  --default-artifact-root ./mlruns \
  --host 0.0.0.0 \
  --port 5000
```

> 💡 **后备方案**: 系统会自动检测MLflow可用性。若MLflow服务不可用，自动切换为本地文件存储（`models/`目录），所有功能保持一致。

---

## 🖥️ 功能页面说明

### 1. 仪表盘 (`/`)
- 5项核心指标卡片：待处理告警、今日告警、今日反馈、当前F1、7天误报率
- 告警趋势折线图（轴承磨损/传感器漂移分类型）
- 反馈类型趋势柱状图+饼图（真实故障/漂移/误报）
- 最新告警快速列表
- 快速操作：初始化系统、一键推理

### 2. 告警管理 (`/alerts`)
- 4张统计卡片：待处理/已确认/轴承磨损/漂移数量
- 多维筛选：状态、类型、设备、最小置信度、时间范围
- 告警列表：带进度条的置信度显示、状态Badge、反馈类型Badge
- **告警详情弹窗**:
  - 基本信息 + 触发窗口
  - 传感器数据快照4轴时序图
  - 温度/振动/电流/转速均值统计
  - 人工确认信息（已确认时）
- **人工确认弹窗**:
  - 三选一可视化卡片：🔧真实故障 / 📡传感器漂移 / ✅误报
  - 可选改标（原标签→新标签，自动记录改标历史）
  - 确认人 + 备注字段

### 3. 模型监控 (`/monitoring`)
**Tab1 - 反馈趋势**:
- 4张反馈类型分布卡片
- 按天/按小时趋势折线图
- 反馈占比饼图
- 告警确认率堆叠柱图
- 告警类型分离柱图

**Tab2 - 模型版本对比**:
- 完整模型版本表：Accuracy/Precision/Recall/F1
- 部署/未部署状态标记
- 模型详情：混淆矩阵、分类别指标、交叉验证结果
- 一键部署任意历史版本

**Tab3 - 性能指标**:
- 已部署模型的总体指标
- 分类别P/R/F1分组柱状图
- 样本分布 + 混淆矩阵热力表

### 4. 后台管理 (`/admin`)
**Tab1 - 数据版本**:
- 每次训练的数据集快照版本列表
- 样本数/正样本数/特征数/关联反馈数
- 关联模型 + 详情（含纳入训练的反馈ID列表）

**Tab2 - 人工改标记录**:
- 所有标签变更：原标签→新标签、改标原因、操作人
- 分页浏览，全量可追溯

**Tab3 - 反馈训练记录**:
- 工程师反馈记录列表
- 是否已用于训练 + 对应的数据版本
- 按使用状态筛选

**Tab4 - 系统管理**:
- 健康检查卡片：DB/API/模型数/待训练反馈
- **4步一键初始化**:
  1. 初始化数据库表结构
  2. 生成30天模拟传感器数据
  3. 训练并部署首个模型
  4. 执行推理生成告警
- 完整的操作指南说明

---

## 🧑‍🔧 工程师工作流程

```
模型自动推理 → 生成告警 → 工程师收到通知
                    │
                    ▼
              打开告警详情
          ┌───────┴───────┐
          ▼               ▼               ▼
    确认真实故障    确认传感器漂移    标记为误报
   (REAL_FAULT)   (SENSOR_DRIFT)   (FALSE_ALARM)
          │               │               │
          └───────┬───────┴───────┬───────┘
                  ▼               ▼
         反馈存入反馈表      可选改标(记录改标轨迹)
         标记待训练
                  │
                  ▼
         下次模型训练自动纳入
         ┌───────┴────────┐
         ▼                ▼
    生成新数据版本     训练新模型版本
    (含反馈ID列表)     (关联数据版本)
         │                │
         └───────┬────────┘
                 ▼
         人工评估是否部署
                 │
                 ▼
          替换线上模型
          → 全链路可追溯：反馈ID→数据版本→模型版本
```

---

## 🔌 API 接口

### 告警相关
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/alerts` | 获取告警列表（支持筛选+分页） |
| GET | `/api/alerts/<id>` | 获取告警详情（含传感器快照） |
| POST | `/api/alerts/<id>/feedback` | 提交人工确认（body: {feedback_type, feedback_user, feedback_note, relabel_from}） |
| GET | `/api/alerts/pending/count` | 待处理告警统计 |

### 模型与训练
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/models` | 模型版本列表 |
| GET | `/api/models/<version>` | 模型详情（完整metrics） |
| POST | `/api/models/<version>/deploy` | 部署指定版本 |
| POST | `/api/models/train` | 训练新模型（自动部署） |

### 推理
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/inference/run` | 批量推理（lookback_minutes, equipment_ids） |

### 数据版本与改标
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/data-versions` | 数据版本列表 |
| GET | `/api/data-versions/<version>` | 数据版本详情（含反馈ID） |
| GET | `/api/relabel-records` | 改标记录（分页） |
| GET | `/api/feedback-records` | 反馈记录（支持按使用状态筛选） |

### 监控统计
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/monitoring/feedback-stats` | 反馈统计+趋势 |
| GET | `/api/monitoring/alert-trends` | 告警趋势 |
| GET | `/api/monitoring/daily-summary` | 今日/本周汇总 |

### 系统管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/init-database` | 初始化数据库 |
| POST | `/api/generate-data` | 生成模拟数据 |
| GET | `/api/equipment/list` | 设备ID列表 |

---

## 🧠 核心业务规则

| 规则 | 实现位置 | 说明 |
|------|----------|------|
| **停机检修数据排除** | `data_generator.py` → `load_sensor_data()` + `feature_engineer.py` → `exclude_downtime` 参数 | `is_downtime=True` 的数据在加载和特征提取时均过滤 |
| **反馈纳入训练门槛** | `model_trainer.py` → `_include_confirmed_feedback()` | 仅 `is_used_for_training=False` 的反馈纳入，使用后标记为True并关联数据版本 |
| **告警去重** | `inference_engine.py` → `generate_alerts()` | 同设备+同类型+时间窗口重叠的pending告警不重复生成 |
| **告警阈值** | `config.py` → `ALERT_THRESHOLD=0.85` | 异常类别置信度≥85%才触发告警 |
| **反馈三种类型** | `config.py` → `FEEDBACK_TYPES` | REAL_FAULT → 轴承磨损标签, SENSOR_DRIFT → 传感器漂移标签, FALSE_ALARM → 正常标签 |
| **改标全记录** | `inference_engine.py` → `submit_feedback()` 的 `relabel_from` 参数 | 任何标签变更都存入 `relabel_records` 表 |
| **全链路关联** | 数据版本 `included_feedback_ids` ←→ 模型版本 `training_data_version` | 从模型版本可追溯数据版本，从数据版本可追溯反馈ID，从反馈可追溯原始告警 |

---

## 📊 特征清单（共110+维）

### 每传感器时域特征 (4传感器 × 15 = 60维)
- 均值、标准差、最小值、最大值、中位数、偏度、峰度
- 均方根(RMS)、峰峰值、波峰因数(Crest)、方差
- P25/P75分位数、四分位距(IQR)、过零率

### 每传感器频域特征 (4传感器 × 7 = 28维)
- 主频、主频功率
- 谱质心(Spectral Centroid)、谱带宽
- 总功率、频谱均值、频谱标准差

### 每传感器趋势特征 (4传感器 × 3 = 12维)
- 线性拟合斜率
- 变化率(ROC)
- 二阶加速度(二次项)

### 交叉相关性特征 (12维)
- 4种传感器两两组合的皮尔逊相关系数 (C(4,2)=6组)
- 两两均值比率 (6组)

### 班次编码特征 (4维)
- 班次数值编码
- 早班/中班/晚班 one-hot 编码

---

## 🛠️ 运维与排错

### 常见问题

**Q1: 启动时提示数据库连接失败？**
- 检查PostgreSQL服务是否运行
- 确认 `.env` 中的连接配置正确
- 默认配置需要本地 `postgres` 用户，密码 `postgres`，数据库 `sensor_prediction`

**Q2: MLflow连接失败会影响功能吗？**
- 不会。系统自动降级为本地注册表（`models/model_registry.json` + `models/<version>/pipeline.joblib`）
- 功能完全一致，包括版本管理、部署、加载

**Q3: 训练模型报错"训练数据不足"？**
- 需要先生成传感器数据（后台管理→系统管理→生成30天数据）
- 或调用 `python scripts/run_demo.py`

**Q4: 告警列表为空？**
- 需先执行推理：仪表盘→快速推理，或后台→执行推理
- 推理需要至少1小时以上的数据窗口

### 常用调试命令

```bash
# 查看数据库中的表
psql -U postgres -d sensor_prediction -c "\dt"

# 查看告警数量
psql -U postgres -d sensor_prediction -c "SELECT status, COUNT(*) FROM alerts GROUP BY status;"

# 查看反馈分布
psql -U postgres -d sensor_prediction -c "SELECT feedback_type, COUNT(*) FROM feedback_records GROUP BY feedback_type;"

# 清理所有数据重新开始
python scripts/init_db.py --drop
python scripts/run_demo.py
```

---

## 📝 License

Internal Use Only © Industrial Sensor Analytics Team
