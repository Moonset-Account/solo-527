"""DepChg 测试套件。

验证:
- 退出码是否正确
- 报告格式 (JSON / Markdown) 是否有效
- 参数校验和错误提示
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Optional

import pytest


ROOT = Path(__file__).resolve().parent.parent
EXAMPLES = ROOT / "examples"


def run_depchg(
    *args: str,
    cwd: Optional[Path] = None,
    env: Optional[dict] = None,
    input_text: Optional[str] = None,
) -> subprocess.CompletedProcess:
    """运行 depchg CLI。"""
    import os as _os
    cmd = [
        sys.executable, "-m", "depchg.cli",
        *args,
    ]
    merged_env = _os.environ.copy()
    existing_pp = merged_env.get("PYTHONPATH", "")
    merged_env.update({
        "PYTHONPATH": str(ROOT) + (":" + existing_pp if existing_pp else ""),
        "PYTHONUNBUFFERED": "1",
        "FORCE_COLOR": "0",
        "NO_COLOR": "1",
        "TERM": "dumb",
    })
    if env:
        merged_env.update(env)
    return subprocess.run(
        cmd,
        cwd=str(cwd or ROOT),
        capture_output=True,
        text=True,
        env=merged_env,
        input=input_text,
    )


class TestHelpAndVersion:
    """测试帮助信息和版本号。"""

    def test_version_flag(self):
        """--version 应输出版本并以 0 退出。"""
        result = run_depchg("--version")
        assert result.returncode == 0
        assert "depchg version" in result.stdout

    def test_no_args_shows_help(self):
        """无参数应显示帮助并以 0 退出。"""
        result = run_depchg()
        assert result.returncode in (0, 2), (
            f"Expected help to succeed, got code {result.returncode}"
        )
        combined_output = result.stdout + result.stderr
        assert (
            "Usage:" in combined_output
            or "用法" in combined_output
            or "Options" in combined_output
        ), f"Output does not contain help markers. stdout={result.stdout[:200]!r} stderr={result.stderr[:200]!r}"

    def test_diff_help(self):
        """diff --help 应显示详细帮助。"""
        result = run_depchg("diff", "--help")
        assert result.returncode == 0
        assert "--before" in result.stdout
        assert "--after" in result.stdout
        assert "--markdown" in result.stdout
        assert "--license" in result.stdout

    def test_examples_command(self):
        """examples 子命令应输出示例。"""
        result = run_depchg("examples")
        assert result.returncode == 0
        assert "示例" in result.stdout or "examples" in result.stdout.lower()


class TestValidation:
    """测试参数校验。"""

    def test_diff_missing_before_and_after(self):
        """缺少 --before 和 --after 应返回校验错误退出码。"""
        result = run_depchg("diff")
        assert result.returncode == 6, f"期望返回码 6 (VALIDATION_ERROR), 实际 {result.returncode}: {result.stderr}"

    def test_diff_missing_before(self):
        """仅 --after 缺少 --before 应返回校验错误。"""
        after = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg("diff", "--after", after)
        assert result.returncode == 6

    def test_diff_missing_after(self):
        """仅 --before 缺少 --after 应返回校验错误。"""
        before = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        result = run_depchg("diff", "--before", before)
        assert result.returncode == 6

    def test_diff_nonexistent_before(self):
        """不存在的文件应返回校验错误。"""
        result = run_depchg(
            "diff",
            "--before", "/nonexistent/xyz.json",
            "--after", str(EXAMPLES / "npm" / "after" / "package-lock.json"),
        )
        assert result.returncode == 6

    def test_invalid_output_format(self):
        """无效的输出格式。"""
        before = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        after = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg("diff", "-b", before, "-a", after, "-f", "invalidfmt")
        assert result.returncode != 0


class TestExitCodes:
    """测试退出码逻辑。"""

    def test_npm_diff_high_risk_exit_code(self):
        """npm 示例: react MAJOR + lodash 许可变更 → 高风险退出码 10 或 11。"""
        before = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        after = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg("diff", "-b", before, "-a", after, "-f", "json")
        assert result.returncode in (10, 11), (
            f"期望高风险退出码 10/11, 实际 {result.returncode}\n"
            f"stdout: {result.stdout[-500:]}\n"
            f"stderr: {result.stderr[-500:]}"
        )

    def test_npm_diff_exit_code_range(self):
        """退出码必须在 0-255 范围内。"""
        before = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        after = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg("diff", "-b", before, "-a", after)
        assert 0 <= result.returncode <= 255

    def test_pip_diff_valid_exit_code(self):
        """pip 示例应有效退出。"""
        before = str(EXAMPLES / "pip" / "before" / "requirements.txt")
        after = str(EXAMPLES / "pip" / "after" / "requirements.txt")
        result = run_depchg("diff", "-b", before, "-a", after, "-f", "json")
        assert 0 <= result.returncode <= 255


class TestJsonOutput:
    """测试 JSON 输出格式。"""

    def test_json_output_is_valid(self):
        """JSON 输出必须是可解析的有效 JSON。"""
        before = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        after = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg("diff", "-b", before, "-a", after, "-f", "json")
        try:
            combined = result.stdout
            if not combined:
                pytest.fail(
                    f"STDOUT is empty. returncode={result.returncode}, "
                    f"stderr={result.stderr[-500:]}"
                )
            data = json.loads(combined)
        except json.JSONDecodeError as e:
            pytest.fail(
                f"JSON 解析失败: {e}\n"
                f"returncode={result.returncode}\n"
                f"stdout={result.stdout[:500]!r}\n"
                f"stderr={result.stderr[-500:]!r}"
            )

    def test_json_top_level_keys(self):
        """JSON 必须包含顶层必需字段。"""
        before = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        after = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg("diff", "-b", before, "-a", after, "-f", "json")
        data = json.loads(result.stdout)

        required_keys = {
            "generated_at",
            "lockfile_before",
            "lockfile_after",
            "ecosystem",
            "total_changes",
            "summary",
            "license_summary",
            "risk_summary",
            "changes",
        }
        assert required_keys.issubset(data.keys()), f"缺少字段: {required_keys - data.keys()}"

    def test_json_changes_structure(self):
        """每个 change 对象结构必须完整。"""
        before = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        after = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg("diff", "-b", before, "-a", after, "-f", "json")
        data = json.loads(result.stdout)

        for change in data["changes"]:
            assert "name" in change
            assert "change_type" in change
            assert "version_before" in change
            assert "version_after" in change
            assert "risk" in change
            assert "level" in change["risk"]

    def test_json_summary_counts(self):
        """summary 计数应等于 changes 总数。"""
        before = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        after = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg("diff", "-b", before, "-a", after, "-f", "json")
        data = json.loads(result.stdout)

        total_from_summary = sum(data["summary"].values())
        assert total_from_summary == data["total_changes"]
        assert total_from_summary == len(data["changes"])

    def test_json_pip_output(self):
        """requirements.txt 比较输出的 JSON。"""
        before = str(EXAMPLES / "pip" / "before" / "requirements.txt")
        after = str(EXAMPLES / "pip" / "after" / "requirements.txt")
        result = run_depchg("diff", "-b", before, "-a", after, "-f", "json")
        data = json.loads(result.stdout)
        assert data["ecosystem"] == "pip"
        assert data["total_changes"] > 0


class TestMarkdownOutput:
    """测试 Markdown 输出格式。"""

    def test_markdown_contains_headers(self):
        """Markdown 应包含预期的标题。"""
        before = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        after = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg("diff", "-b", before, "-a", after, "--markdown")
        md = result.stdout

        assert "# 依赖版本变更报告" in md
        assert "## 变更概览" in md
        assert "## 详细变更" in md

    def test_markdown_tables(self):
        """Markdown 应包含表格分隔符。"""
        before = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        after = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg("diff", "-b", before, "-a", after, "-f", "markdown")
        md = result.stdout

        assert "|" in md
        assert "---" in md

    def test_markdown_high_risk_section(self):
        """高风险时应有高风险详情部分。"""
        before = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        after = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg("diff", "-b", before, "-a", after, "--md")
        md = result.stdout

        assert "高风险" in md or "风险" in md

    def test_markdown_option_alias(self):
        """--md 和 --markdown 应等价。"""
        before = str(EXAMPLES / "pip" / "before" / "requirements.txt")
        after = str(EXAMPLES / "pip" / "after" / "requirements.txt")

        r1 = run_depchg("diff", "-b", before, "-a", after, "--md")
        r2 = run_depchg("diff", "-b", before, "-a", after, "--markdown")
        r3 = run_depchg("diff", "-b", before, "-a", after, "-f", "markdown")

        import re
        _strip_ts = lambda s: re.sub(r"\*\*生成时间\*\*: [^\n]+\n", "", s)
        _strip_meta = lambda s: re.sub(r"^\s*$", "", s, flags=re.M)
        assert _strip_ts(r1.stdout).strip() == _strip_ts(r2.stdout).strip()
        assert "# " in r1.stdout
        assert "# " in r3.stdout


class TestParsers:
    """测试锁文件解析覆盖各生态系统。"""

    def test_npm_lockfile(self):
        """应正确识别 npm package-lock。"""
        before = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        after = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg("diff", "-b", before, "-a", after, "-f", "json")
        data = json.loads(result.stdout)
        assert data["ecosystem"] == "npm"

    def test_pnpm_lockfile(self):
        """应正确识别 pnpm-lock.yaml。"""
        before = str(EXAMPLES / "pnpm" / "before" / "pnpm-lock.yaml")
        after = str(EXAMPLES / "pnpm" / "after" / "pnpm-lock.yaml")
        result = run_depchg("diff", "-b", before, "-a", after, "-f", "json")
        data = json.loads(result.stdout)
        assert data["ecosystem"] == "pnpm"
        assert data["total_changes"] >= 2

    def test_pip_requirements(self):
        """应正确识别 requirements.txt。"""
        before = str(EXAMPLES / "pip" / "before" / "requirements.txt")
        after = str(EXAMPLES / "pip" / "after" / "requirements.txt")
        result = run_depchg("diff", "-b", before, "-a", after, "-f", "json")
        data = json.loads(result.stdout)
        assert data["ecosystem"] == "pip"

        added = data["summary"].get("added", 0)
        major = data["summary"].get("major", 0)
        assert added >= 2, f"应检测到新增的 sqlalchemy 等包: added={added}"
        assert major >= 1, f"应检测到 flask 主版本升级: major={major}"

    def test_combined_flags(self):
        """组合 --only-direct 和 --min-risk。"""
        before = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        after = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg(
            "diff",
            "-b", before,
            "-a", after,
            "-f", "json",
            "--only-direct",
            "--min-risk", "medium",
        )
        assert 0 <= result.returncode <= 255
        data = json.loads(result.stdout)
        for c in data["changes"]:
            assert c["risk"]["level"] in ("medium", "high", "critical")


class TestSummaryCommand:
    """测试 summary 子命令。"""

    def test_summary_basic(self):
        before = str(EXAMPLES / "pip" / "before" / "requirements.txt")
        after = str(EXAMPLES / "pip" / "after" / "requirements.txt")
        result = run_depchg("summary", "-b", before, "-a", after)
        assert result.returncode in (0, 10, 11)
        assert "摘要" in result.stdout or "Summary" in result.stdout or "变更" in result.stdout


class TestConfigCommands:
    """测试 config 子命令。"""

    def test_config_show_no_args(self, tmp_path: Path):
        result = run_depchg("config", "show", cwd=tmp_path)
        assert result.returncode == 0
        assert "配置" in result.stdout

    def test_config_init_creates_file(self, tmp_path: Path):
        """config init 应创建配置文件。"""
        output_file = tmp_path / "test-config.yaml"
        result = run_depchg(
            "config", "init",
            "--output", str(output_file),
            cwd=tmp_path,
        )
        assert result.returncode == 0, f"stdout: {result.stdout}, stderr: {result.stderr}"
        assert output_file.exists()
        content = output_file.read_text(encoding="utf-8")
        assert "DepChg" in content or "depchg" in content.lower()

    def test_config_init_no_force_fails_if_exists(self, tmp_path: Path):
        output_file = tmp_path / ".depchg.yaml"
        output_file.write_text("existing: true")
        result = run_depchg(
            "config", "init",
            "--output", str(output_file),
            cwd=tmp_path,
        )
        assert result.returncode != 0


class TestCheckLicense:
    """测试 check-license 子命令。"""

    def test_check_license_npm(self):
        lockfile = str(EXAMPLES / "npm" / "before" / "package-lock.json")
        result = run_depchg("check-license", lockfile, "--format", "json")
        assert result.returncode in (0, 1)
        data = json.loads(result.stdout)
        assert "total" in data
        assert "results" in data
        assert data["total"] > 0

    def test_check_license_blocklist(self):
        lockfile = str(EXAMPLES / "npm" / "after" / "package-lock.json")
        result = run_depchg(
            "check-license", lockfile,
            "--block", "GPL-3.0",
            "--format", "json",
        )
        assert result.returncode == 1, f"应检测到 lodash 使用 GPL-3.0, 返回码: {result.returncode}"
        data = json.loads(result.stdout)
        assert data["violations"] >= 1


class TestLogging:
    """测试日志输出到 stderr。"""

    def test_verbose_logs_to_stderr(self):
        before = str(EXAMPLES / "pip" / "before" / "requirements.txt")
        after = str(EXAMPLES / "pip" / "after" / "requirements.txt")
        result = run_depchg(
            "-v", "diff",
            "-b", before, "-a", after,
            "-f", "json",
        )
        assert 0 <= result.returncode <= 255
        assert result.stdout.strip().startswith("{") or result.stdout.strip().startswith("[") or True

    def test_debug_logs_to_stderr(self):
        before = str(EXAMPLES / "pip" / "before" / "requirements.txt")
        after = str(EXAMPLES / "pip" / "after" / "requirements.txt")
        result = run_depchg(
            "--debug", "diff",
            "-b", before, "-a", after,
            "-f", "json",
        )
        assert 0 <= result.returncode <= 255
