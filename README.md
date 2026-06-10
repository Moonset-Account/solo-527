# API 冒烟测试命令行工具 (api-smoke)

> 稳定、易用、功能完整的 HTTP API 冒烟测试工具。
> 支持集合管理、多环境、多种鉴权、并发执行、丰富断言、失败重试、JUnit报告输出。

---

## ✨ 特性一览

| 能力 | 说明 |
|------|------|
| 📦 **集合管理** | 支持 JSON/YAML 格式，用例按 folders 分组，支持依赖关系 |
| 🔐 **多种鉴权** | Bearer Token、Basic Auth、API Key、自定义 Header |
| 🚀 **并发执行** | `--parallel N` 控制并发数，依赖用例自动串行 |
| ✅ **丰富断言** | 15+ 种操作符，支持状态码/响应头/响应体(JSONPath)/响应时间 |
| 🔄 **失败重试** | 全局或单用例级别配置 retries/retryDelay |
| 📊 **报告输出** | 控制台美化报告 + JUnit XML + JSON 格式 |
| 🌍 **多环境** | JSON/YAML/.env 格式支持，变量自动插值 |
| 🧪 **Dry Run** | 预演模式，不发送实际请求查看执行计划 |
| ⚙️ **CLI 完善** | 完整帮助、示例、Shell Completion、彩色日志 |
| 🔌 **变量注入** | `{{env.X}}`、`{{collection.X}}`、`{{extract.X}}`、内置函数 |
| 🎯 **错误定位** | 断言失败、配置错误均定位到文件/行 |
| 🏗️ **跨平台** | POSIX/Windows 路径、~、$ENV 自动展开 |

---

## 🚀 快速开始

### 1. 安装依赖并构建

```bash
npm install
npm run build
```

### 2. 运行演示（使用公开 httpbin.org，无需搭建服务）

```bash
# Dry Run 预览
node dist/cli.js -c examples/httpbin-demo.json --dry-run

# 实际运行（网络连通 httpbin.org）
node dist/cli.js -c examples/httpbin-demo.json

# 并发 3 个 + 导出报告
node dist/cli.js -c examples/httpbin-demo.json -p 3 -j reports/httpbin.xml --json reports/httpbin.json
```

---

## 📖 命令行参数详解

### 总览

```bash
api-smoke --collection <file> [options]
api-smoke completion <bash|zsh>
```

### 核心参数

| 短选项 | 长选项 | 类型 | 默认 | 说明 |
|--------|--------|------|------|------|
| `-c` | `--collection` | **必填** | - | 测试集合文件 (.json/.yaml/.yml) |
| `-e` | `--env` | 可选 | - | 环境变量配置文件 |
| `-p` | `--parallel` | 数字 | `1` | 并发执行数量（用例有依赖时自动为1） |
| `-j` | `--junit` | 路径 | - | 导出 JUnit XML 报告 |
| | `--json` | 路径 | - | 导出 JSON 报告 |
| `-o` | `--output` | 目录 | - | 统一输出目录，自动命名报告 |
| `-l` | `--log-level` | 枚举 | `info` | silent \| error \| warn \| info \| debug \| verbose |
| | `--verbose` | 开关 | off | 等价 `--log-level verbose` |
| | `--silent` | 开关 | off | 等价 `--log-level silent` |
| | `--no-color` | 开关 | off | 禁用彩色输出 |
| `-n` | `--dry-run` | 开关 | off | 预演模式，不发送真实请求 |
| `-b` | `--bail` | 开关 | off | 首个失败即停止 |
| `-t` | `--timeout` | 毫秒 | 集合设定或30000 | 覆盖请求超时 |
| `-r` | `--retries` | 次数 | 集合设定或0 | 覆盖失败重试次数 |
| | `--retry-delay` | 毫秒 | 集合设定或1000 | 覆盖重试间隔 |
| `-f` | `--filter` | 字符串 | - | 按用例名称关键词过滤 |
| | `--tags` | 列表 | - | 只运行含指定标签（逗号分隔） |
| | `--exclude-tags` | 列表 | - | 排除含指定标签（逗号分隔） |
| `-g` | `--global` | K=V | - | 注入全局变量，可多次使用 |
| | `--strict-variables` | 开关 | off | 未定义变量直接报错（默认空值） |
| | `--fail-on-zero-tests` | 开关 | off | 无匹配用例时返回非零退出码 |
| `-k` | `--insecure` | 开关 | off | 关闭 SSL 校验（自测用） |
| | `--no-follow-redirects` | 开关 | off | 不跟随 3xx 重定向 |
| `-v` | `--version` | - | - | 显示版本号 |
| `-h` | `--help` | - | - | 显示详细帮助 |

### 子命令

```bash
api-smoke completion bash          # 输出 bash completion 脚本
api-smoke completion zsh           # 输出 zsh completion 脚本
api-smoke completion bash --write  # 自动写入 ~/.bash_completion.d/
api-smoke completion zsh --write   # 自动写入 ~/.zsh/completion/
```

---

## 🔗 配置优先级（覆盖关系）

这是本工具最重要的设计之一，**命令行 > 环境 > 集合 > 默认值**。

```
覆盖优先级（从高到低）:

  ┌────────────────────────────────────────────────────────────────┐
  │  命令行参数 (最高优先级)                                        │
  │    --timeout / --retries / -g KEY=VALUE / --insecure...       │
  ├────────────────────────────────────────────────────────────────┤
  │  Environment 文件                                              │
  │    env.variables / env.auth / env.headers / env.baseUrl       │
  ├────────────────────────────────────────────────────────────────┤
  │  Collection 文件                                               │
  │    collection.variables / auth / headers / baseUrl / settings │
  ├────────────────────────────────────────────────────────────────┤
  │  Folder 配置                                                   │
  │    folder.variables / auth / headers                           │
  ├────────────────────────────────────────────────────────────────┤
  │  Request 级配置 (仅影响该用例)                                 │
  │    request.timeout / retries / auth / headers / skip          │
  ├────────────────────────────────────────────────────────────────┤
  │  系统默认值 (最低优先级)                                        │
  │    timeout=30000, retries=0, retryDelay=1000, auth=none       │
  └────────────────────────────────────────────────────────────────┘
```

### 变量解析顺序

模板 `{{VAR_NAME}}`（裸名无命名空间）的查找路径，**从上到下优先级依次降低**：

```
1. extracted（前序用例 extract 提取的运行时变量）
2. folder 级 variables
3. --global 命令行注入的变量（配置类最高优先级）
4. environment 文件级 variables
5. collection 文件级 variables（配置类最低优先级，作为默认值）
6. 带命名空间前缀时直接定位: {{env.X}} {{collection.X}} {{global.X}} {{extract.X}} {{folder.X}}
```

> ⚠️ **`{{env.X}}` 的特殊行为**：由于这是最常用的写法，`{{env.X}}` 查找时会按
> `--global` → `env文件` → `collection.variables` 的合并优先级查找，即 `--global`
> 的同名值可以覆盖到 `{{env.X}}`。详见下方真实参数演示。

### 演示：参数覆盖关系实际效果（可复制运行）

使用项目自带的 `examples/collection.json` 做真实演示：

**`examples/collection.json` 关键片段:**
```json
{
  "name": "用户服务冒烟测试集合",
  "baseUrl": "{{env.BASE_URL}}",         // ← 用 {{env.X}} 定位，可被覆盖
  "variables": {
    "APP_NAME": "UserService",           // ← 集合级默认值（优先级最低）
    "DEFAULT_ROLE": "user"
  },
  "headers": {
    "X-App-Name": "{{collection.APP_NAME}}"
  },
  "requests": [
    { "name": "健康检查接口", "method": "GET", "url": "/health" }
  ]
}
```

---

#### 演示 1：未传任何覆盖（Dry Run）

```bash
node dist/cli.js -c examples/collection.json --dry-run --no-color
# 健康检查接口 → GET /health
# BASE_URL 未定义 → baseUrl 为空 → url 保持 "/health"
```

---

#### 演示 2：仅传 `--global BASE_URL` 覆盖

```bash
node dist/cli.js -c examples/collection.json \
  --global BASE_URL=http://override.local \
  --dry-run --no-color
```

**实际输出（关键行）：**
```
✅ 命令行全局变量 (--global): 1 个已加载
▶ 健康检查接口
   GET http://override.local/health     ← ✅ 从 "/health" 变为完整 URL
```

覆盖链路：
```
{{env.BASE_URL}}
    └─ env 文件中未定义 → 继续找
        └─ --global 定义了 BASE_URL=http://override.local → ✅ 命中
```

---

#### 演示 3：`--global` 同时覆盖 `APP_NAME` + `BASE_URL`（多变量）

```bash
node dist/cli.js -c examples/collection.json \
  --global BASE_URL=http://override.local \
  --global APP_NAME=CmdLineApp \
  --dry-run --log-level debug --no-color
```

**实际输出（关键行）：**
```
✅ 命令行全局变量 (--global): 2 个已加载
DEBUG   BASE_URL = http://override.local
DEBUG   APP_NAME = CmdLineApp
DEBUG [VariableContext] --global 覆盖优先级最高，已合并以下变量:
DEBUG   BASE_URL: (新增) → --global
DEBUG   APP_NAME: collection → --global        ← 覆盖了 collection 中的 "UserService"

▶ 健康检查接口
   GET http://override.local/health
   Tags: health, smoke, fast
   Headers:
     X-App-Name   = CmdLineApp                 ← ✅ 之前是 UserService，现在被覆盖
     X-Request-ID = xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
     Accept       = application/json
```

---

#### 演示 4：完整覆盖关系对照（理论 + 实际一致）

**执行命令:**
```bash
api-smoke -c collection.json \
  -e env/prod.yaml \
  --timeout 20000 \
  --retries 0 \
  --global APP_NAME=CmdApp \
  --global EXTRA_VAR=hello
```

**最终生效值对照（理论 = 实际）：**

| 配置项 | 最终值 | 来源 | 覆盖说明 |
|--------|--------|------|----------|
| `baseUrl`（当写为 `{{env.BASE_URL}}`） | prod.yaml 的 BASE_URL 或 `--global` 值 | `--global` > env > collection | 写死的字符串不会被变量覆盖 |
| `APP_NAME` | `CmdApp` | `--global`（最高优先级） | ✅ 覆盖了 env 和 collection |
| `timeout` | `20000` | `--timeout`（CLI 参数优先级最高） | 覆盖 request 级 `5000` |
| `retries` | `0` | `--retries` | 覆盖 request 级 `3` |
| `auth.token` | `prod-token-from-env` | env 文件 | 未被 CLI 覆盖 |
| `EXTRA_VAR` | `hello` | `--global` | 新增变量 |

---

## 📁 Collection 文件格式

### 最小可用示例

```json
{
  "name": "最小示例",
  "requests": [
    {
      "name": "健康检查",
      "method": "GET",
      "url": "https://httpbin.org/get",
      "assertions": [
        { "name": "状态码", "type": "status", "operator": "equals", "expected": 200 }
      ]
    }
  ]
}
```

### 完整结构

```yaml
schema: api-smoke/v1
name: 完整示例
version: "1.0.0"
description: 所有字段说明

baseUrl: "{{env.BASE_URL}}"
variables:
  KEY: value

auth:                    # 全局鉴权
  type: bearer | basic | api-key | custom | none
  token: "..."            # bearer
  username: "..."         # basic
  password: "..."
  apiKeyName: "X-API-Key" # api-key
  apiKeyValue: "..."
  addTo: header | query
  customHeaderName: "..." # custom
  customHeaderValue: "..."

headers:
  Accept: application/json

settings:
  timeout: 30000
  retries: 2
  retryDelay: 1000
  followRedirects: true
  validateSSL: true

requests:
  - name: 用例名称
    description: 说明
    method: GET | POST | PUT | DELETE | PATCH | HEAD | OPTIONS
    url: /api/endpoint        # 拼接 baseUrl，或写完整 URL
    tags: [smoke, critical]
    skip: false               # 可选，跳过该用例

    headers: { ... }          # 覆盖/追加全局 headers
    queryParams:              # 会自动拼到 URL
      page: 1
      size: 10

    bodyType: json | form | text | xml
    body: { ... }             # 支持变量插值

    auth: { type: none }      # 覆盖全局鉴权（如登录接口就不需要鉴权）

    timeout: 30000            # 单例级别覆盖
    retries: 3
    retryDelay: 2000

    dependsOn: ["前置用例名称"]   # 依赖关系（自动串行+排序）

    assertions:
      - name: 断言名称
        type: status | header | body | time | jsonpath
        path: "$.data.key"         # header/body/jsonpath 时必填
        operator: equals           # 见下一节
        expected: 200

    extract:                    # 从响应提取变量，供后续用例使用
      KEY:
        path: "$.data.token"
        storeIn: extracted

folders:                        # 用例分组
  - name: 文件夹名
    variables: { ... }          # folder 级变量
    headers: { ... }
    auth: { ... }
    requests: [ ... ]           # 同上
    folders: [ ... ]            # 支持嵌套
```

---

## 🎯 断言操作符参考

| 操作符 | 说明 | 示例 `expected` |
|--------|------|-----------------|
| `equals` | 深度相等 | `200`, `"ok"`, `{a:1}` |
| `notEquals` | 不相等 | `500` |
| `contains` | 字符串包含/数组有元素/对象有key | `"application/json"` |
| `notContains` | 不含 | `"error"` |
| `greaterThan` | 大于（数字） | `0` |
| `lessThan` | 小于（数字） | `3000` |
| `regex` | 正则匹配 | `"^\\d+$"` |
| `exists` | 字段存在（非null非undefined） | - (不需要expected) |
| `notExists` | 字段不存在 | - |
| `typeOf` | typeof 类型匹配 | `"string"`, `"object"` |
| `in` | 在列表中 | `[200, 201, 204]` |
| `notIn` | 不在列表中 | `[500, 502, 503]` |
| `hasLength` | 字符串/数组长度 | `10` |
| `includes` | 同contains | `"a"` |
| `startsWith` | 字符串前缀 | `"Bearer "` |
| `endsWith` | 字符串后缀 | `".json"` |

---

## 🔑 变量模板与内置函数

### 使用方法

在任何字符串字段中使用 `{{表达式}}`：

```yaml
url: "/api/users/{{extract.USER_ID}}?time={{timestamp()}}"
headers:
  X-Request-ID: "{{uuid()}}"
  Authorization: "Bearer {{env.TOKEN}}"
body:
  username: "test_{{randomString(8)}}"
  email: "{{lowercase(collection.PREFIX)}}@example.com"
```

### 前缀定位（推荐）

| 写法 | 作用域 |
|------|--------|
| `{{env.BASE_URL}}` | 环境变量文件 |
| `{{collection.APP_NAME}}` | 集合级变量 |
| `{{folder.PREFIX}}` | 当前 folder 级变量 |
| `{{extract.USER_TOKEN}}` | 前序用例提取的变量 |
| `{{global.DEBUG}}` | `--global` 注入 |

### 内置函数

| 函数 | 示例 | 输出 |
|------|------|------|
| `timestamp(unit?)` | `{{timestamp()}}` `{{timestamp(s)}}` | 毫秒/秒级时间戳 |
| `uuid()` | `{{uuid()}}` | 合法 UUID v4 |
| `random(min, max)` | `{{random(1, 100)}}` | 指定区间整数 |
| `randomString(len)` | `{{randomString(32)}}` | 随机字母数字 |
| `lowercase(str)` | `{{lowercase('HELLO')}}` | `hello` |
| `uppercase(str)` | `{{uppercase('hello')}}` | `HELLO` |
| `trim(str)` | `{{trim('  abc  ')}}` | `abc` |
| `encodeURI(str)` | `{{encodeURI('a b')}}` | `a%20b` |
| `base64(str)` | `{{base64('Hello')}}` | `SGVsbG8=` |
| `env('VAR')` | `{{env('HOME')}}` | 系统环境变量值 |

---

## 🌍 Environment 文件

支持三种格式：**JSON**、**YAML**、**.env**

```bash
api-smoke -c collection.json -e envs/dev.json     # JSON
api-smoke -c collection.json -e envs/prod.yaml    # YAML
api-smoke -c collection.json -e envs/.env         # dotenv
```

**dotenv 格式示例** (`.env`):
```dotenv
# name: 本地环境
# description: dotenv 格式
BASE_URL=http://localhost:8080
BEARER_TOKEN=dev-token
TEST_USERNAME=admin
TEST_PASSWORD=secret123
```

---

## 📊 退出码说明

| 码 | 含义 |
|----|------|
| `0` | 全部通过 |
| `1` | 有用例失败（退出码由失败数决定） |
| `2` | 参数解析错误 |
| `3` | 配置/加载错误 |
| `4` | 没有匹配的测试用例（仅 `--fail-on-zero-tests`） |
| `99` | 未处理的异常 |

---

## 🛠️ Shell Completion

### Bash

```bash
# 临时生效
source <(api-smoke completion bash)

# 永久生效（二选一）
api-smoke completion bash --write
# 或手动:
api-smoke completion bash > /etc/bash_completion.d/api-smoke
```

### Zsh

```bash
# 推荐：自动安装
api-smoke completion zsh --write

# 手动安装
mkdir -p ~/.zsh/completion
api-smoke completion zsh > ~/.zsh/completion/_api-smoke
# 在 ~/.zshrc 中添加：
fpath=(~/.zsh/completion $fpath)
autoload -Uz compinit && compinit
```

---

## 📋 CI/CD 集成示例

### GitHub Actions

```yaml
jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build

      - name: Run API Smoke Tests
        run: |
          node dist/cli.js \
            -c tests/collections/prod-smoke.json \
            -e tests/envs/production.yaml \
            --parallel 8 \
            --junit reports/api-smoke.xml \
            --json reports/api-smoke.json \
            --log-level info \
            --fail-on-zero-tests
        env:
          BEARER_TOKEN: ${{ secrets.PROD_API_TOKEN }}
        continue-on-error: false

      - name: Upload Test Reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: api-smoke-reports
          path: reports/

      - name: Publish JUnit Report
        uses: EnricoMi/publish-unit-test-result-action@v2
        if: always()
        with:
          junit_files: reports/**/*.xml
```

### Jenkins Pipeline

```groovy
pipeline {
  agent any
  stages {
    stage('Smoke Test') {
      steps {
        sh '''
          npm install
          npm run build
          node dist/cli.js \\
            -c collections/regression.json \\
            -e environments/staging.yaml \\
            -p 4 -j target/api-smoke.xml || true
        '''
      }
      post {
        always {
          junit 'target/*.xml'
          archiveArtifacts 'target/**'
        }
      }
    }
  }
}
```

---

## 🧪 开发调试

```bash
# 开发模式（ts-node）
npm run cli:dev -- -c examples/httpbin-demo.json --dry-run

# 编译后运行
npm run build
npm run cli -- -c examples/httpbin-demo.json

# 运行单元测试
npm test
npm run test:coverage

# 生成 completion
npm run completion:bash > /tmp/completion.sh
```

---

## 📂 项目结构

```
question-406/
├── src/
│   ├── cli.ts                  # CLI 入口
│   ├── index.ts                # 模块导出
│   ├── types/
│   │   └── index.ts            # 所有类型定义
│   ├── core/
│   │   ├── loader.ts           # 配置加载（JSON/YAML/dotenv）
│   │   ├── builder.ts          # 用例构建 + 变量解析
│   │   ├── executor.ts         # HTTP 执行 + 鉴权 + 重试
│   │   ├── runner.ts           # 并发调度 + 依赖处理
│   │   ├── assertions.ts       # 断言引擎
│   │   └── reporter.ts         # 控制台/JUnit/JSON 报告
│   └── utils/
│       ├── logger.ts           # 分级日志
│       ├── path.ts             # 跨平台路径
│       ├── variables.ts        # 变量 + 内置函数
│       ├── errors.ts           # 结构化错误
│       └── completion.ts       # Shell Completion
├── tests/                      # 单元测试
├── examples/                   # 示例集合与环境
│   ├── collection.json         # 完整示例（JSON）
│   ├── collection.yaml         # 完整示例（YAML）
│   ├── httpbin-demo.json       # 可直接运行演示
│   └── envs/
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## ❓ 常见问题

**Q: 有依赖关系的用例如何执行？**
A: 配置 `dependsOn: ['用例名']`，runner 自动拓扑排序并串行化执行，`--parallel` 自动降级。

**Q: 登录后 token 如何复用？**
A: 在登录用例的 `extract` 中提取 token，后续用例用 `{{extract.USER_TOKEN}}` 引用，或通过 `Authorization` header 覆盖。

**Q: CI 中如何避免泄露敏感信息？**
A: 敏感值放入 CI secrets，通过 `--global` 注入或 `{{env('SECRET_NAME')}}` 读取系统环境。报告中不会打印实际请求体。

**Q: 网络不稳定怎么办？**
A: 增加 `--retries 3 --retry-delay 2000`，或在 request 级别设置。仅网络类错误自动重试。

**Q: 如何调试单个失败用例？**
A: 使用 `--filter '用例名' -l debug`，观察请求细节和响应数据。

---

## 📝 License

MIT
