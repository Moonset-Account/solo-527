# note2task - Markdown 笔记转任务命令行工具

从 Markdown 笔记中提取待办事项，解析项目名、标签、截止日期、优先级，生成统一格式的任务列表。
支持去重、过滤、dry-run 预览、多种格式导出（JSON/Markdown/Stdout）。

## 快速开始

```bash
# 编译
cargo build --release

# 扫描 examples 目录，输出到控制台
./target/release/note2task scan --from examples/

# 仅显示 #bug 标签，JSON 输出
./target/release/note2task scan --from examples/ --tag bug --export json

# 今日到期的任务，写入 JSON 文件
./target/release/note2task scan --from examples/ --due today --export json:out.json

# 预览模式（不写入文件）
./target/release/note2task scan --from examples/ --export md:tasks.md --dry-run
```

## Markdown 语法

```markdown
## 项目名称（二级及以下标题）

- [ ] 待办事项内容 #标签1 #标签2 @due(YYYY-MM-DD) !优先级
- [x] 已完成
- [/] 进行中
- [-] 已取消
```

### 语法说明

| 语法 | 说明 | 示例 |
| --- | --- | --- |
| `- [ ]` | 待办（Todo） | `- [ ] 写代码` |
| `- [x]` | 已完成（Done） | `- [x] 上线` |
| `- [/]` | 进行中（In-Progress） | `- [/] 测试` |
| `- [-]` | 已取消（Cancelled） | `- [-] 废弃方案` |
| `## ` 及以下 | 项目名 | `## 支付模块重构` |
| `#标签` | 标签（支持中英文） | `#bug #后端` |
| `@due(...)` | 截止日期 | `@due(2025-01-20)` `@due(today)` `@due(tomorrow)` `@due(this-week)` `@due(next-week)` `@due(overdue)` |
| `!N` | 优先级，1（最高）~5 | `!1` 紧急 |

## CLI 参考

### 子命令

| 命令 | 说明 |
| --- | --- |
| `scan` | 扫描 Markdown 文件并提取任务 |
| `completions <shell>` | 生成 Shell 补全脚本 (bash/zsh/fish/powershell/elvish) |

### scan 子命令参数

| 参数 | 说明 |
| --- | --- |
| `-f, --from <PATH>...` | Markdown 源路径（文件或目录，可多次） |
| `-t, --tag <TAG>...` | 按标签过滤（AND 逻辑） |
| `--due <SPEC>` | 截止日期过滤（见下） |
| `--status <todo\|done\|in-progress\|cancelled>` | 按状态过滤 |
| `--project <NAME>...` | 项目名子串匹配 |
| `--priority <1-5>` | 按优先级过滤 |
| `-e, --export [fmt][:path]` | 导出：`stdout`/`json`/`md` + 可选路径 |
| `--no-dedup` | 关闭去重 |
| `-n, --dry-run` | 预览模式，不写入文件 |
| `--strict` | 严格模式，解析错误立即退出 |
| `--today <YYYY-MM-DD>` | 覆盖今日日期（测试用） |
| `-v...` | 详细日志（可叠加 `-vv` `-vvv`） |
| `--quiet` | 安静模式，仅错误 |

#### --due 过滤格式

```
--due today                      今天到期
--due tomorrow                   明天到期
--due week                       本周到期
--due overdue                    已逾期
--due 2025-01-20                 精确日期
--due exact:2025-01-20           同上
--due before:2025-01-31          在某日之前（含）
--due after:2025-02-01           在某日之后（含）
```

## 退出码

| 码 | 含义 |
| --- | --- |
| `0` | 成功 |
| `1` | IO 错误 |
| `2` | 无效路径 |
| `3` | 未找到 Markdown 文件 |
| `4` | 无效日期格式 |
| `5` | 解析错误（严格模式） |
| `6` | 不支持的导出格式 |
| `7` | 无效标签格式 |
| `8` | 写入文件失败 |
| `9` | 读取文件失败 |
| `10` | JSON 序列化错误 |
| `11` | Shell 补全生成失败 |
| `99` | 其他错误 |

## Shell Completion

```bash
# Bash
note2task completions bash > /etc/bash_completion.d/note2task

# Zsh
note2task completions zsh > ~/.zfunc/_note2task

# Fish
note2task completions fish > ~/.config/fish/completions/note2task.fish
```

## 验收检查

```bash
# 运行单元测试
cargo test --lib

# 运行集成测试 (dry-run / 错误输入 / JSON)
cargo test --test cli_tests

# 运行验收脚本
bash examples/acceptance_check.sh
```

## 项目结构

```
src/
├── main.rs          # 入口，退出码处理
├── lib.rs           # 顶层 run_scan 逻辑
├── cli.rs           # clap 参数定义
├── models.rs        # 核心数据模型 (TodoItem/Tag/DueDate/...)
├── parser.rs        # Markdown 解析器
├── filter.rs        # 标签/日期/状态/项目/优先级过滤
├── dedup.rs         # 去重（内容+项目+日期 hash）
├── exporter.rs      # stdout/JSON/Markdown 导出
├── file_walker.rs   # 目录递归扫描
├── logger.rs        # env_logger 初始化
├── completion.rs    # Shell 补全生成
└── errors.rs        # 错误类型与退出码
tests/
└── cli_tests.rs     # 集成测试（验收标准：dry-run/错误/JSON）
examples/
├── work_notes.md    # 工作笔记示例
├── personal.md      # 个人笔记示例（含重复）
└── acceptance_check.sh  # 验收脚本
```

## License

MIT
