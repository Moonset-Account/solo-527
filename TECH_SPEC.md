# 实验室样本复核趋势看板 - 技术说明

## 一、系统架构

### 技术栈
- **桌面框架**: Tauri 1.6 (Rust)
- **前端框架**: Svelte 4 + Vite 5
- **图表引擎**: ECharts 5.5
- **数据库**: PostgreSQL 12+
- **路由**: svelte-routing

### 目录结构
```
question-165/
├── src/                          # 前端源码
│   ├── pages/
│   │   ├── Dashboard.svelte      # 主看板页面
│   │   └── SampleDetail.svelte   # 样本详情下钻页
│   ├── App.svelte                # 根组件
│   ├── main.js                   # 入口文件
│   ├── api.js                    # Tauri 调用封装
│   └── app.css                   # 全局样式
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── main.rs               # Tauri 主程序
│   │   ├── models.rs             # 数据模型
│   │   ├── db.rs                 # 数据库连接
│   │   ├── services.rs           # 业务逻辑服务
│   │   ├── sync.rs               # 离线同步模块
│   │   └── export.rs             # 报告导出模块
│   ├── Cargo.toml
│   └── tauri.conf.json
├── sql/
│   └── init.sql                  # 数据库初始化脚本
├── package.json
└── vite.config.js
```

---

## 二、离线数据同步方案

### 设计思路
内网桌面应用在断网环境下需要支持离线数据导入导出，确保数据在不同终端间可迁移。

### 实现机制

#### 1. 数据导出 (Offline Export)
- **入口**: 参见 [sync.rs](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-165/src-tauri/src/sync.rs#L42-L110) 中的 `export_offline_bundle` 函数
- **流程**:
  1. 从 PostgreSQL 全量读取 5 张核心表数据
  2. 将每条记录包装为 `SyncRecord`，包含：表名、记录ID、操作类型(upsert)、时间戳、数据JSON
  3. 组装为 `SyncBundle` 并添加唯一同步ID和生成时间
  4. 序列化为 JSON 文件，存储在应用数据目录的 `offline_sync/` 下
  5. 文件名格式: `sync_bundle_YYYYMMDD_HHMMSS.json`

#### 2. 数据导入 (Offline Import)
- **入口**: 参见 [sync.rs](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-165/src-tauri/src/sync.rs#L112-L212) 中的 `import_offline_bundle` 函数
- **流程**:
  1. 读取同步 JSON 文件并解析为 `SyncBundle`
  2. 逐条遍历记录，根据表名分发
  3. 使用 PostgreSQL 的 `INSERT ... ON CONFLICT (id) DO UPDATE` 语法实现幂等导入
  4. 冲突时以导入数据为准，更新时间戳
  5. 返回成功导入的记录数

#### 3. 同步目录位置
- macOS: `~/Library/Application Support/com.lab.sample-dashboard/offline_sync/`
- Windows: `%APPDATA%\com.lab.sample-dashboard\offline_sync\`
- Linux: `~/.config/com.lab.sample-dashboard/offline_sync/`

---

## 三、脏数据标记机制

### 设计思路
对采集或录入过程中产生的异常数据进行标记，脏数据默认不进入统计计算，但可按需查看。

### 实现机制

#### 1. 数据库层面
- 每张业务表（`volunteers`、`sample_records`）包含两个字段：
  - `is_dirty BOOLEAN DEFAULT FALSE` - 是否标记为脏数据
  - `dirty_reason TEXT` - 脏数据原因说明
- 索引优化: `CREATE INDEX idx_sample_dirty ON sample_records(is_dirty)`

#### 2. 业务层面
- **默认过滤**: 所有统计查询（通过率、补样原因、积压统计）默认加上 `WHERE NOT is_dirty` 条件
- **可选包含**: 看板顶部提供「包含脏数据」复选框，勾选后可查看含脏数据的统计
- **手动标记**: 可通过 API `mark_sample_dirty` 将样本标记为脏数据并填写原因
- **可视化识别**: 
  - 脏数据在详情页显示红色「脏数据」徽章
  - 脏数据原因在样本信息区高亮显示

#### 3. 相关代码
- 标记接口: [services.rs](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-165/src-tauri/src/services.rs#L109-L119)
- 脏数据过滤: [services.rs](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-165/src-tauri/src/services.rs#L15-L33)
- 前端控制: [Dashboard.svelte](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-165/src/pages/Dashboard.svelte#L15-L20)

---

## 四、二审样本过滤逻辑

### 设计思路
二审样本有明确的状态流转，支持按状态和超时时间过滤，便于项目负责人掌握积压情况。

### 状态模型
二审记录 (`second_reviews` 表) 的 `status` 字段:
- `pending` - 待二审（核心关注对象）
- `completed` - 已完成二审

### 过滤维度

#### 1. 按状态过滤
- 统计积压时只取 `status = 'pending'` 的记录
- 已完成的记录只在样本详情页的历史中展示

#### 2. 按超时时间过滤
在 [services.rs](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-165/src-tauri/src/services.rs#L56-L76) 的 `get_backlog_stats` 中分为三档:
- **待二审总数**: 所有 `status = 'pending'`
- **超24小时**: `NOW() - first_review_time > INTERVAL '24 hours'` 且 ≤ 72小时
- **超72小时**: `NOW() - first_review_time > INTERVAL '72 hours'`

#### 3. 列表查询过滤
- 接口 `get_pending_second_reviews(only_overdue)`:
  - `only_overdue = false`: 返回所有待二审
  - `only_overdue = true`: 仅返回超24小时的

### 前端展示
- 顶部统计卡片直观展示三档积压数量
- 不同紧急度使用不同颜色:
  - 蓝色: 待二审总数
  - 黄色: 超24小时
  - 红色: 超72小时（高危）

---

## 五、导出报告保留筛选口径

### 设计思路
导出的报告需要可追溯，必须完整记录导出时的筛选条件，确保任何人拿到报表都能复现数据范围。

### 实现机制

#### 1. 筛选参数对象
定义 `ExportFilterParams` 结构保存所有筛选条件:
```rust
pub struct ExportFilterParams {
    pub batch_codes: Option<Vec<String>>,     // 指定批次
    pub status_filter: Option<String>,        // 状态过滤
    pub include_dirty: bool,                  // 是否包含脏数据
    pub date_range_start: Option<String>,     // 开始日期
    pub date_range_end: Option<String>,       // 结束日期
    pub min_sample_threshold: i64,            // 最小样本阈值
}
```
参见: [export.rs](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-165/src-tauri/src/export.rs#L12-L20)

#### 2. 报告结构
导出的 CSV 报告分为 5 个区块，每个区块之间空行分隔:
1. **报告头**: 生成时间 + 筛选参数（JSON格式）
2. **批次通过率统计**: 含是否「待观察」标记
3. **补样原因统计**: 分类数量及占比
4. **二审积压统计**: 三档积压数
5. **样本明细**: 满足筛选条件的所有样本详情

参见: [export.rs](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-165/src-tauri/src/export.rs#L102-L168)

#### 3. 前端导出确认
导出前弹出确认对话框，展示将保留的筛选口径:
- 是否包含脏数据
- 最小样本阈值
- 报告生成时间

参见: [Dashboard.svelte](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-165/src/pages/Dashboard.svelte#L223-L246)

---

## 六、待观察批次规则

### 规则定义
- **阈值**: 样本量 < 30 的批次标记为「待观察」
- **阈值配置**: 常量 `MIN_SAMPLE_THRESHOLD = 30`，可在 [services.rs](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-165/src-tauri/src/services.rs#L7) 修改

### 展示逻辑
1. **排行榜排除**: 待观察批次不参与通过率排名，图表中使用黄色柱形区分
2. **标记显示**: 表格中使用「待观察」徽章（黄色）
3. **背景提示**: 待观察批次的表格行使用浅黄色背景
4. **顶部说明**: 工具栏显示提示文字 `※ 样本量低于 30 的批次标记为"待观察"`

### 代码实现
```rust
// services.rs get_batch_pass_rates 中
BatchPassRate {
    ...
    is_pending: total_count < MIN_SAMPLE_THRESHOLD,
}
```
参见: [services.rs](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-165/src-tauri/src/services.rs#L15-L33)

---

## 七、数据库表设计

### 核心表关系
```
volunteers (志愿者)
    └── 1:N ── sample_records (样本登记)
                ├── 1:N ── resample_records (补样记录)
                ├── 1:N ── exception_screenshots (异常截图)
                └── 1:N ── second_reviews (二审结论)
```

### 字段要点
- 所有表使用 UUID 主键，便于跨库同步
- 关键字段加索引 (batch_code, status, is_dirty, sample_id)
- 含 `created_at` / `updated_at` 时间戳追踪

完整脚本: [init.sql](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-165/sql/init.sql)

---

## 八、部署与运行

### 前置要求
- Node.js 18+
- Rust 1.70+
- PostgreSQL 12+

### 数据库初始化
```bash
createdb lab_sample_db
psql -d lab_sample_db -f sql/init.sql
```

### 环境配置
```bash
cp .env.example .env
# 编辑 DATABASE_URL 指向你的 PostgreSQL
```

### 开发运行
```bash
npm install
npm run tauri dev
```

### 生产构建
```bash
npm run tauri build
```

---

## 九、项目负责人周会使用指南

1. **开场概览**: 先看顶部 4 个统计卡片，掌握二审积压和有效批次数量
2. **趋势分析**: 查看「各批次通过率趋势」柱状图，关注低于 85% 目标线的批次
3. **质量回溯**: 查看「补样原因分布」饼图，定位主要质量问题
4. **积压处理**: 查看二审积压，超72小时红色标记为高危需优先处理
5. **下钻排查**: 点击低通过率批次中的异常样本，进入证据链页面查看：
   - 样本基本信息及志愿者信息
   - 补样历史
   - 异常截图证据
   - 二审流转记录
6. **导出报告**: 点击「导出报告」，CSV 文件首行已记录筛选口径，可直接用于周会汇报
