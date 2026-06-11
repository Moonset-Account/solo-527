"""Command Line Interface for Backup Integrity Checker.

Subcommands:
  check     - Run full backup integrity checks (integrity, missing, expired)
  generate  - Generate a manifest file for a backup directory
  verify    - Verify file integrity only
  manifest  - Manifest file operations (validate, show, diff)
  config    - Configuration operations (show, validate)
  help      - Show help for a command
"""

from __future__ import annotations

import json
import sys
from typing import Any

import click

from . import __version__
from .config import SUPPORTED_HASH_ALGORITHMS, build_config
from .core import generate_manifest, parse_manifest, run_checks
from .exceptions import (
    BackupCheckerError,
    ConfigError,
    ExitCode,
    ManifestError,
)
from .logger import get_logger, log_with_context
from .notify import send_notifications
from .report import get_summary_dict, write_report


class CliContext:
    """Context object passed between CLI commands."""

    def __init__(self) -> None:
        self.verbose: bool = False
        self.json_output: bool = False
        self.dry_run: bool = False
        self.config_file: str | None = None
        self.logger = None

    def setup_logger(self) -> None:
        """Set up the logger based on context settings."""
        self.logger = get_logger(
            json_output=self.json_output,
            verbose=self.verbose,
        )


pass_ctx = click.make_pass_decorator(CliContext, ensure=True)


def _apply_config_to_ctx(ctx: CliContext) -> None:
    """Apply configuration file and environment variable settings to CliContext.

    Only applies values when CLI flags were not explicitly set (i.e. are False).
    """
    try:
        cli_args: dict[str, Any] = {}
        config = build_config(ctx.config_file, cli_args, ctx.logger)

        if not ctx.verbose:
            ctx.verbose = config.verbose
        if not ctx.json_output:
            ctx.json_output = config.json_output
        if not ctx.dry_run:
            ctx.dry_run = config.dry_run

        ctx.setup_logger()
    except ConfigError:
        pass


def _validate_hash_algorithm(ctx: click.Context, param: click.Parameter, value: str) -> str:
    """Validate the hash algorithm parameter."""
    if value and value not in SUPPORTED_HASH_ALGORITHMS:
        raise click.BadParameter(
            f"Unsupported hash algorithm: {value}. "
            f"Supported: {', '.join(sorted(SUPPORTED_HASH_ALGORITHMS))}"
        )
    return value


def _validate_positive_int(ctx: click.Context, param: click.Parameter, value: int) -> int:
    """Validate that an integer is positive."""
    if value is not None and value < 1:
        raise click.BadParameter(f"Value must be positive, got {value}")
    return value


_common_options = [
    click.option("--config", "-c", type=click.Path(exists=False, dir_okay=False), help="Configuration file path"),
    click.option("--verbose", "-v", is_flag=True, help="Enable verbose output"),
    click.option("--json", "-j", "json_output", is_flag=True, help="Output in JSON format (machine-readable)"),
    click.option("--dry-run", is_flag=True, help="Do not make any changes, just show what would happen"),
]


def common_options(func):
    """Decorator to apply common options to all commands."""
    for option in reversed(_common_options):
        func = option(func)
    return func


_check_options = [
    click.option("--manifest", "-m", "manifest_path", type=click.Path(exists=False, dir_okay=False), help="Manifest file path"),
    click.option("--backup-dir", "-b", type=click.Path(exists=False, file_okay=False), help="Backup directory root"),
    click.option("--hash", "-a", "hash_algorithm", callback=_validate_hash_algorithm, help="Hash algorithm to use"),
    click.option("--retention", "-r", "retention_days", type=int, callback=_validate_positive_int, help="Retention period in days"),
    click.option("--notify", is_flag=True, help="Enable notifications"),
    click.option("--output", "-o", "output_file", type=click.Path(dir_okay=False), help="Write report to file"),
    click.option("--no-integrity", is_flag=True, help="Skip integrity checks"),
    click.option("--no-missing", is_flag=True, help="Skip missing file detection"),
    click.option("--no-expired", is_flag=True, help="Skip expired backup detection"),
    click.option("--fail-on-expired", is_flag=True, help="Return non-zero exit code on expired backups"),
    click.option("--no-fail-on-missing", is_flag=True, help="Do not fail on missing files"),
    click.option("--no-fail-on-integrity", is_flag=True, help="Do not fail on integrity errors"),
]


def check_options(func):
    """Decorator to apply check-related options."""
    for option in reversed(_check_options):
        func = option(func)
    return func


@click.group(
    invoke_without_command=True,
    context_settings={"help_option_names": ["-h", "--help"], "auto_envvar_prefix": "BACKUP_CHECKER"},
)
@click.version_option(__version__, "-V", "--version")
@common_options
@pass_ctx
def main(ctx: CliContext, verbose: bool, json_output: bool, dry_run: bool, config: str | None) -> None:
    """Backup Integrity Checker - Verify backup integrity and detect issues."""
    ctx.verbose = verbose
    ctx.json_output = json_output
    ctx.dry_run = dry_run
    ctx.config_file = config
    ctx.setup_logger()

    _apply_config_to_ctx(ctx)

    if ctx.logger:
        log_with_context(
            ctx.logger,
            10,
            "Backup Integrity Checker started",
            version=__version__,
            verbose=ctx.verbose,
            json_output=ctx.json_output,
            dry_run=ctx.dry_run,
        )


def _run_check(
    ctx: CliContext,
    manifest_path: str | None,
    backup_dir: str | None,
    hash_algorithm: str | None,
    retention_days: int | None,
    notify: bool,
    output_file: str | None,
    no_integrity: bool,
    no_missing: bool,
    no_expired: bool,
    fail_on_expired: bool,
    no_fail_on_missing: bool,
    no_fail_on_integrity: bool,
) -> None:
    """Internal function to run backup integrity checks."""
    cli_args: dict[str, Any] = {}

    if manifest_path is not None:
        cli_args["manifest_path"] = manifest_path
    if backup_dir is not None:
        cli_args["backup_dir"] = backup_dir
    if hash_algorithm is not None:
        cli_args["hash_algorithm"] = hash_algorithm
    if retention_days is not None:
        cli_args["retention_days"] = retention_days
    if output_file is not None:
        cli_args["output_file"] = output_file

    if no_integrity:
        cli_args["check_integrity"] = False
    if no_missing:
        cli_args["check_missing"] = False
    if no_expired:
        cli_args["check_expired"] = False

    if fail_on_expired:
        cli_args["fail_on_expired"] = True
    if no_fail_on_missing:
        cli_args["fail_on_missing"] = False
    if no_fail_on_integrity:
        cli_args["fail_on_integrity"] = False

    if notify:
        cli_args["notification"] = {"enabled": True}

    try:
        config = build_config(ctx.config_file, cli_args, ctx.logger)
    except ConfigError as e:
        _handle_error(ctx, e)
        sys.exit(e.exit_code)
    except BackupCheckerError as e:
        _handle_error(ctx, e)
        sys.exit(e.exit_code)

    verbose_changed = not ctx.verbose and config.verbose
    json_changed = not ctx.json_output and config.json_output

    if not ctx.verbose:
        ctx.verbose = config.verbose
    if not ctx.json_output:
        ctx.json_output = config.json_output
    if not ctx.dry_run:
        ctx.dry_run = config.dry_run

    if verbose_changed or json_changed:
        ctx.setup_logger()

    if ctx.dry_run and ctx.logger:
        ctx.logger.info("Dry run mode - no changes will be made")

    try:
        report = run_checks(config, ctx.logger)
    except BackupCheckerError as e:
        _handle_error(ctx, e)
        sys.exit(e.exit_code)

    report.dry_run = ctx.dry_run

    if config.notification.enabled:
        try:
            notification_results = send_notifications(
                config.notification, report, dry_run=ctx.dry_run, logger=ctx.logger
            )
            report.notification_results = [r.to_dict() for r in notification_results]
            failed_notifications = [r for r in notification_results if not r.success]
            if failed_notifications:
                report.errors.append({
                    "type": "NotificationError",
                    "message": f"{len(failed_notifications)} notification(s) failed",
                    "details": [r.to_dict() for r in failed_notifications],
                })
                report.set_exit_code(config)
        except Exception as e:
            report.notification_results.append({
                "channel": "unknown",
                "success": False,
                "error": str(e),
            })
            report.errors.append({
                "type": "NotificationError",
                "message": str(e),
            })
            report.set_exit_code(config)

    if ctx.dry_run:
        report.exit_code = 0

    write_report(
        report,
        output_file=config.output_file,
        json_output=ctx.json_output,
        verbose=ctx.verbose,
    )

    if not ctx.json_output:
        _print_summary(report)

    sys.exit(report.exit_code)


@main.command()
@check_options
@pass_ctx
def check(
    ctx: CliContext,
    manifest_path: str | None,
    backup_dir: str | None,
    hash_algorithm: str | None,
    retention_days: int | None,
    notify: bool,
    output_file: str | None,
    no_integrity: bool,
    no_missing: bool,
    no_expired: bool,
    fail_on_expired: bool,
    no_fail_on_missing: bool,
    no_fail_on_integrity: bool,
) -> None:
    """Run all backup integrity checks.

    This is the primary command. It checks:
    - File integrity (hash verification)
    - Missing files
    - Expired backups (based on retention policy)

    Exit codes:
      0 - All checks passed
      3 - Integrity check failed (hash mismatch)
      4 - Missing files detected
      5 - Expired backups detected (with --fail-on-expired)
      6 - Manifest parse error
      7 - Configuration error
    """
    _run_check(
        ctx=ctx,
        manifest_path=manifest_path,
        backup_dir=backup_dir,
        hash_algorithm=hash_algorithm,
        retention_days=retention_days,
        notify=notify,
        output_file=output_file,
        no_integrity=no_integrity,
        no_missing=no_missing,
        no_expired=no_expired,
        fail_on_expired=fail_on_expired,
        no_fail_on_missing=no_fail_on_missing,
        no_fail_on_integrity=no_fail_on_integrity,
    )


@main.command()
@click.option("--backup-dir", "-b", required=True, type=click.Path(exists=True, file_okay=False), help="Backup directory to scan")
@click.option("--output", "-o", "output_path", required=True, type=click.Path(dir_okay=False), help="Manifest output file path")
@click.option("--hash", "-a", "hash_algorithm", default="sha256", callback=_validate_hash_algorithm, help="Hash algorithm to use")
@click.option("--include-hidden", is_flag=True, help="Include hidden files")
@pass_ctx
def generate(
    ctx: CliContext,
    backup_dir: str,
    output_path: str,
    hash_algorithm: str,
    include_hidden: bool,
) -> None:
    """Generate a manifest file for a backup directory.

    Scans the backup directory recursively and creates a manifest
    with file hashes, sizes, and timestamps.
    """
    try:
        manifest = generate_manifest(
            backup_dir=backup_dir,
            output_path=output_path,
            algorithm=hash_algorithm,
            include_hidden=include_hidden,
            dry_run=ctx.dry_run,
            logger=ctx.logger,
        )

        if ctx.json_output:
            output = json.dumps(manifest.to_dict(), indent=2, default=str)
            click.echo(output)
        else:
            click.echo("")
            click.echo("=" * 58)
            click.echo("  Manifest generated successfully")
            click.echo("=" * 58)
            click.echo(f"  Output:    {output_path}")
            click.echo(f"  Algorithm: {hash_algorithm}")
            click.echo(f"  Files:     {len(manifest.files)}")
            click.echo(f"  Dry run:   {ctx.dry_run}")
            click.echo("")

        sys.exit(ExitCode.SUCCESS)

    except BackupCheckerError as e:
        _handle_error(ctx, e)
        sys.exit(e.exit_code)


@main.command()
@check_options
@pass_ctx
def verify(
    ctx: CliContext,
    manifest_path: str | None,
    backup_dir: str | None,
    hash_algorithm: str | None,
    retention_days: int | None,
    notify: bool,
    output_file: str | None,
    no_integrity: bool,
    no_missing: bool,
    no_expired: bool,
    fail_on_expired: bool,
    no_fail_on_missing: bool,
    no_fail_on_integrity: bool,
) -> None:
    """Verify file integrity only (no missing/expired checks).

    This is a shortcut for: backup-checker check --no-missing --no-expired
    """
    _run_check(
        ctx=ctx,
        manifest_path=manifest_path,
        backup_dir=backup_dir,
        hash_algorithm=hash_algorithm,
        retention_days=retention_days,
        notify=notify,
        output_file=output_file,
        no_integrity=False,
        no_missing=True,
        no_expired=True,
        fail_on_expired=fail_on_expired,
        no_fail_on_missing=no_fail_on_missing,
        no_fail_on_integrity=no_fail_on_integrity,
    )


@main.group()
@pass_ctx
def manifest(ctx: CliContext) -> None:
    """Manifest file operations."""
    pass


@manifest.command("validate")
@click.option("--manifest", "-m", "manifest_path", required=True, type=click.Path(exists=True, dir_okay=False), help="Manifest file path")
@pass_ctx
def manifest_validate(ctx: CliContext, manifest_path: str) -> None:
    """Validate a manifest file format and schema."""
    try:
        manifest_obj = parse_manifest(manifest_path, ctx.logger)

        if ctx.json_output:
            result = {
                "valid": True,
                "path": manifest_path,
                "file_count": len(manifest_obj.files),
                "manifest": manifest_obj.to_dict(),
            }
            click.echo(json.dumps(result, indent=2, default=str))
        else:
            click.echo("")
            click.echo("=" * 58)
            click.echo("  MANIFEST VALIDATION")
            click.echo("=" * 58)
            click.echo(f"  Path:   {manifest_path}")
            click.echo("  Valid:  Yes")
            click.echo(f"  Files:  {len(manifest_obj.files)}")
            if manifest_obj.hash_algorithm:
                click.echo(f"  Algorithm: {manifest_obj.hash_algorithm}")
            if manifest_obj.backup_id:
                click.echo(f"  Backup ID: {manifest_obj.backup_id}")
            click.echo("")

        sys.exit(ExitCode.SUCCESS)

    except ManifestError as e:
        _handle_error(ctx, e)
        sys.exit(e.exit_code)


@manifest.command("show")
@click.option("--manifest", "-m", "manifest_path", required=True, type=click.Path(exists=True, dir_okay=False), help="Manifest file path")
@pass_ctx
def manifest_show(ctx: CliContext, manifest_path: str) -> None:
    """Show manifest contents in a readable format."""
    try:
        manifest_obj = parse_manifest(manifest_path, ctx.logger)

        if ctx.json_output:
            click.echo(json.dumps(manifest_obj.to_dict(), indent=2, default=str))
        else:
            click.echo("")
            click.echo("=" * 58)
            click.echo("  MANIFEST CONTENTS")
            click.echo("=" * 58)
            if manifest_obj.backup_id:
                click.echo(f"  Backup ID:   {manifest_obj.backup_id}")
            if manifest_obj.version:
                click.echo(f"  Version:     {manifest_obj.version}")
            if manifest_obj.created_at:
                click.echo(f"  Created:     {manifest_obj.created_at}")
            if manifest_obj.hash_algorithm:
                click.echo(f"  Algorithm:   {manifest_obj.hash_algorithm}")
            click.echo(f"  File count:  {len(manifest_obj.files)}")
            click.echo("")
            click.echo("  Files:")
            for entry in manifest_obj.files:
                click.echo(f"    - {entry.path}")
                click.echo(f"        hash: {entry.hash}")
                if entry.size is not None:
                    click.echo(f"        size: {entry.size} bytes")
                if entry.modified_at:
                    click.echo(f"        modified: {entry.modified_at}")
            click.echo("")

        sys.exit(ExitCode.SUCCESS)

    except ManifestError as e:
        _handle_error(ctx, e)
        sys.exit(e.exit_code)


@main.group()
@pass_ctx
def config(ctx: CliContext) -> None:
    """Configuration operations."""
    pass


@config.command("show")
@pass_ctx
def config_show(ctx: CliContext) -> None:
    """Show the effective configuration."""
    try:
        cfg = build_config(ctx.config_file, {}, ctx.logger)

        if ctx.json_output:
            click.echo(json.dumps(cfg.to_dict(), indent=2, default=str))
        else:
            click.echo("")
            click.echo("=" * 58)
            click.echo("  EFFECTIVE CONFIGURATION")
            click.echo("=" * 58)
            click.echo(f"  Manifest path:     {cfg.manifest_path}")
            click.echo(f"  Backup dir:        {cfg.backup_dir}")
            click.echo(f"  Hash algorithm:    {cfg.hash_algorithm}")
            click.echo(f"  Retention days:    {cfg.retention_days}")
            click.echo(f"  Dry run:           {cfg.dry_run}")
            click.echo(f"  JSON output:       {cfg.json_output}")
            click.echo(f"  Check integrity:   {cfg.check_integrity}")
            click.echo(f"  Check missing:     {cfg.check_missing}")
            click.echo(f"  Check expired:     {cfg.check_expired}")
            click.echo(f"  Fail on integrity: {cfg.fail_on_integrity}")
            click.echo(f"  Fail on missing:   {cfg.fail_on_missing}")
            click.echo(f"  Fail on expired:   {cfg.fail_on_expired}")
            if cfg.notification.enabled:
                click.echo("  Notification:      Enabled")
                click.echo(f"    Channels:        {', '.join(cfg.notification.channels) if cfg.notification.channels else 'default'}")
                if cfg.notification.webhook_url:
                    click.echo(f"    Webhook:         {cfg.notification.webhook_url}")
                if cfg.notification.email_from:
                    click.echo(f"    Email from:      {cfg.notification.email_from}")
                if cfg.notification.email_to:
                    click.echo(f"    Email to:        {', '.join(cfg.notification.email_to)}")
            else:
                click.echo("  Notification:      Disabled")
            click.echo("")

        sys.exit(ExitCode.SUCCESS)

    except ConfigError as e:
        _handle_error(ctx, e)
        sys.exit(e.exit_code)


@config.command("validate")
@pass_ctx
def config_validate(ctx: CliContext) -> None:
    """Validate the configuration."""
    try:
        cfg = build_config(ctx.config_file, {}, ctx.logger)
        if ctx.json_output:
            result = {"valid": True, "config": cfg.to_dict()}
            click.echo(json.dumps(result, indent=2, default=str))
        else:
            click.echo("")
            click.echo("=" * 58)
            click.echo("  CONFIGURATION VALIDATION")
            click.echo("=" * 58)
            click.echo("  Status:  VALID")
            click.echo("")
        sys.exit(ExitCode.SUCCESS)
    except ConfigError as e:
        _handle_error(ctx, e)
        sys.exit(e.exit_code)


def _handle_error(ctx: CliContext, error: BackupCheckerError) -> None:
    """Handle a backup checker error for output."""
    if ctx.logger:
        ctx.logger.error(str(error), extra=error.details)

    if ctx.json_output:
        error_json = json.dumps(error.to_dict(), indent=2, default=str)
        click.echo(error_json)
    else:
        click.echo("")
        click.echo("=" * 58)
        click.echo(f"  ERROR: {type(error).__name__}")
        click.echo("=" * 58)
        click.echo(f"  Message:  {error.message}")
        click.echo(f"  Exit code: {error.exit_code}")
        if error.details:
            click.echo("  Details:")
            for key, value in error.details.items():
                click.echo(f"    {key}: {value}")
        click.echo("")


def _print_summary(report) -> None:
    """Print a concise summary to stderr for CI pipelines."""
    summary = get_summary_dict(report)
    line = (
        f"SUMMARY: total={summary['total']} passed={summary['passed']} "
        f"failed={summary['failed']} missing={summary['missing']} "
        f"expired={summary['expired']} skipped={summary['skipped']} "
        f"exit_code={summary['exit_code']}"
    )
    click.echo(line, err=True)


if __name__ == "__main__":
    main()
