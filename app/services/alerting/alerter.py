from __future__ import annotations

import enum
import uuid
import json
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.core.database import get_sync_session
from app.models.task import (
    AlertEvent,
    AlertSeverity,
    AlertType,
    Task,
    TaskStatus,
)
from app.models.dataset import ErrorSample, ErrorSeverity
from app.models.ml import ModelMetric, MetricType
from app.config import settings

logger = logging.getLogger(__name__)


class AlertChannel(str, enum.Enum):
    WEBHOOK = "webhook"
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"


@dataclass
class AlertPolicy:
    name: str
    metric_name: str
    threshold: float
    window_minutes: int
    severity: AlertSeverity
    channels: List[AlertChannel]
    comparison: str = "gt"
    min_interval_minutes: int = 30
    alert_type: AlertType = AlertType.SYSTEM_ERROR
    description: str = ""
    params: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AlertNotificationPayload:
    alert_id: int
    title: str
    message: str
    severity: AlertSeverity
    url: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class MetricsTracker:
    @staticmethod
    def query_metrics(
        db: Session,
        metric_name: str,
        from_time: datetime,
        to_time: datetime,
        params: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        params = params or {}

        if metric_name == "task_failed_rate":
            total = (
                db.query(func.count(Task.id))
                .filter(
                    and_(
                        Task.created_at >= from_time,
                        Task.created_at <= to_time,
                    )
                )
                .scalar()
                or 0
            )
            failed = (
                db.query(func.count(Task.id))
                .filter(
                    and_(
                        Task.created_at >= from_time,
                        Task.created_at <= to_time,
                        Task.status == TaskStatus.FAILED,
                    )
                )
                .scalar()
                or 0
            )
            rate = failed / total if total > 0 else 0.0
            return [{"value": rate, "total": total, "failed": failed}]

        elif metric_name == "latency_p95":
            task_type = params.get("task_type")
            query = db.query(Task.total_time_ms).filter(
                and_(
                    Task.completed_at >= from_time,
                    Task.completed_at <= to_time,
                    Task.total_time_ms.isnot(None),
                )
            )
            if task_type and task_type != "all":
                from app.models.task import TaskType as TT
                query = query.filter(Task.task_type == TT(task_type))
            latencies = [r[0] for r in query.all()]
            if not latencies:
                return [{"value": 0.0, "count": 0}]
            latencies.sort()
            idx = int(len(latencies) * 0.95)
            p95_ms = latencies[min(idx, len(latencies) - 1)]
            return [{"value": p95_ms / 1000.0, "count": len(latencies)}]

        elif metric_name == "critical_error_count":
            severity_filter = params.get("severity_filter", "critical,major")
            severities = [ErrorSeverity(s) for s in severity_filter.split(",") if s]
            count = (
                db.query(func.count(ErrorSample.id))
                .filter(
                    and_(
                        ErrorSample.created_at >= from_time,
                        ErrorSample.created_at <= to_time,
                        ErrorSample.severity.in_(severities),
                    )
                )
                .scalar()
                or 0
            )
            return [{"value": float(count), "count": count}]

        elif metric_name == "model_metric_drop":
            model_id = params.get("model_id")
            metric = params.get("metric", "f1")
            window_days = params.get("window_days", 7)
            now = to_time
            current_start = now - timedelta(days=window_days)
            prev_start = now - timedelta(days=window_days * 2)
            prev_end = now - timedelta(days=window_days)

            def avg_in_range(start: datetime, end: datetime) -> Optional[float]:
                q = (
                    db.query(func.avg(ModelMetric.metric_value))
                    .filter(
                        and_(
                            ModelMetric.model_id == model_id,
                            ModelMetric.metric_type == MetricType(metric.upper()),
                            ModelMetric.created_at >= start,
                            ModelMetric.created_at <= end,
                        )
                    )
                )
                return q.scalar()

            current_avg = avg_in_range(current_start, now)
            prev_avg = avg_in_range(prev_start, prev_end)

            if current_avg is None or prev_avg is None:
                return [{"value": 0.0, "current": current_avg, "previous": prev_avg}]

            drop = prev_avg - current_avg
            return [
                {
                    "value": drop,
                    "current": current_avg,
                    "previous": prev_avg,
                }
            ]

        elif metric_name == "pending_review_tasks":
            count = (
                db.query(func.count(Task.id))
                .filter(
                    and_(
                        Task.created_at >= from_time,
                        Task.created_at <= to_time,
                        Task.assignee_id.isnot(None),
                        Task.status == TaskStatus.PENDING,
                    )
                )
                .scalar()
                or 0
            )
            return [{"value": float(count), "count": count}]

        return []


class WebhookNotifier:
    @staticmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
    )
    async def send_generic_json(webhook_url: str, payload: Dict[str, Any]) -> bool:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(webhook_url, json=payload)
                resp.raise_for_status()
                return True
        except Exception as e:
            logger.exception(f"Failed to send webhook to {webhook_url}: {e}")
            raise

    @staticmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
    )
    async def send_dingtalk(webhook_url: str, payload: AlertNotificationPayload) -> bool:
        severity_emoji = {
            AlertSeverity.INFO: "ℹ️",
            AlertSeverity.WARNING: "⚠️",
            AlertSeverity.ERROR: "❌",
            AlertSeverity.CRITICAL: "🚨",
        }.get(payload.severity, "📢")

        md_text = (
            f"{severity_emoji} **[{payload.severity.value.upper()}] {payload.title}**\n\n"
            f"**告警ID**: #{payload.alert_id}\n"
            f"**告警级别**: {payload.severity.value}\n\n"
            f"**详情**:\n{payload.message}\n\n"
        )
        if payload.url:
            md_text += f"\n[查看详情]({payload.url})"

        dingtalk_payload = {
            "msgtype": "markdown",
            "markdown": {
                "title": f"[{payload.severity.value}] {payload.title}",
                "text": md_text,
            },
            "at": {"isAtAll": payload.severity in (AlertSeverity.CRITICAL, AlertSeverity.ERROR)},
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(webhook_url, json=dingtalk_payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("errcode", 1) == 0
        except Exception as e:
            logger.exception(f"Failed to send DingTalk: {e}")
            raise

    @staticmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
    )
    async def send_feishu(webhook_url: str, payload: AlertNotificationPayload) -> bool:
        color = {
            AlertSeverity.INFO: "blue",
            AlertSeverity.WARNING: "orange",
            AlertSeverity.ERROR: "red",
            AlertSeverity.CRITICAL: "red",
        }.get(payload.severity, "grey")

        content = [
            [{"tag": "text", "text": f"告警ID: #{payload.alert_id}"}],
            [{"tag": "text", "text": f"告警级别: {payload.severity.value}"}],
            [{"tag": "text", "text": f"详情: {payload.message}"}],
        ]
        if payload.url:
            content.append(
                [{"tag": "a", "text": "查看详情", "href": payload.url}]
            )

        feishu_payload = {
            "msg_type": "post",
            "content": {
                "post": {
                    "zh_cn": {
                        "title": f"[{payload.severity.value}] {payload.title}",
                        "content": content,
                    }
                }
            },
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(webhook_url, json=feishu_payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("code", 1) == 0 or data.get("StatusCode", 1) == 0
        except Exception as e:
            logger.exception(f"Failed to send Feishu: {e}")
            raise

    @staticmethod
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
    )
    async def send_wecom(webhook_url: str, payload: AlertNotificationPayload) -> bool:
        md_text = (
            f"> **[{payload.severity.value.upper()}] {payload.title}**\n"
            f"> 告警ID: #{payload.alert_id}\n"
            f"> 告警级别: {payload.severity.value}\n\n"
            f"**详情**:\n{payload.message}\n"
        )
        if payload.url:
            md_text += f"\n[查看详情]({payload.url})"

        wecom_payload = {
            "msgtype": "markdown",
            "markdown": {"content": md_text},
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(webhook_url, json=wecom_payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("errcode", 1) == 0
        except Exception as e:
            logger.exception(f"Failed to send WeCom: {e}")
            raise

    @staticmethod
    def detect_webhook_type(url: str) -> str:
        if "dingtalk.com" in url or "oapi.dingtalk.com" in url:
            return "dingtalk"
        if "feishu.cn" in url or "larksuite.com" in url or "open.feishu.cn" in url:
            return "feishu"
        if "qyapi.weixin.qq.com" in url:
            return "wecom"
        return "generic"


class EmailNotifier:
    @staticmethod
    async def send(email_config: Dict[str, Any], payload: AlertNotificationPayload) -> bool:
        logger.info(f"[Mock Email] Send to {email_config.get('to')}: [{payload.severity}] {payload.title}")
        return True


class AlertManager:
    def __init__(
        self,
        db: Optional[Session] = None,
        webhook_url: Optional[str] = None,
        email_config: Optional[Dict[str, Any]] = None,
    ):
        self._own_db = db is None
        self.db: Session = db or get_sync_session()
        self.webhook_url: Optional[str] = webhook_url or settings.ALERT_WEBHOOK_URL
        self.email_config: Optional[Dict[str, Any]] = email_config
        self._policies: List[AlertPolicy] = []
        self._last_triggered: Dict[str, datetime] = {}

    def __del__(self):
        try:
            if self._own_db and hasattr(self, "db"):
                self.db.close()
        except Exception:
            pass

    def register_policy(self, policy: AlertPolicy) -> None:
        for i, existing in enumerate(self._policies):
            if existing.name == policy.name:
                self._policies[i] = policy
                return
        self._policies.append(policy)
        logger.info(f"Registered alert policy: {policy.name}")

    def _check_threshold(self, value: float, threshold: float, comparison: str) -> bool:
        cmp_map = {
            "gt": lambda a, b: a > b,
            "gte": lambda a, b: a >= b,
            "lt": lambda a, b: a < b,
            "lte": lambda a, b: a <= b,
            "eq": lambda a, b: a == b,
            "ne": lambda a, b: a != b,
        }
        fn = cmp_map.get(comparison, cmp_map["gt"])
        return fn(value, threshold)

    def check_and_trigger(
        self,
        from_time: Optional[datetime] = None,
        to_time: Optional[datetime] = None,
    ) -> List[AlertEvent]:
        to_time = to_time or datetime.utcnow()
        triggered_events: List[AlertEvent] = []

        for policy in self._policies:
            try:
                from_time_policy = (
                    from_time or to_time - timedelta(minutes=policy.window_minutes)
                )
                metrics = MetricsTracker.query_metrics(
                    self.db,
                    policy.metric_name,
                    from_time_policy,
                    to_time,
                    policy.params,
                )

                if not metrics:
                    continue

                latest = metrics[-1]
                value = latest.get("value", 0.0)

                if not self._check_threshold(value, policy.threshold, policy.comparison):
                    continue

                last_key = policy.name
                last_triggered = self._last_triggered.get(last_key)
                if last_triggered and (to_time - last_triggered).total_seconds() < policy.min_interval_minutes * 60:
                    continue

                title, message = self._build_message(policy, value, latest)
                event = self._create_alert_event(
                    alert_type=policy.alert_type,
                    severity=policy.severity,
                    title=title,
                    message=message,
                    metrics_snapshot={
                        "policy": policy.name,
                        "value": value,
                        "threshold": policy.threshold,
                        "comparison": policy.comparison,
                        "window_minutes": policy.window_minutes,
                        **latest,
                    },
                )

                self._last_triggered[last_key] = to_time
                self.dispatch_notifications(event)
                triggered_events.append(event)

            except Exception as e:
                logger.exception(f"Error checking policy {policy.name}: {e}")

        return triggered_events

    def _build_message(
        self, policy: AlertPolicy, value: float, latest: Dict[str, Any]
    ) -> Tuple[str, str]:
        mapping = {
            "task_failed_rate": (
                "任务失败率过高告警",
                f"最近{policy.window_minutes}分钟任务失败率为 {value:.2%}, 超过阈值 {policy.threshold:.2%}。共执行 {latest.get('total', 0)} 个任务，失败 {latest.get('failed', 0)} 个。",
            ),
            "latency_p95": (
                "接口延迟过高告警",
                f"最近{policy.window_minutes}分钟P95延迟为 {value:.2f}秒, 超过阈值 {policy.threshold:.2f}秒。共统计 {latest.get('count', 0)} 个任务。",
            ),
            "critical_error_count": (
                "严重错误样本过多告警",
                f"最近{policy.window_minutes}分钟新增严重错误样本 {int(value)} 个, 超过阈值 {int(policy.threshold)} 个。",
            ),
            "model_metric_drop": (
                "模型指标下滑告警",
                f"模型指标 {policy.params.get('metric', 'f1')} 较上周下滑 {value:.4f}, 超过阈值 {policy.threshold:.4f}。当前: {latest.get('current'):.4f}, 上周: {latest.get('previous'):.4f}。",
            ),
            "pending_review_tasks": (
                "待审核任务堆积告警",
                f"目前待审核任务有 {int(value)} 个, 超过阈值 {int(policy.threshold)} 个。",
            ),
        }
        if policy.metric_name in mapping:
            return mapping[policy.metric_name]
        return (
            f"指标告警: {policy.name}",
            f"指标 {policy.metric_name}={value:.4f} {policy.comparison} {policy.threshold:.4f}",
        )

    def _create_alert_event(
        self,
        alert_type: AlertType,
        severity: AlertSeverity,
        title: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
        metrics_snapshot: Optional[Dict[str, Any]] = None,
    ) -> AlertEvent:
        event = AlertEvent(
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
            extra_metadata=metadata or {},
            metrics_snapshot=metrics_snapshot or {},
            channels_notified=[],
            status="active",
            acknowledged=False,
        )
        self.db.add(event)
        self.db.flush()
        self.db.commit()
        self.db.refresh(event)
        logger.warning(f"Created alert #{event.id}: [{severity.value}] {title}")
        return event

    def dispatch_notifications(self, event: AlertEvent) -> List[str]:
        notified: List[str] = []
        payload = AlertNotificationPayload(
            alert_id=event.id,
            title=event.title,
            message=event.message,
            severity=event.severity,
            url=None,
            metadata=event.extra_metadata or {},
        )

        import asyncio

        async def _dispatch():
            results = []
            if self.webhook_url:
                wh_type = WebhookNotifier.detect_webhook_type(self.webhook_url)
                try:
                    ok = False
                    if wh_type == "dingtalk":
                        ok = await WebhookNotifier.send_dingtalk(self.webhook_url, payload)
                    elif wh_type == "feishu":
                        ok = await WebhookNotifier.send_feishu(self.webhook_url, payload)
                    elif wh_type == "wecom":
                        ok = await WebhookNotifier.send_wecom(self.webhook_url, payload)
                    else:
                        ok = await WebhookNotifier.send_generic_json(
                            self.webhook_url,
                            {
                                "alert_id": payload.alert_id,
                                "title": payload.title,
                                "message": payload.message,
                                "severity": payload.severity.value,
                                "metadata": payload.metadata,
                            },
                        )
                    if ok:
                        results.append(f"webhook:{wh_type}")
                except Exception as e:
                    logger.exception(f"Webhook dispatch failed: {e}")

            if self.email_config:
                try:
                    ok = await EmailNotifier.send(self.email_config, payload)
                    if ok:
                        results.append("email")
                except Exception as e:
                    logger.exception(f"Email dispatch failed: {e}")

            results.append("in_app")
            return results

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import threading

                t = threading.Thread(
                    target=lambda: asyncio.run(self._async_dispatch_wrapper(payload))
                )
                t.start()
                t.join(timeout=15)
                notified = ["webhook", "in_app"]
            else:
                notified = loop.run_until_complete(_dispatch())
        except RuntimeError:
            notified = asyncio.run(_dispatch())
        except Exception as e:
            logger.exception(f"Dispatch failed: {e}")
            notified = ["in_app"]

        existing = event.channels_notified or []
        event.channels_notified = list(set(existing + notified))
        self.db.commit()
        return notified

    async def _async_dispatch_wrapper(self, payload):
        pass

    def acknowledge_alert(self, alert_id: int, user_id: int, ack_note: str = "") -> Optional[AlertEvent]:
        event = self.db.query(AlertEvent).filter(AlertEvent.id == alert_id).first()
        if not event:
            return None
        event.acknowledged = True
        event.acknowledged_by_id = user_id
        event.acknowledged_at = datetime.utcnow()
        event.ack_note = ack_note
        self.db.commit()
        self.db.refresh(event)
        logger.info(f"Alert #{alert_id} acknowledged by user #{user_id}")
        return event

    def resolve_alert(
        self,
        alert_id: int,
        resolver_id: int,
        resolution_note: str = "",
    ) -> Optional[AlertEvent]:
        event = self.db.query(AlertEvent).filter(AlertEvent.id == alert_id).first()
        if not event:
            return None
        event.status = "resolved"
        event.resolved_by_id = resolver_id
        event.resolved_at = datetime.utcnow()
        event.resolution_note = resolution_note
        self.db.commit()
        self.db.refresh(event)
        logger.info(f"Alert #{alert_id} resolved by user #{resolver_id}")
        return event

    def synthetic_check_tasks_health(self, window_hours: int = 1) -> List[AlertEvent]:
        to_time = datetime.utcnow()
        from_time = to_time - timedelta(hours=window_hours)
        results = self.check_and_trigger(from_time, to_time)
        for p in self._policies:
            if p.metric_name == "task_failed_rate" and p not in results:
                pass
        return results

    def synthetic_check_model_degradation(
        self,
        model_id: int,
        metric: str = "f1",
        window_days: int = 7,
        drop_threshold: float = 0.1,
    ) -> List[AlertEvent]:
        policy = AlertPolicy(
            name=f"model_degradation_m{model_id}_{metric}",
            metric_name="model_metric_drop",
            threshold=drop_threshold,
            window_minutes=window_days * 24 * 60,
            severity=AlertSeverity.CRITICAL,
            channels=[AlertChannel.WEBHOOK, AlertChannel.IN_APP],
            comparison="gt",
            min_interval_minutes=60 * 24,
            alert_type=AlertType.MODEL_DEGRADATION,
            params={"model_id": model_id, "metric": metric, "window_days": window_days},
        )
        self.register_policy(policy)
        return self.check_and_trigger()

    def synthetic_check_latency(
        self,
        task_type: str = "all",
        p95_threshold_s: float = 30.0,
        window_minutes: int = 5,
    ) -> List[AlertEvent]:
        policy = AlertPolicy(
            name=f"high_latency_{task_type}",
            metric_name="latency_p95",
            threshold=p95_threshold_s,
            window_minutes=window_minutes,
            severity=AlertSeverity.WARNING,
            channels=[AlertChannel.WEBHOOK, AlertChannel.IN_APP],
            comparison="gt",
            min_interval_minutes=30,
            alert_type=AlertType.HIGH_LATENCY,
            params={"task_type": task_type},
        )
        self.register_policy(policy)
        return self.check_and_trigger()

    def synthetic_check_error_samples(
        self,
        severity_filter: str = "critical,major",
        window_hours: int = 24,
        count_threshold: int = 5,
    ) -> List[AlertEvent]:
        policy = AlertPolicy(
            name=f"error_samples_{severity_filter.replace(',', '_')}",
            metric_name="critical_error_count",
            threshold=float(count_threshold),
            window_minutes=window_hours * 60,
            severity=AlertSeverity.WARNING,
            channels=[AlertChannel.WEBHOOK, AlertChannel.IN_APP],
            comparison="gt",
            min_interval_minutes=60,
            alert_type=AlertType.NEW_ERROR_SAMPLE,
            params={"severity_filter": severity_filter},
        )
        self.register_policy(policy)
        return self.check_and_trigger()


DEFAULT_POLICIES: List[AlertPolicy] = [
    AlertPolicy(
        name="task_failed_rate_gt_10pct",
        metric_name="task_failed_rate",
        threshold=0.10,
        window_minutes=15,
        severity=AlertSeverity.ERROR,
        channels=[AlertChannel.WEBHOOK, AlertChannel.IN_APP],
        comparison="gt",
        min_interval_minutes=30,
        alert_type=AlertType.HIGH_ERROR_RATE,
        description="15分钟窗口任务失败率超过10%",
    ),
    AlertPolicy(
        name="latency_p95_gt_30s",
        metric_name="latency_p95",
        threshold=30.0,
        window_minutes=5,
        severity=AlertSeverity.WARNING,
        channels=[AlertChannel.WEBHOOK, AlertChannel.IN_APP],
        comparison="gt",
        min_interval_minutes=30,
        alert_type=AlertType.HIGH_LATENCY,
        description="5分钟窗口P95延迟超过30秒",
        params={"task_type": "all"},
    ),
    AlertPolicy(
        name="model_f1_drop_gt_0p1",
        metric_name="model_metric_drop",
        threshold=0.1,
        window_minutes=1440,
        severity=AlertSeverity.CRITICAL,
        channels=[AlertChannel.WEBHOOK, AlertChannel.IN_APP, AlertChannel.EMAIL],
        comparison="gt",
        min_interval_minutes=1440,
        alert_type=AlertType.MODEL_DEGRADATION,
        description="1天窗口主模型F1下降超过0.1",
        params={"model_id": 1, "metric": "f1", "window_days": 7},
    ),
    AlertPolicy(
        name="critical_errors_gt_5",
        metric_name="critical_error_count",
        threshold=5.0,
        window_minutes=1440,
        severity=AlertSeverity.WARNING,
        channels=[AlertChannel.WEBHOOK, AlertChannel.IN_APP],
        comparison="gt",
        min_interval_minutes=60,
        alert_type=AlertType.NEW_ERROR_SAMPLE,
        description="24小时窗口严重错误样本超过5个",
        params={"severity_filter": "critical,major"},
    ),
    AlertPolicy(
        name="new_review_tasks_pending_gt_100",
        metric_name="pending_review_tasks",
        threshold=100.0,
        window_minutes=360,
        severity=AlertSeverity.INFO,
        channels=[AlertChannel.IN_APP],
        comparison="gt",
        min_interval_minutes=360,
        alert_type=AlertType.REVIEW_NEEDED,
        description="6小时窗口待审核任务超过100个",
    ),
]
