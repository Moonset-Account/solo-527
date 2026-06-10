# 备份完整性检查器 (backup-checker)

一个面向团队使用的备份完整性校验命令行工具。支持清单校验、文件缺失检测、保留周期过期提示、报告导出等功能，同时兼容 Windows、macOS 和 Linux。

## 功能特性

- ✅ **哈希校验**：支持 MD5、SHA-1、SHA-256、SHA-512 等算法
- 🔍 **缺失检测**：对比清单文件，检测备份目录中缺失的文件
- ⏰ **过期提醒**：根据保留周期自动检测过期的备份
- 📊 **多格式报告**：支持文本摘要、详细日志和 JSON 格式输出
- 🚨 **告警通知**：发现问题时支持通过 stdout/stderr、日志文件输出告警
- 🔄 **Dry-run 模式**：模拟执行，不产生实际副作用
- 🐚 **Shell 补全**：支持 bash、zsh、fish 的参数补全
- 💻 **跨平台**：统一处理 Windows、macOS、Linux 的路径差异

## 安装

### 方式一：源码安装（推荐团队使用）

```bash
git clone <repository-url>
cd backup-checker
pip install -e .
```

### 方式二：直接使用源码

```bash
cd backup-checker
python -m backup_checker --help
```

## 快速开始

### 1. 准备清单文件

清单文件 (manifest.json) 是备份的索引，格式如下：

```json
{
  "version": "1.0",
  "created_at": "2026-06-01T02:00:00Z",
  "retention_days": 30,
  "files": [
    {
      "path": "data/2026-06-01/database.sql.gz",
      "size": 10485760,
      "modified": "2026-06-01T02:00:00Z",
      "hashes": {
        "sha256": "abc123..."
      }
    }
  ]
}
```

### 2. 运行检查

```bash
# 基础用法：检查备份目录并使用 SHA-256 校验
backup-checker /mnt/backups/weekly \
  --manifest /mnt/backups/weekly/manifest.json \
  --hash sha256

# 指定保留周期（覆盖清单中的设置）
backup-checker /mnt/backups/weekly \
  --manifest manifest.json \
  --retention 14d

# Dry-run 模式（不读取大文件哈希，仅检查存在性）
backup-checker /mnt/backups \
  --manifest manifest.json \
  --dry-run

# 导出 JSON 格式报告
backup-checker /mnt/backups \
  --manifest manifest.json \
  --format json \
  --output report.json
```

## 命令行参数

| 参数 | 缩写 | 说明 | 默认值 |
|------|------|------|--------|
| `backup_dir` | - | **【必填】** 备份目录路径 | - |
| `--manifest` | `-m` | 清单文件路径 (JSON/YAML) | - |
| `--hash` | | 哈希算法：md5/sha1/sha256/sha512/none | `sha256` |
| `--retention` | `-r` | 保留周期，如 7d、2w、1m、365d | 读取清单 |
| `--notify` | `-n` | 告警输出方式：stdout/stderr/log/file | `stdout` |
| `--notify-target` | | 告警目标路径（file 模式下的日志文件） | - |
| `--format` | `-f` | 输出格式：text/json | `text` |
| `--output` | `-o` | 报告输出文件路径（默认打印到控制台） | - |
| `--dry-run` | | 模拟执行，不计算哈希（快速检查） | 关闭 |
| `--strict` | | 严格模式，有任何问题即退出码非零 | 开启 |
| `--no-strict` | | 宽松模式，仅严重错误才非零退出 | - |
| `--verbose` | `-v` | 详细输出（可叠加 -vv） | 关闭 |
| `--quiet` | `-q` | 静默模式，仅输出错误 | 关闭 |
| `--completion` | | 生成 shell 补全脚本：bash/zsh/fish | - |
| `--help` | `-h` | 显示帮助信息 | - |

## 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 所有检查通过 |
| 1 | 参数错误或运行时异常 |
| 2 | 文件缺失 |
| 3 | 哈希校验失败 |
| 4 | 备份已过期 |
| 5 | 存在多个问题 |

## 示例命令

### 场景一：日常快速检查（不计算哈希，仅检查文件存在和过期）

```bash
backup-checker /backup/2026-06-01 \
  --manifest /backup/2026-06-01/manifest.json \
  --hash none \
  --notify stdout
```

### 场景二：月度完整校验（严格模式，JSON 报告）

```bash
backup-checker /backup/monthly \
  --manifest manifests/2026-05.json \
  --hash sha256 \
  --retention 365d \
  --strict \
  --format json \
  --output reports/2026-06-check.json
```

### 场景三：Windows PowerShell 用法

```powershell
backup-checker D:\Backups\2026-06-01 `
  --manifest "D:\Backups\2026-06-01\manifest.json" `
  --hash sha256 `
  --notify file `
  --notify-target "C:\Logs\backup-check.log"
```

### 场景四：纳入 CI/CD 流程

```yaml
# .github/workflows/backup-check.yml
- name: Verify backup integrity
  run: |
    backup-checker /tmp/restore-test \
      --manifest ./ci/manifest-fixture.json \
      --hash sha256 \
      --no-strict \
      --format json \
      --output backup-report.json
```

## Shell 补全

启用命令行参数补全：

```bash
# Bash（添加到 ~/.bashrc）
eval "$(backup-checker --completion bash)"

# Zsh（添加到 ~/.zshrc）
eval "$(backup-checker --completion zsh)"

# Fish（添加到 ~/.config/fish/config.fish）
backup-checker --completion fish | source
```

## 常见错误与排查

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| `清单文件不存在` | `--manifest` 路径错误 | 检查路径拼写，Windows 注意反斜杠转义 |
| `无法解析清单 JSON` | 清单格式损坏 | 用 `python -m json.tool manifest.json` 验证 |
| `备份目录不存在` | 路径错误或未挂载 | 确认 NFS/SMB 挂载、磁盘在线 |
| `哈希算法不支持` | 指定了未知算法 | 可选值：md5/sha1/sha256/sha512/none |
| `保留周期格式无效` | 格式错误 | 正确格式：7d / 2w / 1m / 365d |

## 开发与测试

```bash
# 安装开发依赖
pip install -e ".[dev]"

# 运行测试
pytest -v

# 运行测试并生成覆盖率报告
pytest --cov=backup_checker --cov-report=term-missing
```

## 许可证

MIT License
