# envcheck

Environment Variable Consistency Checker — 环境变量一致性检查命令行工具。

围绕多个 `.env`、示例配置、部署环境和必填变量提供稳定的差异对比、缺失提示、敏感值遮蔽与 CI 输出能力，适用于本地开发与自动化流水线。

## 安装

```bash
go build -o envcheck ./cmd/envcheck/
```

或：

```bash
go install github.com/envcheck/envcheck/cmd/envcheck@latest
```

查看版本：

```bash
envcheck --version
# envcheck v1.0.0
```

## 命令行参数

```
envcheck [OPTIONS]
```

| 参数 | 说明 |
|------|------|
| `--env` | 逗号分隔的 env 文件路径（如 `.env,.env.production`） |
| `--example` | 逗号分隔的 example 文件路径（如 `.env.example`） |
| `--mask` | 逗号分隔的敏感 key 匹配模式（默认 `PASSWORD,SECRET,TOKEN,KEY,PRIVATE,CREDENTIAL,API_KEY`） |
| `--required` | 逗号分隔的必填变量名 |
| `--config` | JSON 配置文件路径 |
| `--format` | 输出格式：`text`、`json`、`ci` |
| `--ci` | CI 模式，输出 GitHub Actions 注释格式 |
| `--strict` | 严格模式，env 中有但 example 中没有的变量也报警告 |
| `--quiet` | 安静模式，仅显示错误和警告 |
| `--verbose` | 详细模式，显示来源文件等详细信息 |
| `--stdin` | 从标准输入读取 env 内容（替代 `--env` 文件输入） |
| `--version` | 打印版本信息 |

布尔标志支持显式设值：`--ci=true`、`--ci=false`、`--strict=false` 等。

## 输入方式

### 文件输入

```bash
envcheck --env .env --example .env.example
envcheck --env .env,.env.production --required DATABASE_URL,REDIS_URL
```

### 标准输入

```bash
cat .env | envcheck --stdin --example .env.example
```

`--stdin` 与 `--env` 互斥，使用 `--stdin` 时从管道读取 env 内容，来源显示为 `<stdin>`。

## 输出格式

### text（默认）

人类可读的表格报告：

```
envcheck - Environment Variable Consistency Report
====================================================
Env files:     .env, .env.production
Example files: .env.example
Variables checked: 9
Issues found:      9
----------------------------------------------------

Issues:
  ✗ [error] DATABASE_URL: required variable "DATABASE_URL" is missing from .env
  ⚠ [warning] EMPTY_VAR: variable "EMPTY_VAR" in .env is missing from example files
  ℹ [info] PORT: variable "PORT" differs between .env and .env.production
```

### json

机器可读的 JSON 报告，每个 issue 均带 `source` 字段定位来源文件：

```bash
envcheck --env .env --required DATABASE_URL --format json
```

```json
{
  "env_files": [".env"],
  "example_files": [],
  "issues": [
    {
      "severity": "error",
      "category": "missing_required",
      "key": "DATABASE_URL",
      "message": "required variable \"DATABASE_URL\" is missing from .env",
      "source": ".env"
    }
  ],
  "diffs": [],
  "missing_in_env": ["DATABASE_URL"],
  "missing_in_example": [],
  "has_errors": true,
  "has_warnings": false,
  "total_checked": 1,
  "total_issues": 1
}
```

### ci

GitHub Actions 注释格式，`source` 字段嵌入注解路径：

```bash
envcheck --env .env --example .env.example --ci
```

```
::warning::.env::EMPTY_VAR [missing_in_example] variable "EMPTY_VAR" in .env is missing from example files
::info::.env::.env.production::PORT [value_diff] variable "PORT" differs between .env and .env.production
```

## 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 所有检查通过 |
| 1 | 发现错误（必填变量缺失/空值等） |
| 2 | 仅发现警告（无错误） |
| 3 | 配置或运行时错误 |

## 检查类别

| 类别 | 严重级 | 说明 |
|------|--------|------|
| `missing_required` | error | 必填变量在某个 env 文件中缺失 |
| `empty_required` | error | 必填变量在某个 env 文件中值为空 |
| `missing_in_example` | warning | env 中有但 example 中缺失 |
| `missing_in_env` | warning | example 中有但 env 中缺失 |
| `empty_value` | warning | 非必填变量值为空 |
| `extra_in_env` | warning | 严格模式下 env 有但 example 无 |
| `value_diff` | info | 多个 env 文件间同一变量值不同 |

必填变量按每个 `--env` 文件和 `--stdin` 输入对象独立判定缺失或空值，issue 的 `source` 字段定位到具体文件。

## 敏感值遮蔽

`--mask` 的默认模式匹配 key 名称（大小写不敏感），命中时对值做部分遮蔽：

```
API_KEY=sk-live-abc123def456  →  sk************************ef
APP_NAME=myapp                →  myapp（不遮蔽）
```

短值（≤4 字符）完全遮蔽为 `****`。

## 配置文件与覆盖关系

### 配置文件格式（JSON）

```json
{
  "env_files": ["testdata/.env", "testdata/.env.production"],
  "example_files": ["testdata/.env.example"],
  "required": ["DATABASE_URL", "REDIS_URL"],
  "mask_patterns": ["PASSWORD", "SECRET", "TOKEN", "KEY", "PRIVATE"],
  "ci": false,
  "strict": false,
  "quiet": false,
  "verbose": false
}
```

`format` 字段可省略，由 `ci` 和 CLI 参数推导：

- `ci=false` 且未设 `format` → 推导为 `text`
- `ci=true` 且未设 `format` → 推导为 `ci`
- 显式设了 `format` → 保持显式值，不受 `ci` 影响

### 覆盖优先级

```
CLI flags > config file > defaults
```

布尔标志支持 `--FLAG=false` 显式覆盖配置文件的 `true`：

| 配置文件 | CLI | 结果 |
|---------|-----|------|
| `ci=true` | 未传 | `true` |
| `ci=true` | `--ci=false` | `false` |
| `ci=false` | `--ci` | `true` |
| `strict=true` | `--strict=false` | `false` |

`--format` 始终优先：`--ci --format json` 输出 JSON 而非 CI 注释。

### testdata 示例配置文件

仓库 `testdata/` 目录包含可提交的示例数据和配置文件：

| 文件 | 说明 |
|------|------|
| `testdata/.env` | 开发环境变量 |
| `testdata/.env.production` | 生产环境变量 |
| `testdata/.env.example` | 示例模板（含 `NEW_FEATURE_FLAG` 等） |
| `testdata/.env.empty` | 含空必填变量的测试用例 |
| `testdata/envcheck.json` | 基础配置，`ci=false`，多 env 文件 |
| `testdata/envcheck.ci.json` | CI 配置，`ci=true`，无显式 format |
| `testdata/envcheck.ci-json.json` | CI + JSON 配置，`ci=true, format=json`（format 优先） |
| `testdata/envcheck.strict.json` | 严格模式配置，`strict=true` |

### 真实示例

```bash
# 基础：配置文件指定 env/example/required，开箱可用
envcheck --config testdata/envcheck.json

# CI 模式：配置文件 ci=true，自动推导 format=ci
envcheck --config testdata/envcheck.ci.json

# --ci=false 覆盖配置文件的 ci=true，回到 text 输出
envcheck --config testdata/envcheck.ci.json --ci=false

# 显式 format 覆盖 ci 默认：输出 JSON 而非 CI 注释
envcheck --config testdata/envcheck.ci.json --format json

# 配置文件 ci=true + format=json，format 优先
envcheck --config testdata/envcheck.ci-json.json

# --strict=false 覆盖配置文件的 strict=true，不再报 extra_in_env
envcheck --config testdata/envcheck.strict.json --strict=false

# 标准输入 + 必填检查，来源显示为 <stdin>
cat testdata/.env | envcheck --stdin --required DATABASE_URL,REDIS_URL

# 多环境差异对比 + 敏感值遮蔽
envcheck --env testdata/.env,testdata/.env.production --example testdata/.env.example --verbose
```

## 性能基准

运行基准测试：

```bash
go test ./... -bench=. -benchmem
```

参考数据（Apple M 系列，Go 1.x）：

| 基准 | 耗时 | 内存 | 分配次数 |
|------|------|------|---------|
| `BenchmarkParseReaderSmall`（3 变量） | ~2.5μs | ~5 KB | 14 |
| `BenchmarkParseReader`（1000 变量） | ~608μs | ~166 KB | 3005 |
| `BenchmarkCheck`（100 变量 + 必填 + 严格） | ~83μs | ~85 KB | 294 |
| `BenchmarkCheckLarge`（2×500 变量差异对比） | ~381μs | ~417 KB | 3059 |

## 运行测试

```bash
go test ./... -count=1
```
