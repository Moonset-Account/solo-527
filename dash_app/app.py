import os
import io
import csv
from datetime import date, timedelta

import dash
from dash import dcc, html, Input, Output, State, callback, ctx
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
    title="训练负荷可视化系统",
)
server = app.server

COLORS = {
    "bg": "#0f1117",
    "card": "#1a1d29",
    "border": "#2d3148",
    "primary": "#4f8cff",
    "success": "#36d399",
    "warning": "#fbbd23",
    "danger": "#f87272",
    "text": "#e2e8f0",
    "text_muted": "#94a3b8",
    "chart_colors": ["#4f8cff", "#36d399", "#fbbd23", "#f87272", "#a78bfa", "#fb923c", "#22d3ee", "#f472b6"],
}


def card(title, children, style=None):
    return dbc.Card(
        dbc.CardBody([
            html.H6(title, className="card-title mb-3",
                    style={"color": COLORS["primary"], "fontSize": "0.85rem"}),
            *children,
        ]),
        style={"backgroundColor": COLORS["card"], "borderColor": COLORS["border"], **(style or {})},
    )


def _get_user(uid_str):
    s = SessionLocal()
    try:
        return s.query(User).filter_by(id=int(uid_str)).first()
    finally:
        s.close()


def _query_load(params, user):
    s = SessionLocal()
    try:
        q = s.query(
            Athlete.team, Athlete.id.label("athlete_id"), Athlete.name.label("athlete_name"),
            TrainingSession.session_date, TrainingSession.session_type,
            TrainingExercise.exercise_name, TrainingExercise.exercise_category,
            TrainingLog.actual_rpe, TrainingLog.actual_sets, TrainingLog.actual_reps,
            TrainingLog.actual_load_kg, TrainingLog.actual_duration_min, TrainingLog.completed,
        ).join(TrainingLog, TrainingLog.athlete_id == Athlete.id
        ).join(TrainingSession, TrainingLog.session_id == TrainingSession.id
        ).join(TrainingExercise, TrainingLog.exercise_id == TrainingExercise.id)

        if user and user.role == "athlete":
            q = q.filter(Athlete.id == user.athlete_id)
        if params.get("team"):
            q = q.filter(Athlete.team == params["team"])
        if params.get("athlete_id"):
            q = q.filter(Athlete.id == int(params["athlete_id"]))
        if params.get("start_date"):
            q = q.filter(TrainingSession.session_date >= params["start_date"])
        if params.get("end_date"):
            q = q.filter(TrainingSession.session_date <= params["end_date"])
        if params.get("session_type"):
            q = q.filter(TrainingSession.session_type == params["session_type"])

        rows = q.limit(5000).all()
        return [{
            "team": r.team, "athlete_id": r.athlete_id, "athlete_name": r.athlete_name,
            "session_date": r.session_date.isoformat() if r.session_date else None,
            "session_type": r.session_type, "exercise_name": r.exercise_name,
            "exercise_category": r.exercise_category, "rpe": r.actual_rpe,
            "load": round((r.actual_rpe or 0) * (r.actual_duration_min or 0), 1),
            "completed": r.completed,
        } for r in rows]
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
            func.count(HeartRate.id).label("count"),
        ).join(HeartRate, HeartRate.athlete_id == Athlete.id)

        if user and user.role == "athlete":
            q = q.filter(Athlete.id == user.athlete_id)
        if params.get("athlete_id"):
            q = q.filter(Athlete.id == int(params["athlete_id"]))
        if params.get("team"):
            q = q.filter(Athlete.team == params["team"])
        if params.get("start_date"):
            q = q.filter(HeartRate.recorded_at >= params["start_date"])
        if params.get("end_date"):
            q = q.filter(HeartRate.recorded_at <= params["end_date"] + " 23:59:59")

        q = q.group_by(Athlete.id, Athlete.name, Athlete.team, func.date(HeartRate.recorded_at))
        rows = q.limit(3000).all()
        return [{
            "athlete_id": r.athlete_id, "athlete_name": r.athlete_name, "team": r.team,
            "date": r.date, "avg_hr": round(r.avg_hr, 1) if r.avg_hr else None,
            "max_hr": r.max_hr, "min_hr": r.min_hr, "count": r.count,
        } for r in rows]
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
            func.count(Pace.id).label("count"),
        ).join(Pace, Pace.athlete_id == Athlete.id)

        if user and user.role == "athlete":
            q = q.filter(Athlete.id == user.athlete_id)
        if params.get("athlete_id"):
            q = q.filter(Athlete.id == int(params["athlete_id"]))
        if params.get("team"):
            q = q.filter(Athlete.team == params["team"])
        if params.get("start_date"):
            q = q.filter(Pace.recorded_at >= params["start_date"])
        if params.get("end_date"):
            q = q.filter(Pace.recorded_at <= params["end_date"] + " 23:59:59")

        q = q.group_by(Athlete.id, Athlete.name, Athlete.team, func.date(Pace.recorded_at))
        rows = q.limit(3000).all()
        return [{
            "athlete_id": r.athlete_id, "athlete_name": r.athlete_name, "team": r.team,
            "date": r.date,
            "avg_pace": round(r.avg_pace, 2) if r.avg_pace else None,
            "best_pace": round(r.best_pace, 2) if r.best_pace else None,
            "total_km": round(r.total_km, 1) if r.total_km else None,
            "count": r.count,
        } for r in rows]
    finally:
        s.close()


def _query_strength(params, user):
    s = SessionLocal()
    try:
        q = s.query(StrengthTest).join(Athlete, StrengthTest.athlete_id == Athlete.id)
        if user and user.role == "athlete":
            q = q.filter(Athlete.id == user.athlete_id)
        if params.get("athlete_id"):
            q = q.filter(StrengthTest.athlete_id == int(params["athlete_id"]))
        if params.get("team"):
            q = q.filter(Athlete.team == params["team"])
        if params.get("start_date"):
            q = q.filter(StrengthTest.test_date >= params["start_date"])
        if params.get("end_date"):
            q = q.filter(StrengthTest.test_date <= params["end_date"])
        rows = q.limit(2000).all()
        result = []
        for r in rows:
            ath = s.query(Athlete).filter_by(id=r.athlete_id).first()
            result.append({
                "id": r.id, "athlete_id": r.athlete_id,
                "athlete_name": ath.name if ath else None,
                "team": ath.team if ath else None,
                "test_date": r.test_date.isoformat(),
                "exercise_name": r.exercise_name, "one_rm_kg": r.one_rm_kg,
                "max_reps": r.max_reps, "velocity_ms": r.velocity_ms,
                "power_w": r.power_w, "is_anomaly": r.is_anomaly, "notes": r.notes,
            })
        return result
    finally:
        s.close()


def _query_recovery(params, user):
    s = SessionLocal()
    try:
        q = s.query(RecoveryScore).join(Athlete, RecoveryScore.athlete_id == Athlete.id)
        if user and user.role == "athlete":
            q = q.filter(Athlete.id == user.athlete_id)
        if params.get("athlete_id"):
            q = q.filter(RecoveryScore.athlete_id == int(params["athlete_id"]))
        if params.get("team"):
            q = q.filter(Athlete.team == params["team"])
        if params.get("start_date"):
            q = q.filter(RecoveryScore.score_date >= params["start_date"])
        if params.get("end_date"):
            q = q.filter(RecoveryScore.score_date <= params["end_date"])
        rows = q.order_by(RecoveryScore.score_date).limit(3000).all()
        result = []
        for r in rows:
            ath = s.query(Athlete).filter_by(id=r.athlete_id).first()
            result.append({
                "id": r.id, "athlete_id": r.athlete_id,
                "athlete_name": ath.name if ath else None,
                "team": ath.team if ath else None,
                "score_date": r.score_date.isoformat(),
                "overall_score": r.overall_score, "sleep_score": r.sleep_score,
                "fatigue_score": r.fatigue_score, "stress_score": r.stress_score,
                "soreness_score": r.soreness_score, "hrv_ms": r.hrv_ms,
                "is_anomaly": r.is_anomaly, "notes": r.notes,
            })
        return result
    finally:
        s.close()


def _query_injuries(params, user):
    s = SessionLocal()
    try:
        q = s.query(Injury).join(Athlete, Injury.athlete_id == Athlete.id)
        if user and user.role == "athlete":
            q = q.filter(Athlete.id == user.athlete_id)
        if params.get("athlete_id"):
            q = q.filter(Injury.athlete_id == int(params["athlete_id"]))
        if params.get("team"):
            q = q.filter(Athlete.team == params["team"])
        rows = q.order_by(Injury.injury_date.desc()).limit(500).all()
        result = []
        for r in rows:
            ath = s.query(Athlete).filter_by(id=r.athlete_id).first()
            item = {
                "id": r.id, "athlete_id": r.athlete_id,
                "athlete_name": ath.name if ath else None,
                "team": ath.team if ath else None,
                "injury_date": r.injury_date.isoformat(),
                "body_part": r.body_part, "injury_type": r.injury_type,
                "severity": r.severity, "status": r.status,
                "return_date": r.return_date.isoformat() if r.return_date else None,
                "athlete_notes": r.athlete_notes,
            }
            if not user or user.role == "coach":
                item["coach_notes"] = r.coach_notes
            result.append(item)
        return result
    finally:
        s.close()


app.layout = html.Div([
    dcc.Store(id="store-drilldown", data={"current_level": 0, "filters": {}}),
    dcc.Store(id="store-filter-state", data={}),
    dcc.Store(id="store-user-role", data="coach"),
    dcc.Store(id="store-user-id", data="1"),
    dcc.Download(id="download-export"),

    html.Div([
        html.Div([
            html.H4("训练负荷可视化系统", style={"color": COLORS["primary"], "margin": 0}),
            html.Span("体能教练日常复盘平台",
                      style={"color": COLORS["text_muted"], "fontSize": "0.8rem", "marginLeft": "1rem"}),
        ], style={"display": "flex", "alignItems": "center", "marginBottom": "0.5rem"}),
        html.Span(id="drilldown-breadcrumb", children="全部",
                  style={"color": COLORS["warning"], "fontSize": "0.8rem", "cursor": "pointer"}),
    ], style={"marginBottom": "0.5rem"}),

    dbc.Row([
        dbc.Col([
            html.Label("队伍", style={"color": COLORS["text_muted"], "fontSize": "0.75rem"}),
            dcc.Dropdown(id="filter-team", placeholder="全部队伍", clearable=True),
        ], width=2),
        dbc.Col([
            html.Label("队员", style={"color": COLORS["text_muted"], "fontSize": "0.75rem"}),
            dcc.Dropdown(id="filter-athlete", placeholder="全部队员", clearable=True),
        ], width=2),
        dbc.Col([
            html.Label("日期范围", style={"color": COLORS["text_muted"], "fontSize": "0.75rem"}),
            dcc.DatePickerRange(
                id="filter-date-range",
                start_date=(date.today() - timedelta(days=28)).isoformat(),
                end_date=date.today().isoformat(),
            ),
        ], width=3),
        dbc.Col([
            html.Label("训练类型", style={"color": COLORS["text_muted"], "fontSize": "0.75rem"}),
            dcc.Dropdown(id="filter-session-type", placeholder="全部类型", clearable=True),
        ], width=2),
        dbc.Col([
            html.Label("角色", style={"color": COLORS["text_muted"], "fontSize": "0.75rem"}),
            dcc.Dropdown(id="filter-role", options=[
                {"label": "教练", "value": "coach"},
                {"label": "队员", "value": "athlete"},
            ], value="coach", clearable=False),
        ], width=2),
        dbc.Col([
            html.Label("导出", style={"color": COLORS["text_muted"], "fontSize": "0.75rem"}),
            dbc.ButtonGroup([
                dbc.Button("CSV", id="btn-export-csv", size="sm", color="primary", outline=True),
            ], size="sm"),
        ], width=1),
    ], className="mb-3 g-2"),

    html.Div(id="main-content", children=[html.Div("加载中...", style={"color": COLORS["text_muted"], "textAlign": "center", "padding": "2rem"})]),

    dbc.Modal([
        dbc.ModalHeader(dbc.ModalTitle("口径校验报告")),
        dbc.ModalBody(id="modal-caliber-body", style={"whiteSpace": "pre-wrap", "fontFamily": "monospace"}),
        dbc.ModalFooter(dbc.Button("关闭", id="btn-close-caliber", className="ms-auto")),
    ], id="modal-caliber", is_open=False, size="lg", style={"color": COLORS["text"]}),
], style={"backgroundColor": COLORS["bg"], "minHeight": "100vh", "padding": "1.5rem"})


def _common_params(start_date, end_date, team, athlete_id, session_type):
    params = {}
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date
    if team:
        params["team"] = team
    if athlete_id:
        params["athlete_id"] = athlete_id
    if session_type:
        params["session_type"] = session_type
    return params


@callback(
    [Output("filter-team", "options"), Output("filter-session-type", "options")],
    Input("filter-date-range", "start_date"),
)
def load_filters(_):
    s = SessionLocal()
    try:
        teams = [t[0] for t in s.query(Athlete.team).distinct().all()]
        stypes = [t[0] for t in s.query(TrainingSession.session_type).distinct().all() if t[0]]
    finally:
        s.close()
    return [{"label": t, "value": t} for t in teams], [{"label": t, "value": t} for t in stypes]


@callback(
    Output("filter-athlete", "options"),
    [Input("filter-team", "value"), Input("filter-role", "value")],
)
def load_athletes(team, role):
    s = SessionLocal()
    try:
        q = s.query(Athlete)
        if role == "athlete":
            q = q.filter(Athlete.id == 1)
        if team:
            q = q.filter(Athlete.team == team)
        athletes = q.all()
    finally:
        s.close()
    return [{"label": a.name, "value": a.id} for a in athletes]


@callback(
    [Output("store-user-role", "data"), Output("store-user-id", "data")],
    Input("filter-role", "value"),
)
def update_role(role):
    return role, "1" if role == "coach" else "2"


@callback(
    Output("drilldown-breadcrumb", "children"),
    Input("store-drilldown", "data"),
)
def update_breadcrumb(drilldown):
    dp = DrilldownPath()
    dp.current_level = drilldown.get("current_level", 0)
    dp.filters = drilldown.get("filters", {})
    return f"📍 {dp.describe()}"


@callback(
    Output("main-content", "children"),
    [
        Input("filter-team", "value"),
        Input("filter-athlete", "value"),
        Input("filter-date-range", "start_date"),
        Input("filter-date-range", "end_date"),
        Input("filter-session-type", "value"),
        Input("filter-role", "value"),
    ],
)
def render_main(team, athlete_id, start_date, end_date, session_type, role):
    user_id = "1" if role == "coach" else "2"
    params = _common_params(start_date, end_date, team, athlete_id, session_type)
    user = _get_user(user_id)
    role = user.role if user else "coach"

    load_data = _query_load(params, user)
    hr_data = _query_hr(params, user)
    pace_data = _query_pace(params, user)
    strength_data = _query_strength(params, user)
    recovery_data = _query_recovery(params, user)
    injury_data = _query_injuries(params, user)

    load_df = pd.DataFrame(load_data)
    hr_df = pd.DataFrame(hr_data)
    pace_df = pd.DataFrame(pace_data)
    strength_df = pd.DataFrame(strength_data)
    recovery_df = pd.DataFrame(recovery_data)
    injury_df = pd.DataFrame(injury_data)

    summary = dbc.Row([
        dbc.Col(card("训练记录", [html.H3(str(len(load_df)), style={"color": COLORS["primary"], "margin": 0})]), width=2),
        dbc.Col(card("心率采样", [html.H3(str(len(hr_df)), style={"color": COLORS["success"], "margin": 0})]), width=2),
        dbc.Col(card("配速记录", [html.H3(str(len(pace_df)), style={"color": COLORS["warning"], "margin": 0})]), width=2),
        dbc.Col(card("力量测试", [html.H3(str(len(strength_df)), style={"color": COLORS["danger"], "margin": 0})]), width=2),
        dbc.Col(card("恢复评分", [html.H3(str(len(recovery_df)), style={"color": "#a78bfa", "margin": 0})]), width=2),
        dbc.Col(card("伤病记录", [html.H3(str(len(injury_df)), style={"color": "#f472b6", "margin": 0})]), width=2),
    ], className="mb-3")

    load_fig = _build_load_chart(load_df)
    radar_fig = _build_radar_chart(strength_df, recovery_df)
    recovery_fig = _build_recovery_chart(recovery_df)
    comp_fig = _build_comparison_chart(load_df)
    hr_fig = _build_hr_chart(hr_df)
    pace_fig = _build_pace_chart(pace_df)
    injury_tbl = _build_injury_table(injury_df, role)

    caliber_btn = dbc.Button("运行口径校验", id="btn-run-caliber", color="warning", size="sm", className="mt-2")

    return html.Div([
        summary,
        dbc.Row([
            dbc.Col(card("负荷曲线（点击下钻）", [dcc.Graph(figure=load_fig, id="graph-load")]), width=8),
            dbc.Col(card("个人雷达图", [dcc.Graph(figure=radar_fig, id="graph-radar")]), width=4),
        ], className="mb-3"),
        dbc.Row([
            dbc.Col(card("恢复趋势", [dcc.Graph(figure=recovery_fig, id="graph-recovery")]), width=6),
            dbc.Col(card("训练对比", [dcc.Graph(figure=comp_fig, id="graph-comparison")]), width=6),
        ], className="mb-3"),
        dbc.Row([
            dbc.Col(card("心率趋势", [dcc.Graph(figure=hr_fig, id="graph-hr")]), width=6),
            dbc.Col(card("配速趋势", [dcc.Graph(figure=pace_fig, id="graph-pace")]), width=6),
        ], className="mb-3"),
        dbc.Row([
            dbc.Col(card("伤病记录", [injury_tbl]), width=12),
        ], className="mb-3"),
        dbc.Row([
            dbc.Col(card("口径校验", [
                html.P("校验维度: 训练计划RPE | 心率范围 | 配速范围 | 力量下降阈值",
                       style={"color": COLORS["text_muted"], "fontSize": "0.8rem"}),
                caliber_btn,
            ]), width=12),
        ]),
    ])


def _build_load_chart(df):
    fig = go.Figure()
    if df.empty or "session_date" not in df.columns:
        fig.update_layout(title="暂无数据", paper_bgcolor=COLORS["card"], plot_bgcolor=COLORS["card"],
                          font={"color": COLORS["text"]})
        return fig

    daily = df.groupby("session_date").agg({"load": "sum"}).reset_index()
    fig.add_trace(go.Scatter(
        x=daily["session_date"], y=daily["load"],
        mode="lines+markers", name="训练负荷",
        line={"color": COLORS["primary"], "width": 2}, marker={"size": 6},
    ))

    if "rpe" in df.columns:
        daily_rpe = df.groupby("session_date").agg({"rpe": "mean"}).reset_index()
        fig.add_trace(go.Scatter(
            x=daily_rpe["session_date"], y=daily_rpe["rpe"],
            mode="lines+markers", name="平均RPE",
            line={"color": COLORS["warning"], "width": 1, "dash": "dot"}, yaxis="y2",
        ))

    fig.update_layout(
        paper_bgcolor=COLORS["card"], plot_bgcolor=COLORS["card"], font={"color": COLORS["text"]},
        margin={"l": 40, "r": 20, "t": 30, "b": 40},
        legend={"orientation": "h", "y": 1.12},
        yaxis={"title": "训练负荷", "gridcolor": COLORS["border"]},
        yaxis2={"title": "RPE", "overlaying": "y", "side": "right", "gridcolor": COLORS["border"]},
        xaxis={"gridcolor": COLORS["border"]}, hovermode="x unified",
    )
    return fig


def _build_radar_chart(strength_df, recovery_df):
    fig = go.Figure()
    categories = ["力量", "速度", "耐力", "恢复", "睡眠", "HRV"]
    values = [50.0] * 6

    if not strength_df.empty and "one_rm_kg" in strength_df.columns:
        by_ex = strength_df.groupby("exercise_name").agg({"one_rm_kg": "max"}).reset_index()
        if not by_ex.empty:
            values[0] = min(100, (by_ex["one_rm_kg"].max() / 200) * 100)

    if not recovery_df.empty:
        if "overall_score" in recovery_df.columns:
            values[3] = float(recovery_df["overall_score"].mean())
        if "sleep_score" in recovery_df.columns:
            values[4] = float(recovery_df["sleep_score"].mean())
        if "hrv_ms" in recovery_df.columns:
            values[5] = min(100, float(recovery_df["hrv_ms"].mean()) / 120 * 100)

    fig.add_trace(go.Scatterpolar(
        r=values + [values[0]], theta=categories + [categories[0]],
        fill="toself", fillcolor="rgba(79,140,255,0.3)",
        line={"color": COLORS["primary"], "width": 2}, name="综合能力",
    ))
    fig.update_layout(
        polar={"bgcolor": COLORS["card"],
               "radialaxis": {"visible": True, "range": [0, 100], "gridcolor": COLORS["border"],
                              "tickfont": {"color": COLORS["text_muted"], "size": 9}},
               "angularaxis": {"gridcolor": COLORS["border"], "tickfont": {"color": COLORS["text"], "size": 11}}},
        paper_bgcolor=COLORS["card"], font={"color": COLORS["text"]},
        margin={"l": 20, "r": 20, "t": 20, "b": 20}, showlegend=False,
    )
    return fig


def _build_recovery_chart(df):
    fig = go.Figure()
    if df.empty or "score_date" not in df.columns:
        fig.update_layout(title="暂无数据", paper_bgcolor=COLORS["card"], plot_bgcolor=COLORS["card"],
                          font={"color": COLORS["text"]})
        return fig

    metrics = [
        ("overall_score", "综合评分", COLORS["primary"]),
        ("sleep_score", "睡眠", "#a78bfa"),
        ("fatigue_score", "疲劳", COLORS["warning"]),
        ("stress_score", "压力", COLORS["danger"]),
        ("soreness_score", "酸痛", "#fb923c"),
    ]
    for col, name, color in metrics:
        if col in df.columns:
            fig.add_trace(go.Scatter(x=df["score_date"], y=df[col], mode="lines", name=name,
                                     line={"color": color, "width": 1.5}))

    if "is_anomaly" in df.columns:
        anomalies = df[df["is_anomaly"] == True]
        if not anomalies.empty and "overall_score" in anomalies.columns:
            fig.add_trace(go.Scatter(
                x=anomalies["score_date"], y=anomalies["overall_score"],
                mode="markers", name="异常点",
                marker={"color": COLORS["danger"], "size": 10, "symbol": "x"},
            ))

    fig.add_hline(y=60, line_dash="dash", line_color=COLORS["warning"],
                  annotation_text="警戒线60", annotation_font_color=COLORS["warning"])
    fig.update_layout(
        paper_bgcolor=COLORS["card"], plot_bgcolor=COLORS["card"], font={"color": COLORS["text"]},
        margin={"l": 40, "r": 20, "t": 30, "b": 40},
        legend={"orientation": "h", "y": 1.12},
        yaxis={"title": "评分", "gridcolor": COLORS["border"], "range": [0, 100]},
        xaxis={"gridcolor": COLORS["border"]}, hovermode="x unified",
    )
    return fig


def _build_comparison_chart(df):
    fig = go.Figure()
    if df.empty or "athlete_name" not in df.columns or "load" not in df.columns:
        fig.update_layout(title="暂无数据", paper_bgcolor=COLORS["card"], plot_bgcolor=COLORS["card"],
                          font={"color": COLORS["text"]})
        return fig

    by_ath = df.groupby("athlete_name").agg({"load": "sum", "rpe": "mean"}).reset_index()
    fig.add_trace(go.Bar(x=by_ath["athlete_name"], y=by_ath["load"], name="总负荷",
                         marker_color=COLORS["primary"]))
    fig.add_trace(go.Scatter(x=by_ath["athlete_name"], y=by_ath["rpe"], mode="lines+markers",
                             name="平均RPE", line={"color": COLORS["warning"], "width": 2}, yaxis="y2"))
    fig.update_layout(
        paper_bgcolor=COLORS["card"], plot_bgcolor=COLORS["card"], font={"color": COLORS["text"]},
        margin={"l": 40, "r": 20, "t": 30, "b": 40},
        legend={"orientation": "h", "y": 1.12},
        yaxis={"title": "训练负荷", "gridcolor": COLORS["border"]},
        yaxis2={"title": "RPE", "overlaying": "y", "side": "right", "gridcolor": COLORS["border"]},
        xaxis={"gridcolor": COLORS["border"]},
    )
    return fig


def _build_hr_chart(df):
    fig = go.Figure()
    if df.empty or "date" not in df.columns:
        fig.update_layout(title="暂无数据", paper_bgcolor=COLORS["card"], plot_bgcolor=COLORS["card"],
                          font={"color": COLORS["text"]})
        return fig

    if "avg_hr" in df.columns:
        fig.add_trace(go.Scatter(x=df["date"], y=df["avg_hr"], mode="lines+markers", name="平均心率",
                                 line={"color": COLORS["success"], "width": 2}))
    if "max_hr" in df.columns:
        fig.add_trace(go.Scatter(x=df["date"], y=df["max_hr"], mode="lines", name="最高心率",
                                 line={"color": COLORS["danger"], "width": 1, "dash": "dot"}))
    if "min_hr" in df.columns:
        fig.add_trace(go.Scatter(x=df["date"], y=df["min_hr"], mode="lines", name="最低心率",
                                 line={"color": COLORS["primary"], "width": 1, "dash": "dot"}))

    fig.update_layout(
        paper_bgcolor=COLORS["card"], plot_bgcolor=COLORS["card"], font={"color": COLORS["text"]},
        margin={"l": 40, "r": 20, "t": 30, "b": 40},
        legend={"orientation": "h", "y": 1.12},
        yaxis={"title": "bpm", "gridcolor": COLORS["border"]},
        xaxis={"gridcolor": COLORS["border"]}, hovermode="x unified",
    )
    return fig


def _build_pace_chart(df):
    fig = go.Figure()
    if df.empty or "date" not in df.columns:
        fig.update_layout(title="暂无数据", paper_bgcolor=COLORS["card"], plot_bgcolor=COLORS["card"],
                          font={"color": COLORS["text"]})
        return fig

    if "avg_pace" in df.columns:
        fig.add_trace(go.Scatter(x=df["date"], y=df["avg_pace"], mode="lines+markers", name="平均配速",
                                 line={"color": COLORS["warning"], "width": 2}))
    if "best_pace" in df.columns:
        fig.add_trace(go.Scatter(x=df["date"], y=df["best_pace"], mode="lines", name="最佳配速",
                                 line={"color": COLORS["success"], "width": 1, "dash": "dash"}))
    if "total_km" in df.columns:
        fig.add_trace(go.Bar(x=df["date"], y=df["total_km"], name="距离(km)",
                             marker_color="rgba(79,140,255,0.3)", yaxis="y2"))

    fig.update_layout(
        paper_bgcolor=COLORS["card"], plot_bgcolor=COLORS["card"], font={"color": COLORS["text"]},
        margin={"l": 40, "r": 20, "t": 30, "b": 40},
        legend={"orientation": "h", "y": 1.12},
        yaxis={"title": "min/km", "gridcolor": COLORS["border"]},
        yaxis2={"title": "km", "overlaying": "y", "side": "right", "gridcolor": COLORS["border"]},
        xaxis={"gridcolor": COLORS["border"]}, hovermode="x unified",
    )
    return fig


def _build_injury_table(df, role):
    if df.empty:
        return html.P("暂无伤病记录", style={"color": COLORS["text_muted"]})

    severity_colors = {"mild": COLORS["success"], "moderate": COLORS["warning"], "severe": COLORS["danger"]}
    status_labels = {"active": "活跃", "recovering": "恢复中", "resolved": "已解决"}

    rows = []
    for _, r in df.iterrows():
        cells = [
            html.Td(str(r.get("athlete_name", "")), style={"color": COLORS["text"]}),
            html.Td(str(r.get("injury_date", "")), style={"color": COLORS["text_muted"]}),
            html.Td(str(r.get("body_part", "")), style={"color": COLORS["text"]}),
            html.Td(str(r.get("injury_type", "")), style={"color": COLORS["text_muted"]}),
            html.Td(html.Span(str(r.get("severity", "")),
                              style={"color": severity_colors.get(r.get("severity"), COLORS["text"]), "fontWeight": "bold"})),
            html.Td(status_labels.get(r.get("status"), str(r.get("status", ""))), style={"color": COLORS["text"]}),
            html.Td(str(r.get("return_date", "")), style={"color": COLORS["text_muted"]}),
        ]
        if role == "coach":
            cn = r.get("coach_notes", "")
            cells.append(html.Td(
                html.Span("教练可见", style={"color": COLORS["danger"], "fontSize": "0.75rem"}) if cn else "—",
                style={"color": COLORS["text_muted"]},
            ))
        rows.append(html.Tr(cells))

    header_cells = [
        html.Th("队员", style={"color": COLORS["primary"]}),
        html.Th("日期", style={"color": COLORS["primary"]}),
        html.Th("部位", style={"color": COLORS["primary"]}),
        html.Th("类型", style={"color": COLORS["primary"]}),
        html.Th("严重度", style={"color": COLORS["primary"]}),
        html.Th("状态", style={"color": COLORS["primary"]}),
        html.Th("预计归队", style={"color": COLORS["primary"]}),
    ]
    if role == "coach":
        header_cells.append(html.Th("教练备注", style={"color": COLORS["danger"]}))

    return html.Table([html.Thead(html.Tr(header_cells)), html.Tbody(rows)],
                      style={"width": "100%", "fontSize": "0.8rem"}, className="table table-dark table-sm")


@callback(
    Output("modal-caliber", "is_open"),
    [Input("btn-close-caliber", "n_clicks")],
    [State("modal-caliber", "is_open")],
)
def toggle_caliber_modal(n, is_open):
    if n:
        return False
    return is_open


@callback(
    [Output("modal-caliber-body", "children"), Output("modal-caliber", "is_open", allow_duplicate=True)],
    Input("btn-run-caliber", "n_clicks"),
    [
        State("filter-date-range", "start_date"),
        State("filter-date-range", "end_date"),
        State("filter-team", "value"),
        State("filter-athlete", "value"),
        State("filter-session-type", "value"),
        State("filter-role", "value"),
    ],
    prevent_initial_call=True,
)
def run_caliber_check(n, start_date, end_date, team, athlete_id, session_type, role):
    if not n:
        return "", False

    user_id = "1" if role == "coach" else "2"
    params = _common_params(start_date, end_date, team, athlete_id, session_type)
    user = _get_user(user_id)

    data_by_dim = {
        "heartrate": _query_hr(params, user),
        "pace": _query_pace(params, user),
        "strength": _query_strength(params, user),
        "training_plan": _query_load(params, user),
    }

    results = run_all_checks(data_by_dim)
    summary = format_check_summary(results)

    filter_desc = (f"筛选条件: 队伍={team or '全部'}, 队员={athlete_id or '全部'}, "
                   f"日期={start_date}~{end_date}, 类型={session_type or '全部'}\n\n")

    rules_text = "校验规则:\n"
    rules_text += "  心率: " + ", ".join(f"{v['label']}" for v in HEARTRATE_RULES.values()) + "\n"
    rules_text += "  配速: " + ", ".join(f"{v['label']}" for v in PACE_RULES.values()) + "\n"
    rules_text += "  力量: " + ", ".join(f"{v['label']}" for v in STRENGTH_RULES.values()) + "\n"
    rules_text += "  训练计划: " + ", ".join(f"{v['label']}" for v in TRAINING_PLAN_RULES.values()) + "\n\n"

    return filter_desc + rules_text + summary, True


@callback(
    Output("download-export", "data"),
    Input("btn-export-csv", "n_clicks"),
    [
        State("filter-team", "value"),
        State("filter-athlete", "value"),
        State("filter-date-range", "start_date"),
        State("filter-date-range", "end_date"),
        State("filter-session-type", "value"),
        State("filter-role", "value"),
    ],
    prevent_initial_call=True,
)
def export_csv(n, team, athlete_id, start_date, end_date, session_type, role):
    if not n:
        return dash.no_update

    user_id = "1" if role == "coach" else "2"
    params = _common_params(start_date, end_date, team, athlete_id, session_type)
    user = _get_user(user_id)
    load_data = _query_load(params, user)

    caliber_header = f"筛选口径: 队伍={team or '全部'} 队员={athlete_id or '全部'} 日期={start_date}~{end_date} 类型={session_type or '全部'}"

    if not load_data:
        return dcc.send_string("暂无数据", "export.csv")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["# " + caliber_header])
    writer.writerow(load_data[0].keys())
    for row in load_data:
        writer.writerow(row.values())
    return dcc.send_string(output.getvalue(), "training_load_export.csv", "text/csv")
