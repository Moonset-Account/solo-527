# smoke-api-cli

API 冒烟测试命令行工具，面向测试工程师的日常工作流。读取接口集合、鉴权、请求体、断言和环境变量，支持用例加载、并发执行、断言报告、失败重试，输出人类可读表格或 JSON / JUnit 机器可读格式。

## 特性

- **多种鉴权方式**：Bearer Token、Basic Auth、API Key（header / query）、OAuth2
- **变量占位符**：`${VAR_NAME}` 语法，支持 `process.env` → `env.variables` → 运行时 `extract` 三级变量源
- **10 种断言**：statusCode、statusCodeRange、header、headerExists、bodyJsonPath、bodyContains、bodyRegex、responseTime、jsonSchema、contentType
- **并发与依赖**：`p-limit` 并发控制，`dependsOn` 依赖链顺序执行
- **失败重试**：指数退避算法，默认重试 429 / 500 / 502 / 503 / 504
- **多格式报告**：cli-table3 表格、JSON、JUnit XML
- **稳定退出码**：0=成功、1=测试失败、2=配置错误、3=运行时异常、130=中断
- **CI 友好**：自动检测 CI 环境禁用彩色输出，支持机器可读报告

## 安装

```bash
npm install -g smoke-api-cli
```

或直接运行：

```bash
npx smoke-api-cli --collection ./collection.json
```

## 快速开始

```bash
# 冒烟测试（DRY-RUN，只校验配置，不发起请求）
smoke-api --collection examples/collection.json --env examples/env.dev.yaml --dry-run

# 并发执行，输出 JSON 报告
smoke-api -c collection.json -e env.json --parallel 10 --json -o report.json

# 输出 JUnit 报告给 CI
smoke-api -c collection.json --junit junit-results.xml
```

## CLI 选项

| 选项 | 缩写 | 说明 |
|------|------|------|
| `--collection` | `-c` | collection 文件路径 (JSON / YAML) **必填** |
| `--env` | `-e` | environment 文件路径 (JSON / YAML) |
| `--parallel` | `-p` | 并发数，默认 1，范围 1–100 |
| `--retry` | `-r` | 最大重试次数，覆盖 collection 配置 |
| `--timeout` | `-t` | 每个请求超时时间（毫秒） |
| `--json` | `-j` | 输出 JSON 格式报告 |
| `--output` | `-o` | JSON 报告输出路径 |
| `--junit` |  | JUnit XML 报告输出路径 |
| `--report` |  | 报告目录（同时输出 JSON + JUnit） |
| `--dry-run` | `-d` | 只校验配置，不发起请求 |
| `--verbose` | `-v` | 详细输出 |
| `--tags` |  | 按标签过滤用例，逗号分隔 |
| `--filter` |  | 按用例 ID / 名称关键字过滤 |
| `--fail-fast` |  | 遇到第一个失败立即停止 |
| `--delay` |  | 每个用例之间的延迟（毫秒） |
| `--color` |  | 彩色输出，默认 true |
| `--version` | `-V` | 输出版本号 |
| `--help` | `-h` | 显示帮助 |

## 配置文件

### Collection（接口集合）

```json
{
  "name": "用户服务冒烟测试",
  "version": "1.0",
  "baseUrl": "${BASE_URL}",
  "auth": {
    "type": "bearer",
    "token": "${API_TOKEN}"
  },
  "tests": [
    {
      "id": "user-001",
      "name": "获取用户列表",
      "method": "GET",
      "url": "/api/users",
      "assertions": [
        { "type": "statusCode", "value": 200 },
        { "type": "bodyJsonPath", "path": "$.data", "valueType": "array" }
      ],
      "extract": {
        "firstUserId": "$.data[0].id"
      }
    },
    {
      "id": "user-002",
      "name": "获取单个用户",
      "method": "GET",
      "url": "/api/users/${firstUserId}",
      "dependsOn": ["user-001"],
      "assertions": [
        { "type": "statusCode", "value": 200 }
      ]
    }
  ]
}
```

### Environment（环境变量）

```yaml
name: 开发环境
variables:
  BASE_URL: http://localhost:3000
  API_TOKEN: dev-token-12345
auth:
  type: bearer
  token: ${API_TOKEN}
```

## 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 所有用例通过 |
| 1 | 存在失败的测试用例 |
| 2 | 配置错误（collection / env 格式错误、未解析占位符等） |
| 3 | 运行时异常 |
| 130 | 用户中断（Ctrl+C） |

## CI 集成

GitHub Actions 示例：

```yaml
- name: API 冒烟测试
  run: npx smoke-api-cli -c collection.json -e env.prod.json --junit report.xml
  continue-on-error: true

- name: 上传测试结果
  uses: actions/upload-artifact@v4
  with:
    name: smoke-report
    path: report.xml
```

## License

MIT
