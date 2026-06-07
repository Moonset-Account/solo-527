from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class MetricDefinition:
    name: str
    description: str
    calculation: str
    unit: str
    filters: Optional[str] = None
    group_by: Optional[str] = None


METRICS: Dict[str, MetricDefinition] = {
    "backlog_count": MetricDefinition(
        name="队列积压量",
        description="截止当前时间，处于待审核状态的视频数量",
        calculation="COUNT(*) WHERE reviewer_end_time IS NULL AND enqueue_time <= :asof",
        unit="条",
    ),
    "avg_review_duration": MetricDefinition(
        name="平均审核时长",
        description="人审从接单到提交结果的平均耗时",
        calculation="AVG(EXTRACT(EPOCH FROM (reviewer_end_time - reviewer_start_time)))",
        unit="秒",
        filters="reviewer_end_time IS NOT NULL",
    ),
    "sla_breach_rate": MetricDefinition(
        name="SLA违规率",
        description="超过队列规定SLA时长仍未审核的视频占比",
        calculation="COUNT(CASE WHEN (NOW() - enqueue_time) > :sla_threshold THEN 1 END)::FLOAT / COUNT(*)",
        unit="%",
    ),
    "appeal_reversal_rate": MetricDefinition(
        name="申诉逆转率",
        description="申诉成功的视频占总申诉量的比例，按原机器风险标签分组",
        calculation="COUNT(CASE WHEN appeal_result = 'success' THEN 1 END)::FLOAT / COUNT(*)",
        unit="%",
        group_by="original_risk_tags",
    ),
    "processed_count": MetricDefinition(
        name="处理量",
        description="指定时间范围内完成审核的视频数量",
        calculation="COUNT(*)",
        unit="条",
        filters="reviewer_end_time IS NOT NULL",
    ),
    "conversion_rate": MetricDefinition(
        name="转化率",
        description="从机器初筛到各环节的留存比例",
        calculation="current_step_count / previous_step_count",
        unit="%",
    ),
}


RISK_TAGS: List[Dict[str, str]] = [
    {"code": "porn", "name": "色情", "category": "内容合规", "severity": "high"},
    {"code": "violence", "name": "暴力", "category": "内容合规", "severity": "high"},
    {"code": "political", "name": "政治", "category": "内容合规", "severity": "high"},
    {"code": "ad", "name": "广告", "category": "商业行为", "severity": "medium"},
    {"code": "vulgar", "name": "低俗", "category": "内容合规", "severity": "medium"},
    {"code": "minor", "name": "未成年人", "category": "内容合规", "severity": "high"},
    {"code": "copyright", "name": "版权", "category": "知识产权", "severity": "medium"},
    {"code": "terrorism", "name": "暴恐", "category": "内容合规", "severity": "high"},
]


QUEUE_TYPES: List[str] = ["机器初筛", "人审-高优", "人审-普通", "人审-低优", "申诉复核"]


SHIFTS: List[Dict[str, str]] = [
    {"code": "morning", "name": "早班", "hours": "08:00-16:00"},
    {"code": "afternoon", "name": "午班", "hours": "16:00-00:00"},
    {"code": "night", "name": "夜班", "hours": "00:00-08:00"},
]


SOURCES: List[str] = ["首页推荐", "搜索结果", "用户举报", "专题活动", "达人内容"]
