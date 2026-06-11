# 支持企业微信扫码登录
category: feature
scope: auth

新增企业微信 OAuth2.0 扫码登录，关联 PROJ-1001。
管理员可在后台配置企业微信应用 ID 和密钥。

---
# 修复 iOS 15 启动闪退
category: fix
scope: ios

原因是 iOS 15 废弃了某 API，参见 PROJ-1002。
已升级底层 SDK 到 2.3.1。

---
# 数据库连接池耗尽
category: known_issue
scope: backend

高并发下（>500 QPS）可能出现连接池耗尽，见 PROJ-1003。
临时缓解措施：调大连接池大小到 200，正式修复将在 v2.1 提供。

---
# API v1 废弃通知
category: upgrade_notice
scope: api

PROJ-1004：API v1 将在 v2.1 正式移除，请使用 v2 接口。
迁移指南：https://docs.example.com/migration/v1-to-v2

---
# 这个条目缺工单编号
category: feature
scope: ui

这是一个忘记关联工单的功能说明，应该出现在待补充区。

---
category: fix

这个条目缺标题，也应该进入待补充区。
