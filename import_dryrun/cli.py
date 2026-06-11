"""
命令行入口。

使用示例:

  # 基础用法：指定映射文件和输入数据
  import-dryrun --mapping mapping.yaml --input data.csv

  # 完整参数：指定目标表结构、样例数、限制处理条数
  import-dryrun \\
      --target target_schema.yaml \\
      --input users.csv \\
      --sample-errors 10 \\
      --limit 100

  # 详细模式 + 机器可读 JSON 输出
  import-dryrun -m mapping.yaml -i data.csv -v --json

  # 关闭彩色输出 + 写入报告文件
  import-dryrun -m mapping.yaml -i data.csv --no-color -o report.txt

环境变量 (IMPORTDRYRUN_ 前缀):

  IMPORTDRYRUN_MAPPING_FILE=mapping.yaml
  IMPORTDRYRUN_VERBOSE=true
  IMPORTDRYRUN_DRY_RUN=true

配置文件 (自动发现: import-dryrun.yaml / .import-dryrun.json):

  mapping_file: mapping.yaml
  target_file: target.yaml
  sample_errors: 5
  verbose: false
  strict_mode: false

优先级: 命令行参数 > 环境变量 > 配置文件 > 默认值

退出码:
  0 - 全部成功 (或 dry-run 无致命错误)
  1 - 部分/全部记录失败
  2 - 参数或配置错误
"""

from __future__ import annotations

import sys
from typing import Optional

import click

from . import __version__
from .config import AppConfig, load_config
from .engine import DryRunEngine
from .models import ImportResult
from .report import ReportGenerator


EPILOG = """\n\
示例:
  # 使用 mapping 文件 + CSV 数据做 dry-run
  import-dryrun --mapping mapping.yaml --input data.csv

  # 指定目标表结构和更多样例错误
  import-dryrun --target schema.yaml -i users.csv --sample-errors 10

  # 仅处理前 500 条 + 详细模式 + JSON 输出
  import-dryrun -m mapping.yaml -i big.csv --limit 500 -v --json

  # 严格模式（未映射字段报错）+ 关闭彩色
  import-dryrun -m mapping.yaml -i data.csv --strict --no-color

环境变量:
  使用 IMPORTDRYRUN_ 前缀，例如:
    export IMPORTDRYRUN_MAPPING_FILE=mapping.yaml
    export IMPORTDRYRUN_VERBOSE=true

配置文件 (自动发现):
  在当前目录查找: import-dryrun.yaml / .import-dryrun.json

  mapping_file: ./mapping.yaml
  target_file: ./target.yaml
  sample_errors: 5
  limit: 1000
  verbose: false
  strict_mode: false

退出码:
  0 - 全部成功
  1 - 存在失败记录
  2 - 参数 / 配置 / 文件错误
"""


def _cli_args_dict(**kwargs) -> dict:
    mapping = {
        "mapping_file": "mapping",
        "target_file": "target",
        "input_file": "input",
        "sample_errors": "sample_errors",
        "limit": "limit",
        "dry_run": "dry_run",
        "verbose": "verbose",
        "machine_output": "machine_output",
        "color": "color",
        "config_file": "config",
        "output_file": "output",
        "strict_mode": "strict",
        "skip_empty_rows": "skip_empty",
        "csv_delimiter": "delimiter",
        "csv_encoding": "encoding",
    }
    out: dict = {}
    for config_key, cli_key in mapping.items():
        if cli_key in kwargs and kwargs[cli_key] is not None:
            out[config_key] = kwargs[cli_key]
    return out


@click.command(
    context_settings={"help_option_names": ["-h", "--help"]},
    epilog=EPILOG,
)
@click.version_option(__version__, "-V", "--version", prog_name="import-dryrun")
@click.option(
    "-m", "--mapping", "mapping",
    type=click.Path(dir_okay=False, readable=True, path_type=str),
    default=None,
    help="字段映射文件 (YAML/JSON)，定义源字段到目标字段的映射规则",
)
@click.option(
    "-t", "--target", "target",
    type=click.Path(dir_okay=False, readable=True, path_type=str),
    default=None,
    help="目标表结构文件 (YAML/JSON)，包含表名、字段、主键、唯一约束",
)
@click.option(
    "-i", "--input", "input",
    type=click.Path(dir_okay=False, readable=True, path_type=str),
    default=None,
    help="输入数据文件 (CSV/JSON/JSONL)",
)
@click.option(
    "--sample-errors", "sample_errors",
    type=click.IntRange(0, 100),
    default=None,
    metavar="N",
    help="每类错误最多展示的样例数量 (0-100，默认 5)",
)
@click.option(
    "-l", "--limit", "limit",
    type=click.IntRange(0),
    default=None,
    metavar="N",
    help="仅处理前 N 条记录（默认不限制，保守模式建议先 100 验证）",
)
@click.option(
    "--dry-run/--no-dry-run", "dry_run",
    default=None,
    help="dry-run 模式：仅模拟不写入 (默认启用)",
)
@click.option(
    "-v", "--verbose", "verbose",
    is_flag=True,
    default=None,
    help="详细模式：输出每条记录的源数据、目标数据、错误详情",
)
@click.option(
    "--json", "machine_output",
    is_flag=True,
    default=None,
    help="机器可读输出 (JSON)，适合管道和脚本处理",
)
@click.option(
    "--color/--no-color", "color",
    default=None,
    help="彩色 / 非彩色输出 (默认彩色)",
)
@click.option(
    "-c", "--config", "config",
    type=click.Path(dir_okay=False, readable=True, path_type=str),
    default=None,
    help="显式指定配置文件路径 (默认自动查找)",
)
@click.option(
    "-o", "--output", "output",
    type=click.Path(dir_okay=False, writable=True, path_type=str),
    default=None,
    help="报告输出文件路径 (默认输出到标准输出)",
)
@click.option(
    "--strict", "strict",
    is_flag=True,
    default=None,
    help="严格模式：源数据中未在 mapping 声明的字段视为错误",
)
@click.option(
    "--skip-empty/--no-skip-empty", "skip_empty",
    default=None,
    help="跳过空行 (默认跳过)",
)
@click.option(
    "-d", "--delimiter", "delimiter",
    type=str,
    default=None,
    help="CSV 分隔符 (默认 ',')",
)
@click.option(
    "-e", "--encoding", "encoding",
    type=str,
    default=None,
    help="CSV 文件编码 (默认 utf-8)",
)
def main(**kwargs) -> None:
    """数据导入 Dry-Run 工具。

    模拟执行数据导入，生成摘要报告：处理成功 / 跳过 / 失败的数量。
    提供字段映射、错误分组、修复建议。默认行为保守（dry-run、不修改任何数据）。
    """
    try:
        cli_args = _cli_args_dict(**kwargs)
        config = load_config(
            config_file=cli_args.get("config_file"),
            cli_args=cli_args,
        )
    except Exception as exc:
        click.echo(
            click.style(f"[错误] 配置加载失败: {exc}", fg="red", bold=True),
            err=True,
        )
        click.echo(
            click.style(
                "提示: 使用 import-dryrun --help 查看所有选项，或检查配置文件格式",
                fg="yellow",
            ),
            err=True,
        )
        sys.exit(2)

    if not config.mapping_file and not config.target_file:
        click.echo(
            click.style(
                "[错误] 必须指定 --mapping 或 --target 之一，"
                "否则无法进行字段映射。",
                fg="red",
                bold=True,
            ),
            err=True,
        )
        click.echo(
            click.style(
                "示例: import-dryrun --mapping mapping.yaml --input data.csv",
                fg="yellow",
            ),
            err=True,
        )
        sys.exit(2)

    if not config.input_file:
        click.echo(
            click.style(
                "[错误] 必须指定 --input 输入数据文件。",
                fg="red",
                bold=True,
            ),
            err=True,
        )
        click.echo(
            click.style(
                "示例: import-dryrun -m mapping.yaml -i users.csv",
                fg="yellow",
            ),
            err=True,
        )
        sys.exit(2)

    try:
        engine = DryRunEngine(config)
        result: ImportResult = engine.run()
    except FileNotFoundError as exc:
        click.echo(
            click.style(f"[错误] 文件不存在: {exc}", fg="red", bold=True),
            err=True,
        )
        sys.exit(2)
    except ValueError as exc:
        click.echo(
            click.style(f"[错误] 数据格式问题: {exc}", fg="red", bold=True),
            err=True,
        )
        sys.exit(2)
    except Exception as exc:
        click.echo(
            click.style(
                f"[错误] 执行失败 ({type(exc).__name__}): {exc}",
                fg="red",
                bold=True,
            ),
            err=True,
        )
        if config.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(2)

    reporter = ReportGenerator(
        config,
        sample_errors=config.sample_errors,
    )
    report = reporter.generate(result)

    if config.output_file:
        try:
            reporter.write_to_file(result, config.output_file)
            click.echo(
                click.style(
                    f"[信息] 报告已写入: {config.output_file}",
                    fg="green",
                ),
                err=True,
            )
        except OSError as exc:
            click.echo(
                click.style(
                    f"[警告] 写入报告文件失败: {exc}",
                    fg="yellow",
                ),
                err=True,
            )
            click.echo(report)
    else:
        click.echo(report)

    if result.failed_count > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":  # pragma: no cover
    main()
