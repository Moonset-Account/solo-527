import os
import io
import csv
import json
from datetime import date, timedelta

import dash
from dash import dcc, html, Input, Output, State, ctx, ALL, MATCH
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import pandas as pd
from sqlalchemy import func

from backend.db.database import SessionLocal
from backend.models.schema import (
    Athlete, HeartRate, Pace, StrengthTest, RecoveryScore,
    Injury, TrainingPlan, TrainingSession, TrainingExercise, TrainingLog, User,
)
from backend.models.caliber import (
    DrilldownPath, run_all_checks, format_check_summary,
    HEARTRATE_RULES, PACE_RULES, STRENGTH_RULES, TRAINING_PLAN_RULES,
)

app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.DARKLY],
    suppress_callback_exceptions=True,
    title="运动训练负荷可视化",
)
server = app.server

C = {
    "bg": "#0b0e14",
    "card": "#151922",
    "border": "#262d3d",
    "primary": "#4f8cff",
    "success": "#36d399",
    "warning": "#fbbd23",
    "danger": "#f87272",
    "text": "#e2e8f0",
    "muted": "#8892a4",
    "colors": ["#4f8cff", "#36d399", "#fbbd23", "#f87272", "#a78bfa", "#fb923c", "#22d3ee", "#f472b6"],
}

DRILL_LEVELS = ["team", "athlete", "program", "training_day", "exercise", "metric"]
DRILL_LABELS = {"team": "队伍", "athlete": "队员", "program": "训练计划", "training_day": "训练日", "exercise": "动作", "metric": "指标"}


def _card(title, children):
    return dbc.Card(dbc.CardBody([
        html.H6(title, className="card-title mb-2", style={"color": C["primary"], "fontSize": "0.82rem"}),
        *children,
    ]), style={"backgroundColor": C["card"], "borderColor": C["border"]})


def _user(uid_str):
    s = SessionLocal()
    try:
        return s.query(User).filter_by(id=int(uid_str or "1")).first()
    finally:
        s.close()


def _merge_params(sd, ed, team, ath_id, program, stype, exercise, drill_filters):
    p = {}
    if sd: p["start_date"] = sd
    if ed: p["end_date"] = ed
    if stype: p["session_type"] = stype
    if team: p["team"] = team
    if ath_id: p["athlete_id"] = str(ath_id)
    if program: p["program"] = program
    if exercise: p["exercise_name"] = exercise
    for dim in DRILL_LEVELS:
        val = drill_filters.get(dim)
        if val and dim not in p:
            if dim == "athlete":
                name_to_id = _athlete_name_to_id()
                aid = name_to_id.get(val)
                if aid: p["athlete_id"] = str(aid)
            elif dim == "training_day":
                p["start_date"] = val
                p["end_date"] = val
            else:
                p[dim] = val
    return p


_ATH_NAME_MAP = None

def _athlete_name_to_id():
    global _ATH_NAME_MAP
    if _ATH_NAME_MAP is None:
        s = SessionLocal()
        try:
            _ATH_NAME_MAP = {a.name: a.id for a in s.query(Athlete).all()}
        finally:
            s.close()
    return _ATH_NAME_MAP


def _query_agg(group_by, params, user):
    s = SessionLocal()
    try:
        q = s.query(
            Athlete.team, Athlete.id.label("athlete_id"), Athlete.name.label("athlete_name"),
            TrainingPlan.name.label("program_name"),
            TrainingSession.session_date, TrainingSession.session_type,
            TrainingExercise.exercise_name, TrainingExercise.exercise_category,
            TrainingLog.actual_rpe, TrainingLog.actual_duration_min,
        ).join(TrainingLog, TrainingLog.athlete_id == Athlete.id
        ).join(TrainingSession, TrainingLog.session_id == TrainingSession.id
        ).join(TrainingExercise, TrainingLog.exercise_id == TrainingExercise.id
        ).join(TrainingPlan, TrainingSession.plan_id == TrainingPlan.id)

        if user and user.role == "athlete":
            q = q.filter(Athlete.id == user.athlete_id)
        if params.get("team"): q = q.filter(Athlete.team == params["team"])
        if params.get("athlete_id"): q = q.filter(Athlete.id == int(params["athlete_id"]))
        if params.get("program"): q = q.filter(TrainingPlan.name == params["program"])
        if params.get("start_date"): q = q.filter(TrainingSession.session_date >= params["start_date"])
        if params.get("end_date"): q = q.filter(TrainingSession.session_date <= params["end_date"])
        if params.get("session_type"): q = q.filter(TrainingSession.session_type == params["session_type"])
        if params.get("exercise_name"): q = q.filter(TrainingExercise.exercise_name == params["exercise_name"])

        rows = q.limit(8000).all()
        df = pd.DataFrame([{
            "team": r.team, "athlete_id": r.athlete_id, "athlete_name": r.athlete_name,
            "program": r.program_name, "training_day": r.session_date.isoformat() if r.session_date else None,
            "exercise_name": r.exercise_name, "exercise_category": r.exercise_category,
            "rpe": r.actual_rpe,
            "load": round((r.actual_rpe or 0) * (r.actual_duration_min or 0), 1),
        } for r in rows])

        if df.empty:
            return df

        if group_by == "team":
            return df.groupby("team").agg(load=("load", "sum"), rpe=("rpe", "mean"), count=("load", "size")).reset_index().rename(columns={"team": "key"})
        elif group_by == "athlete":
            g = df.groupby(["athlete_id", "athlete_name", "team"]).agg(load=("load", "sum"), rpe=("rpe", "mean"), count=("load", "size")).reset_index()
            g["key"] = g["athlete_name"]
            return g
        elif group_by == "program":
            g = df.groupby("program").agg(load=("load", "sum"), rpe=("rpe", "mean"), count=("load", "size")).reset_index().rename(columns={"program": "key"})
            return g
        elif group_by == "training_day":
            g = df.groupby("training_day").agg(load=("load", "sum"), rpe=("rpe", "mean"), count=("load", "size")).reset_index().rename(columns={"training_day": "key"})
            return g
        elif group_by == "exercise":
            g = df.groupby(["exercise_name", "exercise_category"]).agg(load=("load", "sum"), rpe=("rpe", "mean"), count=("load", "size")).reset_index()
            g["key"] = g["exercise_name"]
            return g
        else:
            df["key"] = df["training_day"]
            return df.groupby("key").agg(load=("load", "sum"), rpe=("rpe", "mean"), count=("load", "size")).reset_index()
    finally:
        s.close()


def _query_hr(params, user):
    s = SessionLocal()
    try:
        q = s.query(
            Athlete.id.label("athlete_id"), Athlete.name.label("athlete_name"), Athlete.team,
            func.date(HeartRate.recorded_at).label("date"),
            func.avg(HeartRate.hr_bpm).label("avg_hr"),
            func.max(HeartRate.hr_bpm).label("max_hr"),
            func.min(HeartRate.hr_bpm).label("min_hr"),
        ).join(HeartRate, HeartRate.athlete_id == Athlete.id)
        if user and user.role == "athlete": q = q.filter(Athlete.id == user.athlete_id)
        if params.get("athlete_id"): q = q.filter(Athlete.id == int(params["athlete_id"]))
        if params.get("team"): q = q.filter(Athlete.team == params["team"])
        if params.get("start_date"): q = q.filter(HeartRate.recorded_at >= params["start_date"])
        if params.get("end_date"): q = q.filter(HeartRate.recorded_at <= params["end_date"] + " 23:59:59")
        q = q.group_by(Athlete.id, Athlete.name, Athlete.team, func.date(HeartRate.recorded_at))
        rows = q.limit(3000).all()
        return pd.DataFrame([{
            "athlete_id": r.athlete_id, "athlete_name": r.athlete_name, "team": r.team,
            "date": r.date, "avg_hr": round(r.avg_hr, 1), "max_hr": r.max_hr, "min_hr": r.min_hr,
        } for r in rows])
    finally:
        s.close()


def _query_hr_detail(params, user):
    s = SessionLocal()
    try:
        q = s.query(HeartRate).join(Athlete, HeartRate.athlete_id == Athlete.id)
        if user and user.role == "athlete": q = q.filter(Athlete.id == user.athlete_id)
        if params.get("athlete_id"): q = q.filter(HeartRate.athlete_id == int(params["athlete_id"]))
        if params.get("team"): q = q.filter(Athlete.team == params["team"])
        if params.get("start_date"): q = q.filter(HeartRate.recorded_at >= params["start_date"])
        if params.get("end_date"): q = q.filter(HeartRate.recorded_at <= params["end_date"] + " 23:59:59")
        q = q.filter(HeartRate.is_anomaly == True)
        rows = q.order_by(HeartRate.recorded_at.desc()).limit(200).all()
        out = []
        for r in rows:
            ath = s.query(Athlete).filter_by(id=r.athlete_id).first()
            out.append({
                "id": r.id, "athlete_id": r.athlete_id, "athlete_name": ath.name if ath else None,
                "team": ath.team if ath else None, "recorded_at": r.recorded_at.isoformat(),
                "hr_bpm": r.hr_bpm, "hr_zone": r.hr_zone,
                "activity": r.activity, "is_anomaly": r.is_anomaly, "notes": r.notes,
            })
        return pd.DataFrame(out)
    finally:
        s.close()


def _query_pace(params, user):
    s = SessionLocal()
    try:
        q = s.query(
            Athlete.id.label("athlete_id"), Athlete.name.label("athlete_name"), Athlete.team,
            func.date(Pace.recorded_at).label("date"),
            func.avg(Pace.pace_min_per_km).label("avg_pace"),
            func.min(Pace.pace_min_per_km).label("best_pace"),
            func.sum(Pace.distance_km).label("total_km"),
        ).join(Pace, Pace.athlete_id == Athlete.id)
        if user and user.role == "athlete": q = q.filter(Athlete.id == user.athlete_id)
        if params.get("athlete_id"): q = q.filter(Athlete.id == int(params["athlete_id"]))
        if params.get("team"): q = q.filter(Athlete.team == params["team"])
        if params.get("start_date"): q = q.filter(Pace.recorded_at >= params["start_date"])
        if params.get("end_date"): q = q.filter(Pace.recorded_at <= params["end_date"] + " 23:59:59")
        q = q.group_by(Athlete.id, Athlete.name, Athlete.team, func.date(Pace.recorded_at))
        rows = q.limit(3000).all()
        return pd.DataFrame([{
            "athlete_id": r.athlete_id, "athlete_name": r.athlete_name, "team": r.team,
            "date": r.date, "avg_pace": round(r.avg_pace, 2), "best_pace": round(r.best_pace, 2),
            "total_km": round(r.total_km, 1) if r.total_km else None,
        } for r in rows])
    finally:
        s.close()


def _query_pace_detail(params, user):
    s = SessionLocal()
    try:
        q = s.query(Pace).join(Athlete, Pace.athlete_id == Athlete.id)
        if user and user.role == "athlete": q = q.filter(Athlete.id == user.athlete_id)
        if params.get("athlete_id"): q = q.filter(Pace.athlete_id == int(params["athlete_id"]))
        if params.get("team"): q = q.filter(Athlete.team == params["team"])
        if params.get("start_date"): q = q.filter(Pace.recorded_at >= params["start_date"])
        if params.get("end_date"): q = q.filter(Pace.recorded_at <= params["end_date"] + " 23:59:59")
        q = q.filter(Pace.is_anomaly == True)
        rows = q.order_by(Pace.recorded_at.desc()).limit(200).all()
        out = []
        for r in rows:
            ath = s.query(Athlete).filter_by(id=r.athlete_id).first()
            out.append({
                "id": r.id, "athlete_id": r.athlete_id, "athlete_name": ath.name if ath else None,
                "team": ath.team if ath else None, "recorded_at": r.recorded_at.isoformat(),
                "pace_min_per_km": r.pace_min_per_km, "distance_km": r.distance_km,
                "duration_min": r.duration_min, "activity": r.activity,
                "is_anomaly": r.is_anomaly, "notes": r.notes,
            })
        return pd.DataFrame(out)
    finally:
        s.close()


def _query_strength(params, user):
    s = SessionLocal()
    try:
        q = s.query(StrengthTest).join(Athlete, StrengthTest.athlete_id == Athlete.id)
        if user and user.role == "athlete": q = q.filter(Athlete.id == user.athlete_id)
        if params.get("athlete_id"): q = q.filter(StrengthTest.athlete_id == int(params["athlete_id"]))
        if params.get("team"): q = q.filter(Athlete.team == params["team"])
        if params.get("start_date"): q = q.filter(StrengthTest.test_date >= params["start_date"])
        if params.get("end_date"): q = q.filter(StrengthTest.test_date <= params["end_date"])
        rows = q.limit(2000).all()
        out = []
        for r in rows:
            ath = s.query(Athlete).filter_by(id=r.athlete_id).first()
            out.append({
                "id": r.id, "athlete_id": r.athlete_id, "athlete_name": ath.name if ath else None,
                "team": ath.team if ath else None, "test_date": r.test_date.isoformat(),
                "exercise_name": r.exercise_name, "one_rm_kg": r.one_rm_kg,
                "max_reps": r.max_reps, "velocity_ms": r.velocity_ms,
                "power_w": r.power_w, "is_anomaly": r.is_anomaly, "notes": r.notes,
            })
        return pd.DataFrame(out)
    finally:
        s.close()


def _query_recovery(params, user):
    s = SessionLocal()
    try:
        q = s.query(RecoveryScore).join(Athlete, RecoveryScore.athlete_id == Athlete.id)
        if user and user.role == "athlete": q = q.filter(Athlete.id == user.athlete_id)
        if params.get("athlete_id"): q = q.filter(RecoveryScore.athlete_id == int(params["athlete_id"]))
        if params.get("team"): q = q.filter(Athlete.team == params["team"])
        if params.get("start_date"): q = q.filter(RecoveryScore.score_date >= params["start_date"])
        if params.get("end_date"): q = q.filter(RecoveryScore.score_date <= params["end_date"])
        rows = q.order_by(RecoveryScore.score_date).limit(3000).all()
        out = []
        for r in rows:
            ath = s.query(Athlete).filter_by(id=r.athlete_id).first()
            out.append({
                "id": r.id, "athlete_id": r.athlete_id, "athlete_name": ath.name if ath else None,
                "team": ath.team if ath else None, "score_date": r.score_date.isoformat(),
                "overall_score": r.overall_score, "sleep_score": r.sleep_score,
                "fatigue_score": r.fatigue_score, "stress_score": r.stress_score,
                "soreness_score": r.soreness_score, "hrv_ms": r.hrv_ms,
                "is_anomaly": r.is_anomaly, "notes": r.notes,
            })
        return pd.DataFrame(out)
    finally:
        s.close()


def _query_injuries(params, user):
    s = SessionLocal()
    try:
        q = s.query(Injury).join(Athlete, Injury.athlete_id == Athlete.id)
        if user and user.role == "athlete": q = q.filter(Athlete.id == user.athlete_id)
        if params.get("athlete_id"): q = q.filter(Injury.athlete_id == int(params["athlete_id"]))
        if params.get("team"): q = q.filter(Athlete.team == params["team"])
        rows = q.order_by(Injury.injury_date.desc()).limit(500).all()
        out = []
        for r in rows:
            ath = s.query(Athlete).filter_by(id=r.athlete_id).first()
            item = {
                "id": r.id, "athlete_id": r.athlete_id, "athlete_name": ath.name if ath else None,
                "team": ath.team if ath else None, "injury_date": r.injury_date.isoformat(),
                "body_part": r.body_part, "injury_type": r.injury_type,
                "severity": r.severity, "status": r.status,
                "return_date": r.return_date.isoformat() if r.return_date else None,
                "athlete_notes": r.athlete_notes,
            }
            if not user or user.role == "coach":
                item["coach_notes"] = r.coach_notes
            out.append(item)
        return pd.DataFrame(out)
    finally:
        s.close()


def _get_record_detail(record_type, record_id, user):
    s = SessionLocal()
    try:
        if record_type == "heartrate":
            r = s.query(HeartRate).filter_by(id=record_id).first()
            if r:
                if user and user.role == "athlete" and user.athlete_id != r.athlete_id:
                    return None
                ath = s.query(Athlete).filter_by(id=r.athlete_id).first()
                return html.Div([
                    html.H5(f"心率异常记录 #{r.id}", style={"color": C["danger"]}),
                    html.Table([
                        html.Tr([html.Td("队员", style={"color": C["muted"]}), html.Td(ath.name if ath else "")]),
                        html.Tr([html.Td("时间", style={"color": C["muted"]}), html.Td(r.recorded_at.isoformat())]),
                        html.Tr([html.Td("心率", style={"color": C["muted"]}), html.Td(f"{r.hr_bpm} bpm")]),
                        html.Tr([html.Td("心率区间", style={"color": C["muted"]}), html.Td(str(r.hr_zone))]),
                        html.Tr([html.Td("活动", style={"color": C["muted"]}), html.Td(r.activity or "")]),
                        html.Tr([html.Td("备注", style={"color": C["muted"]}), html.Td(r.notes or "无")]),
                    ], style={"fontSize": "0.85rem", "color": C["text"]}),
                ])
        elif record_type == "pace":
            r = s.query(Pace).filter_by(id=record_id).first()
            if r:
                if user and user.role == "athlete" and user.athlete_id != r.athlete_id:
                    return None
                ath = s.query(Athlete).filter_by(id=r.athlete_id).first()
                return html.Div([
                    html.H5(f"配速异常记录 #{r.id}", style={"color": C["danger"]}),
                    html.Table([
                        html.Tr([html.Td("队员", style={"color": C["muted"]}), html.Td(ath.name if ath else "")]),
                        html.Tr([html.Td("时间", style={"color": C["muted"]}), html.Td(r.recorded_at.isoformat())]),
                        html.Tr([html.Td("配速", style={"color": C["muted"]}), html.Td(f"{r.pace_min_per_km} min/km")]),
                        html.Tr([html.Td("距离", style={"color": C["muted"]}), html.Td(f"{r.distance_km} km")]),
                        html.Tr([html.Td("时长", style={"color": C["muted"]}), html.Td(f"{r.duration_min} min")]),
                        html.Tr([html.Td("活动", style={"color": C["muted"]}), html.Td(r.activity or "")]),
                        html.Tr([html.Td("备注", style={"color": C["muted"]}), html.Td(r.notes or "无")]),
                    ], style={"fontSize": "0.85rem", "color": C["text"]}),
                ])
        elif record_type == "strength":
            r = s.query(StrengthTest).filter_by(id=record_id).first()
            if r:
                if user and user.role == "athlete" and user.athlete_id != r.athlete_id:
                    return None
                ath = s.query(Athlete).filter_by(id=r.athlete_id).first()
                return html.Div([
                    html.H5(f"力量测试异常记录 #{r.id}", style={"color": C["danger"]}),
                    html.Table([
                        html.Tr([html.Td("队员", style={"color": C["muted"]}), html.Td(ath.name if ath else "")]),
                        html.Tr([html.Td("测试日", style={"color": C["muted"]}), html.Td(r.test_date.isoformat())]),
                        html.Tr([html.Td("动作", style={"color": C["muted"]}), html.Td(r.exercise_name)]),
                        html.Tr([html.Td("1RM", style={"color": C["muted"]}), html.Td(f"{r.one_rm_kg} kg")]),
                        html.Tr([html.Td("最大次数", style={"color": C["muted"]}), html.Td(str(r.max_reps))]),
                        html.Tr([html.Td("速度", style={"color": C["muted"]}), html.Td(f"{r.velocity_ms} m/s" if r.velocity_ms else "")]),
                        html.Tr([html.Td("功率", style={"color": C["muted"]}), html.Td(f"{r.power_w} W" if r.power_w else "")]),
                        html.Tr([html.Td("备注", style={"color": C["muted"]}), html.Td(r.notes or "无")]),
                    ], style={"fontSize": "0.85rem", "color": C["text"]}),
                ])
        elif record_type == "recovery":
            r = s.query(RecoveryScore).filter_by(id=record_id).first()
            if r:
                if user and user.role == "athlete" and user.athlete_id != r.athlete_id:
                    return None
                ath = s.query(Athlete).filter_by(id=r.athlete_id).first()
                return html.Div([
                    html.H5(f"恢复评分异常记录 #{r.id}", style={"color": C["danger"]}),
                    html.Table([
                        html.Tr([html.Td("队员", style={"color": C["muted"]}), html.Td(ath.name if ath else "")]),
                        html.Tr([html.Td("日期", style={"color": C["muted"]}), html.Td(r.score_date.isoformat())]),
                        html.Tr([html.Td("综合评分", style={"color": C["muted"]}), html.Td(str(r.overall_score))]),
                        html.Tr([html.Td("睡眠", style={"color": C["muted"]}), html.Td(str(r.sleep_score))]),
                        html.Tr([html.Td("疲劳", style={"color": C["muted"]}), html.Td(str(r.fatigue_score))]),
                        html.Tr([html.Td("压力", style={"color": C["muted"]}), html.Td(str(r.stress_score))]),
                        html.Tr([html.Td("酸痛", style={"color": C["muted"]}), html.Td(str(r.soreness_score))]),
                        html.Tr([html.Td("HRV(ms)", style={"color": C["muted"]}), html.Td(str(r.hrv_ms))]),
                        html.Tr([html.Td("备注", style={"color": C["muted"]}), html.Td(r.notes or "无")]),
                    ], style={"fontSize": "0.85rem", "color": C["text"]}),
                ])
    finally:
        s.close()
    return None


app.layout = html.Div([
    dcc.Store(id="drilldown-state", data={"level": 0, "filters": {}}),
    dcc.Download(id="download-export"),

    html.Div([
        html.H4("运动训练负荷可视化", style={"color": C["primary"], "margin": 0, "fontWeight": "bold"}),
        html.Span("体能教练日常复盘平台", style={"color": C["muted"], "fontSize": "0.8rem", "marginLeft": "1rem"}),
    ], style={"marginBottom": "0.3rem"}),

    html.Div(id="breadcrumb", style={"color": C["warning"], "fontSize": "0.78rem", "marginBottom": "0.8rem"}),

    dbc.Row([
        dbc.Col([html.Label("队伍", style={"color": C["muted"], "fontSize": "0.72rem"}),
                 dcc.Dropdown(id="f-team", placeholder="全部", clearable=True)], width=2),
        dbc.Col([html.Label("队员", style={"color": C["muted"], "fontSize": "0.72rem"}),
                 dcc.Dropdown(id="f-athlete", placeholder="全部", clearable=True)], width=2),
        dbc.Col([html.Label("日期", style={"color": C["muted"], "fontSize": "0.72rem"}),
                 dcc.DatePickerRange(id="f-date",
                                     start_date=(date.today() - timedelta(days=28)).isoformat(),
                                     end_date=date.today().isoformat())], width=3),
        dbc.Col([html.Label("训练类型", style={"color": C["muted"], "fontSize": "0.72rem"}),
                 dcc.Dropdown(id="f-stype", placeholder="全部", clearable=True)], width=2),
        dbc.Col([html.Label("角色", style={"color": C["muted"], "fontSize": "0.72rem"}),
                 dcc.Dropdown(id="f-role", options=[{"label": "教练", "value": "coach"}, {"label": "队员", "value": "athlete"}],
                              value="coach", clearable=False)], width=2),
        dbc.Col([html.Label("导出", style={"color": C["muted"], "fontSize": "0.72rem"}),
                 dbc.Button("CSV", id="btn-csv", size="sm", color="primary", outline=True)], width=1),
    ], className="mb-3 g-2"),

    dbc.Row(id="summary-row", className="mb-3"),

    dcc.Tabs(id="tab-main", value="tab-load", children=[
        dcc.Tab(label="负荷趋势与下钻", value="tab-load", style={"backgroundColor": C["card"], "color": C["text"]},
                selected_style={"backgroundColor": C["primary"], "color": "#fff"}),
        dcc.Tab(label="心率", value="tab-hr", style={"backgroundColor": C["card"], "color": C["text"]},
                selected_style={"backgroundColor": C["primary"], "color": "#fff"}),
        dcc.Tab(label="配速", value="tab-pace", style={"backgroundColor": C["card"], "color": C["text"]},
                selected_style={"backgroundColor": C["primary"], "color": "#fff"}),
        dcc.Tab(label="力量测试", value="tab-str", style={"backgroundColor": C["card"], "color": C["text"]},
                selected_style={"backgroundColor": C["primary"], "color": "#fff"}),
        dcc.Tab(label="恢复评分", value="tab-rec", style={"backgroundColor": C["card"], "color": C["text"]},
                selected_style={"backgroundColor": C["primary"], "color": "#fff"}),
        dcc.Tab(label="伤病记录", value="tab-inj", style={"backgroundColor": C["card"], "color": C["text"]},
                selected_style={"backgroundColor": C["primary"], "color": "#fff"}),
        dcc.Tab(label="口径校验", value="tab-cal", style={"backgroundColor": C["card"], "color": C["text"]},
                selected_style={"backgroundColor": C["primary"], "color": "#fff"}),
    ]),

    html.Div(id="tab-content", className="mt-3"),

    dbc.Modal([
        dbc.ModalHeader(dbc.ModalTitle("原始记录详情")),
        dbc.ModalBody(id="modal-detail-body"),
        dbc.ModalFooter(dbc.Button("关闭", id="btn-close-detail", className="ms-auto")),
    ], id="modal-detail", is_open=False, size="lg", style={"color": C["text"]}),

    dbc.Modal([
        dbc.ModalHeader(dbc.ModalTitle("口径校验报告")),
        dbc.ModalBody(id="modal-caliber-body", style={"whiteSpace": "pre-wrap", "fontFamily": "monospace"}),
        dbc.ModalFooter(dbc.Button("关闭", id="btn-close-caliber", className="ms-auto")),
    ], id="modal-caliber", is_open=False, size="lg", style={"color": C["text"]}),
], style={"backgroundColor": C["bg"], "minHeight": "100vh", "padding": "1.2rem 1.5rem"})


@app.callback([Output("f-team", "options"), Output("f-stype", "options"), Output("f-athlete", "options")],
          [Input("f-date", "start_date"), Input("f-team", "value"), Input("f-role", "value")])
def load_filters(_, team, role):
    s = SessionLocal()
    try:
        teams = [t[0] for t in s.query(Athlete.team).distinct().all()]
        stypes = [t[0] for t in s.query(TrainingSession.session_type).distinct().all() if t[0]]
        q = s.query(Athlete)
        if role == "athlete": q = q.filter(Athlete.id == 1)
        if team: q = q.filter(Athlete.team == team)
        aths = q.all()
    finally:
        s.close()
    return ([{"label": t, "value": t} for t in teams],
            [{"label": t, "value": t} for t in stypes],
            [{"label": a.name, "value": a.id} for a in aths])


@app.callback(Output("breadcrumb", "children"), Input("drilldown-state", "data"))
def update_breadcrumb(ds):
    ds = ds or {"level": 0, "filters": {}}
    level = ds.get("level", 0)
    filters = ds.get("filters", {})
    if level == 0:
        return "📍 全部（点击图表柱下钻）"
    parts = ["📍 全部"]
    for dim in DRILL_LEVELS[:level]:
        val = filters.get(dim, "?")
        parts.append(f"{DRILL_LABELS.get(dim, dim)}={val}")
    return " > ".join(parts)


@app.callback([Output("summary-row", "children"), Output("tab-content", "children")],
          [Input("f-team", "value"), Input("f-athlete", "value"),
           Input("f-date", "start_date"), Input("f-date", "end_date"),
           Input("f-stype", "value"), Input("f-role", "value"),
           Input("tab-main", "value"),
           Input("drilldown-state", "data")])
def render_all(team, ath_id, sd, ed, stype, role, tab, ds):
    import traceback
    try:
        uid = "1" if role == "coach" else "2"
        user = _user(uid)

        ds = ds or {"level": 0, "filters": {}}
        level = ds.get("level", 0)
        drill_filters = ds.get("filters", {})

        params = _merge_params(sd, ed, team, ath_id, None, stype, None, drill_filters)

        hr_df = _query_hr(params, user)
        pace_df = _query_pace(params, user)
        str_df = _query_strength(params, user)
        rec_df = _query_recovery(params, user)
        inj_df = _query_injuries(params, user)
        hr_detail = _query_hr_detail(params, user)
        pace_detail = _query_pace_detail(params, user)

        agg_dim = DRILL_LEVELS[min(level, len(DRILL_LEVELS) - 1)]
        if agg_dim == "metric":
            agg_dim = "training_day"
        load_df = _query_agg(agg_dim, params, user)

        summary = [
            dbc.Col(_card("训练记录", [html.H3(str(len(load_df)), style={"color": C["primary"], "margin": 0, "fontSize": "1.3rem"})]), width=2),
            dbc.Col(_card("心率采样", [html.H3(str(len(hr_df)), style={"color": C["success"], "margin": 0, "fontSize": "1.3rem"})]), width=2),
            dbc.Col(_card("配速记录", [html.H3(str(len(pace_df)), style={"color": C["warning"], "margin": 0, "fontSize": "1.3rem"})]), width=2),
            dbc.Col(_card("力量测试", [html.H3(str(len(str_df)), style={"color": C["danger"], "margin": 0, "fontSize": "1.3rem"})]), width=2),
            dbc.Col(_card("恢复评分", [html.H3(str(len(rec_df)), style={"color": "#a78bfa", "margin": 0, "fontSize": "1.3rem"})]), width=2),
            dbc.Col(_card("伤病记录", [html.H3(str(len(inj_df)), style={"color": "#f472b6", "margin": 0, "fontSize": "1.3rem"})]), width=2),
        ]

        if tab == "tab-load":
            content = _render_load_tab(load_df, rec_df, str_df, level)
        elif tab == "tab-hr":
            content = _render_hr_tab(hr_df, hr_detail)
        elif tab == "tab-pace":
            content = _render_pace_tab(pace_df, pace_detail)
        elif tab == "tab-str":
            content = _render_str_tab(str_df)
        elif tab == "tab-rec":
            content = _render_rec_tab(rec_df)
        elif tab == "tab-inj":
            content = _render_inj_tab(inj_df, user)
        elif tab == "tab-cal":
            content = _render_cal_tab()
        else:
            content = html.Div("")

        return summary, content
    except Exception as e:
        traceback.print_exc()
        err = html.Div(f"渲染错误: {str(e)}", style={"color": C["danger"], "padding": "2rem"})
        return [dbc.Col(err, width=12)], err


def _render_load_tab(load_df, rec_df, str_df, level):
    drill_fig = go.Figure()
    if not load_df.empty and "key" in load_df.columns:
        drill_fig.add_trace(go.Bar(
            x=load_df["key"], y=load_df["load"], name="训练负荷",
            marker_color=C["primary"], customdata=load_df["key"],
        ))
        if "rpe" in load_df.columns:
            drill_fig.add_trace(go.Scatter(
                x=load_df["key"], y=load_df["rpe"].round(1), mode="lines+markers",
                name="平均RPE", line={"color": C["warning"], "width": 2}, yaxis="y2",
            ))
    drill_fig.update_layout(
        paper_bgcolor=C["card"], plot_bgcolor=C["card"], font={"color": C["text"]},
        margin={"l": 50, "r": 30, "t": 35, "b": 50},
        title={"text": f"负荷聚合（按{DRILL_LABELS.get(DRILL_LEVELS[min(level, 5)], '整体')}）— 点击柱下钻", "font": {"size": 13}},
        legend={"orientation": "h", "y": 1.12},
        yaxis={"title": "训练负荷", "gridcolor": C["border"]},
        yaxis2={"title": "RPE", "overlaying": "y", "side": "right", "gridcolor": C["border"]},
        xaxis={"gridcolor": C["border"]}, hovermode="x unified",
    )

    radar_fig = go.Figure()
    cats = ["力量", "耐力", "恢复", "睡眠", "HRV"]
    vals = [50.0] * 5
    if not str_df.empty and "one_rm_kg" in str_df.columns:
        vals[0] = min(100, float(str_df["one_rm_kg"].max()) / 200 * 100)
    if not rec_df.empty:
        if "overall_score" in rec_df.columns: vals[2] = float(rec_df["overall_score"].mean())
        if "sleep_score" in rec_df.columns: vals[3] = float(rec_df["sleep_score"].mean())
        if "hrv_ms" in rec_df.columns: vals[4] = min(100, float(rec_df["hrv_ms"].mean()) / 120 * 100)
    radar_fig.add_trace(go.Scatterpolar(
        r=vals + [vals[0]], theta=cats + [cats[0]], fill="toself",
        fillcolor="rgba(79,140,255,0.25)", line={"color": C["primary"], "width": 2},
    ))
    radar_fig.update_layout(
        polar={"bgcolor": C["card"], "radialaxis": {"visible": True, "range": [0, 100], "gridcolor": C["border"],
                                                       "tickfont": {"color": C["muted"], "size": 9}},
               "angularaxis": {"gridcolor": C["border"], "tickfont": {"color": C["text"], "size": 11}}},
        paper_bgcolor=C["card"], font={"color": C["text"]}, margin={"l": 20, "r": 20, "t": 20, "b": 20}, showlegend=False,
    )

    rec_fig = go.Figure()
    if not rec_df.empty and "score_date" in rec_df.columns:
        for col, nm, clr in [("overall_score", "综合", C["primary"]), ("sleep_score", "睡眠", "#a78bfa"),
                              ("fatigue_score", "疲劳", C["warning"]), ("stress_score", "压力", C["danger"]),
                              ("soreness_score", "酸痛", "#fb923c")]:
            if col in rec_df.columns:
                rec_fig.add_trace(go.Scatter(x=rec_df["score_date"], y=rec_df[col], mode="lines", name=nm,
                                             line={"color": clr, "width": 1.5}))
        if "is_anomaly" in rec_df.columns:
            anom = rec_df[rec_df["is_anomaly"] == True]
            if not anom.empty and "overall_score" in anom.columns:
                rec_fig.add_trace(go.Scatter(x=anom["score_date"], y=anom["overall_score"], mode="markers",
                                             name="异常点", marker={"color": C["danger"], "size": 10, "symbol": "x"}))
    rec_fig.add_hline(y=60, line_dash="dash", line_color=C["warning"],
                      annotation_text="警戒线60", annotation_font_color=C["warning"])
    rec_fig.update_layout(paper_bgcolor=C["card"], plot_bgcolor=C["card"], font={"color": C["text"]},
                          margin={"l": 40, "r": 20, "t": 30, "b": 40}, legend={"orientation": "h", "y": 1.12},
                          yaxis={"title": "评分", "gridcolor": C["border"], "range": [0, 100]},
                          xaxis={"gridcolor": C["border"]}, hovermode="x unified")

    comp_fig = go.Figure()
    if not load_df.empty and "key" in load_df.columns:
        comp_fig.add_trace(go.Bar(x=load_df["key"], y=load_df["load"], name="总负荷", marker_color=C["primary"]))
        if "rpe" in load_df.columns:
            comp_fig.add_trace(go.Scatter(x=load_df["key"], y=load_df["rpe"].round(1), mode="lines+markers",
                                          name="平均RPE", line={"color": C["warning"], "width": 2}, yaxis="y2"))
    comp_fig.update_layout(paper_bgcolor=C["card"], plot_bgcolor=C["card"], font={"color": C["text"]},
                           margin={"l": 40, "r": 20, "t": 30, "b": 40}, legend={"orientation": "h", "y": 1.12},
                           yaxis={"title": "训练负荷", "gridcolor": C["border"]},
                           yaxis2={"title": "RPE", "overlaying": "y", "side": "right", "gridcolor": C["border"]},
                           xaxis={"gridcolor": C["border"]})

    return html.Div([
        dbc.Row([
            dbc.Col(_card("负荷下钻", [dcc.Graph(figure=drill_fig, id="graph-drill")]), width=8),
            dbc.Col(_card("个人雷达", [dcc.Graph(figure=radar_fig, id="graph-radar")]), width=4),
        ], className="mb-3"),
        dbc.Row([
            dbc.Col(_card("恢复趋势", [dcc.Graph(figure=rec_fig, id="graph-recovery")]), width=6),
            dbc.Col(_card("训练对比", [dcc.Graph(figure=comp_fig, id="graph-compare")]), width=6),
        ], className="mb-3"),
        html.Div([
            dbc.Button("⬆ 上钻一级", id="btn-drill-up", color="warning", size="sm", className="me-2"),
            dbc.Button("🔄 重置下钻", id="btn-drill-reset", color="secondary", size="sm"),
        ], className="mb-2"),
    ])


def _render_hr_tab(hr_df, hr_detail_df):
    fig = go.Figure()
    if not hr_df.empty and "date" in hr_df.columns:
        if "avg_hr" in hr_df.columns:
            fig.add_trace(go.Scatter(x=hr_df["date"], y=hr_df["avg_hr"], mode="lines+markers", name="平均心率",
                                     line={"color": C["success"], "width": 2}))
        if "max_hr" in hr_df.columns:
            fig.add_trace(go.Scatter(x=hr_df["date"], y=hr_df["max_hr"], mode="lines", name="最高心率",
                                     line={"color": C["danger"], "width": 1, "dash": "dot"}))
        if "min_hr" in hr_df.columns:
            fig.add_trace(go.Scatter(x=hr_df["date"], y=hr_df["min_hr"], mode="lines", name="最低心率",
                                     line={"color": C["primary"], "width": 1, "dash": "dot"}))
    fig.update_layout(paper_bgcolor=C["card"], plot_bgcolor=C["card"], font={"color": C["text"]},
                      margin={"l": 40, "r": 20, "t": 30, "b": 40}, legend={"orientation": "h", "y": 1.12},
                      yaxis={"title": "bpm", "gridcolor": C["border"]}, xaxis={"gridcolor": C["border"]}, hovermode="x unified")

    anom_rows = []
    if not hr_detail_df.empty:
        for _, r in hr_detail_df.iterrows():
            anom_rows.append(html.Tr([
                html.Td(str(r.get("athlete_name", "")), style={"color": C["text"]}),
                html.Td(str(r.get("recorded_at", ""))[:16], style={"color": C["muted"]}),
                html.Td(str(r.get("hr_bpm", "")), style={"color": C["danger"], "fontWeight": "bold"}),
                html.Td(str(r.get("activity", "")), style={"color": C["muted"]}),
                html.Td(dbc.Button("查看详情", size="sm", color="danger", outline=True,
                                   id={"type": "btn-hr-detail", "index": int(r["id"])},
                                   style={"fontSize": "0.7rem", "padding": "0.1rem 0.4rem"})),
            ]))

    anom_table = ""
    if anom_rows:
        hdr = [html.Th(h, style={"color": C["primary"], "fontSize": "0.75rem"})
               for h in ["队员", "时间", "心率", "活动", "操作"]]
        anom_table = html.Div([
            html.H6("异常心率记录（点击查看原始详情）", style={"color": C["danger"], "fontSize": "0.82rem", "marginTop": "1rem"}),
            html.Table([html.Thead(html.Tr(hdr)), html.Tbody(anom_rows)],
                       style={"width": "100%", "fontSize": "0.75rem"}, className="table table-dark table-sm"),
        ])

    return dbc.Row([dbc.Col(_card("心率趋势", [dcc.Graph(figure=fig), anom_table]), width=12)])


def _render_pace_tab(pace_df, pace_detail_df):
    fig = go.Figure()
    if not pace_df.empty and "date" in pace_df.columns:
        if "avg_pace" in pace_df.columns:
            fig.add_trace(go.Scatter(x=pace_df["date"], y=pace_df["avg_pace"], mode="lines+markers", name="平均配速",
                                     line={"color": C["warning"], "width": 2}))
        if "best_pace" in pace_df.columns:
            fig.add_trace(go.Scatter(x=pace_df["date"], y=pace_df["best_pace"], mode="lines", name="最佳配速",
                                     line={"color": C["success"], "width": 1, "dash": "dash"}))
        if "total_km" in pace_df.columns:
            fig.add_trace(go.Bar(x=pace_df["date"], y=pace_df["total_km"], name="距离(km)",
                                 marker_color="rgba(79,140,255,0.3)", yaxis="y2"))
    fig.update_layout(paper_bgcolor=C["card"], plot_bgcolor=C["card"], font={"color": C["text"]},
                      margin={"l": 40, "r": 20, "t": 30, "b": 40}, legend={"orientation": "h", "y": 1.12},
                      yaxis={"title": "min/km", "gridcolor": C["border"]},
                      yaxis2={"title": "km", "overlaying": "y", "side": "right", "gridcolor": C["border"]},
                      xaxis={"gridcolor": C["border"]}, hovermode="x unified")

    anom_rows = []
    if not pace_detail_df.empty:
        for _, r in pace_detail_df.iterrows():
            anom_rows.append(html.Tr([
                html.Td(str(r.get("athlete_name", "")), style={"color": C["text"]}),
                html.Td(str(r.get("recorded_at", ""))[:16], style={"color": C["muted"]}),
                html.Td(str(r.get("pace_min_per_km", "")), style={"color": C["danger"], "fontWeight": "bold"}),
                html.Td(str(r.get("distance_km", "")), style={"color": C["muted"]}),
                html.Td(dbc.Button("查看详情", size="sm", color="danger", outline=True,
                                   id={"type": "btn-pace-detail", "index": int(r["id"])},
                                   style={"fontSize": "0.7rem", "padding": "0.1rem 0.4rem"})),
            ]))

    anom_table = ""
    if anom_rows:
        hdr = [html.Th(h, style={"color": C["primary"], "fontSize": "0.75rem"})
               for h in ["队员", "时间", "配速", "距离", "操作"]]
        anom_table = html.Div([
            html.H6("异常配速记录（点击查看原始详情）", style={"color": C["danger"], "fontSize": "0.82rem", "marginTop": "1rem"}),
            html.Table([html.Thead(html.Tr(hdr)), html.Tbody(anom_rows)],
                       style={"width": "100%", "fontSize": "0.75rem"}, className="table table-dark table-sm"),
        ])

    return dbc.Row([dbc.Col(_card("配速趋势", [dcc.Graph(figure=fig), anom_table]), width=12)])


def _render_str_tab(str_df):
    fig = go.Figure()
    if not str_df.empty and "test_date" in str_df.columns and "one_rm_kg" in str_df.columns:
        for i, ex in enumerate(str_df["exercise_name"].unique()[:6]):
            sub = str_df[str_df["exercise_name"] == ex]
            fig.add_trace(go.Scatter(x=sub["test_date"], y=sub["one_rm_kg"], mode="lines+markers",
                                     name=ex, line={"color": C["colors"][i % len(C["colors"])]}))
        if "is_anomaly" in str_df.columns:
            anom = str_df[str_df["is_anomaly"] == True]
            if not anom.empty:
                fig.add_trace(go.Scatter(x=anom["test_date"], y=anom["one_rm_kg"], mode="markers",
                                         name="异常下降", marker={"color": C["danger"], "size": 10, "symbol": "x"}))
    fig.update_layout(paper_bgcolor=C["card"], plot_bgcolor=C["card"], font={"color": C["text"]},
                      margin={"l": 40, "r": 20, "t": 30, "b": 40}, legend={"orientation": "h", "y": 1.12},
                      yaxis={"title": "1RM (kg)", "gridcolor": C["border"]}, xaxis={"gridcolor": C["border"]}, hovermode="x unified")

    anom_rows = []
    if not str_df.empty and "is_anomaly" in str_df.columns:
        anom = str_df[str_df["is_anomaly"] == True]
        for _, r in anom.iterrows():
            anom_rows.append(html.Tr([
                html.Td(str(r.get("athlete_name", "")), style={"color": C["text"]}),
                html.Td(str(r.get("test_date", "")), style={"color": C["muted"]}),
                html.Td(str(r.get("exercise_name", "")), style={"color": C["text"]}),
                html.Td(str(r.get("one_rm_kg", "")), style={"color": C["danger"], "fontWeight": "bold"}),
                html.Td(dbc.Button("查看详情", size="sm", color="danger", outline=True,
                                   id={"type": "btn-str-detail", "index": int(r["id"])},
                                   style={"fontSize": "0.7rem", "padding": "0.1rem 0.4rem"})),
            ]))

    anom_table = ""
    if anom_rows:
        hdr = [html.Th(h, style={"color": C["primary"], "fontSize": "0.75rem"})
               for h in ["队员", "测试日", "动作", "1RM", "操作"]]
        anom_table = html.Div([
            html.H6("力量异常记录（点击查看原始详情）", style={"color": C["danger"], "fontSize": "0.82rem", "marginTop": "1rem"}),
            html.Table([html.Thead(html.Tr(hdr)), html.Tbody(anom_rows)],
                       style={"width": "100%", "fontSize": "0.75rem"}, className="table table-dark table-sm"),
        ])

    return dbc.Row([dbc.Col(_card("力量测试趋势", [dcc.Graph(figure=fig, id="graph-strength"), anom_table]), width=12)])


def _render_rec_tab(rec_df):
    fig = go.Figure()
    if not rec_df.empty and "score_date" in rec_df.columns:
        for col, nm, clr in [("overall_score", "综合评分", C["primary"]), ("sleep_score", "睡眠", "#a78bfa"),
                              ("fatigue_score", "疲劳", C["warning"]), ("stress_score", "压力", C["danger"]),
                              ("soreness_score", "酸痛", "#fb923c")]:
            if col in rec_df.columns:
                fig.add_trace(go.Scatter(x=rec_df["score_date"], y=rec_df[col], mode="lines", name=nm,
                                         line={"color": clr, "width": 1.5}))
        if "is_anomaly" in rec_df.columns:
            anom = rec_df[rec_df["is_anomaly"] == True]
            if not anom.empty and "overall_score" in anom.columns:
                fig.add_trace(go.Scatter(x=anom["score_date"], y=anom["overall_score"], mode="markers",
                                         name="异常点(点击查看)", marker={"color": C["danger"], "size": 12, "symbol": "x"},
                                         customdata=anom["id"] if "id" in anom.columns else None))
    fig.add_hline(y=60, line_dash="dash", line_color=C["warning"], annotation_text="警戒线60", annotation_font_color=C["warning"])
    fig.update_layout(paper_bgcolor=C["card"], plot_bgcolor=C["card"], font={"color": C["text"]},
                      margin={"l": 40, "r": 20, "t": 30, "b": 40}, legend={"orientation": "h", "y": 1.12},
                      yaxis={"title": "评分", "gridcolor": C["border"], "range": [0, 100]},
                      xaxis={"gridcolor": C["border"]}, hovermode="x unified")

    anom_rows = []
    if not rec_df.empty and "is_anomaly" in rec_df.columns:
        anom = rec_df[rec_df["is_anomaly"] == True]
        for _, r in anom.iterrows():
            anom_rows.append(html.Tr([
                html.Td(str(r.get("athlete_name", "")), style={"color": C["text"]}),
                html.Td(str(r.get("score_date", "")), style={"color": C["muted"]}),
                html.Td(str(r.get("overall_score", "")), style={"color": C["danger"], "fontWeight": "bold"}),
                html.Td(dbc.Button("查看详情", size="sm", color="danger", outline=True,
                                   id={"type": "btn-rec-detail", "index": int(r["id"])},
                                   style={"fontSize": "0.7rem", "padding": "0.1rem 0.4rem"})),
            ]))

    anom_table = ""
    if anom_rows:
        hdr = [html.Th(h, style={"color": C["primary"], "fontSize": "0.75rem"})
               for h in ["队员", "日期", "综合评分", "操作"]]
        anom_table = html.Div([
            html.H6("恢复异常记录（点击查看原始详情）", style={"color": C["danger"], "fontSize": "0.82rem", "marginTop": "1rem"}),
            html.Table([html.Thead(html.Tr(hdr)), html.Tbody(anom_rows)],
                       style={"width": "100%", "fontSize": "0.75rem"}, className="table table-dark table-sm"),
        ])

    return dbc.Row([dbc.Col(_card("恢复评分趋势", [dcc.Graph(figure=fig, id="graph-rec-detail"), anom_table]), width=12)])


def _render_inj_tab(inj_df, user):
    if inj_df.empty:
        return html.Div("暂无伤病记录", style={"color": C["muted"]})
    sev_c = {"mild": C["success"], "moderate": C["warning"], "severe": C["danger"]}
    st_l = {"active": "活跃", "recovering": "恢复中", "resolved": "已解决"}
    rows = []
    for _, r in inj_df.iterrows():
        cells = [
            html.Td(str(r.get("athlete_name", "")), style={"color": C["text"]}),
            html.Td(str(r.get("injury_date", "")), style={"color": C["muted"]}),
            html.Td(str(r.get("body_part", "")), style={"color": C["text"]}),
            html.Td(str(r.get("injury_type", "")), style={"color": C["muted"]}),
            html.Td(html.Span(str(r.get("severity", "")),
                              style={"color": sev_c.get(r.get("severity"), C["text"]), "fontWeight": "bold"})),
            html.Td(st_l.get(r.get("status"), str(r.get("status", ""))), style={"color": C["text"]}),
        ]
        if not user or user.role == "coach":
            cn = r.get("coach_notes", "")
            cells.append(html.Td(html.Span("教练可见", style={"color": C["danger"], "fontSize": "0.72rem"}) if cn else "—",
                                 style={"color": C["muted"]}))
        rows.append(html.Tr(cells))
    hdr = [html.Th(h, style={"color": C["primary"]}) for h in ["队员", "日期", "部位", "类型", "严重度", "状态"]]
    if not user or user.role == "coach":
        hdr.append(html.Th("教练备注", style={"color": C["danger"]}))
    return html.Table([html.Thead(html.Tr(hdr)), html.Tbody(rows)],
                      style={"width": "100%", "fontSize": "0.78rem"}, className="table table-dark table-sm")


def _render_cal_tab():
    return html.Div([
        html.P("校验维度: 训练计划RPE | 心率范围 | 配速范围 | 力量下降阈值 | 恢复评分异常",
               style={"color": C["muted"], "fontSize": "0.8rem"}),
        dbc.Button("运行口径校验", id="btn-run-caliber", color="warning", size="sm"),
        html.Div(id="caliber-result", className="mt-3"),
    ])


@app.callback(
    Output("drilldown-state", "data"),
    [Input("graph-drill", "clickData"), Input("btn-drill-up", "n_clicks"), Input("btn-drill-reset", "n_clicks")],
    State("drilldown-state", "data"),
    prevent_initial_call=True,
)
def handle_drill(click, up_n, reset_n, ds):
    triggered = ctx.triggered_id
    ds = ds or {"level": 0, "filters": {}}
    level = ds.get("level", 0)
    filters = dict(ds.get("filters", {}))

    if triggered == "btn-drill-reset":
        return {"level": 0, "filters": {}}
    elif triggered == "btn-drill-up":
        if level > 0:
            dim = DRILL_LEVELS[level - 1]
            if dim in filters:
                del filters[dim]
            level -= 1
        return {"level": level, "filters": filters}
    elif triggered == "graph-drill" and click:
        pt = click["points"][0]
        if "label" in pt:
            val = pt["label"]
        elif "x" in pt:
            val = str(pt["x"])
        else:
            return dash.no_update
        if level < len(DRILL_LEVELS):
            dim = DRILL_LEVELS[level]
            filters[dim] = val
            level += 1
        return {"level": level, "filters": filters}

    return dash.no_update


@app.callback(
    [Output("modal-detail", "is_open"), Output("modal-detail-body", "children")],
    [Input({"type": "btn-hr-detail", "index": ALL}, "n_clicks"),
     Input({"type": "btn-pace-detail", "index": ALL}, "n_clicks"),
     Input({"type": "btn-str-detail", "index": ALL}, "n_clicks"),
     Input({"type": "btn-rec-detail", "index": ALL}, "n_clicks"),
     Input("graph-rec-detail", "clickData"),
     Input("btn-close-detail", "n_clicks")],
    [State("modal-detail", "is_open"), State("f-role", "value")],
    prevent_initial_call=True,
)
def handle_detail_click(hr_clicks, pace_clicks, str_clicks, rec_clicks, graph_click, close_n, is_open, role):
    triggered = ctx.triggered_id
    if triggered == "btn-close-detail":
        return False, ""

    if isinstance(triggered, dict) and "type" in triggered and "index" in triggered:
        btn_type = triggered["type"]
        record_id = triggered["index"]
        type_map = {
            "btn-hr-detail": "heartrate",
            "btn-pace-detail": "pace",
            "btn-str-detail": "strength",
            "btn-rec-detail": "recovery",
        }
        record_type = type_map.get(btn_type)
        if record_type:
            uid = "1" if role == "coach" else "2"
            user = _user(uid)
            detail = _get_record_detail(record_type, record_id, user)
            if detail:
                return True, detail
            return True, html.Div(f"记录 #{record_id} 未找到", style={"color": C["muted"]})

    if triggered == "graph-rec-detail" and graph_click:
        pt = graph_click["points"][0]
        x_val = pt.get("x", "")
        y_val = pt.get("y", "")
        uid = "1" if role == "coach" else "2"
        user = _user(uid)
        s = SessionLocal()
        try:
            rec = s.query(RecoveryScore).filter(
                RecoveryScore.score_date == x_val,
                RecoveryScore.overall_score == y_val,
                RecoveryScore.is_anomaly == True,
            ).first()
            if rec:
                detail = _get_record_detail("recovery", rec.id, user)
                if detail:
                    return True, detail
        finally:
            s.close()
        return True, html.Div(f"日期: {x_val}, 评分: {y_val}", style={"color": C["muted"]})

    return is_open, ""


@app.callback(
    [Output("modal-caliber", "is_open"), Output("caliber-result", "children")],
    Input("btn-run-caliber", "n_clicks"),
    [State("f-date", "start_date"), State("f-date", "end_date"),
     State("f-team", "value"), State("f-athlete", "value"),
     State("f-stype", "value"), State("f-role", "value"),
     State("drilldown-state", "data")],
    prevent_initial_call=True,
)
def run_caliber(n, sd, ed, team, ath_id, stype, role, ds):
    if not n:
        return False, ""
    uid = "1" if role == "coach" else "2"
    user = _user(uid)
    drill_filters = ds.get("filters", {}) if ds else {}
    params = _merge_params(sd, ed, team, ath_id, None, stype, None, drill_filters)

    data_by_dim = {
        "heartrate": _query_hr(params, user).to_dict("records"),
        "pace": _query_pace(params, user).to_dict("records"),
        "strength": _query_strength(params, user).to_dict("records"),
        "training_plan": _query_agg("training_day", params, user).to_dict("records"),
    }
    results = run_all_checks(data_by_dim)
    summary = format_check_summary(results)

    filter_desc = f"口径: 队伍={team or '全部'}, 队员={ath_id or '全部'}, 日期={sd}~{ed}, 类型={stype or '全部'}\n"
    for dim in DRILL_LEVELS:
        val = drill_filters.get(dim)
        if val:
            filter_desc += f"  下钻 {DRILL_LABELS.get(dim, dim)}={val}\n"
    filter_desc += "\n"
    rules = "规则:\n"
    rules += "  心率: " + ", ".join(v["label"] for v in HEARTRATE_RULES.values()) + "\n"
    rules += "  配速: " + ", ".join(v["label"] for v in PACE_RULES.values()) + "\n"
    rules += "  力量: " + ", ".join(v["label"] for v in STRENGTH_RULES.values()) + "\n"
    rules += "  训练: " + ", ".join(v["label"] for v in TRAINING_PLAN_RULES.values()) + "\n\n"

    report = filter_desc + rules + summary
    return True, html.Pre(report, style={"color": C["text"], "fontSize": "0.8rem", "whiteSpace": "pre-wrap"})


@app.callback(Output("modal-caliber", "is_open", allow_duplicate=True), Input("btn-close-caliber", "n_clicks"),
          State("modal-caliber", "is_open"), prevent_initial_call=True)
def close_caliber(n, is_open):
    return False if n else is_open


@app.callback(Output("download-export", "data"), Input("btn-csv", "n_clicks"),
          [State("f-team", "value"), State("f-athlete", "value"),
           State("f-date", "start_date"), State("f-date", "end_date"),
           State("f-stype", "value"), State("f-role", "value"),
           State("drilldown-state", "data")],
          prevent_initial_call=True)
def export_csv(n, team, ath_id, sd, ed, stype, role, ds):
    if not n:
        return dash.no_update
    uid = "1" if role == "coach" else "2"
    user = _user(uid)
    drill_filters = ds.get("filters", {}) if ds else {}
    params = _merge_params(sd, ed, team, ath_id, None, stype, None, drill_filters)
    df = _query_agg("training_day", params, user)

    caliber = f"口径: 队伍={team or '全部'} 队员={ath_id or '全部'} 日期={sd}~{ed} 类型={stype or '全部'}"
    if ds:
        level = ds.get("level", 0)
        caliber += f" 下钻层级={level}"
        for k, v in drill_filters.items():
            caliber += f" {k}={v}"

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["# " + caliber])
    if not df.empty:
        writer.writerow(df.columns.tolist())
        for _, row in df.iterrows():
            writer.writerow(row.tolist())
    return dcc.send_string(output.getvalue(), "training_load_export.csv", "text/csv")
