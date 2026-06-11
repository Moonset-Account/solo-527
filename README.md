# git-brclean - Git 分支清理助手

> 团队级 Git 分支管理命令行工具。扫描、风险分级、交互确认、安全清理。

## 功能特性

- **全面扫描**: 本地分支 + 远端分支，完整的分支信息 + 提交元数据
- **智能风险分级**: 基于合并状态、PR 状态、分支年龄、活跃度等多维度评估
- **保护规则**: 支持 glob 模式的分支保护，避免误删重要分支
- **交互确认**: 交互式多选，确认后再执行，安全第一
- **试运行模式**: `--dry-run` 预览效果，零风险评估
- **回滚机制**: 自动记录删除操作，支持一键回滚
- **多格式输出**: 人类可读 / JSON / JSON-Pretty / CSV / Markdown
- **CI 友好**: 稳定退出码 + 机器可读报告 + 非交互模式
- **跨平台**: Windows / macOS / Linux

## 快速开始

### 安装

```bash
# 从源码构建
cargo install --path .

# 或使用安装脚本
./scripts/install.sh
```

### 基本用法

```bash
# 扫描当前仓库的分支（默认 dry-run 模式）
git-brclean scan

# 指定仓库路径
git-brclean scan --repo /path/to/repo

# 只看已合并的分支
git-brclean scan --merged

# 超过 30 天未活动的分支
git-brclean scan --older-than 30

# 排除特定模式的分支
git-brclean scan --exclude feature/* --exclude hotfix/*

# 包含远端分支
git-brclean scan --include-remote --remote origin
```

### 清理分支

```bash
# 试运行，预览将要删除的分支
git-brclean clean --dry-run

# 实际删除（交互式确认）
git-brclean clean

# 非交互模式（CI 用）
git-brclean clean --no-interactive --merged --older-than 30

# 指定最低风险等级才删除
git-brclean clean --min-risk low
```

### 回滚操作

```bash
# 查看回滚历史
git-brclean rollback --list

# 回滚最近一次操作
git-brclean rollback latest

# 回滚指定记录
git-brclean rollback rollback-20240101-120000
```

## 命令详解

### 常用参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--dry-run` | 试运行模式，不实际删除 | `scan` 默认开启 |
| `--merged` | 只处理已合入主分支的 | 关闭 |
| `--older-than N` | 只处理 N 天前最后提交的 | 关闭 |
| `--exclude PATTERN` | 排除匹配 glob 模式的分支 | 无 |
| `--include-remote` | 同时处理远端分支 | 关闭 |
| `--remote NAME` | 指定远端名称 | `origin` |
| `--default-branch NAME` | 指定默认分支 | `main` |
| `--min-risk LEVEL` | 最低风险等级才删除 | `medium` |
| `--protect PATTERN` | 添加保护分支模式 | 内置规则 |
| `--format FORMAT` | 输出格式 | `human` |
| `--output FILE` | 输出到文件 | 标准输出 |
| `--no-interactive` | 非交互模式 | 交互模式 |
| `--no-rollback` | 禁用回滚记录 | 启用 |
| `-v, --verbose` | 增加日志详细程度 | 警告级别 |

### 风险等级

| 等级 | 说明 |
|------|------|
| `safe` | 安全，已合并且无 PR |
| `low` | 低风险，较老且无 PR |
| `medium` | 中风险，有一些活动 |
| `high` | 高风险，有打开的 PR |
| `critical` | 危险，受保护分支 |

### 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 成功完成 |
| 1 | 发生错误 |

## 项目结构

```
src/
├── main.rs          # CLI 入口
├── lib.rs           # 库导出
├── models.rs        # 数据模型（分支信息、风险等级、报告结构）
├── config.rs        # 配置管理
├── git.rs           # Git 操作层
├── scanner.rs       # 分支扫描器
├── risk.rs          # 风险分级引擎
├── executor.rs      # 清理执行器
├── reporter.rs      # 报告生成器
├── pr.rs            # PR 状态集成
├── logger.rs        # 日志系统
├── rollback.rs      # 回滚管理
└── platform.rs      # 跨平台适配
```

## CI 集成

### GitHub Actions

```yaml
- name: Cleanup branches
  run: |
    git-brclean clean \
      --merged \
      --older-than 30 \
      --min-risk safe \
      --no-interactive \
      --format json-pretty \
      --output report.json
```

详细示例见 [examples/github-actions.yml](examples/github-actions.yml)。

## 配置文件

支持 JSON 配置文件，示例见 [examples/config.json](examples/config.json)。

默认配置位置：
- Linux/macOS: `~/.config/git-brclean/config.json`
- Windows: `%APPDATA%\git-brclean\config.json`

## 开发

```bash
# 运行所有测试
cargo test

# 运行单元测试
cargo test --lib

# 运行集成测试
cargo test --test integration_tests

# 构建 release
cargo build --release

# 发布
./scripts/release.sh 0.1.0
```

## License

MIT
