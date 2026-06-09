from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from loguru import logger
from sqlalchemy import and_, case, cast, desc, extract, func, or_, select
from sqlalchemy.orm import Session

from app.config import settings
from app.core.database import get_sync_session
from app.models.contract import (
    ContractDocument,
    ContractStatus,
    RiskAlert,
    RiskLevel,
    RiskType,
)
from app.models.dataset import Dataset, DatasetSample, SampleLabel, SampleStatus
from app.models.ml import ModelMetric, ModelStatus, ModelVersion, MetricType
from app.models.task import (
    AlertEvent,
    AlertSeverity,
    AlertType,
    AuditAction,
    AuditLog,
    Feedback,
    FeedbackType,
    Task,
    TaskResult,
    TaskStatus,
)
from app.models.user import User


@dataclass
class TimeSeriesPoint:
    """时序数据点，表示某一时刻的指标值及其标签。

    Attributes:
        timestamp: 数据点的时间戳
        value: 指标值
        tags: 附加标签字典，用于分组与筛选
    """

    timestamp: datetime
    value: float
    tags: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MetricQuery:
    """指标查询条件，用于从 model_metrics 表中按窗口聚合查询。

    Attributes:
        metric_name: 指标名称（对应 MetricType 枚举值）
        start_time: 查询起始时间
        end_time: 查询结束时间
        group_by: 分组维度列表，如 ['model_id', 'window_start']
        tags_filter: 标签过滤条件
        agg: 聚合方式，默认 avg（支持 avg/sum/count/max/min）
    """

    metric_name: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    group_by: List[str] = field(default_factory=list)
    tags_filter: Dict[str, Any] = field(default_factory=dict)
    agg: str = "avg"


@dataclass
class DashboardSummary:
    """首页看板汇总指标。

    Attributes:
        total_contracts: 合同总数量
        today_parsed: 今日解析完成合同数
        total_risks: 风险告警总数
        avg_processing_time: 平均处理耗时（秒）
        error_rate: 错误率（0-1）
        model_usage_cost_this_month: 本月模型使用成本（USD）
        active_users: 活跃用户数
        feedback_rate: 反馈率（有反馈的任务 / 总任务）
    """

    total_contracts: int = 0
    today_parsed: int = 0
    total_risks: int = 0
    avg_processing_time: float = 0.0
    error_rate: float = 0.0
    model_usage_cost_this_month: float = 0.0
    active_users: int = 0
    feedback_rate: float = 0.0


@dataclass
class LLMUsage:
    """LLM 调用使用量统计。

    Attributes:
        prompt_tokens: 输入 token 数
        completion_tokens: 输出 token 数
        total_tokens: 总 token 数
        cost_usd: 成本（美元）
        latency_ms: 延迟（毫秒）
    """

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    latency_ms: float = 0.0


@dataclass
class AnomalyPoint:
    """异常检测结果点。

    Attributes:
        timestamp: 异常发生时间
        value: 实际值
        expected_mean: 滚动均值
        expected_std: 滚动标准差
        z_score: Z 分数
        is_anomaly: 是否为异常点
    """

    timestamp: datetime
    value: float
    expected_mean: float
    expected_std: float
    z_score: float
    is_anomaly: bool


class MetricsTracker:
    """指标追踪器。

    负责采集、存储、查询系统中各类运行指标，包括任务性能、风险分布、
    用户反馈、数据集统计等，并支持异常检测与自动告警。
    指标可写入数据库，也可选写入 Redis 用于 Prometheus 抓取。
    """

    def __init__(self, db: Optional[Session] = None, redis_url: Optional[str] = None):
        """初始化指标追踪器。

        Args:
            db: SQLAlchemy 同步会话，若为 None 则从 get_sync_session 获取
            redis_url: Redis 连接 URL，可选，用于写入实时指标供 Prometheus 抓取
        """
        self.db = db or get_sync_session()
        self.redis_url = redis_url
        self._redis_client = None

        if self.redis_url:
            try:
                import redis

                self._redis_client = redis.from_url(self.redis_url)
                logger.info(f"MetricsTracker 已启用 Redis: {self.redis_url}")
            except ImportError:
                logger.warning("未安装 redis 库，跳过 Redis 指标写入")
            except Exception as e:
                logger.exception(f"Redis 连接失败: {e}")

    def close(self) -> None:
        """关闭数据库会话与 Redis 连接。"""
        try:
            self.db.close()
        except Exception:
            pass
        if self._redis_client:
            try:
                self._redis_client.close()
            except Exception:
                pass

    def _hour_window(self, dt: datetime) -> Tuple[datetime, datetime]:
        """将时间对齐到小时粒度窗口。

        Args:
            dt: 原始时间

        Returns:
            (窗口起始时间, 窗口结束时间) 元组
        """
        start = dt.replace(minute=0, second=0, microsecond=0)
        end = start + timedelta(hours=1)
        return start, end

    def _write_redis_metric(
        self,
        metric_key: str,
        value: float,
        labels: Optional[Dict[str, str]] = None,
    ) -> None:
        """可选：将指标写入 Redis。

        Args:
            metric_key: 指标键名
            value: 指标值
            labels: 标签字典
        """
        if not self._redis_client:
            return
        try:
            key_parts = [metric_key]
            if labels:
                for k, v in sorted(labels.items()):
                    key_parts.append(f"{k}={v}")
            key = ":".join(key_parts)
            self._redis_client.set(key, value, ex=3600 * 24)
        except Exception as e:
            logger.warning(f"写入 Redis 指标失败 {metric_key}: {e}")

    def track_task_metrics(
        self,
        task: Task,
        result: TaskResult,
        usage: LLMUsage,
    ) -> List[ModelMetric]:
        """追踪任务执行指标，写入 ModelMetric 表。

        自动抽取 tokens / cost / latency，并按小时粒度设置 window_start/end。

        Args:
            task: 任务实例
            result: 任务结果实例
            usage: LLM 使用量统计

        Returns:
            已创建的 ModelMetric 记录列表
        """
        created: List[ModelMetric] = []
        try:
            now = datetime.utcnow()
            window_start, window_end = self._hour_window(now)
            model_id = task.model_id

            metrics_to_write: List[Tuple[MetricType, float, Dict[str, Any]]] = [
                (MetricType.COST, usage.cost_usd, {}),
                (MetricType.LATENCY, usage.latency_ms, {"unit": "ms"}),
                (
                    MetricType.THROUGHPUT,
                    usage.total_tokens / max(usage.latency_ms / 1000.0, 1e-6),
                    {"unit": "tokens_per_sec"},
                ),
            ]

            for metric_type, value, extra_meta in metrics_to_write:
                metadata = {
                    "task_id": task.id,
                    "task_type": task.task_type.value if hasattr(task.task_type, "value") else str(task.task_type),
                    "contract_id": task.contract_id,
                    **extra_meta,
                }
                mm = ModelMetric(
                    model_id=model_id,
                    metric_type=metric_type,
                    metric_value=float(value),
                    window_start=window_start,
                    window_end=window_end,
                    sample_size=1,
                    metadata=metadata,
                    created_at=now,
                )
                self.db.add(mm)
                created.append(mm)

                self._write_redis_metric(
                    f"model.{metric_type.value}",
                    float(value),
                    {"model_id": str(model_id), "task_type": str(task.task_type)},
                )

            self.db.commit()
            for mm in created:
                self.db.refresh(mm)

            logger.info(
                f"已写入任务指标 task_id={task.id} model_id={model_id} "
                f"cost={usage.cost_usd:.4f} latency={usage.latency_ms:.1f}ms"
            )
        except Exception as e:
            logger.exception(f"写入任务指标失败: {e}")
            self.db.rollback()
            created = []

        return created

    def track_risk_detection(
        self,
        risk_alerts_list: List[RiskAlert],
        contract_id: Optional[int],
        model_version: Optional[str],
    ) -> List[ModelMetric]:
        """追踪风险检测分布指标。

        按风险类型 / 级别分别统计数量并写入分布指标。

        Args:
            risk_alerts_list: 风险告警列表
            contract_id: 关联合同 ID
            model_version: 模型版本标识

        Returns:
            已创建的 ModelMetric 记录列表
        """
        created: List[ModelMetric] = []
        try:
            now = datetime.utcnow()
            window_start, window_end = self._hour_window(now)

            type_counter: Dict[str, int] = {}
            level_counter: Dict[str, int] = {}

            for alert in risk_alerts_list:
                rtype = alert.risk_type.value if hasattr(alert.risk_type, "value") else str(alert.risk_type)
                rlevel = alert.risk_level.value if hasattr(alert.risk_level, "value") else str(alert.risk_level)
                type_counter[rtype] = type_counter.get(rtype, 0) + 1
                level_counter[rlevel] = level_counter.get(rlevel, 0) + 1

            for rtype, count in type_counter.items():
                mm = ModelMetric(
                    model_id=None,
                    metric_type=MetricType.PRECISION,
                    metric_value=float(count),
                    window_start=window_start,
                    window_end=window_end,
                    sample_size=len(risk_alerts_list),
                    metadata={
                        "metric_subtype": "risk_type_distribution",
                        "risk_type": rtype,
                        "contract_id": contract_id,
                        "model_version": model_version,
                    },
                    created_at=now,
                )
                self.db.add(mm)
                created.append(mm)

            for rlevel, count in level_counter.items():
                mm = ModelMetric(
                    model_id=None,
                    metric_type=MetricType.PRECISION,
                    metric_value=float(count),
                    window_start=window_start,
                    window_end=window_end,
                    sample_size=len(risk_alerts_list),
                    metadata={
                        "metric_subtype": "risk_level_distribution",
                        "risk_level": rlevel,
                        "contract_id": contract_id,
                        "model_version": model_version,
                    },
                    created_at=now,
                )
                self.db.add(mm)
                created.append(mm)

            total_mm = ModelMetric(
                model_id=None,
                metric_type=MetricType.RECALL,
                metric_value=float(len(risk_alerts_list)),
                window_start=window_start,
                window_end=window_end,
                sample_size=1,
                metadata={
                    "metric_subtype": "total_risks",
                    "contract_id": contract_id,
                    "model_version": model_version,
                },
                created_at=now,
            )
            self.db.add(total_mm)
            created.append(total_mm)

            self.db.commit()
            for mm in created:
                self.db.refresh(mm)

            logger.info(
                f"已写入风险指标 contract_id={contract_id} "
                f"total_risks={len(risk_alerts_list)} types={len(type_counter)}"
            )
        except Exception as e:
            logger.exception(f"写入风险检测指标失败: {e}")
            self.db.rollback()
            created = []

        return created

    def track_feedback(self, feedback: Feedback) -> Optional[ModelMetric]:
        """追踪用户反馈指标。

        计算用户满意度（upvote_ratio）、纠正率、平均响应时间并写入指标。

        Args:
            feedback: 反馈实例

        Returns:
            若成功写入则返回 ModelMetric，否则返回 None
        """
        created: Optional[ModelMetric] = None
        try:
            now = datetime.utcnow()
            window_start, window_end = self._hour_window(now)

            ftype = feedback.feedback_type
            upvote_ratio = 0.0
            correction_ratio = 0.0
            response_time_hours = 0.0

            if ftype == FeedbackType.UPVOTE:
                upvote_ratio = 1.0
            elif ftype == FeedbackType.DOWNVOTE:
                upvote_ratio = 0.0
            elif ftype == FeedbackType.CORRECTION:
                correction_ratio = 1.0

            if feedback.task_result_id:
                tr_stmt = (
                    select(TaskResult, Task)
                    .join(Task, Task.id == TaskResult.task_id)
                    .where(TaskResult.id == feedback.task_result_id)
                )
                tr_row = self.db.execute(tr_stmt).first()
                if tr_row and tr_row[0] and tr_row[1]:
                    tr: TaskResult = tr_row[0]
                    task: Task = tr_row[1]
                    if task.completed_at:
                        delta = feedback.created_at - task.completed_at
                        response_time_hours = max(delta.total_seconds() / 3600.0, 0.0)

            satisfaction_score = (upvote_ratio * 0.6 + (1.0 - correction_ratio) * 0.4)

            mm = ModelMetric(
                model_id=None,
                metric_type=MetricType.USER_SATISFACTION,
                metric_value=satisfaction_score,
                window_start=window_start,
                window_end=window_end,
                sample_size=1,
                metadata={
                    "feedback_id": feedback.id,
                    "feedback_type": ftype.value if hasattr(ftype, "value") else str(ftype),
                    "upvote_ratio": upvote_ratio,
                    "correction_ratio": correction_ratio,
                    "response_time_hours": response_time_hours,
                    "user_id": feedback.user_id,
                },
                created_at=now,
            )
            self.db.add(mm)
            self.db.commit()
            self.db.refresh(mm)
            created = mm

            logger.info(
                f"已写入反馈指标 feedback_id={feedback.id} "
                f"type={ftype} satisfaction={satisfaction_score:.3f}"
            )
        except Exception as e:
            logger.exception(f"写入反馈指标失败: {e}")
            self.db.rollback()

        return created

    def track_dataset_stats(self, dataset_id: int) -> Dict[str, Any]:
        """统计数据集指标。

        统计样本数、已标注比例、已审核比例、审核员效率（每小时标注数）。

        Args:
            dataset_id: 数据集 ID

        Returns:
            包含各项统计指标的字典
        """
        stats: Dict[str, Any] = {}
        try:
            stmt = select(Dataset).where(Dataset.id == dataset_id)
            dataset = self.db.execute(stmt).scalar_one_or_none()
            if not dataset:
                logger.warning(f"数据集不存在: id={dataset_id}")
                return stats

            sample_count = dataset.sample_count or 0
            labeled_count = dataset.labeled_count or 0
            approved_count = dataset.approved_count or 0

            labeled_ratio = labeled_count / sample_count if sample_count > 0 else 0.0
            approved_ratio = approved_count / sample_count if sample_count > 0 else 0.0

            reviewer_stmt = (
                select(
                    DatasetSample.reviewer_id,
                    func.count(DatasetSample.id).label("reviewed_count"),
                    func.min(DatasetSample.reviewed_at).label("first_at"),
                    func.max(DatasetSample.reviewed_at).label("last_at"),
                )
                .where(
                    DatasetSample.dataset_id == dataset_id,
                    DatasetSample.reviewer_id.isnot(None),
                    DatasetSample.reviewed_at.isnot(None),
                )
                .group_by(DatasetSample.reviewer_id)
            )
            reviewer_rows = self.db.execute(reviewer_stmt).all()

            reviewer_efficiency: Dict[str, float] = {}
            for row in reviewer_rows:
                rid, count, first_at, last_at = row
                if first_at and last_at and count > 0:
                    hours = max((last_at - first_at).total_seconds() / 3600.0, 1e-3)
                    per_hour = count / hours
                else:
                    per_hour = 0.0
                reviewer_efficiency[str(rid)] = round(per_hour, 4)

            stats = {
                "dataset_id": dataset_id,
                "sample_count": sample_count,
                "labeled_count": labeled_count,
                "approved_count": approved_count,
                "labeled_ratio": round(labeled_ratio, 4),
                "approved_ratio": round(approved_ratio, 4),
                "reviewer_efficiency": reviewer_efficiency,
                "computed_at": datetime.utcnow().isoformat(),
            }

            dataset.stats = stats
            self.db.commit()

            now = datetime.utcnow()
            window_start, window_end = self._hour_window(now)
            metrics_entries = [
                (MetricType.ACCURACY, float(labeled_ratio), {"subtype": "labeled_ratio"}),
                (MetricType.ACCURACY, float(approved_ratio), {"subtype": "approved_ratio"}),
                (MetricType.THROUGHPUT, float(sample_count), {"subtype": "sample_count"}),
            ]
            for mtype, val, meta in metrics_entries:
                mm = ModelMetric(
                    model_id=None,
                    metric_type=mtype,
                    metric_value=val,
                    dataset_id=dataset_id,
                    window_start=window_start,
                    window_end=window_end,
                    sample_size=sample_count,
                    metadata={
                        **meta,
                        "dataset_name": dataset.name,
                    },
                    created_at=now,
                )
                self.db.add(mm)
            self.db.commit()

            logger.info(
                f"数据集统计 dataset_id={dataset_id} samples={sample_count} "
                f"labeled={labeled_ratio:.2%} approved={approved_ratio:.2%}"
            )
        except Exception as e:
            logger.exception(f"数据集统计失败 dataset_id={dataset_id}: {e}")
            self.db.rollback()

        return stats

    def query_metrics(self, query: MetricQuery) -> List[TimeSeriesPoint]:
        """按查询条件从 model_metrics 表聚合时序指标。

        Args:
            query: 指标查询条件

        Returns:
            时序数据点列表
        """
        results: List[TimeSeriesPoint] = []
        try:
            agg_map = {
                "avg": func.avg,
                "sum": func.sum,
                "count": func.count,
                "max": func.max,
                "min": func.min,
            }
            agg_func = agg_map.get(query.agg, func.avg)

            stmt = select(
                ModelMetric.window_start,
                agg_func(ModelMetric.metric_value).label("agg_value"),
                ModelMetric.metadata,
                ModelMetric.model_id,
            ).where(ModelMetric.metric_type == cast(query.metric_name, MetricType))

            if query.start_time:
                stmt = stmt.where(ModelMetric.window_start >= query.start_time)
            if query.end_time:
                stmt = stmt.where(ModelMetric.window_end <= query.end_time)

            if query.tags_filter:
                for k, v in query.tags_filter.items():
                    if k == "model_id":
                        stmt = stmt.where(ModelMetric.model_id == v)
                    elif k == "dataset_id":
                        stmt = stmt.where(ModelMetric.dataset_id == v)
                    else:
                        json_path = f"$.{k}"
                        stmt = stmt.where(func.json_extract(ModelMetric.metadata, json_path) == v)

            group_cols = []
            if "window_start" in query.group_by or True:
                group_cols.append(ModelMetric.window_start)
            if "model_id" in query.group_by:
                group_cols.append(ModelMetric.model_id)
            if "metadata" in query.group_by:
                group_cols.append(ModelMetric.metadata)

            stmt = stmt.group_by(*group_cols).order_by(ModelMetric.window_start.asc())

            rows = self.db.execute(stmt).all()
            for row in rows:
                ts = row[0] or datetime.utcnow()
                value = float(row[1] or 0.0)
                tags: Dict[str, Any] = {}
                if len(row) > 2 and row[2]:
                    tags = dict(row[2]) if isinstance(row[2], dict) else {}
                if len(row) > 3 and row[3] is not None:
                    tags.setdefault("model_id", row[3])
                results.append(TimeSeriesPoint(timestamp=ts, value=value, tags=tags))

            logger.info(
                f"指标查询 metric={query.metric_name} agg={query.agg} "
                f"points={len(results)}"
            )
        except Exception as e:
            logger.exception(f"指标查询失败 {query.metric_name}: {e}")

        return results

    def get_dashboard_summary(self, days: int = 7) -> DashboardSummary:
        """计算首页看板汇总指标。

        从多个数据表 JOIN 聚合得到首页展示的核心指标。

        Args:
            days: 统计最近 N 天的数据，默认 7 天

        Returns:
            DashboardSummary 汇总对象
        """
        summary = DashboardSummary()
        try:
            now = datetime.utcnow()
            start_date = now - timedelta(days=days)
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

            total_stmt = select(func.count(ContractDocument.id))
            summary.total_contracts = self.db.execute(total_stmt).scalar_one() or 0

            today_stmt = select(func.count(ContractDocument.id)).where(
                ContractDocument.status == ContractStatus.PARSED,
                ContractDocument.updated_at >= today_start,
            )
            summary.today_parsed = self.db.execute(today_stmt).scalar_one() or 0

            risks_stmt = select(func.count(RiskAlert.id)).where(
                RiskAlert.created_at >= start_date
            )
            summary.total_risks = self.db.execute(risks_stmt).scalar_one() or 0

            proc_time_stmt = select(func.avg(Task.total_time_ms)).where(
                Task.status == TaskStatus.COMPLETED,
                Task.total_time_ms.isnot(None),
                Task.completed_at >= start_date,
            )
            avg_ms = self.db.execute(proc_time_stmt).scalar_one() or 0.0
            summary.avg_processing_time = round(avg_ms / 1000.0, 3)

            total_tasks_stmt = select(func.count(Task.id)).where(
                Task.created_at >= start_date
            )
            failed_tasks_stmt = select(func.count(Task.id)).where(
                Task.status.in_([TaskStatus.FAILED, TaskStatus.TIMEOUT]),
                Task.created_at >= start_date,
            )
            total_tasks = self.db.execute(total_tasks_stmt).scalar_one() or 0
            failed_tasks = self.db.execute(failed_tasks_stmt).scalar_one() or 0
            summary.error_rate = round(failed_tasks / total_tasks, 4) if total_tasks > 0 else 0.0

            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            cost_stmt = select(func.coalesce(func.sum(TaskResult.cost_usd), 0.0)).where(
                TaskResult.created_at >= month_start
            )
            summary.model_usage_cost_this_month = round(
                float(self.db.execute(cost_stmt).scalar_one() or 0.0), 4
            )

            active_stmt = select(func.count(func.distinct(Task.creator_id))).where(
                Task.creator_id.isnot(None),
                Task.created_at >= start_date,
            )
            summary.active_users = self.db.execute(active_stmt).scalar_one() or 0

            feedback_stmt = select(func.count(func.distinct(Feedback.task_result_id))).where(
                Feedback.created_at >= start_date
            )
            fb_count = self.db.execute(feedback_stmt).scalar_one() or 0
            results_stmt = select(func.count(TaskResult.id)).where(
                TaskResult.created_at >= start_date
            )
            tr_count = self.db.execute(results_stmt).scalar_one() or 0
            summary.feedback_rate = round(fb_count / tr_count, 4) if tr_count > 0 else 0.0

            logger.info(
                f"看板汇总 days={days} contracts={summary.total_contracts} "
                f"risks={summary.total_risks} cost=${summary.model_usage_cost_this_month}"
            )
        except Exception as e:
            logger.exception(f"计算看板汇总失败: {e}")

        return summary

    def detect_anomalies(
        self,
        metric_name: str,
        window_days: int = 14,
        z_threshold: float = 2.5,
    ) -> List[AnomalyPoint]:
        """基于滚动均值 + 标准差的 Z-score 异常检测。

        当 Z-score > 阈值时，自动创建 AlertEvent 告警事件，
        如 error_rate 突增、latency 突增等场景。

        Args:
            metric_name: 要检测的指标名称
            window_days: 历史窗口天数
            z_threshold: Z-score 异常阈值，默认 2.5

        Returns:
            异常点列表
        """
        anomalies: List[AnomalyPoint] = []
        try:
            now = datetime.utcnow()
            start_time = now - timedelta(days=window_days)

            query = MetricQuery(
                metric_name=metric_name,
                start_time=start_time,
                end_time=now,
                agg="avg",
                group_by=["window_start"],
            )
            points = self.query_metrics(query)
            if len(points) < 7:
                logger.info(f"指标 {metric_name} 数据点不足 ({len(points)})，跳过异常检测")
                return anomalies

            values = [p.value for p in points]
            n = len(values)

            for i in range(6, n):
                window = values[max(0, i - 6) : i]
                mean = sum(window) / len(window)
                variance = sum((v - mean) ** 2 for v in window) / len(window)
                std = math.sqrt(variance) if variance > 0 else 1e-6
                z_score = (values[i] - mean) / std
                is_anomaly = abs(z_score) > z_threshold

                ap = AnomalyPoint(
                    timestamp=points[i].timestamp,
                    value=values[i],
                    expected_mean=mean,
                    expected_std=std,
                    z_score=z_score,
                    is_anomaly=is_anomaly,
                )
                if is_anomaly:
                    anomalies.append(ap)
                    self._create_anomaly_alert(metric_name, ap)

            logger.info(
                f"异常检测 metric={metric_name} window={window_days}d "
                f"points={n} anomalies={len(anomalies)}"
            )
        except Exception as e:
            logger.exception(f"异常检测失败 {metric_name}: {e}")

        return anomalies

    def _create_anomaly_alert(self, metric_name: str, ap: AnomalyPoint) -> None:
        """根据异常点自动创建 AlertEvent 告警记录。

        Args:
            metric_name: 指标名称
            ap: 异常点
        """
        try:
            if metric_name == MetricType.ERROR_RATE.value:
                alert_type = AlertType.HIGH_ERROR_RATE
                severity = AlertSeverity.ERROR if ap.z_score > 3.0 else AlertSeverity.WARNING
                title = f"错误率突增异常 - Z={ap.z_score:.2f}"
                message = (
                    f"错误率达到 {ap.value:.2%}，显著高于历史均值 {ap.expected_mean:.2%} "
                    f"(±{ap.expected_std:.2%})，Z-score={ap.z_score:.2f}"
                )
            elif metric_name == MetricType.LATENCY.value:
                alert_type = AlertType.HIGH_LATENCY
                severity = AlertSeverity.WARNING if ap.z_score > 0 else AlertSeverity.INFO
                title = f"延迟异常波动 - Z={ap.z_score:.2f}"
                message = (
                    f"延迟 {ap.value:.1f}ms 偏离预期均值 {ap.expected_mean:.1f}ms "
                    f"(±{ap.expected_std:.1f}ms)，Z-score={ap.z_score:.2f}"
                )
            else:
                alert_type = AlertType.MODEL_DEGRADATION
                severity = AlertSeverity.WARNING
                title = f"指标 {metric_name} 异常 - Z={ap.z_score:.2f}"
                message = (
                    f"指标 {metric_name}={ap.value:.4f} 偏离预期 "
                    f"均值={ap.expected_mean:.4f} std={ap.expected_std:.4f} Z={ap.z_score:.2f}"
                )

            alert = AlertEvent(
                alert_type=alert_type,
                severity=severity,
                title=title,
                message=message,
                related_ids={"metric": metric_name},
                metadata={"detection_window": "rolling_7_points"},
                metrics_snapshot={
                    "value": ap.value,
                    "expected_mean": ap.expected_mean,
                    "expected_std": ap.expected_std,
                    "z_score": ap.z_score,
                    "timestamp": ap.timestamp.isoformat(),
                },
                created_at=datetime.utcnow(),
            )
            self.db.add(alert)
            self.db.commit()
            logger.warning(
                f"已创建异常告警 type={alert_type.value} severity={severity.value} "
                f"z_score={ap.z_score:.2f}"
            )
        except Exception as e:
            logger.exception(f"创建异常告警失败: {e}")
            self.db.rollback()


class DashboardQuery:
    """看板查询辅助类，提供常用的看板数据查询静态方法。"""

    @staticmethod
    def contract_processing_funnel(
        from_date: datetime,
        to_date: datetime,
        db: Optional[Session] = None,
    ) -> List[Dict[str, Any]]:
        """合同处理漏斗分析：DRAFT → PARSED → ANALYZED → APPROVED 各步骤数量。

        Args:
            from_date: 统计起始时间
            to_date: 统计结束时间
            db: 数据库会话，若为 None 则新建

        Returns:
            各阶段数量列表，形如 [{"stage": "PARSED", "count": 120}, ...]
        """
        session = db or get_sync_session()
        funnel: List[Dict[str, Any]] = []
        try:
            stages = [
                ContractStatus.DRAFT,
                ContractStatus.PARSED,
                ContractStatus.ANALYZED,
                ContractStatus.APPROVED,
            ]
            for stage in stages:
                stmt = select(func.count(ContractDocument.id)).where(
                    ContractDocument.status == stage,
                    ContractDocument.created_at >= from_date,
                    ContractDocument.created_at <= to_date,
                )
                count = session.execute(stmt).scalar_one() or 0
                funnel.append(
                    {
                        "stage": stage.value if hasattr(stage, "value") else str(stage),
                        "count": int(count),
                    }
                )
            logger.info(
                f"合同漏斗 from={from_date.date()} to={to_date.date()} "
                f"total={sum(x['count'] for x in funnel)}"
            )
        except Exception as e:
            logger.exception(f"合同漏斗查询失败: {e}")
        finally:
            if db is None:
                session.close()
        return funnel

    @staticmethod
    def risk_distribution(
        from_date: datetime,
        to_date: datetime,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """按风险类型 / 级别的饼图数据。

        Args:
            from_date: 统计起始时间
            to_date: 统计结束时间
            db: 数据库会话

        Returns:
            {"by_type": {...}, "by_level": {...}, "total": N} 字典
        """
        session = db or get_sync_session()
        result: Dict[str, Any] = {"by_type": {}, "by_level": {}, "total": 0}
        try:
            total_stmt = select(func.count(RiskAlert.id)).where(
                RiskAlert.created_at >= from_date,
                RiskAlert.created_at <= to_date,
            )
            result["total"] = int(session.execute(total_stmt).scalar_one() or 0)

            type_stmt = (
                select(RiskAlert.risk_type, func.count(RiskAlert.id))
                .where(
                    RiskAlert.created_at >= from_date,
                    RiskAlert.created_at <= to_date,
                )
                .group_by(RiskAlert.risk_type)
            )
            for row in session.execute(type_stmt).all():
                k = row[0].value if hasattr(row[0], "value") else str(row[0])
                result["by_type"][k] = int(row[1])

            level_stmt = (
                select(RiskAlert.risk_level, func.count(RiskAlert.id))
                .where(
                    RiskAlert.created_at >= from_date,
                    RiskAlert.created_at <= to_date,
                )
                .group_by(RiskAlert.risk_level)
            )
            for row in session.execute(level_stmt).all():
                k = row[0].value if hasattr(row[0], "value") else str(row[0])
                result["by_level"][k] = int(row[1])

            logger.info(
                f"风险分布 from={from_date.date()} to={to_date.date()} "
                f"total={result['total']} types={len(result['by_type'])}"
            )
        except Exception as e:
            logger.exception(f"风险分布查询失败: {e}")
        finally:
            if db is None:
                session.close()
        return result

    @staticmethod
    def model_comparison(
        model_ids: List[int],
        metric: str = "f1",
        days: int = 30,
        db: Optional[Session] = None,
    ) -> Dict[int, List[Dict[str, Any]]]:
        """多模型性能时序对比。

        Args:
            model_ids: 模型 ID 列表
            metric: 对比指标，默认 f1
            days: 最近 N 天，默认 30 天
            db: 数据库会话

        Returns:
            以 model_id 为键，值为时间序列点列表的字典
        """
        session = db or get_sync_session()
        result: Dict[int, List[Dict[str, Any]]] = {}
        try:
            from_date = datetime.utcnow() - timedelta(days=days)
            metric_enum = MetricType.F1
            if hasattr(MetricType, metric.upper()):
                metric_enum = getattr(MetricType, metric.upper())

            stmt = (
                select(
                    ModelMetric.model_id,
                    ModelMetric.window_start,
                    func.avg(ModelMetric.metric_value).label("v"),
                )
                .where(
                    ModelMetric.model_id.in_(model_ids),
                    ModelMetric.metric_type == metric_enum,
                    ModelMetric.window_start >= from_date,
                )
                .group_by(ModelMetric.model_id, ModelMetric.window_start)
                .order_by(ModelMetric.window_start.asc())
            )
            for row in session.execute(stmt).all():
                mid = int(row[0]) if row[0] is not None else 0
                ts = row[1] or datetime.utcnow()
                val = float(row[2] or 0.0)
                result.setdefault(mid, []).append(
                    {
                        "timestamp": ts.isoformat(),
                        "value": val,
                    }
                )
            logger.info(
                f"模型对比 models={len(model_ids)} metric={metric} "
                f"days={days} series={len(result)}"
            )
        except Exception as e:
            logger.exception(f"模型对比查询失败: {e}")
        finally:
            if db is None:
                session.close()
        return result

    @staticmethod
    def reviewer_leaderboard(
        days: int = 7,
        db: Optional[Session] = None,
    ) -> List[Dict[str, Any]]:
        """审核员排行榜：各审核员的审核数量、通过率、平均时长排名。

        Args:
            days: 最近 N 天，默认 7 天
            db: 数据库会话

        Returns:
            审核员排行列表，按审核数量降序
        """
        session = db or get_sync_session()
        leaderboard: List[Dict[str, Any]] = []
        try:
            from_date = datetime.utcnow() - timedelta(days=days)

            stmt = (
                select(
                    DatasetSample.reviewer_id,
                    func.count(DatasetSample.id).label("reviewed_count"),
                    func.sum(
                        case(
                            (DatasetSample.status == SampleStatus.APPROVED, 1),
                            else_=0,
                        )
                    ).label("approved_count"),
                    func.avg(
                        extract("epoch", DatasetSample.updated_at)
                        - extract("epoch", DatasetSample.created_at)
                    ).label("avg_duration_sec"),
                )
                .where(
                    DatasetSample.reviewer_id.isnot(None),
                    DatasetSample.reviewed_at.isnot(None),
                    DatasetSample.reviewed_at >= from_date,
                )
                .group_by(DatasetSample.reviewer_id)
                .order_by(desc("reviewed_count"))
            )
            rows = session.execute(stmt).all()

            for idx, row in enumerate(rows, start=1):
                rid, count, approved, avg_sec = row
                approved = int(approved or 0)
                count = int(count or 0)
                pass_rate = approved / count if count > 0 else 0.0
                avg_min = (float(avg_sec or 0.0)) / 60.0

                user_stmt = select(User).where(User.id == rid)
                user = session.execute(user_stmt).scalar_one_or_none()

                leaderboard.append(
                    {
                        "rank": idx,
                        "reviewer_id": int(rid),
                        "reviewer_name": user.username if user else f"user_{rid}",
                        "reviewed_count": count,
                        "approved_count": approved,
                        "pass_rate": round(pass_rate, 4),
                        "avg_duration_minutes": round(avg_min, 2),
                    }
                )
            logger.info(f"审核员排行榜 days={days} entries={len(leaderboard)}")
        except Exception as e:
            logger.exception(f"审核员排行榜查询失败: {e}")
        finally:
            if db is None:
                session.close()
        return leaderboard

    @staticmethod
    def error_type_heatmap(
        days: int = 30,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """错误类型 × 严重程度热力图数据。

        Args:
            days: 最近 N 天，默认 30 天
            db: 数据库会话

        Returns:
            {"error_types": [...], "severities": [...], "matrix": [[...]]} 热力图结构
        """
        session = db or get_sync_session()
        heatmap: Dict[str, Any] = {
            "error_types": [],
            "severities": [],
            "matrix": [],
        }
        try:
            from app.models.dataset import ErrorSample, ErrorSeverity, ErrorType

            from_date = datetime.utcnow() - timedelta(days=days)

            stmt = (
                select(
                    ErrorSample.error_type,
                    ErrorSample.severity,
                    func.count(ErrorSample.id).label("cnt"),
                )
                .where(ErrorSample.created_at >= from_date)
                .group_by(ErrorSample.error_type, ErrorSample.severity)
            )
            rows = session.execute(stmt).all()

            error_types_list = list(ErrorType)
            severity_list = list(ErrorSeverity)
            type_index = {
                et.value if hasattr(et, "value") else str(et): i
                for i, et in enumerate(error_types_list)
            }
            sev_index = {
                sv.value if hasattr(sv, "value") else str(sv): i
                for i, sv in enumerate(severity_list)
            }

            matrix = [
                [0 for _ in range(len(severity_list))]
                for _ in range(len(error_types_list))
            ]
            for row in rows:
                etype, severity, cnt = row
                et_key = etype.value if hasattr(etype, "value") else str(etype)
                sv_key = severity.value if hasattr(severity, "value") else str(severity)
                if et_key in type_index and sv_key in sev_index:
                    matrix[type_index[et_key]][sev_index[sv_key]] = int(cnt or 0)

            heatmap["error_types"] = [
                t.value if hasattr(t, "value") else str(t) for t in error_types_list
            ]
            heatmap["severities"] = [
                s.value if hasattr(s, "value") else str(s) for s in severity_list
            ]
            heatmap["matrix"] = matrix
            total = sum(sum(r) for r in matrix)
            logger.info(f"错误热力图 days={days} total={total}")
        except Exception as e:
            logger.exception(f"错误热力图查询失败: {e}")
        finally:
            if db is None:
                session.close()
        return heatmap
