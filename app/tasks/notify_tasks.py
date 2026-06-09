from __future__ import annotations

import json
import smtplib
import traceback
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Any, Dict, List, Optional

from loguru import logger

try:
    import requests
except ImportError:
    requests = None

from app.core.celery_app import celery_app
from app.models.task import Task, TaskResult, TaskStatus
from app.models.task import AlertEvent
from app.models.user import User
from app.models.dataset import Dataset
from app.tasks.base import ContractAIBaseTask
from app.config import settings


def _send_webhook_alert(url: str, alert: AlertEvent) -> bool:
    if requests is None:
        logger.warning("requests库未安装，跳过webhook通知")
        return False

    title = f"【{alert.severity.value.upper()}】{alert.title}"
    text = f"""**告警类型**: {alert.alert_type.value}
**严重级别**: {alert.severity.value}
**告警时间**: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

**消息内容**:
{alert.message}
"""

    if alert.extra_metadata:
        text += f"\n**元数据**: \n```json\n{json.dumps(alert.extra_metadata, ensure_ascii=False, indent=2)}\n```"

    if alert.metrics_snapshot:
        text += f"\n**指标快照**: \n```json\n{json.dumps(alert.metrics_snapshot, ensure_ascii=False, indent=2)}\n```"

    payload_type = None
    if "dingtalk" in url or "oapi.dingtalk" in url:
        payload = {
            "msgtype": "markdown",
            "markdown": {"title": title, "text": text},
        }
        payload_type = "dingtalk"
    elif "feishu" in url or "open.feishu" in url or "lark" in url:
        payload = {
            "msg_type": "interactive",
            "card": {
                "header": {
                    "title": {"tag": "plain_text", "content": title},
                    "template": {
                        "critical": "red",
                        "error": "red",
                        "warning": "orange",
                        "info": "blue",
                    }.get(alert.severity.value, "grey"),
                },
                "elements": [
                    {
                        "tag": "markdown",
                        "content": text,
                    }
                ],
            },
        }
        payload_type = "feishu"
    elif "weixin" in url or "qyapi.weixin" in url or "wechat" in url:
        content = f"{title}\n\n{text}"
        payload = {
            "msgtype": "markdown",
            "markdown": {"content": content},
        }
        payload_type = "wechat_work"
    else:
        payload = {
            "title": title,
            "message": alert.message,
            "severity": alert.severity.value,
            "alert_type": alert.alert_type.value,
            "metadata": alert.extra_metadata,
            "metrics": alert.metrics_snapshot,
        }
        payload_type = "generic"

    try:
        resp = requests.post(url, json=payload, timeout=10)
        if resp.status_code == 200:
            logger.info(f"Webhook通知成功: type={payload_type}, url={url[:50]}...")
            return True
        else:
            logger.warning(
                f"Webhook通知失败: status={resp.status_code}, body={resp.text[:200]}"
            )
            return False
    except Exception as e:
        logger.error(f"Webhook请求异常: type={payload_type}, error={e}")
        return False


def _send_email_alert(
    to_email: str, alert: AlertEvent, smtp_config: Optional[Dict] = None
) -> bool:
    try:
        subject = f"[{alert.severity.value.upper()}] ContractRiskAI - {alert.title}"

        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">ContractRiskAI 系统告警</h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
            </div>
            <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
                <div style="margin-bottom: 15px; padding: 10px; background-color: {
                    {'critical': '#ffe0e0', 'error': '#ffe8e0', 'warning': '#fff3cd', 'info': '#d1ecf1'}.get(alert.severity.value, '#f0f0f0')
                }; border-radius: 4px;">
                    <strong>严重级别:</strong> <span style="text-transform: uppercase;">{alert.severity.value}</span> &nbsp;&nbsp;
                    <strong>告警类型:</strong> {alert.alert_type.value}
                </div>

                <h3 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 8px;">
                    {alert.title}
                </h3>

                <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <p style="white-space: pre-wrap; margin: 0; line-height: 1.6;">{alert.message}</p>
                </div>
        """

        if alert.extra_metadata:
            body_html += f"""
                <div style="margin-top: 15px;">
                    <h4 style="color: #555;">元数据</h4>
                    <pre style="background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 12px;">
{json.dumps(alert.extra_metadata, ensure_ascii=False, indent=2)}
                    </pre>
                </div>
            """

        if alert.metrics_snapshot:
            body_html += f"""
                <div style="margin-top: 15px;">
                    <h4 style="color: #555;">指标快照</h4>
                    <pre style="background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 12px;">
{json.dumps(alert.metrics_snapshot, ensure_ascii=False, indent=2)}
                    </pre>
                </div>
            """

        body_html += """
            </div>
            <div style="text-align: center; padding: 15px; color: #999; font-size: 12px;">
                本邮件由 ContractRiskAI 系统自动发送，请勿直接回复。
            </div>
        </body>
        </html>
        """

        logger.info(
            f"[SMTP占位] 告警邮件 -> {to_email}, subject={subject}"
            f" (severity={alert.severity.value}, alert_id={alert.id})"
        )
        print(
            f"[ALERT EMAIL] To: {to_email} | Subject: {subject} | "
            f"Severity: {alert.severity.value} | "
            f"Message: {alert.message[:100]}..."
        )

        return True

    except Exception as e:
        logger.error(f"发送告警邮件失败: to={to_email}, error={e}")
        return False


@celery.task(
    bind=True,
    base=ContractAIBaseTask,
    name="notify.send_alert",
    queue="notify_queue",
    autoretry_for=(Exception,),
    retry_backoff=3,
    retry_kwargs={"max_retries": 3},
    time_limit=120,
    soft_time_limit=90,
)
def send_alert_task(
    self,
    task_id_str: str,
    alert_event_id: int,
) -> Dict[str, Any]:
    try:
        self.update_progress(10, "加载告警事件")
        db = self.db

        alert = db.get(AlertEvent, alert_event_id)
        if not alert:
            raise ValueError(f"告警事件不存在: {alert_event_id}")

        channels_notified: List[str] = []

        self.update_progress(30, "分发告警通知...")

        webhook_url = settings.ALERT_WEBHOOK_URL
        if webhook_url:
            self.update_progress(50, "发送Webhook通知")
            try:
                ok = _send_webhook_alert(webhook_url, alert)
                if ok:
                    channels_notified.append("webhook")
            except Exception as e:
                logger.warning(f"Webhook通道异常: {e}")

        email_to = settings.ALERT_EMAIL
        if email_to:
            self.update_progress(75, "发送邮件通知")
            try:
                ok = _send_email_alert(email_to, alert)
                if ok:
                    channels_notified.append("email")
            except Exception as e:
                logger.warning(f"邮件通道异常: {e}")

        alert.channels_notified = channels_notified
        alert.status = "notified" if channels_notified else "pending"
        alert.updated_at = datetime.utcnow()
        db.commit()

        self.update_progress(100, f"告警通知完成，通道: {channels_notified}")

        result = {"channels": channels_notified}

        self.save_task_result(
            result_data=result,
            metrics={
                "alert_id": alert_event_id,
                "alert_type": alert.alert_type.value,
                "severity": alert.severity.value,
                "channels_count": len(channels_notified),
            },
        )

        logger.info(
            f"告警任务完成: alert_id={alert_event_id}, "
            f"channels={channels_notified}, severity={alert.severity.value}"
        )

        return result

    except Exception as e:
        logger.error(f"send_alert_task失败: {e}\n{traceback.format_exc()}")
        raise


@celery.task(
    bind=True,
    base=ContractAIBaseTask,
    name="notify.review_assignment",
    queue="notify_queue",
    autoretry_for=(Exception,),
    retry_backoff=2,
    retry_kwargs={"max_retries": 2},
    time_limit=300,
    soft_time_limit=240,
)
def notify_review_assignment_task(
    self,
    task_id_str: str,
    reviewer_ids: List[int],
    dataset_id: int,
    sample_count: int,
) -> Dict[str, Any]:
    try:
        self.update_progress(10, "加载审核任务信息")
        db = self.db

        dataset = db.get(Dataset, dataset_id)
        if not dataset:
            raise ValueError(f"数据集不存在: {dataset_id}")

        stmt = User.select().where(User.id.in_(reviewer_ids)) if hasattr(User, "select") else None
        if stmt is None:
            from sqlalchemy import select as sa_select

            stmt = sa_select(User).where(User.id.in_(reviewer_ids))
        reviewers = db.execute(stmt).scalars().all()

        channels_notified: List[str] = []
        notified_count = 0

        self.update_progress(40, f"通知 {len(reviewers)} 位审核员...")

        for idx, reviewer in enumerate(reviewers):
            try:
                username = getattr(reviewer, "username", f"user_{reviewer.id}")
                email = getattr(reviewer, "email", None)
                reviewer_name = getattr(reviewer, "full_name", None) or username

                logger.info(
                    f"[站内信通知] 审核任务分配 -> user_id={reviewer.id}, "
                    f"username={username}, dataset={dataset.name}, samples={sample_count}"
                )

                if email:
                    subject = f"【审核任务分配】{dataset.name}"
                    body = f"""
尊敬的 {reviewer_name}：

您被分配了新的数据审核任务。

数据集名称：{dataset.name}
数据集ID：{dataset_id}
待审核样本数量：{sample_count}
分配时间：{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

请及时登录系统处理审核任务。

---
ContractRiskAI 系统自动通知
                    """.strip()

                    logger.info(
                        f"[邮件通知占位] 审核任务分配 -> {email} ({reviewer_name}), "
                        f"subject={subject}, samples={sample_count}"
                    )
                    print(
                        f"[REVIEW ASSIGN EMAIL] To: {email} ({reviewer_name}) | "
                        f"Dataset: {dataset.name} | Samples: {sample_count}"
                    )

                notified_count += 1
                channels_notified.append(f"user_{reviewer.id}")

            except Exception as e:
                logger.warning(
                    f"通知审核员失败 reviewer_id={getattr(reviewer, 'id', '?')}: {e}"
                )
                continue

            progress = 40 + int((idx + 1) / max(1, len(reviewers)) * 50)
            self.update_progress(
                progress,
                f"通知进度: {idx + 1}/{len(reviewers)}",
            )

        self.update_progress(100, "审核任务分配通知完成")

        result = {
            "notified_count": notified_count,
            "dataset_id": dataset_id,
            "sample_count": sample_count,
            "channels": channels_notified,
        }

        self.save_task_result(
            result_data=result,
            metrics={
                "reviewer_count": len(reviewer_ids),
                "notified_count": notified_count,
                "dataset_id": dataset_id,
                "sample_count": sample_count,
            },
        )

        logger.info(
            f"审核分配通知完成: dataset_id={dataset_id}, "
            f"reviewers={len(reviewer_ids)}, notified={notified_count}, samples={sample_count}"
        )

        return result

    except Exception as e:
        logger.error(f"notify_review_assignment_task失败: {e}\n{traceback.format_exc()}")
        raise
