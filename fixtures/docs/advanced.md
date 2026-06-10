# 进阶文档

本文档介绍进阶功能。

## 配置

支持多种配置方式：

### 命令行参数

命令行参数具有最高优先级。

### 配置文件

支持 [YAML](../../examples/.mdlinkcheckerrc.yaml) 和 [JSON](../../examples/.mdlinkcheckerrc.json)。

### 引用类型链接

这是一个[参考链接][ref1]和另一个[参考链接][ref2]。

[ref1]: https://example.com/ref1 "参考链接1"
[ref2]: ./install.md#配置 "参考安装配置"

## 更多坏链

- [外链坏](https://this-domain-definitely-does-not-exist-67890.invalid/foo)
- [文件坏](./nothing-here.md)
- [锚点坏](#no-such-section)

## 图片

![架构图](../assets/logo.png)
![缺失图](../assets/no-such-image.svg)
