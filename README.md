# JSON/YAML 配置合并器 (config-merger)

面向平台工程师的多环境配置合并工具，解决反复处理多个环境配置、覆盖顺序、数组合并规则和敏感键脱敏的问题。

![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-green)
![Tests](https://img.shields.io/badge/tests-112%20passed-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ 核心功能

| 功能 | 描述 |
|------|------|
| 📄 **多格式解析** | 同时支持 JSON 和 YAML 格式，自动识别文件扩展名 |
| 🔀 **智能合并** | 三种合并策略（深度/浅度/覆盖）+ 五种数组合并规则 |
| 🔒 **敏感键处理** | 自动检测 20+ 种常见敏感键名，支持 5 种脱敏策略 |
| 🧪 **冲突检测** | 自动检测配置值冲突并给出明确提示 |
| ✅ **Schema 校验** | 内置 JSON Schema 校验，支持自定义校验器 |
| 👁️ **合并预览** | 差异标记（+新增 / ~修改 / -删除）的直观预览 |
| 🚀 **Dry-Run** | 试运行模式，不写入文件即查看最终效果 |
| 🤖 **机器可读** | 支持 JSON 格式摘要输出，CI/CD 友好 |
| 🐚 **Shell 补全** | 支持 Bash/Zsh/Fish 三大主流 Shell |
| 🌍 **跨平台** | 自动处理路径分隔符，Windows/Mac/Linux 通用 |

---

## 📦 安装

```bash
# 克隆项目后安装依赖
npm install

# 全局安装 CLI (可选)
npm link
```

---

## 🚀 快速开始

### 命令行参数

```
必选参数:
  -b, --base <file>              基础配置文件 (JSON/YAML) - 优先级最低

可选参数:
  -o, --overlay <files...>       覆盖配置文件，可多次指定，后指定的优先级更高
  -s, --strategy <type>          合并策略: deep | shallow | overlay (默认: deep)
  -a, --array-strategy <type>    数组合并策略: replace | concat | merge | unique | prepend (默认: replace)
      --schema <file>            Schema 校验文件 (JSON Schema)
  -O, --output <file>            输出文件路径
  -p, --print [format]           打印合并结果到控制台: json | yaml (默认: json)
      --dry-run                  试运行模式，不写入文件，自动启用 --preview
      --preview                  预览合并结果，显示差异标记
  -v, --verbose                  详细模式，显示完整变更列表、冲突详情
  -q, --quiet                    安静模式，仅显示严重错误
      --machine-readable         机器可读输出，摘要以 JSON 格式输出
      --no-color                 禁用彩色输出
      --sensitive-keys <keys>    额外敏感键，逗号分隔 (例: db_pass,api_token)
      --no-sensitive             禁用敏感键自动检测
      --mask-type <type>         脱敏类型: default | full | partial | hash | remove
      --detect-conflicts         启用冲突检测 (默认开启)
      --no-conflicts             禁用冲突检测
  -c, --config <file>            参数配置文件，文件中参数会被命令行覆盖
      --examples                 显示使用示例
      --completion [shell]       生成 Shell 补全脚本: bash | zsh | fish
  -h, --help                     显示帮助信息
  -V, --version                  显示版本号
```

---

## 💡 使用示例

以下所有命令均使用 `examples/` 目录中的真实示例配置文件，可直接运行。

### 1. 基础合并

将开发环境配置覆盖到基础配置：

```bash
node src/cli.js \
  --base examples/config/base.yaml \
  --overlay examples/config/dev.yaml \
  --output examples/output/dev-merged.yaml \
  --preview
```

### 2. 三层合并 (基础 -> 环境 -> 实例)

```bash
node src/cli.js \
  -b examples/config/base.json \
  -o examples/config/prod.yaml \
  -O examples/output/prod-merged.json \
  --print json \
  --verbose
```

### 3. Dry-Run 模式 (不写入文件)

```bash
node src/cli.js \
  -b examples/config/base.yaml \
  -o examples/config/dev.yaml \
  --dry-run
```

### 4. 带 Schema 校验的合并

```bash
node src/cli.js \
  --base examples/config/base.yaml \
  --overlay examples/config/prod.yaml \
  --schema examples/schemas/app-schema.json \
  -O examples/output/validated.yaml \
  -v
```

### 5. 机器可读输出 (用于 CI/CD)

```bash
node src/cli.js \
  -b examples/config/base.yaml \
  -o examples/config/prod.yaml \
  --machine-readable \
  --no-color \
  > examples/output/summary.json
```

### 6. 使用配置文件 + 命令行覆盖

优先级规则：命令行参数 > 配置文件参数 > 默认值

```bash
# 仅使用配置文件
node src/cli.js --config examples/config/merger-config.json

# 配置文件 + 命令行覆盖 (命令行中的 output 和 verbose 优先级更高)
node src/cli.js \
  --config examples/config/merger-config.json \
  --output examples/output/override-output.yaml \
  --verbose
```

### 7. 数组追加合并策略

```bash
node src/cli.js \
  -b examples/config/base.yaml \
  -o examples/config/dev.yaml \
  --array-strategy concat \
  --preview
```

### 8. 敏感键处理 (自动脱敏)

```bash
node src/cli.js \
  -b examples/config/base.yaml \
  -o examples/config/dev.yaml \
  --mask-type partial \
  -p yaml
```

### 9. 查看完整帮助

```bash
node src/cli.js --help
```

### 10. 查看更多示例

```bash
node src/cli.js --examples
```

---

## 🔧 合并策略详解

### 对象合并策略 (--strategy)

| 策略 | 说明 | 使用场景 |
|------|------|----------|
| **deep** (默认) | 深度递归合并，嵌套对象子属性逐个合并 | **推荐**：大多数场景，最安全 |
| **shallow** | 浅层合并，仅顶层键，子对象整体替换 | 完整替换某个子模块时使用，需谨慎 |
| **overlay** | 完全覆盖，overlay 整个替换 base | 紧急情况：完全重写配置 |

### 数组合并策略 (--array-strategy)

| 策略 | 说明 | base=[1,2,3] + overlay=[3,4] = 结果 |
|------|------|--------------------------------------|
| **replace** (默认) | overlay 数组完全替换 base | [3,4] 保守、可预测 |
| **concat** | 顺序拼接: base + overlay | [1,2,3,3,4] |
| **prepend** | 逆向拼接: overlay + base | [3,4,1,2,3] |
| **unique** | 去重拼接 | [1,2,3,4] |
| **merge** | 按索引位置合并对象数组 | 适用于 [{id:1,...}, {id:2,...}] |

---

## 🔒 敏感键脱敏

### 自动检测的敏感键（20+）

`password`, `secret`, `token`, `apiKey`, `privateKey`, `accessKey`, `clientSecret`, `authorization`, `sessionId`, `cookie`, `aws_access_key`, `db_password` 等。

### 脱敏类型 (--mask-type)

| 类型 | 效果 | 示例值 "mysecretpassword123" 的脱敏结果 |
|------|------|--------------------------------------|
| **default** | 默认替换 | `***SENSITIVE***` |
| **full** | 完全替换 | `***` |
| **partial** | 部分显示 | `my***23` |
| **hash** | 哈希标记（同值同哈希） | `[HASH:abc12345]` |
| **remove** | 直接删除字段 | 字段不存在 |

---

## 📄 参数配置文件

将参数写入配置文件中，便于重复使用：

```yaml
# merger-config.yaml
base: examples/config/base.yaml
overlays:
  - examples/config/prod.yaml

strategy: deep
arrayStrategy: merge

schema: examples/schemas/app-schema.json
output: examples/output/merged.yaml

print: yaml
dryRun: false
preview: true
verbose: true

maskSensitive: true
sensitiveKeys:
  - custom_database_password
  - third_party_api_key
maskType: partial

detectConflicts: true
```

使用：

```bash
node src/cli.js --config merger-config.yaml
```

**覆盖优先级（从低到高）**：
```
默认值 < 参数配置文件 < --base < --overlay(按顺序) < 命令行其他参数
```

---

## 🤖 Shell 自动补全

### Bash

```bash
# 临时启用
source <(node src/cli.js --completion bash)

# 永久启用（推荐）
node src/cli.js --completion bash > ~/.config-merger-completion.bash
echo "source ~/.config-merger-completion.bash" >> ~/.bashrc
```

### Zsh

```bash
mkdir -p ~/.zsh/completions
node src/cli.js --completion zsh > ~/.zsh/completions/_config-merger
echo 'fpath=(~/.zsh/completions $fpath)' >> ~/.zshrc
echo 'autoload -Uz compinit && compinit' >> ~/.zshrc
```

### Fish

```bash
node src/cli.js --completion fish > ~/.config/fish/completions/config-merger.fish
```

---

## 📊 输出说明

### 运行摘要示例

```
═══ 合并摘要 ═══

▸ 处理的配置项数    : 68
▸ 新增配置项        : 12
▸ 覆盖配置项        : 18
▸ 移除配置项        : 2
▸ 跳过（敏感）      : 4
▸ 失败项            : 0

⚠  检测到 3 个潜在冲突
✓  Schema 校验通过

═══ 完成 ═══
```

### 机器可读输出 (--machine-readable)

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "inputFiles": ["/path/to/base.yaml", "/path/to/prod.yaml"],
  "outputFile": "/path/to/output.yaml",
  "processedCount": 68,
  "addedCount": 12,
  "overwrittenCount": 18,
  "removedCount": 2,
  "skippedCount": 4,
  "failedCount": 0,
  "conflictCount": 3,
  "schemaValidated": true,
  "schemaValid": true,
  "validationErrors": 0,
  "validationWarnings": 0,
  "exitCode": 0,
  "details": { ... }
}
```

### 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 成功执行 |
| 1 | 运行时错误（文件解析失败/Schema 校验失败） |
| 2 | 参数错误 |

---

## 🧪 测试

```bash
# 运行所有测试
npm test

# 查看覆盖率
npm run test:coverage
```

测试覆盖：112 个测试用例，覆盖解析器、合并引擎、敏感键、Schema 校验、集成测试。

---

## 📁 项目结构

```
question-421/
├── src/
│   ├── cli.js              # CLI 入口
│   ├── index.js            # ConfigMerger 核心类
│   ├── parser.js           # JSON/YAML 解析模块
│   ├── merger.js           # 合并引擎
│   ├── sensitive.js        # 敏感键检测与脱敏
│   ├── validator.js        # Schema 校验
│   ├── formatter.js        # 输出格式化
│   └── completion.js       # Shell 补全脚本生成
├── tests/
│   ├── fixtures/           # 测试夹具
│   │   ├── simple-base.json
│   │   ├── simple-overlay.json
│   │   ├── invalid-syntax.yaml
│   │   └── ...
│   ├── parser.test.js      # 解析器测试
│   ├── merger.test.js      # 合并引擎测试
│   ├── sensitive.test.js   # 敏感键测试
│   ├── validator.test.js   # Schema 校验测试
│   └── integration.test.js # 集成测试
├── examples/
│   ├── config/             # 示例配置
│   │   ├── base.yaml
│   │   ├── base.json
│   │   ├── dev.yaml
│   │   ├── prod.yaml
│   │   ├── merger-config.json
│   │   └── merger-config-prod.yaml
│   ├── schemas/
│   │   └── app-schema.json # JSON Schema 示例
│   └── output/             # 示例输出目录
├── package.json
└── README.md
```

---

## 💡 最佳实践

1. **默认策略最安全**：不指定策略时使用深度合并+数组替换，行为最可预测
2. **先 Dry-Run**：正式写入前，建议加 `--dry-run --preview` 查看效果
3. **加 Schema 校验**：生产环境务必配合 Schema，避免非法配置
4. **避免浅合并陷阱**：`--strategy shallow` 会整体替换嵌套对象，慎用
5. **敏感键不泄露**：使用 `-q --machine-readable` 在 CI 中避免日志泄露
6. **使用配置文件**：复杂的参数组合写成配置文件，团队共享

---

## 📝 许可

MIT License
