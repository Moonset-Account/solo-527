"""cli.py 测试：参数解析、completion、退出码、dry-run、JSON 输出等。"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

from backup_checker.cli import build_config, build_parser, main, parse_args


class TestParser:
    def test_help_contains_examples(self, capsys):
        parser = build_parser()
        with pytest.raises(SystemExit) as exc:
            parser.parse_args(["--help"])
        assert exc.value.code == 0
        out = capsys.readouterr().out
        assert "示例命令" in out
        assert "退出码" in out
        assert "--manifest" in out
        assert "--dry-run" in out
        assert "--completion" in out

    def test_version(self, capsys):
        with pytest.raises(SystemExit) as exc:
            build_parser().parse_args(["--version"])
        assert exc.value.code == 0
        assert "backup-checker" in capsys.readouterr().out

    def test_missing_backup_dir(self):
        with pytest.raises(SystemExit) as exc:
            parse_args([])
        assert exc.value.code == 1


class TestCompletion:
    @pytest.mark.parametrize("shell", ["bash", "zsh", "fish"])
    def test_completion_output(self, shell, run_cli):
        code, out, err = run_cli("--completion", shell)
        assert code == 0
        assert len(out) > 100
        # 每个脚本里都应提到 backup-checker
        assert "backup-checker" in out

    def test_completion_does_not_run_check(self, run_cli, tmp_path: Path):
        # 即便给了备份目录，只要有 --completion 就不执行检查
        code, out, _ = run_cli("--completion", "bash", str(tmp_path))
        assert code == 0
        # 输出里不含"备份完整性检查报告"（说明没跑检查）
        assert "备份完整性检查报告" not in out


class TestEndToEnd:
    """验收级场景：dry-run、错误输入、JSON 输出。"""

    # ------------------------------------------------------------------
    # 场景 1：dry-run
    # ------------------------------------------------------------------

    def test_dry_run_success(self, run_cli, backup_dir: Path,
                             good_manifest_path: Path):
        code, out, err = run_cli(
            str(backup_dir),
            "--manifest", str(good_manifest_path),
            "--dry-run",
            "--hash", "sha256",
            "--retention", "365d",
        )
        assert code == 0
        # 有 dry-run 标识
        assert "dry-run" in out or "dry-run" in err or "dry" in (out + err).lower()
        assert "检查通过" in out or "退出码 0" in out or "通过" in out

    def test_dry_run_with_missing(self, run_cli, backup_dir: Path,
                                  bad_manifest_path: Path):
        # dry-run 仍会检测缺失文件与大小不一致
        code, out, err = run_cli(
            str(backup_dir),
            "--manifest", str(bad_manifest_path),
            "--dry-run",
            "--retention", "365d",
        )
        # 有问题 => 非零
        assert code != 0
        combined = out + err
        assert "ghost-file.bin" in combined or "缺失" in combined

    # ------------------------------------------------------------------
    # 场景 2：错误输入
    # ------------------------------------------------------------------

    def test_error_missing_manifest(self, run_cli, backup_dir: Path):
        code, out, err = run_cli(str(backup_dir))
        # 未提供 --manifest，保守策略拒绝执行 => 非零
        assert code == 1
        combined = out + err
        # 友好错误提示
        assert "参数错误" in combined or "缺少必填" in combined or "--manifest" in combined

    def test_error_malformed_manifest(self, run_cli, backup_dir: Path,
                                      malformed_manifest_path: Path):
        code, out, err = run_cli(
            str(backup_dir),
            "--manifest", str(malformed_manifest_path),
        )
        assert code == 1
        combined = out + err
        # JSON 解析错误应当被提示
        assert "解析 JSON" in combined or "JSON" in combined or "manifest" in combined.lower()

    def test_error_bad_retention(self, run_cli, backup_dir: Path,
                                 good_manifest_path: Path):
        code, out, err = run_cli(
            str(backup_dir),
            "--manifest", str(good_manifest_path),
            "--retention", "bad-value",
        )
        assert code == 1
        combined = out + err
        assert "retention" in combined.lower() or "保留周期" in combined

    def test_error_bad_hash_choice(self, run_cli, backup_dir: Path):
        # argparse 会先拦截 choices
        code, out, err = run_cli(
            str(backup_dir),
            "--manifest", "x.json",
            "--hash", "crc32",
        )
        assert code == 1
        combined = out + err
        assert "hash" in combined.lower() or "哈希" in combined

    def test_error_nonexistent_backup_dir(self, run_cli, tmp_path: Path,
                                          good_manifest_path: Path):
        code, out, err = run_cli(
            str(tmp_path / "definitely-not-here"),
            "--manifest", str(good_manifest_path),
        )
        assert code == 1
        assert "不存在" in (out + err) or "备份目录" in (out + err)

    def test_error_bad_notify(self, run_cli, backup_dir: Path,
                              good_manifest_path: Path):
        # --notify=file 但没给 --notify-target，程序仍可运行（仅写失败时回退）
        code, out, err = run_cli(
            str(backup_dir),
            "--manifest", str(good_manifest_path),
            "--notify", "file",
            # 注意：没有 --notify-target
            "--retention", "365d",
        )
        # 即使通知目标缺失，检查本身仍可完成
        # （Notifier 会打开文件失败，然后回退）
        assert code in (0, 1)  # 根据实现可能 0 或 1

    # ------------------------------------------------------------------
    # 场景 3：JSON 输出
    # ------------------------------------------------------------------

    def test_json_output_success(self, run_cli, backup_dir: Path,
                                 good_manifest_path: Path, tmp_path: Path):
        out_path = tmp_path / "report.json"
        code, stdout, stderr = run_cli(
            str(backup_dir),
            "--manifest", str(good_manifest_path),
            "--format", "json",
            "--output", str(out_path),
            "--retention", "365d",
        )
        assert code == 0
        assert out_path.exists()
        data = json.loads(out_path.read_text(encoding="utf-8"))
        assert data["summary"]["passed"] is True
        assert data["summary"]["total_files"] == 4
        assert data["summary"]["errors_count"] == 0
        # stdout 应不含 JSON 主体（已写入文件），但可能有 info 行
        assert "备份完整性检查报告" not in stdout or not stdout.strip() or "报告已写入" in stderr

    def test_json_output_stdout(self, run_cli, backup_dir: Path,
                                good_manifest_path: Path):
        code, stdout, _ = run_cli(
            str(backup_dir),
            "--manifest", str(good_manifest_path),
            "--format", "json",
            "--retention", "365d",
        )
        assert code == 0
        data = json.loads(stdout)
        assert data["summary"]["passed"] is True
        assert "tool" in data and "timing" in data

    def test_json_output_with_issues(self, run_cli, backup_dir: Path,
                                     bad_manifest_path: Path, tmp_path: Path):
        code, stdout, stderr = run_cli(
            str(backup_dir),
            "--manifest", str(bad_manifest_path),
            "--format", "json",
            "--retention", "365d",
            "--no-strict",  # no-strict，但 ERROR 仍会非零
        )
        # 有错误，退出码非零
        assert code != 0
        data = json.loads(stdout)
        assert data["summary"]["missing_files"] == 1
        assert data["summary"]["hash_mismatches"] == 1
        assert data["summary"]["size_mismatches"] == 1
        # issues 有不同类型
        types = {i["type"] for i in data["issues"]}
        assert "missing_file" in types
        assert "hash_mismatch" in types
        assert "size_mismatch" in types

    # ------------------------------------------------------------------
    # 其他验收
    # ------------------------------------------------------------------

    def test_quiet_mode_suppresses_output(self, run_cli, backup_dir: Path,
                                          good_manifest_path: Path):
        code, stdout, stderr = run_cli(
            str(backup_dir),
            "--manifest", str(good_manifest_path),
            "--quiet",
            "--retention", "365d",
        )
        assert code == 0
        # -q 时 stdout 应当为空（或几乎空）
        assert stdout.strip() == ""

    def test_expired_exit_code_4(self, run_cli, backup_dir: Path,
                                 expired_manifest_path: Path):
        # 仅过期，哈希等全部通过 => 退出码 4
        code, out, err = run_cli(
            str(backup_dir),
            "--manifest", str(expired_manifest_path),
            "--hash", "none",  # 跳过哈希，避免意外
        )
        assert code == 4
        assert "过期" in (out + err) or "expired" in (out + err).lower()

    def test_module_invocation(self, backup_dir: Path, good_manifest_path: Path):
        """验证 `python -m backup_checker` 也可用。"""
        r = subprocess.run(
            [sys.executable, "-m", "backup_checker",
             str(backup_dir),
             "--manifest", str(good_manifest_path),
             "--hash", "none",
             "--retention", "365d",
             "--quiet",
             ],
            capture_output=True, text=True,
            cwd=str(Path(__file__).resolve().parent.parent),
        )
        assert r.returncode == 0
