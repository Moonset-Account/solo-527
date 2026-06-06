# 社区菜园认领管理平台 - 项目结构说明

## 目录结构

```
community-garden-management/
├── src/                          # 前端源码
│   ├── firebase/                 # Firebase 配置
│   │   └── config.js             # Firebase 初始化配置
│   ├── layouts/                  # 布局组件
│   │   └── MainLayout.vue        # 主布局（侧边栏+顶部导航）
│   ├── middleware/               # 中间件
│   │   └── permission.js         # 权限中间件、敏感字段过滤
│   ├── models/                   # 数据模型
│   │   └── schemas.js            # 所有集合 Schema 定义、常量枚举
│   ├── router/                   # 路由配置
│   │   └── index.js              # 路由定义、权限守卫
│   ├── services/                 # 领域服务层（接口层）
│   │   ├── baseService.js        # Firestore 基础服务类
│   │   ├── plotService.js        # 地块服务
│   │   ├── claimService.js       # 认领申请服务
│   │   ├── rotationService.js    # 轮值服务
│   │   ├── toolService.js        # 工具服务
│   │   ├── cropService.js        # 作物服务
│   │   ├── announcementService.js# 公告服务
│   │   ├── harvestService.js     # 收获记录服务
│   │   ├── photoLogService.js    # 照片日志服务
│   │   ├── userService.js        # 用户服务
│   │   ├── notificationService.js# 通知服务
│   │   ├── dashboardService.js   # 看板分析服务
│   │   └── index.js              # 服务统一导出
│   ├── stores/                   # Pinia 状态管理
│   │   └── auth.js               # 认证状态存储
│   ├── styles/                   # 全局样式
│   │   └── main.scss             # 主样式文件
│   ├── views/                    # 页面组件
│   │   ├── Login.vue             # 登录页
│   │   ├── Dashboard.vue         # 数据看板
│   │   ├── Plots.vue             # 地块地图
│   │   ├── Claims.vue            # 认领申请
│   │   ├── Crops.vue             # 作物管理
│   │   ├── Rotation.vue          # 轮值表
│   │   ├── Tools.vue             # 公共工具
│   │   ├── Announcements.vue     # 公共公告
│   │   ├── Harvest.vue           # 收获记录
│   │   ├── PhotoLog.vue          # 照片日志
│   │   └── Users.vue             # 用户管理（仅管理员）
│   ├── App.vue                   # 根组件
│   └── main.js                   # 应用入口
├── functions/                    # Firebase Cloud Functions
│   ├── package.json              # Functions 依赖
│   └── index.js                  # 异步任务入口（连续缺席检查、轮值提醒等）
├── firestore.rules               # Firestore 安全规则
├── firestore.indexes.json        # Firestore 索引配置
├── storage.rules                 # Storage 安全规则
├── firebase.json                 # Firebase 项目配置
├── .firebaserc                   # Firebase 项目别名
├── package.json                  # 项目依赖
├── vite.config.js                # Vite 构建配置
├── .env.example                  # 环境变量示例
└── MAIN_FLOW_VALIDATION.md       # 主流程验证文档
```

## 架构分层说明

### 1. 表现层 (Views / Components)
- 位于 `src/views/` 和 `src/layouts/`
- 负责 UI 渲染和用户交互
- 只调用服务层接口，不直接操作 Firestore

### 2. 状态层 (Stores)
- 位于 `src/stores/`
- 使用 Pinia 管理全局状态
- 认证状态、用户信息等跨页面共享数据

### 3. 领域服务层 (Services)
- 位于 `src/services/`
- 封装业务逻辑和数据访问
- 每个领域对应一个 Service 类
- 继承 BaseFirestoreService 获得基础 CRUD

### 4. 权限中间件 (Middleware)
- 位于 `src/middleware/`
- 敏感字段过滤：按角色返回不同字段
- 权限检查：验证用户操作权限

### 5. 数据层 (Firebase)
- Firestore: 结构化数据存储
- Storage: 照片、文件存储
- Functions: 异步任务、定时任务
- Auth: 用户认证

### 6. 异步任务层 (Cloud Functions)
- 位于 `functions/`
- 定时任务：每日检查连续缺席、轮值提醒、工具逾期检查
- 触发器：状态变更自动联动（如认领通过→更新地块状态）

## 核心数据流

### 认领申请流程
```
用户提交申请 → claimService.createClaim()
    ↓
写入 claims 集合（状态: pending）
    ↓
管理员审批 → claimService.approveClaim()
    ↓
更新 claims 状态为 approved
    ↓
Cloud Functions onClaimStatusChange 触发
    ↓
更新 plots 集合对应地块状态为 claimed
    ↓
发送通知给申请人
```

### 轮值打卡流程
```
用户点击开始 → rotationService.startRotation()
    ↓
更新状态为 in_progress
    ↓
用户点击完成 → rotationService.completeRotation()
    ↓
更新状态为 completed
    ↓
Cloud Functions onRotationStatusChange 触发
    ↓
重置用户 consecutiveAbsences = 0
```

### 连续缺席检测流程
```
每日 08:00 定时触发 checkConsecutiveAbsences
    ↓
遍历所有 resident 用户
    ↓
计算每个用户的连续缺席次数
    ↓
次数 ≥ 3 时：
    - 给用户发警告通知
    - 给所有管理员发提醒通知
    - 不取消认领资格
```
