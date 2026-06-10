# CHANGELOG

本项目维护变更记录以 Keep a Changelog 格式编写。

## [Unreleased]

### react

- 升级 React 到 18.2.0
- 支持自动批处理 (Automatic batching)
- 新增 useId hook 用于服务端渲染
- 废弃 react-dom/client 之外的入口
- 性能优化：调度器改进

### lodash

- 修复 `_.merge` 原型污染漏洞 (CVE-2021-23337)
- 许可证从 MIT 切换为 GPL-3.0 (请核查合规性)
- 优化 debounce/throttle 内存占用

### axios

- 1.4.0 发布
- 修复 form-data 在 Node 18+ 下的编码问题
- 默认启用 Accept-Encoding: gzip
- 拦截器错误回调链顺序修复

### typescript

- 升级至 5.1.3
- 新增 satisfies 操作符支持
- 改进模板字面量类型推导
- --noUncheckedSideEffectImports 新选项
