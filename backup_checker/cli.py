"""命令行入口：参数解析、执行流程、shell completion 生成。"""
from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path
from typing import List, Optional, Sequence

from . import __version__
from .checker import BackupChecker
from .models import CheckConfig, NotifyTarget, OutputFormat
from .reporting import Notifier, render_report
from .utils import normalize_path, parse_retention


# ---------------------------------------------------------------------------
# shell completion 脚本
# ---------------------------------------------------------------------------

_BASH_COMPLETION = r'''# backup-checker bash completion script
# 用法: eval "$(backup-checker --completion bash)"
_backup_checker_completions() {
    local cur prev words cword
    _init_completion || return

    local opts="--manifest -m --hash --retention -r --notify -n --notify-target \
                --format -f --output -o --dry-run --strict --no-strict \
                --verbose -v --quiet -q --completion --help -h --version"

    case "${prev}" in
        --manifest|-m|--output|-o|--notify-target)
            _filedir
            return 0
            ;;
        --hash)
            COMPREPLY=( $(compgen -W "md5 sha1 sha256 sha512 none" -- "${cur}") )
            return 0
            ;;
        --notify|-n)
            COMPREPLY=( $(compgen -W "stdout stderr log file" -- "${cur}") )
            return 0
            ;;
        --format|-f)
            COMPREPLY=( $(compgen -W "text json" -- "${cur}") )
            return 0
            ;;
        --completion)
            COMPREPLY=( $(compgen -W "bash zsh fish" -- "${cur}") )
            return 0
            ;;
        --retention|-r)
            COMPREPLY=( $(compgen -W "7d 14d 30d 60d 90d 180d 365d 1w 2w 4w 1m 3m 6m 1y" -- "${cur}") )
            return 0
            ;;
    esac

    if [[ "${cur}" == -* ]]; then
        COMPREPLY=( $(compgen -W "${opts}" -- "${cur}") )
    else
        _filedir -d
    fi
    return 0
}
complete -F _backup_checker_completions backup-checker
'''

_ZSH_COMPLETION = r'''# backup-checker zsh completion script
# 用法: eval "$(backup-checker --completion zsh)"
#compdef backup-checker
_backup_checker() {
    local -a opts
    opts=(
        '(--manifest -m)'{--manifest,-m}'[清单文件路径]:file:_files'
        '--hash[哈希算法]:hash:(md5 sha1 sha256 sha512 none)'
        '(--retention -r)'{--retention,-r}'[保留周期]:retention:(7d 14d 30d 60d 90d 180d 365d 1w 2w 1m 3m 6m 1y)'
        '(--notify -n)'{--notify,-n}'[告警方式]:notify:(stdout stderr log file)'
        '--notify-target[告警输出目标路径]:file:_files'
        '(--format -f)'{--format,-f}'[输出格式]:format:(text json)'
        '(--output -o)'{--output,-o}'[报告输出路径]:file:_files'
        '--dry-run[模拟执行，不计算哈希]'
        '--strict[严格模式，有任何问题即非零退出]'
        '--no-strict[宽松模式]'
        '(-v --verbose)'{-v,--verbose}'[详细输出，可叠加]'
        '(-q --quiet)'{-q,--quiet}'[仅输出错误]'
        '--completion[生成 shell completion 脚本]:shell:(bash zsh fish)'
        '(-h --help)'{-h,--help}'[显示帮助]'
        '--version[显示版本]'
        '*:backup directory:_directories'
    )
    _arguments -s $opts
}
_backup_checker "$@"
'''

_FISH_COMPLETION = r'''# backup-checker fish completion script
# 用法: backup-checker --completion fish | source
complete -c backup-checker -s h -l help -d '显示帮助信息'
complete -c backup-checker -l version -d '显示版本信息'
complete -c backup-checker -s m -l manifest -r -d '清单文件路径' -F
complete -c backup-checker -l hash -r -d '哈希算法' \
    -a 'md5 sha1 sha256 sha512 none'
complete -c backup-checker -s r -l retention -r -d '保留周期，如 7d/2w/1m' \
    -a '7d 14d 30d 60d 90d 180d 365d 1w 2w 1m 3m 6m 1y'
complete -c backup-checker -s n -l notify -r -d '告警输出方式' \
    -a 'stdout stderr log file'
complete -c backup-checker -l notify-target -r -d '告警文件目标路径' -F
complete -c backup-checker -s f -l format -r -d '输出格式' -a 'text json'
complete -c backup-checker -s o -l output -r -d '报告输出路径' -F
complete -c backup-checker -l dry-run -d '模拟执行，不计算哈希'
complete -c backup-checker -l strict -d '严格模式，有任何问题即非零退出'
complete -c backup-checker -l no-strict -d '宽松模式'
complete -c backup-checker -s v -l verbose -d '详细输出，可叠加 -vv'
complete -c backup-checker -s q -l quiet -d '仅输出错误'
complete -c backup-checker -l completion -r -d '生成 shell completion 脚本' \
    -a 'bash zsh fish'
complete -c backup-checker -d '备份目录路径' -a '(__fish_complete_directories)'
'''


# ---------------------------------------------------------------------------
# argparse 自定义
# ---------------------------------------------------------------------------

class _FriendlyArgumentParser(argparse.ArgumentParser):
    """在默认行为基础上，提供更友好的中文错误提示。"""

    def error(self, message: str) -> None:  # noqa: D401
        """输出带定位提示的错误信息，并退出码 1。"""
        sys.stderr.write(self._format_friendly_error(message))
        sys.exit(1)

    def _format_friendly_error(self, message: str) -> str:
        lines = [
            "",
            "✗ 参数错误：" + _translate_argparse_msg(message),
            "",
            "提示：",
            "  · 使用 -h 或 --help 查看完整帮助",
            "  · 示例：backup-checker /backup/dir --manifest manifest.json --hash sha256",
            "  · 路径建议使用引号包裹，尤其是包含空格时",
            "",
            _error_location_hint(message),
            "",
        ]
        return "\n".join(lines)


def _translate_argparse_msg(msg: str) -> str:
    """将 argparse 默认英文错误消息翻译为中文。"""
    mapping = [
        (r"^the following arguments are required: (.+)$",
         r"缺少必填参数：\1"),
        (r"^argument ([^:]+): (?:expected )?one argument$",
         r"参数 \1 需要提供一个值"),
        (r"^argument ([^:]+): invalid .* value: '(.+)'$",
         r"参数 \1 的值无效：'\2'"),
        (r"^argument ([^:]+): .* not in choices$",
         r"参数 \1 的值不在可选范围"),
        (r"^unrecognized arguments: (.+)$",
         r"无法识别的参数：\1"),
        (r"^argument --([a-zA-Z0-9-]+): .*not? accessible$",
         r"参数 --\1 无法读取，请检查权限或路径"),
    ]
    import re
    out = msg
    for pattern, repl in mapping:
        new = re.sub(pattern, repl, out, flags=re.IGNORECASE)
        if new != out:
            out = new
            break
    return out


def _error_location_hint(message: str) -> str:
    """基于错误内容给出更具体的定位建议。"""
    m = message.lower()
    if "manifest" in m or "--manifest" in m or "-m" in m:
        return "定位提示：请检查 --manifest 参数，清单文件应为 JSON 格式，路径可相对或绝对。"
    if "hash" in m or "--hash" in m:
        return "定位提示：--hash 可选值为 md5 / sha1 / sha256 / sha512 / none"
    if "retention" in m or "--retention" in m or "-r" in m:
        return "定位提示：--retention 格式如 7d / 2w / 1m / 365d"
    if "notify" in m or "--notify" in m or "-n" in m:
        return "定位提示：--notify 可选值 stdout / stderr / log / file，file 时需同时给 --notify-target"
    if "format" in m or "--format" in m or "-f" in m:
        return "定位提示：--format 可选 text / json"
    if "backup_dir" in m or "backup dir" in m:
        return "定位提示：第一个位置参数是备份目录路径；路径含空格请加引号。"
    return "定位提示：使用 -vv 可以获得更详细的调试输出。"


# ---------------------------------------------------------------------------
# 帮助示例
# ---------------------------------------------------------------------------

_EPILOG = """\
示例命令:
  1. 基础检查（SHA-256）
     backup-checker /backups/weekly --manifest /backups/weekly/manifest.json

  2. Dry-run 快速检查（不计算哈希，仅检查文件存在性和过期）
     backup-checker /backups/weekly -m manifest.json --dry-run

  3. 自定义保留周期并输出 JSON 报告
     backup-checker /backups/monthly -m manifest.json -r 90d -f json -o report.json

  4. 宽松模式 + 告警写入日志文件
     backup-checker D:\\Backups\\06-01 -m manifest.json --no-strict \\
         --notify file --notify-target /var/log/backup-check.log

退出码:
  0  检查通过        1  参数/运行异常
  2  文件缺失        3  哈希校验失败
  4  备份过期        5  存在多个问题
"""


def build_parser() -> argparse.ArgumentParser:
    """构建 argparse 解析器。"""
    parser = _FriendlyArgumentParser(
        prog="backup-checker",
        description=(
            "备份完整性检查器：校验备份目录与清单的一致性（文件存在/哈希/大小），"
            "检测过期备份，并生成摘要、明细与错误清单报告。"
        ),
        epilog=_EPILOG,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "backup_dir",
        nargs="?",
        default=None,
        help="备份目录路径（必填位置参数），相对/绝对均可；Windows 路径可用正斜杠或反斜杠",
    )
    parser.add_argument(
        "--manifest", "-m",
        default=None,
        help="清单文件路径（JSON 格式，支持 YAML 若安装 PyYAML），默认为空",
    )
    parser.add_argument(
        "--hash",
        default="sha256",
        choices=["md5", "sha1", "sha256", "sha512", "none"],
        help="哈希算法，默认 sha256；指定 none 则跳过哈希校验，仅检查存在性",
    )
    parser.add_argument(
        "--retention", "-r",
        default=None,
        help="保留周期，格式如 7d / 2w / 1m / 365d；覆盖清单中的设置",
    )
    parser.add_argument(
        "--notify", "-n",
        default="stdout",
        choices=["stdout", "stderr", "log", "file"],
        help="告警输出方式，默认 stdout",
    )
    parser.add_argument(
        "--notify-target",
        default=None,
        help="告警输出目标路径（仅在 --notify=file 时使用）",
    )
    parser.add_argument(
        "--format", "-f",
        default="text",
        choices=["text", "json"],
        help="报告输出格式，默认 text",
    )
    parser.add_argument(
        "--output", "-o",
        default=None,
        help="报告写入的文件路径，默认打印到控制台",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="模拟执行：跳过哈希计算，仅检查文件存在性、大小和过期（快速模式）",
    )
    strict_group = parser.add_mutually_exclusive_group()
    strict_group.add_argument(
        "--strict",
        dest="strict",
        action="store_true",
        default=True,
        help="严格模式（默认）：任何 warning 或 error 都导致非零退出码",
    )
    strict_group.add_argument(
        "--no-strict",
        dest="strict",
        action="store_false",
        help="宽松模式：仅 ERROR/CRITICAL 导致非零退出码",
    )
    verb_group = parser.add_mutually_exclusive_group()
    verb_group.add_argument(
        "--verbose", "-v",
        action="count",
        default=0,
        help="详细输出，可叠加 -v / -vv / -vvv",
    )
    verb_group.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="静默模式：仅输出错误，不输出摘要和明细",
    )
    parser.add_argument(
        "--completion",
        default=None,
        choices=["bash", "zsh", "fish"],
        help="生成指定 shell 的补全脚本并打印到 stdout（不执行检查）",
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"backup-checker {__version__}",
    )
    return parser


# ---------------------------------------------------------------------------
# 主入口
# ---------------------------------------------------------------------------

def _configure_logging(verbose: int, quiet: bool) -> None:
    if quiet:
        level = logging.ERROR
    elif verbose >= 2:
        level = logging.DEBUG
    elif verbose >= 1:
        level = logging.INFO
    else:
        level = logging.WARNING
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    """解析命令行参数，对路径进行规范化。"""
    parser = build_parser()
    args = parser.parse_args(argv)

    # 处理 completion：早返回
    if args.completion:
        return args

    # 强制要求 backup_dir
    if args.backup_dir is None:
        parser.error("the following arguments are required: backup_dir")

    # 路径规范化
    args.backup_dir = normalize_path(args.backup_dir)
    if args.manifest is not None:
        args.manifest = normalize_path(args.manifest)
    if args.notify_target is not None:
        args.notify_target = normalize_path(args.notify_target)
    if args.output is not None:
        args.output = normalize_path(args.output)
    return args


def build_config(args: argparse.Namespace) -> CheckConfig:
    """基于 argparse.Namespace 构造 CheckConfig。"""
    # 保留周期
    retention_days: Optional[int] = None
    if args.retention is not None:
        try:
            retention_days = parse_retention(args.retention)
        except ValueError as exc:
            msg = f"argument --retention/-r: invalid retention value: '{args.retention}'"
            build_parser().error(msg + f" ({exc})")

    return CheckConfig(
        backup_dir=args.backup_dir,
        manifest_path=args.manifest,
        hash_algorithm=args.hash,
        retention_days=retention_days,
        dry_run=args.dry_run,
        strict=args.strict,
        verbose=args.verbose,
        quiet=args.quiet,
        notify=NotifyTarget(args.notify),
        notify_target=args.notify_target,
        output_format=OutputFormat(args.format),
        output_path=args.output,
    )


def main(argv: Optional[Sequence[str]] = None) -> int:
    """主函数，返回退出码。"""
    args = parse_args(argv)

    # shell completion 模式：直接输出脚本并退出
    if args.completion:
        scripts = {
            "bash": _BASH_COMPLETION,
            "zsh": _ZSH_COMPLETION,
            "fish": _FISH_COMPLETION,
        }
        sys.stdout.write(scripts[args.completion])
        return 0

    _configure_logging(args.verbose, args.quiet)

    try:
        config = build_config(args)
    except SystemExit as exc:
        return int(exc.code) if exc.code is not None else 1

    checker = BackupChecker(config)
    result = checker.run_all_checks()

    # 告警通知
    try:
        with Notifier(config.notify, config.notify_target) as notifier:
            notifier.notify(result)
    except Exception:  # pragma: no cover - 防御性
        logging.getLogger("backup_checker").exception("通知发送失败")

    # 生成并输出报告
    report = render_report(result, config.output_format)
    if config.output_path:
        try:
            config.output_path.parent.mkdir(parents=True, exist_ok=True)
            config.output_path.write_text(report, encoding="utf-8")
            if not config.quiet:
                sys.stderr.write(f"[info] 报告已写入：{config.output_path}\n")
        except OSError as exc:
            sys.stderr.write(f"✗ 写入报告文件失败：{exc}\n")
            sys.stdout.write(report)
    else:
        if not config.quiet:
            sys.stdout.write(report)
        elif result.summary.errors_count > 0:
            # 静默模式下仍将错误清单输出到 stderr
            issues_str = "\n".join(
                f"[{i.severity.value.upper()}] {i.message}"
                for i in result.issues
                if i.severity.value in ("error", "critical")
            )
            if issues_str:
                sys.stderr.write(issues_str + "\n")

    return result.exit_code()


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
