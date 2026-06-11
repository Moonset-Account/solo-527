"""命令行接口模块。

提供 csv-validator CLI 命令，支持：
- Schema文件指定 (--schema)
- 严格模式 (--strict)
- 报告输出 (--report)
- 修复建议预览 (--fix-preview)
- 输出格式切换 (--format human|json|markdown|csv)
- 标准输入/文件输入
- Dry-run 模式
- CI友好的稳定退出码
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import List, Optional, Sequence, TextIO

from csv_validator.errors import (
    ExitCode,
    ValidationError,
    ValidationResult,
)
from csv_validator.report import ReportGenerator
from csv_validator.schema import Schema, SchemaLoader
from csv_validator.validator import CSVValidator


class ArgumentParserError(Exception):
    """自定义参数解析错误异常，携带完整错误消息。"""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class _CustomArgumentParser(argparse.ArgumentParser):
    """自定义ArgumentParser，不直接输出到stderr或调用exit。

    标准argparse在出错时会输出usage信息到stderr然后调用sys.exit，
    这会污染我们的机器可读JSON输出。通过自定义error方法，
    我们抛出一个携带完整错误消息的异常，由上层统一处理。
    """

    def error(self, message: str):
        raise ArgumentParserError(message)

    def print_help(self, file=None):
        raise SystemExit(0)

    def print_usage(self, file=None):
        raise SystemExit(0)


def build_parser() -> _CustomArgumentParser:
    """构建命令行参数解析器。"""
    parser = _CustomArgumentParser(
        prog="csv-validator",
        description="CSV数据导入校验器 - 基于Schema的结构化数据校验工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
退出码说明:
  0  校验通过，无错误
  1  校验发现数据错误
  2  Schema定义错误
  3  文件IO错误
  4  命令行参数错误

示例:
  csv-validator --schema schema.json data.csv
  csv-validator --schema schema.json --strict --format json data.csv
  cat data.csv | csv-validator --schema schema.json -
  csv-validator --schema schema.json --report report.json --fix-preview data.csv
        """,
    )

    parser.add_argument(
        "input",
        nargs="?",
        default="-",
        help="CSV输入文件路径，使用 '-' 表示从标准输入读取（默认: -）",
    )

    parser.add_argument(
        "-s", "--schema",
        required=True,
        help="Schema JSON文件路径",
    )

    parser.add_argument(
        "-S", "--strict",
        action="store_true",
        default=None,
        help="严格模式：不允许Schema中未定义的列",
    )

    parser.add_argument(
        "-f", "--format",
        choices=["human", "json", "markdown", "csv"],
        default="human",
        help="报告输出格式（默认: human）",
    )

    parser.add_argument(
        "-o", "--output",
        default="-",
        help="报告输出文件路径，使用 '-' 表示输出到标准输出（默认: -）",
    )

    parser.add_argument(
        "-r", "--report",
        default=None,
        help="机器可读JSON报告的输出路径（等价于 --format json --output <path>）",
    )

    parser.add_argument(
        "--fix-preview",
        action="store_true",
        help="在报告中显示修复建议预览",
    )

    parser.add_argument(
        "--no-fix-preview",
        action="store_true",
        help="在报告中隐藏修复建议预览（默认显示）",
    )

    parser.add_argument(
        "--show-samples",
        action="store_true",
        default=True,
        help="显示典型错误样例（默认）",
    )

    parser.add_argument(
        "--no-samples",
        action="store_true",
        help="隐藏典型错误样例",
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="仅加载Schema并解析参数，不执行实际校验（用于验证配置）",
    )

    parser.add_argument(
        "--max-errors",
        type=int,
        default=1000,
        help="最大记录错误数（默认: 1000），超过后停止收集",
    )

    parser.add_argument(
        "-e", "--encoding",
        default="utf-8",
        help="CSV文件编码（默认: utf-8）",
    )

    parser.add_argument(
        "-q", "--quiet",
        action="store_true",
        help="静默模式，仅输出错误信息",
    )

    parser.add_argument(
        "--version",
        action="version",
        version="csv-validator 1.0.0",
    )

    return parser


def resolve_output_stream(output_path: str) -> tuple[TextIO, bool]:
    """解析输出路径，返回 (文件流, 是否需要手动关闭)。"""
    if output_path == "-":
        return sys.stdout, False
    try:
        fp = open(output_path, "w", encoding="utf-8")
        return fp, True
    except OSError as e:
        raise ValidationError(
            f"无法打开输出文件 {output_path}: {e}",
            exit_code=ExitCode.IO_ERROR,
        )


def read_input(input_path: str, encoding: str) -> TextIO:
    """读取输入，返回文件流对象。"""
    if input_path == "-":
        return sys.stdin
    try:
        return open(input_path, "r", encoding=encoding, newline="")
    except FileNotFoundError:
        raise ValidationError(
            f"输入文件不存在: {input_path}",
            exit_code=ExitCode.IO_ERROR,
        )
    except OSError as e:
        raise ValidationError(
            f"无法读取输入文件 {input_path}: {e}",
            exit_code=ExitCode.IO_ERROR,
        )


def run_validation(
    schema_path: str,
    input_path: str,
    strict: Optional[bool],
    max_errors: int,
    encoding: str,
    dry_run: bool,
) -> tuple[Schema, Optional[ValidationResult]]:
    """执行Schema加载和CSV校验流程。"""
    schema = SchemaLoader.from_file(schema_path)

    if dry_run:
        return schema, None

    validator = CSVValidator(schema=schema, strict=strict, max_errors=max_errors)

    if input_path == "-":
        content = sys.stdin.read()
        result = validator.validate_string(content)
    else:
        result = validator.validate_file(input_path, encoding=encoding)

    return schema, result


def _detect_output_format(argv: Optional[Sequence[str]]) -> str:
    """从原始argv中检测输出格式，用于argparse错误时的机器可读输出。

    当argparse本身解析失败时，我们无法从args对象获取format参数，
    因此需要直接从命令行参数中检测。
    """
    if argv is None:
        argv = sys.argv[1:]
    for i, arg in enumerate(argv):
        if arg in ("-f", "--format") and i + 1 < len(argv):
            return argv[i + 1]
        if arg.startswith("--format="):
            return arg.split("=", 1)[1]
        if arg == "--report" or arg.startswith("--report="):
            return "json"
    return "human"


def main(argv: Optional[Sequence[str]] = None) -> int:
    """CLI主入口函数。

    Returns:
        退出码，见 ExitCode
    """
    parser = build_parser()
    try:
        args = parser.parse_args(argv)
    except SystemExit as e:
        code = e.code if e.code is not None else 0
        if code == 0:
            return ExitCode.SUCCESS
        return ExitCode.CLI_ERROR
    except ArgumentParserError as e:
        output_format = _detect_output_format(argv)
        err_msg = e.message
        if output_format == "json":
            err = json.dumps({
                "status": "error",
                "error_type": "ArgumentError",
                "message": err_msg,
                "exit_code": ExitCode.CLI_ERROR,
            }, ensure_ascii=False, indent=2)
            print(err, file=sys.stderr)
        else:
            print(f"错误: {err_msg}", file=sys.stderr)
        return ExitCode.CLI_ERROR

    output_format = args.format
    output_path = args.output
    if args.report:
        output_format = "json"
        output_path = args.report

    show_fix_preview = True
    if args.fix_preview:
        show_fix_preview = True
    if args.no_fix_preview:
        show_fix_preview = False

    show_samples = not args.no_samples

    try:
        schema, result = run_validation(
            schema_path=args.schema,
            input_path=args.input,
            strict=args.strict,
            max_errors=args.max_errors,
            encoding=args.encoding,
            dry_run=args.dry_run,
        )

        if args.dry_run:
            if not args.quiet:
                info = {
                    "status": "dry_run_ok",
                    "schema": {
                        "description": schema.description,
                        "field_count": len(schema.fields),
                        "fields": schema.field_names,
                        "required_fields": schema.required_fields,
                        "unique_fields": schema.unique_fields,
                        "unique_keys": schema.unique_keys,
                        "strict": args.strict if args.strict is not None else schema.strict,
                    },
                }
                if output_format == "json":
                    print(json.dumps(info, ensure_ascii=False, indent=2))
                else:
                    print(f"Dry-run 成功: Schema加载无误")
                    print(f"  字段数量: {len(schema.fields)}")
                    print(f"  必填字段: {', '.join(schema.required_fields) or '无'}")
                    print(f"  唯一字段: {', '.join(schema.unique_fields) or '无'}")
                    print(f"  严格模式: {'开启' if info['schema']['strict'] else '关闭'}")
            return ExitCode.SUCCESS

        assert result is not None

        out_stream, need_close = resolve_output_stream(output_path)
        try:
            if not args.quiet or not result.valid:
                ReportGenerator.write(
                    result,
                    output=out_stream,
                    output_format=output_format,
                    show_fix_preview=show_fix_preview,
                    show_samples=show_samples,
                )
        finally:
            if need_close:
                out_stream.close()

        return ExitCode.SUCCESS if result.valid else ExitCode.VALIDATION_ERRORS

    except ValidationError as e:
        if output_format == "json":
            err = json.dumps({
                "status": "error",
                "error_type": type(e).__name__,
                "message": str(e),
                "exit_code": e.exit_code,
            }, ensure_ascii=False, indent=2)
            print(err, file=sys.stderr)
        else:
            print(f"错误: {e}", file=sys.stderr)
        return e.exit_code
    except KeyboardInterrupt:
        print("\n已取消", file=sys.stderr)
        return ExitCode.CLI_ERROR
    except Exception as e:
        print(f"未预期的错误: {e}", file=sys.stderr)
        return ExitCode.CLI_ERROR


if __name__ == "__main__":
    sys.exit(main())
