# 品牌短视频审稿发布系统

基于 Vue 3 + Vite + NestJS + MongoDB + Redis 的品牌内容审稿与发布管理平台。

## 功能模块

- **内容管理**：选题提交、脚本编辑、审稿流程、明细视图（附件/备注/修改历史）
- **审稿配置**：运营后台灵活配置多节点审稿流程
- **产能统计**：按状态、日期、负责人维度统计内容产出
- **运营中心**：平台账号、采访素材、发布排期快速筛选管理
- **异常池**：发布失败内容归集，支持补充处理结论
- **系统设置**：字典项维护、提醒阈值配置、默认负责人

## 快速开始

```bash
# 安装前后端依赖
npm run install:all

# 启动后端 (http://localhost:3000)
npm run dev:server

# 启动前端 (http://localhost:5173)
npm run dev:client
```

## 技术栈

- **前端**：Vue 3 + Vite + Pinia + Vue Router + Element Plus + Axios
- **后端**：NestJS + TypeScript + Mongoose + Redis
- **数据库**：MongoDB + Redis（缓存/会话）
