# CSV 数据导入校验器 (csv-validator)

面向数据运营团队的结构化CSV校验工具。解决日常面对的CSV字段类型校验、必填列检查、枚举值合法性、重复键检测等问题，支持CI流水线集成，提供机器可读报告和精确的错误定位。

## 功能特性

- **Schema 驱动校验**：基于JSON Schema定义列类型、必填、枚举、范围、唯一键等规则
- **精确错误定位**：定位到具体行号和列名，附带原始值和错误描述
- **样例错误输出**：自动抽取典型错误样例，快速了解问题
- **修复建议**：按错误类型聚合修复建议，加速数据修正
- **多种输入/输出格式**：支持标准输入/文件输入，支持 human/json/markdown/csv 四种报告格式
- **CI 友好**：稳定的退出码约定，机器可读的JSON报告，可在流水线中直接使用
- **Dry-run 模式**：仅验证Schema和参数配置，不执行实际校验
- **严格模式**：不允许Schema中未定义的列
- **性能优化**：流式处理大文件，支持最大错误数限制避免性能问题

## 安装

### 要求

- Python >= 3.9

### 从源码安装（推荐用于开发/本地）

```bash
# 进入项目目录
cd csv-validator

# 以可编辑模式安装
pip install -e .

# 安装测试依赖
pip install -e ".[test]"
```

### 验证安装

```bash
csv-validator --version
# csv-validator 1.0.0

csv-validator --help
```

## 快速开始

```bash
# 1. 基础校验 - 使用示例数据
csv-validator --schema examples/schema_orders.json examples/orders_valid.csv

# 2. 校验含错误的数据，观察错误输出
csv-validator --schema examples/schema_orders.json examples/orders_invalid.csv

# 3. Dry-run 验证Schema配置
csv-validator --schema examples/schema_orders.json --dry-run

# 4. 机器可读 JSON 报告（CI用）
csv-validator --schema examples/schema_orders.json --format json examples/orders_valid.csv

# 5. 将报告写入文件 + 修复建议预览
csv-validator --schema examples/schema_orders.json \
  --report report.json \
  --fix-preview \
  examples/orders_invalid.csv

# 6. 严格模式 + 标准输入管道
cat examples/orders_invalid.csv | csv-validator --schema examples/schema_orders.json --strict -

# 7. Markdown 格式报告
csv-validator --schema examples/schema_orders.json -f markdown examples/orders_invalid.csv
```

## 命令行参数

| 参数 | 缩写 | 说明 | 默认值 |
|------|------|------|--------|
| `input` | - | CSV输入文件路径，`-` 表示标准输入 | `-` |
| `--schema` | `-s` | Schema JSON文件路径 (必填) | - |
| `--strict` | `-S` | 严格模式，不允许Schema未定义的列 | `false` |
| `--format` | `-f` | 报告格式：`human`/`json`/`markdown`/`csv` | `human` |
| `--output` | `-o` | 报告输出路径，`-` 表示标准输出 | `-` |
| `--report` | `-r` | JSON报告输出路径（等价于 `-f json -o <path>`） | - |
| `--fix-preview` | - | 在报告中显示修复建议预览 | 默认显示 |
| `--no-fix-preview` | - | 隐藏修复建议预览 | - |
| `--show-samples` | - | 显示典型错误样例 | 默认显示 |
| `--no-samples` | - | 隐藏典型错误样例 | - |
| `--dry-run` | - | 仅加载Schema和解析参数，不执行实际校验 | `false` |
| `--max-errors` | - | 最大错误记录数，超过后停止收集 | `1000` |
| `--encoding` | `-e` | CSV文件编码 | `utf-8` |
| `--quiet` | `-q` | 静默模式，成功时无输出 | `false` |
| `--version` | - | 显示版本号 | - |

## 退出码

CI流水线中可根据退出码判断处理逻辑：

| 退出码 | 含义 |
|--------|------|
| `0` | 校验通过，无错误 |
| `1` | 校验发现数据错误 |
| `2` | Schema定义错误（文件不存在、JSON格式错、Schema结构不合法） |
| `3` | 文件IO错误（输入文件不存在、无法读取/写入） |
| `4` | 命令行参数错误 |

**CI 集成示例 (GitLab CI)**:

```yaml
validate_csv:
  stage: validate
  image: python:3.11
  before_script:
    - pip install ./csv-validator
  script:
    - csv-validator --schema config/orders_schema.json --report report.json data/orders.csv
  artifacts:
    when: always
    paths:
      - report.json
```

## Schema 定义格式

Schema 使用 JSON 格式，完整示例见 [examples/schema_orders.json](examples/schema_orders.json)。

```json
{
  "description": "订单数据Schema",
  "strict": false,
  "fields": [
    {
      "name": "order_id",
      "type": "string",
      "required": true,
      "unique": true,
      "pattern": "^ORD[0-9]{8}$",
      "description": "订单号"
    },
    {
      "name": "quantity",
      "type": "integer",
      "required": true,
      "min_value": 1,
      "max_value": 999
    },
    {
      "name": "status",
      "type": "string",
      "required": true,
      "enum": ["pending", "paid", "shipped", "delivered", "cancelled", "refunded"]
    },
    {
      "name": "order_date",
      "type": "date",
      "format": "%Y-%m-%d"
    }
  ],
  "unique_keys": [
    ["user_id", "order_date"]
  ]
}
```

### 字段类型

| 类型 | 说明 | 额外参数 |
|------|------|----------|
| `string` | 字符串 | `pattern`(正则), `enum`(枚举值) |
| `integer` | 整数 | `min_value`, `max_value`, `enum` |
| `float` | 浮点数 | `min_value`, `max_value`, `enum` |
| `boolean` | 布尔值 | 支持: true/false, 1/0, yes/no, 是/否 |
| `date` | 日期 | `format` (strftime格式，默认 `%Y-%m-%d`) |
| `datetime` | 日期时间 | `format` (默认 `%Y-%m-%d %H:%M:%S`) |

### 唯一键

- **单字段唯一**：在字段定义中设置 `"unique": true`
- **多字段组合唯一**：在 `unique_keys` 数组中声明，例如 `[["user_id", "order_date"]]`

## 错误码

| 错误码 | 说明 |
|--------|------|
| `MISSING_REQUIRED_COLUMN` | CSV表头缺少必填列 |
| `UNKNOWN_COLUMN` | 出现Schema未定义的列（严格模式下） |
| `MISSING_VALUE` | 必填字段值为空 |
| `TYPE_MISMATCH` | 字段值无法转换为声明的类型 |
| `INVALID_ENUM` | 值不在允许的枚举列表中 |
| `DUPLICATE_KEY` | 唯一键（单字段或组合）重复 |
| `INVALID_FORMAT` | 字符串不匹配正则表达式 |
| `VALUE_OUT_OF_RANGE` | 数值超出最小值/最大值范围 |
| `EMPTY_FILE` | CSV文件为空 |

## JSON 报告结构

```json
{
  "valid": false,
  "total_rows": 10,
  "total_columns": 10,
  "error_count": 8,
  "warning_count": 1,
  "stats": {
    "DUPLICATE_KEY": 2,
    "INVALID_FORMAT": 1,
    "TYPE_MISMATCH": 1
  },
  "issues": [
    {
      "code": "MISSING_VALUE",
      "row": 7,
      "column": "order_id",
      "value": "",
      "message": "必填字段 'order_id' 为空",
      "suggestion": "请填写该字段的值",
      "severity": "error"
    }
  ],
  "sample_errors": [...],
  "fix_preview": [
    {
      "code": "DUPLICATE_KEY",
      "count": 2,
      "suggestion": "请确保该字段的值唯一...",
      "example": {
        "location": "第3行 列[order_id]",
        "value": "ORD20250001"
      }
    }
  ]
}
```

## 作为 Python 库使用

```python
from csv_validator import CSVValidator, SchemaLoader, ValidationResult

# 加载 Schema
schema = SchemaLoader.from_file("examples/schema_orders.json")

# 创建校验器
validator = CSVValidator(schema=schema, strict=False, max_errors=1000)

# 校验文件
result: ValidationResult = validator.validate_file("data.csv")

# 校验字符串
result = validator.validate_string("id,name\n1,Alice\n")

# 输出结果
if result.valid:
    print(f"校验通过，共 {result.total_rows} 行")
else:
    print(f"发现 {result.error_count} 个错误")
    for issue in result.issues:
        print(f"  [{issue.code.value}] {issue.format_location()}: {issue.message}")
```

## 自动化测试

### 运行单元测试

```bash
# 安装测试依赖
pip install -e ".[test]"

# 运行所有单元测试
pytest tests/ -v

# 运行带覆盖率的测试
pytest tests/ --cov=csv_validator --cov-report=term-missing
```

### 运行性能基准测试

```bash
# 直接运行基准脚本
python benchmarks/test_benchmark.py

# 使用 pytest-benchmark
pytest benchmarks/test_benchmark.py --benchmark-autosave
```

预期性能参考（普通笔记本，10列数据）：
- 1,000 行：~0.01 秒
- 10,000 行：~0.1 秒
- 吞吐率：> 10万行/秒

## 验收检查清单

- [x] **Dry-run 模式**：`csv-validator --schema examples/schema_orders.json --dry-run` 验证Schema无误
- [x] **错误输入**：`csv-validator --schema examples/schema_orders.json examples/orders_invalid.csv` 准确定位所有类型错误
- [x] **JSON 输出**：`csv-validator --schema examples/schema_orders.json -f json examples/orders_invalid.csv` 输出合法可解析JSON
- [x] **退出码稳定**：成功返回0，数据错误返回1，Schema错误返回2，IO错误返回3，参数错误返回4
- [x] **单元测试通过**：`pytest tests/ -v`
- [x] **示例数据完备**：`examples/` 目录包含有效/无效CSV和多个Schema

## 项目结构

```
csv-validator/
├── csv_validator/          # 主代码包
│   ├── __init__.py
│   ├── errors.py           # 错误定义与结果封装
│   ├── schema.py           # Schema解析与定义
│   ├── validator.py        # 校验引擎
│   ├── report.py           # 多格式报告生成
│   └── cli.py              # CLI入口
├── tests/                  # 单元测试
│   ├── test_errors.py
│   ├── test_schema.py
│   ├── test_validator.py
│   ├── test_report.py
│   └── test_cli.py
├── benchmarks/             # 性能基准
│   └── test_benchmark.py
├── examples/               # 示例数据
│   ├── schema_orders.json
│   ├── schema_users.json
│   ├── orders_valid.csv
│   ├── orders_invalid.csv
│   └── users_valid.csv
├── pyproject.toml          # 项目配置
└── README.md
```

## License

MIT
