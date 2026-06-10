# 青禾候选人管道台 - 前端

基于 Nuxt 3 + Naive UI + TypeScript 的校招候选人管道管理系统前端。

## 技术栈

- Nuxt 3 (Vue 3)
- Naive UI 组件库
- TypeScript
- Pinia 状态管理
- Axios HTTP 客户端

## 角色与功能

### 候选人
- 浏览职位列表
- 投递简历
- 查看投递进度
- 查看面试安排
- 管理个人资料

### 招聘员
- 数据看板
- 投递管理（筛选、状态流转）
- 候选人管理
- 职位管理
- 面试安排（冲突检测）
- 待办中心（普通待办/升级催办）

### 管理员
- 所有招聘员功能
- 测评题库管理
- 录用Offer管理
- 签到记录管理
- 字典配置管理
- 系统设置（阈值、提醒频率）
- 操作审计日志

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 目录结构

```
frontend/
├── pages/              # 页面
│   ├── login.vue
│   ├── dashboard.vue
│   ├── positions.vue
│   ├── applications.vue
│   ├── candidates.vue
│   ├── interviews.vue
│   ├── todos.vue
│   ├── assessments/
│   │   └── questions.vue
│   ├── admin/
│   │   ├── offers.vue
│   │   ├── check-ins.vue
│   │   ├── dictionary.vue
│   │   ├── settings.vue
│   │   └── audit.vue
│   └── my/
│       ├── applications.vue
│       ├── interviews.vue
│       └── profile.vue
├── layouts/            # 布局
│   └── default.vue
├── components/         # 组件
├── stores/             # Pinia 状态
│   └── auth.ts
├── types/              # 类型定义
├── utils/              # 工具函数
├── middleware/         # 路由中间件
└── plugins/            # 插件
```

## 环境变量

```env
API_BASE_URL=http://localhost:8000/api/v1
```
