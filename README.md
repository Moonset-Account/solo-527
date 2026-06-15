# 青禾选题协作台 🌱

> 面向品牌内容负责人的短视频数据复盘看板，全流程协作管理选题、脚本、审核与合规风险

## 📋 项目概览

| 项目 | 技术栈 |
|------|--------|
| **前端** | Vue 3 + Element Plus + Pinia + ECharts + Vite |
| **后端** | Spring Boot 3 + MyBatis Plus + MySQL + Redis |
| **接口文档** | Knife4j (Swagger 3) |
| **数据库** | MySQL 8.0+ |

## 🎯 核心功能

### 1. 前台流程（内容创作者）
- ✅ **选题提交**：创建选题、设置标签、目标受众、内容方向
- ✅ **脚本提交**：关联选题、撰写脚本内容、标注素材标签、拍摄要求
- ✅ **工作台**：快捷入口 + 待办统计

### 2. 审核流程（审核员）
- ✅ **变更历史追溯**：时间轴展示每次变更版本（V1→V2→V3...）
- ✅ **变更前后对比**：选题/脚本/素材标签的 Before / After 双栏视图
- ✅ **审稿意见留存**：每次审核的意见永久记录
- ✅ **所有变更留痕**：修改素材标签、调整脚本结构、修改选题描述均有记录

### 3. 数据管理（内容负责人）
- ✅ **数据复盘看板**：6大核心指标 + 播放/点赞/转化趋势图
- ✅ **平台分布**：抖音/快手/视频号/B站/小红书数据对比
- ✅ **选题表现分析**：各选题的播放量 vs 转化金额散点分析
- ✅ **内容产能复盘**：选题→脚本→视频转化漏斗、创作者ROI排行、产能明细表

### 4. 异常管理（新媒体运营）
- ✅ **按素材授权风险拆分**：
  - 1️⃣ 版权授权风险（未经授权的文字/图片/视频）
  - 2️⃣ 肖像权风险（未经授权的人物肖像）
  - 3️⃣ 商标侵权风险（品牌Logo）
  - 4️⃣ 背景音乐授权（未商用授权BGM）
  - 9️� 其他合规风险
- ✅ **处理结论书写**：运营处理完成后必须填写结论，永久留存审计
- ✅ **证据材料上传**：支持上传截图、凭证等

### 5. 单据状态流转
所有关键单据均支持以下状态：
| 状态 | Tag 颜色 | 说明 |
|------|---------|------|
| **待办** | 灰色 `info` | 刚提交，等待处理 |
| **处理中** | 橙色 `warning` | 正在审核/处理中 |
| **已完成** | 绿色 `success` | 审核通过/处理完成 |
| **异常** | 红色 `danger` | 出现问题需退回 |

## 📁 项目结构

```
work-0128/
├── backend/                        # Spring Boot 后端
│   ├── sql/init.sql               # 数据库初始化脚本
│   ├── pom.xml                    # Maven 配置
│   └── src/main/
│       ├── java/com/qinghe/topic/
│       │   ├── QingHeTopicApplication.java      # 启动类
│       │   ├── common/             # 通用类 (Result, PageQuery...)
│       │   ├── config/             # 配置类 (MyBatis, CORS, Jackson...)
│       │   ├── controller/         # 6个 REST API Controller
│       │   ├── dto/                # 请求/响应 DTO
│       │   ├── entity/             # 7个数据库实体
│       │   ├── enums/              # 枚举 (状态, 审核类型, 风险类型...)
│       │   ├── mapper/             # MyBatis Plus Mapper 接口
│       │   └── service/            # 业务 Service 层
│       └── resources/
│           ├── application.yml     # 应用配置
│           └── mapper/VideoDataMapper.xml
│
├── frontend/                       # Vue 3 前端
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/                    # 6个 API 封装模块
│       ├── layout/MainLayout.vue   # 主布局 (侧边栏 + 顶栏)
│       ├── router/index.js         # 路由配置
│       ├── stores/                 # Pinia 状态管理
│       ├── styles/index.scss       # 全局样式
│       ├── utils/                  # request.js / constants.js
│       └── views/
│           ├── Login.vue           # 登录页
│           ├── 404.vue
│           ├── Workbench.vue       # 工作台
│           ├── Productivity.vue    # 产能复盘
│           ├── dashboard/Index.vue # 数据复盘看板
│           ├── topic/              # 选题 (列表+表单)
│           ├── script/             # 脚本 (列表+表单)
│           ├── review/Index.vue    # 审核追溯
│           └── abnormal/           # 异常记录 (列表+表单)
│
└── sql/ -> ../backend/sql          # 数据库脚本 (软链接位置)
```

## 🚀 快速开始

### 环境准备

| 软件 | 版本要求 | 检查命令 |
|------|---------|---------|
| JDK | 17+ | `java -version` |
| Maven | 3.8+ | `mvn -v` |
| MySQL | 8.0+ | `mysql -V` |
| Redis | 6.0+ | `redis-server -v` |
| Node.js | 18+ | `node -v` |
| npm / pnpm | 最新 LTS | `npm -v` |

### 步骤 1：创建数据库并初始化

```sql
-- 登录 MySQL 后执行
source /你的项目路径/backend/sql/init.sql;
```

或者手动执行：
```bash
mysql -uroot -p < backend/sql/init.sql
```

> 默认数据库名：`qinghe_topic`，如果用户名密码不是 `root/root`，请修改 [application.yml](backend/src/main/resources/application.yml)

### 步骤 2：启动后端

```bash
cd backend

# 方式一：Maven 命令启动
mvn spring-boot:run

# 方式二：先打包再运行
mvn clean package -DskipTests
java -jar target/topic-collaboration-1.0.0.jar
```

✅ 启动成功后访问：
- **服务地址**：http://localhost:8080/api
- **Knife4j 接口文档**：http://localhost:8080/api/doc.html

### 步骤 3：启动前端

```bash
cd frontend

# 安装依赖
npm install
# 或者推荐使用 pnpm
# pnpm install

# 启动开发服务器
npm run dev
```

✅ 启动成功后访问：**http://localhost:5173**

## 🔐 测试账号

> 所有账号密码均为：`123456`，登录页可一键填入

| 账号 | 角色 | 权限 |
|------|------|------|
| `creator01` / `creator02` / `creator03` | 📝 内容创作者 | 提交选题、提交脚本 |
| `reviewer01` | 🔍 审核员 | 选题/脚本审核、追溯变更记录 |
| `operator01` | 📣 新媒体运营 | 处理异常记录、填写结论 |
| `admin01` | 👑 内容负责人 | **全部权限** + 数据复盘看板 |

## 📊 后端接口一览

| 模块 | 基础路径 | 主要接口 |
|------|---------|---------|
| 选题管理 | `/topic` | 分页列表 / 详情 / 新增编辑 / 状态更新 / 删除 / 概览统计 |
| 脚本管理 | `/script` | 分页列表 / 详情 / 新增编辑 / 按选题查询 / 状态更新 |
| 审核记录 | `/review` | 业务ID查询变更历史 / 分页 / 新增变更记录 |
| 异常记录 | `/abnormal` | 分页列表 / 上报异常 / 运营填写结论 / 状态更新 |
| 数据统计 | `/stats` | 复盘看板全量数据 / 工作台待办统计 |
| 用户管理 | `/user` | 登录 / 创作者列表 / 审核员列表 / 运营列表 |

## 🎨 页面演示指引

1. **登录页** → 选择测试账号一键登录（推荐 `admin01`）
2. **工作台** → 查看待办统计 + 快捷入口
3. **数据复盘看板** → 切换时间范围（近7/30/90天）查看图表
4. **内容产能复盘** → 查看转化漏斗 + 创作者产能排行
5. **选题管理** → 列表 → 点"审核追溯"链接跳转查看变更历史
6. **审核追溯** → 选择快捷按钮（选题ID=1 / 脚本ID=1 / 素材ID=3）加载时间轴
7. **异常记录** → 查看按授权风险分类列表 → 点"处理结论"模拟运营操作

## ⚠️ 注意事项

1. **Redis 非强制**：当前版本 Redis 未深度耦合，未启动 Redis 后端也能运行（会有启动日志警告但不影响功能）
2. **前端 Mock 兜底**：若后端未启动，所有列表页均有 Mock 数据可直接预览界面效果
3. **数据库连接**：请确保 [application.yml](backend/src/main/resources/application.yml) 中的 MySQL 用户名/密码与你本地环境一致
4. **跨域已配置**：后端已开放 CORS，前端 Vite 已配置代理 `/api` → `http://localhost:8080`

## 📦 生产部署

### 前端构建
```bash
cd frontend
npm run build
# dist/ 目录即为产物，可由 Nginx 托管
```

### 后端打包
```bash
cd backend
mvn clean package -DskipTests
# JAR 包位于 target/topic-collaboration-1.0.0.jar
nohup java -jar target/topic-collaboration-1.0.0.jar > app.log 2>&1 &
```

---

> 🌱 **青禾**寓意：如同青苗茁壮成长，内容创作从选题萌芽，经过协作打磨，最终成长为爆款。
