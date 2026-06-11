"""Notification module for backup integrity checker.

Supports multiple notification channels:
- Webhook (HTTP POST with JSON payload)
- Email (SMTP)
- Stdout (for testing/dry-run)
"""

from __future__ import annotations

import json
import logging
import smtplib
import ssl
import urllib.parse
import urllib.request
from dataclasses import dataclass
from email.message import EmailMessage
from typing import Any

from .config import NotificationConfig
from .core import CheckReport


@dataclass
class NotificationResult:
    """Result of a notification attempt."""

    channel: str
    success: bool
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "channel": self.channel,
            "success": self.success,
            "error": self.error,
        }


def _should_notify(config: NotificationConfig, report: CheckReport) -> bool:
    """Determine if a notification should be sent based on configuration."""
    if not config.enabled:
        return False

    notify_on = set(config.notify_on)
    if not notify_on:
        notify_on = {"failure", "error"}

    if "always" in notify_on:
        return True

    if "error" in notify_on and report.errors:
        return True

    if "failure" in notify_on and report.exit_code != 0:
        return True

    if "success" in notify_on and report.exit_code == 0 and not report.errors:
        return True

    if "expired" in notify_on and report.summary.expired > 0:
        return True

    if "missing" in notify_on and report.summary.missing > 0:
        return True

    return bool("integrity" in notify_on and report.summary.integrity_errors > 0)


def _build_payload(report: CheckReport) -> dict[str, Any]:
    """Build the notification payload."""
    summary = report.summary
    status = "SUCCESS" if report.exit_code == 0 and not report.errors else "FAILURE"

    payload = {
        "status": status,
        "exit_code": report.exit_code,
        "summary": {
            "total": summary.total,
            "passed": summary.passed,
            "failed": summary.failed,
            "missing": summary.missing,
            "expired": summary.expired,
            "skipped": summary.skipped,
            "integrity_errors": summary.integrity_errors,
        },
        "started_at": report.started_at,
        "completed_at": report.completed_at,
        "duration_seconds": report.duration_seconds,
        "errors": report.errors,
        "missing_files": report.missing_files,
        "expired_backups": report.expired_backups,
    }

    if report.manifest:
        payload["backup_id"] = report.manifest.backup_id
        payload["backup_description"] = report.manifest.description

    return payload


def _send_webhook(
    webhook_url: str,
    payload: dict[str, Any],
    timeout: int = 30,
    dry_run: bool = False,
    logger: logging.Logger | None = None,
) -> NotificationResult:
    """Send a webhook notification."""
    if dry_run:
        if logger:
            logger.info(f"[DRY-RUN] Would send webhook to {webhook_url}")
        return NotificationResult(channel="webhook", success=True)

    try:
        data = json.dumps(payload, default=str).encode("utf-8")
        req = urllib.request.Request(
            webhook_url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "backup-integrity-checker/1.0",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=timeout) as response:
            status = response.getcode()
            if 200 <= status < 300:
                if logger:
                    logger.info(f"Webhook sent successfully to {webhook_url}")
                return NotificationResult(channel="webhook", success=True)
            else:
                error_msg = f"Webhook returned status {status}"
                if logger:
                    logger.error(error_msg)
                return NotificationResult(channel="webhook", success=False, error=error_msg)

    except urllib.error.URLError as e:
        error_msg = f"Webhook URL error: {e.reason}"
        if logger:
            logger.error(error_msg)
        return NotificationResult(channel="webhook", success=False, error=error_msg)
    except Exception as e:
        error_msg = f"Webhook failed: {e}"
        if logger:
            logger.error(error_msg)
        return NotificationResult(channel="webhook", success=False, error=error_msg)


def _send_email(
    config: NotificationConfig,
    payload: dict[str, Any],
    dry_run: bool = False,
    logger: logging.Logger | None = None,
) -> NotificationResult:
    """Send an email notification via SMTP."""
    if dry_run:
        if logger:
            logger.info(f"[DRY-RUN] Would send email to {config.email_to}")
        return NotificationResult(channel="email", success=True)

    if not config.email_to:
        return NotificationResult(
            channel="email",
            success=False,
            error="No recipient email addresses configured",
        )

    if not config.email_from:
        return NotificationResult(
            channel="email",
            success=False,
            error="No sender email address configured",
        )

    if not config.smtp_host:
        return NotificationResult(
            channel="email",
            success=False,
            error="No SMTP host configured",
        )

    try:
        summary = payload["summary"]
        status = payload["status"]
        subject = f"[Backup Checker] {status}: {summary['passed']}/{summary['total']} passed"

        body_lines = [
            "Backup Integrity Check Report",
            "=" * 40,
            "",
            f"Status:     {status}",
            f"Exit Code:  {payload['exit_code']}",
            f"Started:    {payload['started_at']}",
            f"Completed:  {payload['completed_at']}",
            f"Duration:   {payload['duration_seconds']:.2f}s",
            "",
            "Summary:",
            f"  Total:      {summary['total']}",
            f"  Passed:     {summary['passed']}",
            f"  Failed:     {summary['failed']}",
            f"  Missing:    {summary['missing']}",
            f"  Expired:    {summary['expired']}",
            f"  Skipped:    {summary['skipped']}",
        ]

        if payload.get("missing_files"):
            body_lines.extend(["", "Missing Files:", "  " + ", ".join(f["path"] for f in payload["missing_files"])])

        if payload.get("expired_backups"):
            body_lines.extend(["", "Expired Backups:", "  " + ", ".join(e["source"] for e in payload["expired_backups"])])

        if payload.get("errors"):
            body_lines.extend(["", "Errors:"])
            for error in payload["errors"]:
                body_lines.append(f"  [{error.get('type', 'Unknown')}] {error.get('message', 'No message')}")

        body = "\n".join(body_lines)

        msg = EmailMessage()
        msg.set_content(body)
        msg["Subject"] = subject
        msg["From"] = config.email_from
        msg["To"] = ", ".join(config.email_to)

        if logger:
            logger.debug(f"Connecting to SMTP server {config.smtp_host}:{config.smtp_port}")

        context = ssl.create_default_context() if config.smtp_use_tls else None

        if config.smtp_use_tls:
            with smtplib.SMTP(config.smtp_host, config.smtp_port, timeout=30) as server:
                server.starttls(context=context)
                if config.smtp_username and config.smtp_password:
                    server.login(config.smtp_username, config.smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(config.smtp_host, config.smtp_port, timeout=30) as server:
                if config.smtp_username and config.smtp_password:
                    server.login(config.smtp_username, config.smtp_password)
                server.send_message(msg)

        if logger:
            logger.info(f"Email sent successfully to {config.email_to}")
        return NotificationResult(channel="email", success=True)

    except Exception as e:
        error_msg = f"Email notification failed: {e}"
        if logger:
            logger.error(error_msg)
        return NotificationResult(channel="email", success=False, error=error_msg)


def send_notifications(
    config: NotificationConfig,
    report: CheckReport,
    dry_run: bool = False,
    logger: logging.Logger | None = None,
) -> list[NotificationResult]:
    """Send notifications based on configuration.

    Args:
        config: Notification configuration
        report: CheckReport to notify about
        dry_run: If True, don't actually send notifications
        logger: Optional logger instance

    Returns:
        List of NotificationResult objects
    """
    results: list[NotificationResult] = []

    if not _should_notify(config, report):
        if logger:
            logger.debug("No notification needed based on configuration")
        return results

    payload = _build_payload(report)
    channels = set(config.channels) if config.channels else {"webhook", "email"}

    if "webhook" in channels and config.webhook_url:
        result = _send_webhook(config.webhook_url, payload, dry_run=dry_run, logger=logger)
        results.append(result)

    if "email" in channels:
        result = _send_email(config, payload, dry_run=dry_run, logger=logger)
        results.append(result)

    if "stdout" in channels:
        print(json.dumps(payload, indent=2, default=str))
        results.append(NotificationResult(channel="stdout", success=True))

    return results
