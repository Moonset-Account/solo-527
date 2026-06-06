import pandas as pd
import numpy as np
from datetime import datetime, date
from typing import List, Dict, Optional, Tuple
from sqlalchemy import func, and_, or_, Integer, case
from database import get_session, Candidate, StageTransition, CandidateFeedback, SavedFilter, DataQualityLog
from config import Config


class DataService:
    def __init__(self):
        self.session = get_session()

    def close(self):
        self.session.close()

    def _build_filter_query(self, query, filters: Dict):
        if filters.get("positions"):
            query = query.filter(Candidate.position.in_(filters["positions"]))
        if filters.get("departments"):
            query = query.filter(Candidate.department.in_(filters["departments"]))
        if filters.get("recruiters"):
            query = query.filter(Candidate.recruiter.in_(filters["recruiters"]))
        if filters.get("channels"):
            query = query.filter(Candidate.channel.in_(filters["channels"]))
        if filters.get("stages"):
            query = query.filter(Candidate.current_stage.in_(filters["stages"]))
        if filters.get("date_range"):
            start_date, end_date = filters["date_range"]
            if start_date:
                query = query.filter(Candidate.application_date >= start_date)
            if end_date:
                query = query.filter(Candidate.application_date <= end_date)
        return query

    def get_dimension_options(self) -> Dict:
        candidates = self.session.query(Candidate).all()
        return {
            "positions": sorted(list(set([c.position for c in candidates]))),
            "departments": sorted(list(set([c.department for c in candidates]))),
            "recruiters": sorted(list(set([c.recruiter for c in candidates]))),
            "channels": sorted(list(set([c.channel for c in candidates]))),
            "stages": Config.STAGES,
            "interviewers": sorted(
                list(
                    set(
                        [
                            t.interviewer
                            for t in self.session.query(StageTransition).filter(StageTransition.interviewer.isnot(None)).all()
                        ]
                    )
                )
            ),
        }

    def get_funnel_data(self, filters: Dict = None, group_by: str = None) -> pd.DataFrame:
        filters = filters or {}
        query = self.session.query(
            StageTransition.stage_name,
            StageTransition.stage_order,
            func.count(StageTransition.candidate_id.distinct()).label("count"),
        )

        if group_by and group_by in ["position", "department", "recruiter", "channel"]:
            query = query.add_columns(getattr(Candidate, group_by).label("group"))
            query = query.join(Candidate, Candidate.id == StageTransition.candidate_id)
            query = self._build_filter_query(query, filters)
            query = query.group_by(StageTransition.stage_name, StageTransition.stage_order, "group")
        else:
            query = query.join(Candidate, Candidate.id == StageTransition.candidate_id)
            query = self._build_filter_query(query, filters)
            query = query.group_by(StageTransition.stage_name, StageTransition.stage_order)

        query = query.order_by(StageTransition.stage_order)

        df = pd.read_sql(query.statement, query.session.bind)

        if not df.empty:
            df["stage_name"] = pd.Categorical(df["stage_name"], categories=Config.STAGES, ordered=True)
            df = df.sort_values("stage_order")

        return df

    def get_stage_duration_data(self, filters: Dict = None, group_by: str = None) -> pd.DataFrame:
        filters = filters or {}
        query = self.session.query(
            StageTransition.stage_name,
            StageTransition.stage_order,
            StageTransition.duration_days,
        )

        if group_by and group_by in ["position", "department", "recruiter", "channel"]:
            query = query.add_columns(getattr(Candidate, group_by).label("group"))
            query = query.join(Candidate, Candidate.id == StageTransition.candidate_id)
            query = self._build_filter_query(query, filters)
        else:
            query = query.join(Candidate, Candidate.id == StageTransition.candidate_id)
            query = self._build_filter_query(query, filters)

        query = query.filter(StageTransition.duration_days.isnot(None))
        df_raw = pd.read_sql(query.statement, query.session.bind)

        if df_raw.empty:
            return pd.DataFrame()

        group_cols = ["stage_name", "stage_order"]
        if group_by:
            group_cols.append("group")

        df = df_raw.groupby(group_cols, as_index=False).agg(
            avg_duration=("duration_days", "mean"),
            median_duration=("duration_days", "median"),
            p75_duration=("duration_days", lambda x: x.quantile(0.75)),
            count=("duration_days", "count"),
        )

        df["stage_name"] = pd.Categorical(df["stage_name"], categories=Config.STAGES, ordered=True)
        df = df.sort_values("stage_order")
        for col in ["avg_duration", "median_duration", "p75_duration"]:
            df[col] = df[col].round(1)

        return df

    def get_channel_quality_data(self, filters: Dict = None) -> pd.DataFrame:
        filters = filters or {}
        query = self.session.query(Candidate)
        query = self._build_filter_query(query, filters)
        df_candidates = pd.read_sql(query.statement, query.session.bind)

        if df_candidates.empty:
            return pd.DataFrame()

        transitions_query = (
            self.session.query(StageTransition)
            .join(Candidate, Candidate.id == StageTransition.candidate_id)
            .filter(StageTransition.stage_name.in_(["一面", "二面", "HR面"]))
        )
        transitions_query = self._build_filter_query(transitions_query, filters)
        df_transitions = pd.read_sql(transitions_query.statement, transitions_query.session.bind)

        interview_counts = (
            df_transitions.groupby("candidate_id")
            .first()
            .reset_index()
            .merge(df_candidates[["id", "channel"]], left_on="candidate_id", right_on="id")
            .groupby("channel")
            .size()
            .reset_index(name="interview_count")
        )

        df = df_candidates.groupby("channel").agg(
            total_candidates=("id", "count"),
            hired_count=("current_stage", lambda x: (x == "入职").sum()),
        ).reset_index()

        df = df.merge(interview_counts, on="channel", how="left")
        df["interview_count"] = df["interview_count"].fillna(0).astype(int)

        df["interview_rate"] = (df["interview_count"] / df["total_candidates"] * 100).round(1)
        df["conversion_rate"] = (df["hired_count"] / df["total_candidates"] * 100).round(1)
        df["interview_to_hire"] = df.apply(
            lambda x: round(x["hired_count"] / x["interview_count"] * 100, 1)
            if x["interview_count"] > 0
            else 0,
            axis=1,
        )

        return df

    def get_interviewer_workload(self, filters: Dict = None) -> pd.DataFrame:
        filters = filters or {}
        query = (
            self.session.query(
                StageTransition.interviewer,
                func.count(StageTransition.id).label("total_interviews"),
                StageTransition.stage_name,
                func.count(StageTransition.candidate_id.distinct()).label("candidates_count"),
            )
            .join(Candidate, Candidate.id == StageTransition.candidate_id)
            .filter(StageTransition.interviewer.isnot(None))
            .filter(StageTransition.stage_name.in_(["一面", "二面", "HR面"]))
        )

        query = self._build_filter_query(query, filters)
        query = query.group_by(StageTransition.interviewer, StageTransition.stage_name)
        query = query.order_by(func.count(StageTransition.id).desc())

        df = pd.read_sql(query.statement, query.session.bind)
        return df

    def get_feedback_data(self, filters: Dict = None, group_by: str = None) -> pd.DataFrame:
        filters = filters or {}
        query = self.session.query(
            func.avg(CandidateFeedback.overall_rating).label("avg_overall"),
            func.avg(CandidateFeedback.interview_experience).label("avg_interview"),
            func.avg(CandidateFeedback.communication_rating).label("avg_communication"),
            func.avg(CandidateFeedback.process_speed_rating).label("avg_speed"),
            func.count(CandidateFeedback.id).label("feedback_count"),
        )

        if group_by and group_by in ["position", "department", "recruiter", "channel"]:
            query = query.add_columns(getattr(Candidate, group_by).label("group"))
            query = query.join(Candidate, Candidate.id == CandidateFeedback.candidate_id)
            query = self._build_filter_query(query, filters)
            query = query.group_by("group")
        else:
            query = query.join(Candidate, Candidate.id == CandidateFeedback.candidate_id)
            query = self._build_filter_query(query, filters)

        df = pd.read_sql(query.statement, query.session.bind)

        if not df.empty:
            for col in ["avg_overall", "avg_interview", "avg_communication", "avg_speed"]:
                df[col] = df[col].round(2)

        return df

    def get_monthly_trend_data(self, filters: Dict = None) -> pd.DataFrame:
        filters = filters or {}
        query = (
            self.session.query(
                func.strftime("%Y-%m", Candidate.application_date).label("month"),
                Candidate.current_stage,
                func.count(Candidate.id).label("count"),
            )
            .group_by("month", Candidate.current_stage)
            .order_by("month")
        )
        query = self._build_filter_query(query, filters)

        df = pd.read_sql(query.statement, query.session.bind)
        return df

    def get_candidate_details(self, filters: Dict = None, stage: str = None) -> pd.DataFrame:
        filters = filters or {}
        query = self.session.query(Candidate)

        if stage:
            query = query.filter(Candidate.current_stage == stage)

        query = self._build_filter_query(query, filters)
        df = pd.read_sql(query.statement, query.session.bind)
        return df

    def save_filter(self, name: str, filter_config: str, created_by: str = "user") -> int:
        saved = SavedFilter(
            name=name,
            filter_config=filter_config,
            created_by=created_by,
        )
        self.session.add(saved)
        self.session.commit()
        return saved.id

    def get_saved_filters(self) -> List[Dict]:
        filters = self.session.query(SavedFilter).order_by(SavedFilter.created_at.desc()).all()
        return [
            {
                "id": f.id,
                "name": f.name,
                "filter_config": f.filter_config,
                "created_by": f.created_by,
                "created_at": f.created_at.strftime("%Y-%m-%d %H:%M"),
            }
            for f in filters
        ]

    def delete_filter(self, filter_id: int) -> bool:
        try:
            filt = self.session.query(SavedFilter).filter(SavedFilter.id == filter_id).first()
            if filt:
                self.session.delete(filt)
                self.session.commit()
                return True
            return False
        except Exception:
            self.session.rollback()
            return False

    def check_data_quality(self) -> List[Dict]:
        issues = []

        null_counts = (
            self.session.query(
                func.sum(func.cast(Candidate.position.is_(None), Integer)).label("position_null"),
                func.sum(func.cast(Candidate.department.is_(None), Integer)).label("department_null"),
                func.sum(func.cast(Candidate.channel.is_(None), Integer)).label("channel_null"),
                func.sum(func.cast(Candidate.recruiter.is_(None), Integer)).label("recruiter_null"),
            )
            .first()
        )

        if null_counts.position_null and null_counts.position_null > 0:
            issues.append(
                {
                    "severity": "error",
                    "message": f"发现 {null_counts.position_null} 条候选人数据缺少职位信息",
                    "field": "position",
                }
            )

        if null_counts.department_null and null_counts.department_null > 0:
            issues.append(
                {
                    "severity": "error",
                    "message": f"发现 {null_counts.department_null} 条候选人数据缺少部门信息",
                    "field": "department",
                }
            )

        transition_issues = (
            self.session.query(StageTransition)
            .filter(
                StageTransition.exit_date.isnot(None),
                StageTransition.enter_date > StageTransition.exit_date,
            )
            .count()
        )

        if transition_issues > 0:
            issues.append(
                {
                    "severity": "warning",
                    "message": f"发现 {transition_issues} 条阶段流转数据存在日期逻辑错误（进入日期晚于退出日期）",
                    "field": "stage_transitions.dates",
                }
            )

        orphan_transitions = (
            self.session.query(StageTransition)
            .outerjoin(Candidate)
            .filter(Candidate.id.is_(None))
            .count()
        )

        if orphan_transitions > 0:
            issues.append(
                {
                    "severity": "error",
                    "message": f"发现 {orphan_transitions} 条阶段流转数据没有关联的候选人",
                    "field": "stage_transitions.candidate_id",
                }
            )

        return issues

    def get_summary_stats(self, filters: Dict = None) -> Dict:
        filters = filters or {}
        query = self.session.query(Candidate)
        query = self._build_filter_query(query, filters)
        total = query.count()

        stage_counts = (
            self.session.query(Candidate.current_stage, func.count(Candidate.id))
            .filter(Candidate.id.in_([c.id for c in query.all()]))
            .group_by(Candidate.current_stage)
            .all()
        )

        hired = sum([cnt for stage, cnt in stage_counts if stage == "入职"])

        avg_duration_df = self.get_stage_duration_data(filters)
        total_cycle_days = 0
        if not avg_duration_df.empty:
            total_cycle_days = avg_duration_df["avg_duration"].sum()

        return {
            "total_candidates": total,
            "hired_count": hired,
            "conversion_rate": round(hired / total * 100, 1) if total > 0 else 0,
            "avg_cycle_days": round(total_cycle_days, 1),
            "in_process_count": sum(
                [
                    cnt
                    for stage, cnt in stage_counts
                    if stage in ["简历筛选", "一面", "二面", "HR面", "Offer发放"]
                ]
            ),
        }
