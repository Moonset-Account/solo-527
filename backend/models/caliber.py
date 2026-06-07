from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum


class Severity(str, Enum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


@dataclass
class CaliberCheckResult:
    dimension: str
    metric: str
    severity: Severity
    message: str
    actual_value: Optional[float] = None
    expected_range: Optional[str] = None
    affected_records: int = 0


@dataclass
class DrilldownPath:
    dimensions: List[str] = field(default_factory=lambda: ["team", "athlete", "session", "exercise", "metric"])
    current_level: int = 0
    filters: dict = field(default_factory=dict)

    @property
    def current_dimension(self):
        if self.current_level < len(self.dimensions):
            return self.dimensions[self.current_level]
        return "metric"

    def drill_down(self, value):
        dim = self.current_dimension
        self.filters[dim] = value
        self.current_level = min(self.current_level + 1, len(self.dimensions) - 1)

    def drill_up(self):
        if self.current_level > 0:
            dim = self.dimensions[self.current_level - 1]
            if dim in self.filters:
                del self.filters[dim]
            self.current_level -= 1

    def reset(self):
        self.filters.clear()
        self.current_level = 0

    def describe(self):
        parts = []
        for dim, val in self.filters.items():
            dim_cn = {
                "team": "队伍", "athlete": "队员",
                "session": "训练日", "exercise": "动作", "metric": "指标",
            }.get(dim, dim)
            parts.append(f"{dim_cn}={val}")
        return " > ".join(parts) if parts else "全部"


HEARTRATE_RULES = {
    "hr_bpm_range": {"min": 30, "max": 220, "label": "心率范围(30-220bpm)"},
    "hr_zone_range": {"min": 1, "max": 5, "label": "心率区间(1-5)"},
    "hr_anomaly_threshold": {"min": 190, "max": 50, "label": "异常心率阈值(>190或<50)"},
}

PACE_RULES = {
    "pace_range": {"min": 2.5, "max": 12.0, "label": "配速范围(2.5-12.0 min/km)"},
    "distance_range": {"min": 0.1, "max": 50.0, "label": "距离范围(0.1-50km)"},
    "pace_anomaly_threshold": {"max": 9.0, "label": "配速异常阈值(>9.0 min/km)"},
}

STRENGTH_RULES = {
    "one_rm_range": {"min": 10, "max": 400, "label": "1RM范围(10-400kg)"},
    "velocity_range": {"min": 0.1, "max": 3.0, "label": "速度范围(0.1-3.0 m/s)"},
    "power_range": {"min": 50, "max": 8000, "label": "功率范围(50-8000W)"},
    "strength_drop_threshold": {"pct": 0.15, "label": "力量下降阈值(>15%下降)"},
}

TRAINING_PLAN_RULES = {
    "rpe_range": {"min": 1, "max": 10, "label": "RPE范围(1-10)"},
    "load_range": {"min": 0, "max": 300, "label": "负荷范围(0-300kg)"},
    "duration_range": {"min": 5, "max": 180, "label": "时长范围(5-180min)"},
}


def check_heartrate(records):
    results = []
    rules = HEARTRATE_RULES
    anomaly_count = 0
    for r in records:
        hr = r.get("hr_bpm") or r.get("avg_hr")
        if hr is not None:
            if hr < rules["hr_bpm_range"]["min"] or hr > rules["hr_bpm_range"]["max"]:
                anomaly_count += 1
                if anomaly_count <= 5:
                    results.append(CaliberCheckResult(
                        dimension="heartrate", metric="hr_bpm",
                        severity=Severity.ERROR,
                        message=f"心率{hr}bpm超出合理范围[{rules['hr_bpm_range']['min']}-{rules['hr_bpm_range']['max']}]",
                        actual_value=hr,
                        expected_range=f"{rules['hr_bpm_range']['min']}-{rules['hr_bpm_range']['max']}",
                    ))
    if anomaly_count > 5:
        results.append(CaliberCheckResult(
            dimension="heartrate", metric="hr_bpm",
            severity=Severity.WARNING,
            message=f"共{anomaly_count}条心率记录超出合理范围",
            affected_records=anomaly_count,
        ))
    return results


def check_pace(records):
    results = []
    rules = PACE_RULES
    anomaly_count = 0
    for r in records:
        pace = r.get("pace_min_per_km") or r.get("avg_pace")
        if pace is not None:
            if pace < rules["pace_range"]["min"] or pace > rules["pace_range"]["max"]:
                anomaly_count += 1
                if anomaly_count <= 5:
                    results.append(CaliberCheckResult(
                        dimension="pace", metric="pace_min_per_km",
                        severity=Severity.WARNING,
                        message=f"配速{pace}min/km超出合理范围[{rules['pace_range']['min']}-{rules['pace_range']['max']}]",
                        actual_value=pace,
                        expected_range=f"{rules['pace_range']['min']}-{rules['pace_range']['max']}",
                    ))
    if anomaly_count > 5:
        results.append(CaliberCheckResult(
            dimension="pace", metric="pace_min_per_km",
            severity=Severity.WARNING,
            message=f"共{anomaly_count}条配速记录超出合理范围",
            affected_records=anomaly_count,
        ))
    return results


def check_strength(records):
    results = []
    rules = STRENGTH_RULES
    by_athlete_exercise = {}
    for r in records:
        key = (r.get("athlete_id"), r.get("exercise_name"))
        by_athlete_exercise.setdefault(key, []).append(r)

    for key, recs in by_athlete_exercise.items():
        sorted_recs = sorted(recs, key=lambda x: x.get("test_date", ""))
        for i in range(1, len(sorted_recs)):
            prev_rm = sorted_recs[i - 1].get("one_rm_kg")
            curr_rm = sorted_recs[i].get("one_rm_kg")
            if prev_rm and curr_rm and prev_rm > 0:
                drop = (prev_rm - curr_rm) / prev_rm
                if drop > rules["strength_drop_threshold"]["pct"]:
                    results.append(CaliberCheckResult(
                        dimension="strength", metric="one_rm_kg",
                        severity=Severity.WARNING,
                        message=f"队员{key[0]} {key[1]}力量下降{drop:.0%}(从{prev_rm}kg到{curr_rm}kg)",
                        actual_value=curr_rm,
                        expected_range=f">={prev_rm * (1 - rules['strength_drop_threshold']['pct']):.1f}kg",
                    ))

        for r in recs:
            rm = r.get("one_rm_kg")
            if rm and (rm < rules["one_rm_range"]["min"] or rm > rules["one_rm_range"]["max"]):
                results.append(CaliberCheckResult(
                    dimension="strength", metric="one_rm_kg",
                    severity=Severity.ERROR,
                    message=f"1RM {rm}kg超出合理范围[{rules['one_rm_range']['min']}-{rules['one_rm_range']['max']}]",
                    actual_value=rm,
                    expected_range=f"{rules['one_rm_range']['min']}-{rules['one_rm_range']['max']}",
                ))
    return results


def check_training_plan(records):
    results = []
    rules = TRAINING_PLAN_RULES
    rpe_anomaly = 0
    for r in records:
        rpe = r.get("rpe") or r.get("actual_rpe")
        if rpe is not None:
            if rpe < rules["rpe_range"]["min"] or rpe > rules["rpe_range"]["max"]:
                rpe_anomaly += 1
                if rpe_anomaly <= 3:
                    results.append(CaliberCheckResult(
                        dimension="training_plan", metric="rpe",
                        severity=Severity.ERROR,
                        message=f"RPE {rpe}超出合理范围[{rules['rpe_range']['min']}-{rules['rpe_range']['max']}]",
                        actual_value=rpe,
                        expected_range=f"{rules['rpe_range']['min']}-{rules['rpe_range']['max']}",
                    ))
    if rpe_anomaly > 3:
        results.append(CaliberCheckResult(
            dimension="training_plan", metric="rpe",
            severity=Severity.WARNING,
            message=f"共{rpe_anomaly}条训练记录RPE超出合理范围",
            affected_records=rpe_anomaly,
        ))
    return results


def run_all_checks(data_by_dimension):
    all_results = []
    checkers = {
        "heartrate": check_heartrate,
        "pace": check_pace,
        "strength": check_strength,
        "training_plan": check_training_plan,
    }
    for dim, records in data_by_dimension.items():
        checker = checkers.get(dim)
        if checker and records:
            all_results.extend(checker(records))
    return all_results


def format_check_summary(results):
    if not results:
        return "口径校验通过，未发现异常。"
    errors = [r for r in results if r.severity == Severity.ERROR]
    warnings = [r for r in results if r.severity == Severity.WARNING]
    lines = []
    if errors:
        lines.append(f"严重问题({len(errors)}条):")
        for e in errors[:10]:
            lines.append(f"  [{e.dimension}/{e.metric}] {e.message}")
    if warnings:
        lines.append(f"警告({len(warnings)}条):")
        for w in warnings[:10]:
            lines.append(f"  [{w.dimension}/{w.metric}] {w.message}")
    return "\n".join(lines)
