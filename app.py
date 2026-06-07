import dash
from dash import dcc, html, Input, Output, State, callback_context, ALL
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import pandas as pd
import json
import base64
from datetime import datetime

from db.queries import QueriesService
from db.demo_data import get_demo_data
from services import ChapterMappingService
from services.export import ExportService
from charts import (
    build_viewing_chart, build_quiz_chart, build_error_heatmap,
    build_discussion_chart, build_refund_chart, build_learning_path_chart,
    build_version_table, build_mapping_table,
)
from config import APP_HOST, APP_PORT, APP_DEBUG, DEMO_MODE, TRANSITION_WINDOW_DAYS

app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    suppress_callback_exceptions=True,
    title="课程内容更新影响分析",
)

queries = QueriesService()
mapping_service = ChapterMappingService()
export_service = ExportService()

NAVBAR = dbc.Navbar(
    dbc.Container([
        dbc.NavbarBrand("📚 课程内容更新影响分析", className="ms-2",
                        style={"font_size": "20px", "font_weight": "bold"}),
        dbc.Nav([
            dbc.NavItem(dbc.NavLink("📊 看板", href="#", active=True, id="nav-dashboard")),
            dbc.NavItem(dbc.NavLink("📋 下钻", href="#", id="nav-drilldown")),
        ], navbar=True),
        dbc.NavItem(dbc.Button("📥 导出报告", id="btn-export", color="success",
                               size="sm", className="ms-3")),
    ], fluid=True),
    color="dark", dark=True,
)

CHAPTER_SELECTOR = dbc.Card([
    dbc.CardHeader("🎯 章节与版本选择", className="fw-bold"),
    dbc.CardBody([
        dbc.Row([
            dbc.Col([
                dbc.Label("选择章节"),
                dcc.Dropdown(
                    id="chapter-selector",
                    placeholder="请选择章节...",
                    clearable=False,
                    style={"width": "100%"},
                ),
            ], width=6),
            dbc.Col([
                dbc.Label("选择版本（可选）"),
                dcc.Dropdown(
                    id="version-selector",
                    placeholder="全部版本",
                    clearable=True,
                    style={"width": "100%"},
                ),
            ], width=6),
        ]),
        dbc.Row([
            dbc.Col([
                dbc.Label("日期范围"),
                dcc.DatePickerRange(
                    id="date-range",
                    display_format="YYYY-MM-DD",
                    clearable=True,
                ),
            ], width=8),
            dbc.Col([
                dbc.Label(""),
                dbc.Checklist(
                    id="exclude-transition",
                    options=[{"label": "排除过渡期数据（稳定期对比）", "value": "exclude"}],
                    value=[],
                    inline=False,
                    style={"font_size": "13px"},
                ),
            ], width=4),
        ], className="mt-2"),
    ]),
], className="mb-3")

UNMAPPED_ALERT = html.Div(id="unmapped-alert", className="mb-2")

VERSION_TABLE = dbc.Card([
    dbc.CardHeader("📋 章节版本表", className="fw-bold"),
    dbc.CardBody([
        dcc.Graph(id="version-table", config={"displayModeBar": False}),
    ]),
], className="mb-3")

MAPPING_TABLE = dbc.Card([
    dbc.CardHeader("🔗 章节结构映射", className="fw-bold"),
    dbc.CardBody([
        dcc.Graph(id="mapping-table", config={"displayModeBar": False}),
    ]),
], className="mb-3")

VIEWING_CHART = dbc.Card([
    dbc.CardHeader("👁️ 观看数据对比", className="fw-bold"),
    dbc.CardBody([
        dcc.Graph(id="viewing-chart"),
    ]),
], className="mb-3")

QUIZ_CHART = dbc.Card([
    dbc.CardHeader("📝 测验数据对比", className="fw-bold"),
    dbc.CardBody([
        dcc.Graph(id="quiz-chart"),
    ]),
], className="mb-3")

ERROR_HEATMAP = dbc.Card([
    dbc.CardHeader("🔥 错题热力图", className="fw-bold"),
    dbc.CardBody([
        dcc.Graph(id="error-heatmap"),
    ]),
], className="mb-3")

DISCUSSION_CHART = dbc.Card([
    dbc.CardHeader("💬 讨论主题聚合", className="fw-bold"),
    dbc.CardBody([
        dcc.Graph(id="discussion-chart"),
    ]),
], className="mb-3")

REFUND_CHART = dbc.Card([
    dbc.CardHeader("💰 退款趋势对比", className="fw-bold"),
    dbc.CardBody([
        dcc.Graph(id="refund-chart"),
    ]),
], className="mb-3")

LEARNING_PATH_CHART = dbc.Card([
    dbc.CardHeader("🛤️ 学习路径变化", className="fw-bold"),
    dbc.CardBody([
        dcc.Graph(id="learning-path-chart"),
    ]),
], className="mb-3")

DRILLDOWN_PANEL = dbc.Card([
    dbc.CardHeader("🔍 原始学习记录下钻", className="fw-bold"),
    dbc.CardBody([
        dbc.Row([
            dbc.Col([
                dbc.Label("记录类型"),
                dcc.Dropdown(
                    id="drilldown-type",
                    options=[
                        {"label": "全部", "value": "all"},
                        {"label": "观看", "value": "viewing"},
                        {"label": "测验", "value": "quiz"},
                        {"label": "错题", "value": "error"},
                    ],
                    value="all",
                    clearable=False,
                ),
            ], width=3),
            dbc.Col([
                dbc.Label("每页数量"),
                dcc.Dropdown(
                    id="drilldown-pagesize",
                    options=[
                        {"label": "50条", "value": 50},
                        {"label": "100条", "value": 100},
                        {"label": "200条", "value": 200},
                    ],
                    value=100,
                    clearable=False,
                ),
            ], width=2),
            dbc.Col([
                dbc.Label("页码"),
                dcc.Dropdown(
                    id="drilldown-page",
                    options=[{"label": f"第{i}页", "value": i} for i in range(1, 11)],
                    value=1,
                    clearable=False,
                ),
            ], width=2),
        ]),
        html.Div(id="drilldown-table", className="mt-3"),
    ]),
], className="mb-3", id="drilldown-panel-card", style={"display": "none"})

STATS_SUMMARY = dbc.Card([
    dbc.CardHeader("📊 稳定期统计对比", className="fw-bold"),
    dbc.CardBody([
        html.Div(id="stats-summary"),
    ]),
], className="mb-3")

app.layout = dbc.Container([
    NAVBAR,
    dcc.Store(id="filter-state"),
    dcc.Store(id="unmapped-store"),
    html.Div(id="export-trigger", style={"display": "none"}),

    CHAPTER_SELECTOR,
    UNMAPPED_ALERT,
    VERSION_TABLE,
    MAPPING_TABLE,

    dbc.Tabs([
        dbc.Tab(label="👁️ 观看", tab_id="tab-viewing", children=[VIEWING_CHART]),
        dbc.Tab(label="📝 测验", tab_id="tab-quiz", children=[QUIZ_CHART]),
        dbc.Tab(label="🔥 错题", tab_id="tab-error", children=[ERROR_HEATMAP]),
        dbc.Tab(label="💬 讨论", tab_id="tab-discussion", children=[DISCUSSION_CHART]),
        dbc.Tab(label="💰 退款", tab_id="tab-refund", children=[REFUND_CHART]),
        dbc.Tab(label="🛤️ 学习路径", tab_id="tab-path", children=[LEARNING_PATH_CHART]),
        dbc.Tab(label="📊 统计", tab_id="tab-stats", children=[STATS_SUMMARY]),
    ], id="main-tabs", active_tab="tab-viewing", className="mb-3"),

    DRILLDOWN_PANEL,

    dbc.Modal([
        dbc.ModalHeader(dbc.ModalTitle("📥 导出报告")),
        dbc.ModalBody([
            html.P("报告将包含所有图表数据和原始记录的 Excel 文件。"),
            html.Div(id="export-status"),
        ]),
        dbc.ModalFooter([
            dbc.Button("下载", id="btn-export-confirm", color="primary"),
            dbc.Button("关闭", id="btn-export-close", color="secondary"),
        ]),
    ], id="export-modal", is_open=False),

    dcc.Download(id="download-report"),

    html.Footer(
        html.Small("课程内容更新影响分析系统 · Python Dash + Plotly + TimescaleDB",
                   className="text-muted"),
        className="text-center mt-4 mb-3",
    ),
], fluid=True)


def _get_mapping_context(chapter_id):
    versions = queries.get_chapter_versions(chapter_id)
    has_multiple = len(versions) >= 2
    old_vid = versions.iloc[0]["id"] if has_multiple else None
    new_vid = versions.iloc[-1]["id"] if has_multiple else None
    return has_multiple, old_vid, new_vid


def _get_mapped_data(chapter_id, version_id=None):
    has_multiple, old_vid, new_vid = _get_mapping_context(chapter_id)

    result = {
        "viewing": pd.DataFrame(),
        "quiz": pd.DataFrame(),
        "error": pd.DataFrame(),
        "discussion": pd.DataFrame(),
        "refund": pd.DataFrame(),
        "learning_path_events": pd.DataFrame(),
        "learning_path_flow": pd.DataFrame(),
        "unmapped_viewing": pd.DataFrame(),
        "unmapped_quiz": pd.DataFrame(),
        "unmapped_error": pd.DataFrame(),
        "unmapped_discussion": pd.DataFrame(),
        "unmapped_learning_path": pd.DataFrame(),
        "unmapped_section_info": [],
        "has_multiple": has_multiple,
        "old_vid": old_vid,
        "new_vid": new_vid,
        "unmapped_old_sids": set(),
    }

    update_date = queries.get_update_date(chapter_id)

    if version_id is not None:
        result["viewing"] = queries.get_viewing_comparison(chapter_id, version_id)
        result["quiz"] = queries.get_quiz_comparison(chapter_id, version_id)
        result["error"] = queries.get_error_heatmap_data(chapter_id, version_id)
        result["discussion"] = queries.get_discussion_aggregation(chapter_id, version_id)
        result["refund"] = queries.get_refund_comparison(chapter_id, version_id)
        lp_agg, lp_flow = queries.get_learning_path_data(chapter_id, version_id)
        result["learning_path_events"] = lp_agg
        result["learning_path_flow"] = lp_flow
        return result

    if not has_multiple:
        result["viewing"] = queries.get_viewing_comparison(chapter_id)
        result["quiz"] = queries.get_quiz_comparison(chapter_id)
        result["error"] = queries.get_error_heatmap_data(chapter_id)
        result["discussion"] = queries.get_discussion_aggregation(chapter_id)
        result["refund"] = queries.get_refund_comparison(chapter_id)
        lp_agg, lp_flow = queries.get_learning_path_data(chapter_id)
        result["learning_path_events"] = lp_agg
        result["learning_path_flow"] = lp_flow
        return result

    _, unmapped_section_info = mapping_service.get_section_mapping(old_vid, new_vid)
    result["unmapped_section_info"] = unmapped_section_info

    unmapped_old_sids = set()
    for rec in unmapped_section_info:
        if rec.get("version") == "old":
            unmapped_old_sids.add(rec["section_id"])
    result["unmapped_old_sids"] = unmapped_old_sids

    old_viewing_raw = queries._get_version_raw_records("viewing_records", chapter_id, old_vid)
    new_viewing_raw = queries._get_version_raw_records("viewing_records", chapter_id, new_vid)
    old_quiz_raw = queries._get_version_raw_records("quiz_records", chapter_id, old_vid)
    new_quiz_raw = queries._get_version_raw_records("quiz_records", chapter_id, new_vid)
    old_error_raw = queries._get_version_raw_records("error_records", chapter_id, old_vid)
    new_error_raw = queries._get_version_raw_records("error_records", chapter_id, new_vid)
    old_disc_raw = queries._get_version_raw_records("discussion_records", chapter_id, old_vid)
    new_disc_raw = queries._get_version_raw_records("discussion_records", chapter_id, new_vid)
    old_lp_raw = queries._get_version_raw_records("learning_path_events", chapter_id, old_vid)
    new_lp_raw = queries._get_version_raw_records("learning_path_events", chapter_id, new_vid)

    mapped_viewing, unmapped_viewing = mapping_service.map_records_to_new_structure(
        old_viewing_raw, old_vid, new_vid
    )
    mapped_quiz, unmapped_quiz = mapping_service.map_records_to_new_structure(
        old_quiz_raw, old_vid, new_vid
    )
    mapped_error, unmapped_error = mapping_service.map_records_to_new_structure(
        old_error_raw, old_vid, new_vid
    )

    result["unmapped_viewing"] = unmapped_viewing
    result["unmapped_quiz"] = unmapped_quiz
    result["unmapped_error"] = unmapped_error

    if not mapped_viewing.empty:
        if not new_viewing_raw.empty:
            combined_viewing = pd.concat([mapped_viewing, new_viewing_raw], ignore_index=True)
        else:
            combined_viewing = mapped_viewing
    else:
        combined_viewing = new_viewing_raw

    if not combined_viewing.empty:
        combined_viewing["date"] = pd.to_datetime(combined_viewing["time"]).dt.date
        daily = combined_viewing.groupby("date").agg(
            avg_duration=("duration_seconds", "mean"),
            avg_completion=("completion_pct", "mean"),
            view_count=("user_id", "count"),
            unique_users=("user_id", "nunique"),
        ).reset_index()
        daily["date"] = pd.to_datetime(daily["date"])
        before, transition, after = queries._split_periods(daily, update_date, "date")
        result["viewing"] = queries._apply_period_labels(before, transition, after)

    if not mapped_quiz.empty:
        if not new_quiz_raw.empty:
            combined_quiz = pd.concat([mapped_quiz, new_quiz_raw], ignore_index=True)
        else:
            combined_quiz = mapped_quiz
    else:
        combined_quiz = new_quiz_raw

    if not combined_quiz.empty:
        combined_quiz["date"] = pd.to_datetime(combined_quiz["time"]).dt.date
        daily = combined_quiz.groupby("date").agg(
            avg_score=("score", "mean"),
            quiz_count=("user_id", "count"),
            unique_users=("user_id", "nunique"),
            avg_correct=("correct_answers", "mean"),
        ).reset_index()
        daily["date"] = pd.to_datetime(daily["date"])
        before, transition, after = queries._split_periods(daily, update_date, "date")
        result["quiz"] = queries._apply_period_labels(before, transition, after)

    sections = queries.get_chapter_sections()

    if not mapped_error.empty:
        if not new_error_raw.empty:
            combined_error = pd.concat([mapped_error, new_error_raw], ignore_index=True)
        else:
            combined_error = mapped_error
    else:
        combined_error = new_error_raw

    if not combined_error.empty and not sections.empty:
        combined_error = combined_error.merge(
            sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
            on="section_id", how="left"
        )
        result["error"] = combined_error.groupby(["section_name", "question_id"]).size().reset_index(
            name="error_count"
        )

    mapped_disc, unmapped_disc = mapping_service.map_records_to_new_structure(
        old_disc_raw, old_vid, new_vid
    )
    result["unmapped_discussion"] = unmapped_disc

    if not mapped_disc.empty:
        if not new_disc_raw.empty:
            combined_disc = pd.concat([mapped_disc, new_disc_raw], ignore_index=True)
        else:
            combined_disc = mapped_disc
    else:
        combined_disc = new_disc_raw

    if not combined_disc.empty:
        combined_disc["date"] = pd.to_datetime(combined_disc["time"]).dt.date
        all_tags = []
        for _, row in combined_disc.iterrows():
            tags = row.get("topic_tags", [])
            if isinstance(tags, str):
                import ast
                try:
                    tags = ast.literal_eval(tags)
                except Exception:
                    tags = [tags]
            if isinstance(tags, (list, tuple)):
                for tag in tags:
                    all_tags.append({"date": row["date"], "tag": tag, "section_id": row["section_id"]})
        if all_tags:
            tags_df = pd.DataFrame(all_tags)
            tags_df["date"] = pd.to_datetime(tags_df["date"])
            agg = tags_df.groupby(["date", "tag"]).size().reset_index(name="count")
            result["discussion"] = queries._apply_period_column(agg, update_date, "date")

    result["refund"] = queries.get_refund_comparison(chapter_id)

    mapped_lp, unmapped_lp = mapping_service.map_records_to_new_structure(
        old_lp_raw, old_vid, new_vid
    )
    result["unmapped_learning_path"] = unmapped_lp

    mapping_records = mapping_service._get_mappings(old_vid, new_vid)
    sid_map = {}
    for _, mr in mapping_records.iterrows():
        if mr["mapping_type"] != "unmapped":
            sid_map.setdefault(mr["old_section_id"], []).append(mr["new_section_id"])

    if not mapped_lp.empty:
        for col in ["from_section_id", "to_section_id"]:
            if col in mapped_lp.columns:
                mapped_lp[col] = mapped_lp[col].apply(
                    lambda s: sid_map.get(s, [s])[0] if pd.notna(s) else s
                )

    if not mapped_lp.empty:
        if "from_section_id" in mapped_lp.columns and "to_section_id" in mapped_lp.columns:
            has_unmapped_ref = (
                mapped_lp["from_section_id"].isin(unmapped_old_sids) |
                mapped_lp["to_section_id"].isin(unmapped_old_sids)
            )
            if has_unmapped_ref.any():
                unmapped_ref_rows = mapped_lp[has_unmapped_ref].copy()
                unmapped_ref_rows["mapping_type"] = "unmapped"
                if not unmapped_lp.empty:
                    unmapped_lp = pd.concat([unmapped_lp, unmapped_ref_rows], ignore_index=True)
                    result["unmapped_learning_path"] = unmapped_lp
                else:
                    result["unmapped_learning_path"] = unmapped_ref_rows
                mapped_lp = mapped_lp[~has_unmapped_ref].copy()

    if not mapped_lp.empty:
        if not new_lp_raw.empty:
            for col in ["from_section_id", "to_section_id"]:
                if col in new_lp_raw.columns:
                    new_lp_raw[col] = new_lp_raw[col]
            combined_lp = pd.concat([mapped_lp, new_lp_raw], ignore_index=True)
        else:
            combined_lp = mapped_lp
    else:
        combined_lp = new_lp_raw

    if not combined_lp.empty:
        combined_lp["date"] = pd.to_datetime(combined_lp["time"]).dt.date
        event_agg = combined_lp.groupby(["date", "event_type"]).size().reset_index(name="count")
        event_agg["date"] = pd.to_datetime(event_agg["date"])
        event_agg = queries._apply_period_column(event_agg, update_date, "date")

        transitions = combined_lp[
            combined_lp["from_section_id"].notna() & combined_lp["to_section_id"].notna()
        ].copy()
        if not transitions.empty and not sections.empty:
            trans = transitions.merge(
                sections[["id", "section_name"]].rename(
                    columns={"id": "from_section_id", "section_name": "from_name"}
                ), on="from_section_id", how="left"
            ).merge(
                sections[["id", "section_name"]].rename(
                    columns={"id": "to_section_id", "section_name": "to_name"}
                ), on="to_section_id", how="left"
            )
            flow = trans.groupby(["from_name", "to_name"]).size().reset_index(name="count")
            flow = flow.sort_values("count", ascending=False).head(20)
        else:
            flow = pd.DataFrame()

        result["learning_path_events"] = event_agg
        result["learning_path_flow"] = flow

    return result


def _build_unmapped_alert(unmapped_data):
    if not unmapped_data:
        return ""

    unmapped_viewing = unmapped_data.get("unmapped_viewing", pd.DataFrame())
    unmapped_quiz = unmapped_data.get("unmapped_quiz", pd.DataFrame())
    unmapped_error = unmapped_data.get("unmapped_error", pd.DataFrame())
    unmapped_discussion = unmapped_data.get("unmapped_discussion", pd.DataFrame())
    unmapped_learning_path = unmapped_data.get("unmapped_learning_path", pd.DataFrame())
    unmapped_section_info = unmapped_data.get("unmapped_section_info", [])

    if (unmapped_viewing.empty and unmapped_quiz.empty
            and unmapped_error.empty and unmapped_discussion.empty
            and unmapped_learning_path.empty):
        if not unmapped_section_info:
            return dbc.Alert(
                "✅ 所有旧章节小节均可映射到新结构，学习记录已完整映射。",
                color="success", dismissable=True
            )
        return dbc.Alert(
            "✅ 所有旧章节学习记录均可映射到新结构。",
            color="success", dismissable=True
        )

    section_items = []
    for rec in unmapped_section_info:
        section_items.append(html.Li(
            f"「{rec['section_name']}」({rec['version']}版本) - {rec['reason']}"
        ))

    sample_parts = []
    if not unmapped_viewing.empty:
        sample_parts.append(f"观看记录 {len(unmapped_viewing)} 条")
    if not unmapped_quiz.empty:
        sample_parts.append(f"测验记录 {len(unmapped_quiz)} 条")
    if not unmapped_error.empty:
        sample_parts.append(f"错题记录 {len(unmapped_error)} 条")
    if not unmapped_discussion.empty:
        sample_parts.append(f"讨论记录 {len(unmapped_discussion)} 条")
    if not unmapped_learning_path.empty:
        sample_parts.append(f"学习路径记录 {len(unmapped_learning_path)} 条")

    sample_detail = "，涉及 " + "、".join(sample_parts) if sample_parts else ""

    record_detail_rows = []
    sections = queries.get_chapter_sections()

    if not unmapped_viewing.empty:
        uv = unmapped_viewing.copy()
        if not sections.empty and "section_id" in uv.columns:
            uv = uv.merge(
                sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
                on="section_id", how="left"
            )
        record_detail_rows.append(
            html.Tr([html.Td("观看"), html.Td(str(len(unmapped_viewing))),
                     html.Td(", ".join(uv["section_name"].unique()[:5]) if "section_name" in uv.columns else "—")])
        )

    if not unmapped_quiz.empty:
        uq = unmapped_quiz.copy()
        if not sections.empty and "section_id" in uq.columns:
            uq = uq.merge(
                sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
                on="section_id", how="left"
            )
        record_detail_rows.append(
            html.Tr([html.Td("测验"), html.Td(str(len(unmapped_quiz))),
                     html.Td(", ".join(uq["section_name"].unique()[:5]) if "section_name" in uq.columns else "—")])
        )

    if not unmapped_error.empty:
        ue = unmapped_error.copy()
        if not sections.empty and "section_id" in ue.columns:
            ue = ue.merge(
                sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
                on="section_id", how="left"
            )
        record_detail_rows.append(
            html.Tr([html.Td("错题"), html.Td(str(len(unmapped_error))),
                     html.Td(", ".join(ue["section_name"].unique()[:5]) if "section_name" in ue.columns else "—")])
        )

    if not unmapped_discussion.empty:
        ud = unmapped_discussion.copy()
        if not sections.empty and "section_id" in ud.columns:
            ud = ud.merge(
                sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
                on="section_id", how="left"
            )
        record_detail_rows.append(
            html.Tr([html.Td("讨论"), html.Td(str(len(unmapped_discussion))),
                     html.Td(", ".join(ud["section_name"].unique()[:5]) if "section_name" in ud.columns else "—")])
        )

    if not unmapped_learning_path.empty:
        ulp = unmapped_learning_path.copy()
        if not sections.empty and "section_id" in ulp.columns:
            ulp = ulp.merge(
                sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
                on="section_id", how="left"
            )
        record_detail_rows.append(
            html.Tr([html.Td("学习路径"), html.Td(str(len(unmapped_learning_path))),
                     html.Td(", ".join(ulp["section_name"].unique()[:5]) if "section_name" in ulp.columns else "—")])
        )

    alert_content = [
        html.Strong(f"⚠️ 无法映射到新结构的学习记录{sample_detail}："),
    ]

    if section_items:
        alert_content.append(html.Ul(section_items))

    alert_content.append(html.Table([
        html.Thead(html.Tr([html.Th("记录类型"), html.Th("数量"), html.Th("涉及小节")])),
        html.Tbody(record_detail_rows),
    ], className="table table-sm table-bordered"))

    alert_content.append(
        html.Small("这些记录已排除在稳定期对比图表之外，可在下钻面板中查看。", className="text-muted")
    )

    return dbc.Alert(alert_content, color="warning", dismissable=True)


@app.callback(
    [Output("chapter-selector", "options"), Output("chapter-selector", "value")],
    Input("chapter-selector", "id"),
)
def load_chapters(_):
    chapters = queries.get_chapters()
    if chapters.empty:
        return [], None
    options = [{"label": f"{row['name']} (课程ID:{row['course_id']})", "value": row["id"]}
               for _, row in chapters.iterrows()]
    return options, options[0]["value"] if options else None


@app.callback(
    [Output("version-selector", "options"), Output("version-selector", "value")],
    [Input("chapter-selector", "value")],
    [State("version-selector", "value")],
)
def load_versions(chapter_id, current_version):
    if not chapter_id:
        return [], None

    versions = queries.get_chapter_versions(chapter_id)
    if versions.empty:
        return [], None

    options = [{"label": f"V{row['version_number']} - {str(row['updated_at'])[:10]}",
                "value": row["id"]}
               for _, row in versions.iterrows()]

    if current_version is not None and any(o["value"] == current_version for o in options):
        return options, current_version

    return options, None


@app.callback(
    Output("date-range", "min_date_allowed"),
    Output("date-range", "max_date_allowed"),
    Output("date-range", "start_date"),
    Output("date-range", "end_date"),
    Input("chapter-selector", "value"),
)
def set_date_range(chapter_id):
    if not chapter_id:
        return None, None, None, None

    versions = queries.get_chapter_versions(chapter_id)
    if versions.empty:
        return None, None, None, None

    min_date = str(versions["updated_at"].min())[:10]
    max_date = "2026-05-01"

    return min_date, max_date, min_date, max_date


@app.callback(
    Output("filter-state", "data"),
    [
        Input("chapter-selector", "value"),
        Input("version-selector", "value"),
        Input("date-range", "start_date"),
        Input("date-range", "end_date"),
        Input("exclude-transition", "value"),
    ],
)
def update_filter_state(chapter_id, version_id, start_date, end_date, exclude_transition):
    return {
        "chapter_id": chapter_id,
        "version_id": version_id,
        "start_date": start_date,
        "end_date": end_date,
        "exclude_transition": "exclude" in (exclude_transition or []),
    }


@app.callback(
    Output("version-table", "figure"),
    Input("chapter-selector", "value"),
)
def update_version_table(chapter_id):
    if not chapter_id:
        return go.Figure()
    versions = queries.get_chapter_versions(chapter_id)
    return build_version_table(versions)


@app.callback(
    [Output("mapping-table", "figure"), Output("unmapped-store", "data"),
     Output("unmapped-alert", "children")],
    Input("chapter-selector", "value"),
)
def update_mapping_table(chapter_id):
    if not chapter_id:
        return go.Figure(), [], ""

    has_multiple, old_vid, new_vid = _get_mapping_context(chapter_id)
    if not has_multiple:
        return go.Figure().update_layout(title="章节映射（仅一个版本，无需映射）"), [], ""

    mapping_df, unmapped_records = mapping_service.get_section_mapping(old_vid, new_vid)
    fig = build_mapping_table(mapping_df, unmapped_records)

    mapped_data = _get_mapped_data(chapter_id, version_id=None)
    alert = _build_unmapped_alert(mapped_data)

    unmapped_store_data = []
    if not mapped_data["unmapped_viewing"].empty:
        for _, row in mapped_data["unmapped_viewing"].iterrows():
            unmapped_store_data.append({"record_type": "观看", "time": str(row.get("time", "")),
                                        "user_id": str(row.get("user_id", "")),
                                        "section_id": str(row.get("section_id", ""))})
    if not mapped_data["unmapped_quiz"].empty:
        for _, row in mapped_data["unmapped_quiz"].iterrows():
            unmapped_store_data.append({"record_type": "测验", "time": str(row.get("time", "")),
                                        "user_id": str(row.get("user_id", "")),
                                        "section_id": str(row.get("section_id", ""))})
    if not mapped_data["unmapped_error"].empty:
        for _, row in mapped_data["unmapped_error"].iterrows():
            unmapped_store_data.append({"record_type": "错题", "time": str(row.get("time", "")),
                                        "user_id": str(row.get("user_id", "")),
                                        "section_id": str(row.get("section_id", ""))})

    return fig, unmapped_store_data, alert


@app.callback(
    Output("viewing-chart", "figure"),
    [Input("chapter-selector", "value"), Input("version-selector", "value"),
     Input("exclude-transition", "value")],
    State("filter-state", "data"),
)
def update_viewing_chart(chapter_id, version_id, exclude_transition, filter_state):
    if not chapter_id:
        return go.Figure()

    mapped = _get_mapped_data(chapter_id, version_id)
    df = mapped["viewing"]
    update_date = queries.get_update_date(chapter_id)

    if filter_state and filter_state.get("exclude_transition") and not df.empty:
        df = df[df["period"] != "过渡期"]

    return build_viewing_chart(df, update_date)


@app.callback(
    Output("quiz-chart", "figure"),
    [Input("chapter-selector", "value"), Input("version-selector", "value"),
     Input("exclude-transition", "value")],
    State("filter-state", "data"),
)
def update_quiz_chart(chapter_id, version_id, exclude_transition, filter_state):
    if not chapter_id:
        return go.Figure()

    mapped = _get_mapped_data(chapter_id, version_id)
    df = mapped["quiz"]
    update_date = queries.get_update_date(chapter_id)

    if filter_state and filter_state.get("exclude_transition") and not df.empty:
        df = df[df["period"] != "过渡期"]

    return build_quiz_chart(df, update_date)


@app.callback(
    Output("error-heatmap", "figure"),
    [Input("chapter-selector", "value"), Input("version-selector", "value")],
)
def update_error_heatmap(chapter_id, version_id):
    if not chapter_id:
        return go.Figure()

    mapped = _get_mapped_data(chapter_id, version_id)
    df = mapped["error"]

    return build_error_heatmap(df)


@app.callback(
    Output("discussion-chart", "figure"),
    [Input("chapter-selector", "value"), Input("version-selector", "value")],
)
def update_discussion_chart(chapter_id, version_id):
    if not chapter_id:
        return go.Figure()

    mapped = _get_mapped_data(chapter_id, version_id)
    df = mapped["discussion"]
    update_date = queries.get_update_date(chapter_id)
    return build_discussion_chart(df, update_date)


@app.callback(
    Output("refund-chart", "figure"),
    [Input("chapter-selector", "value"), Input("version-selector", "value"),
     Input("exclude-transition", "value")],
    State("filter-state", "data"),
)
def update_refund_chart(chapter_id, version_id, exclude_transition, filter_state):
    if not chapter_id:
        return go.Figure()

    mapped = _get_mapped_data(chapter_id, version_id)
    df = mapped["refund"]
    update_date = queries.get_update_date(chapter_id)

    if filter_state and filter_state.get("exclude_transition") and not df.empty:
        df = df[df["period"] != "过渡期"]

    return build_refund_chart(df, update_date)


@app.callback(
    Output("learning-path-chart", "figure"),
    [Input("chapter-selector", "value"), Input("version-selector", "value")],
)
def update_learning_path_chart(chapter_id, version_id):
    if not chapter_id:
        return go.Figure()

    mapped = _get_mapped_data(chapter_id, version_id)
    agg_df = mapped["learning_path_events"]
    flow_df = mapped["learning_path_flow"]

    return build_learning_path_chart(agg_df, flow_df)


@app.callback(
    Output("stats-summary", "children"),
    Input("chapter-selector", "value"),
)
def update_stats_summary(chapter_id):
    if not chapter_id:
        return html.P("请选择章节")

    mapped = _get_mapped_data(chapter_id)
    viewing = mapped["viewing"]
    quiz = mapped["quiz"]

    stats = {}
    for label, df in [("观看", viewing), ("测验", quiz)]:
        if df.empty:
            continue
        for period in ["更新前", "更新后"]:
            subset = df[df["period"] == period]
            if subset.empty:
                continue
            numeric_cols = subset.select_dtypes(include="number").columns
            for col in numeric_cols:
                key = f"{label}_{period}_{col}"
                stats[key] = subset[col].mean()

    if not stats:
        return html.P("数据不足，无法计算统计对比")

    viewing_keys = [k for k in stats if k.startswith("观看_")]
    quiz_keys = [k for k in stats if k.startswith("测验_")]

    def _build_comparison_rows(keys, stats):
        rows = []
        before_vals = {k.replace("更新前_", ""): v for k, v in stats.items()
                       if "更新前" in k}
        after_vals = {k.replace("更新后_", ""): v for k, v in stats.items()
                      if "更新后" in k}

        for metric in before_vals:
            if metric in after_vals:
                before_v = before_vals[metric]
                after_v = after_vals[metric]
                if before_v != 0:
                    change = (after_v - before_v) / abs(before_v) * 100
                    change_str = f"{change:+.1f}%"
                    color = "success" if change > 0 else "danger" if change < 0 else "secondary"
                else:
                    change_str = "N/A"
                    color = "secondary"
                rows.append(html.Tr([
                    html.Td(metric),
                    html.Td(f"{before_v:.2f}"),
                    html.Td(f"{after_v:.2f}"),
                    html.Td(dbc.Badge(change_str, color=color)),
                ]))
        return rows

    viewing_rows = _build_comparison_rows(viewing_keys, stats)
    quiz_rows = _build_comparison_rows(quiz_keys, stats)

    return dbc.Row([
        dbc.Col([
            html.H6("观看指标", className="mt-2"),
            dbc.Table([
                html.Thead(html.Tr([
                    html.Th("指标"), html.Th("更新前"), html.Th("更新后"), html.Th("变化"),
                ])),
                html.Tbody(viewing_rows),
            ], size="sm", bordered=True),
        ], width=6),
        dbc.Col([
            html.H6("测验指标", className="mt-2"),
            dbc.Table([
                html.Thead(html.Tr([
                    html.Th("指标"), html.Th("更新前"), html.Th("更新后"), html.Th("变化"),
                ])),
                html.Tbody(quiz_rows),
            ], size="sm", bordered=True),
        ], width=6),
    ])


@app.callback(
    Output("drilldown-table", "children"),
    [Input("chapter-selector", "value"), Input("version-selector", "value"),
     Input("drilldown-type", "value"), Input("drilldown-page", "value"),
     Input("drilldown-pagesize", "value")],
    State("filter-state", "data"),
)
def update_drilldown(chapter_id, version_id, record_type, page, page_size, filter_state):
    if not chapter_id:
        return ""

    start_date = filter_state.get("start_date") if filter_state else None
    end_date = filter_state.get("end_date") if filter_state else None

    has_multiple, old_vid, new_vid = _get_mapping_context(chapter_id)

    if has_multiple and version_id is None:
        mapped = _get_mapped_data(chapter_id, version_id=None)
        unmapped_old_sids = mapped.get("unmapped_old_sids", set())

        parts = []
        if record_type in ("all", "viewing") and not mapped["unmapped_viewing"].empty:
            uv = mapped["unmapped_viewing"].copy()
            uv["record_type"] = "观看(无法映射)"
            uv["_struct_ver"] = "旧版"
            uv["mapping_type"] = "unmapped"
            parts.append(uv)

        if record_type in ("all", "quiz") and not mapped["unmapped_quiz"].empty:
            uq = mapped["unmapped_quiz"].copy()
            uq["record_type"] = "测验(无法映射)"
            uq["_struct_ver"] = "旧版"
            uq["mapping_type"] = "unmapped"
            parts.append(uq)

        if record_type in ("all", "error") and not mapped["unmapped_error"].empty:
            ue = mapped["unmapped_error"].copy()
            ue["record_type"] = "错题(无法映射)"
            ue["_struct_ver"] = "旧版"
            ue["mapping_type"] = "unmapped"
            parts.append(ue)

        mapped_df = queries.get_raw_records(chapter_id, version_id, record_type, start_date, end_date)
        if not mapped_df.empty and unmapped_old_sids and "section_id" in mapped_df.columns:
            mapped_df = mapped_df[~mapped_df["section_id"].isin(unmapped_old_sids)].copy()

        if not mapped_df.empty:
            old_sids = set(queries.get_section_ids_for_version(old_vid))
            new_sids = set(queries.get_section_ids_for_version(new_vid))
            if "section_id" in mapped_df.columns:
                mapped_df["_struct_ver"] = mapped_df["section_id"].apply(
                    lambda s: "旧版→新版(已映射)" if s in new_sids else ("旧版" if s in old_sids else "新版")
                )
            parts.append(mapped_df)

        if not parts:
            return html.P("无匹配记录", className="text-muted")

        df = pd.concat(parts, ignore_index=True)
    else:
        df = queries.get_raw_records(chapter_id, version_id, record_type, start_date, end_date)

    if df.empty:
        return html.P("无匹配记录", className="text-muted")

    sections = queries.get_chapter_sections()
    if "section_name" not in df.columns and not sections.empty and "section_id" in df.columns:
        df = df.merge(
            sections[["id", "section_name"]].rename(columns={"id": "section_id"}),
            on="section_id", how="left"
        )

    if "_struct_ver" not in df.columns and has_multiple and version_id is None:
        old_sids = set(queries.get_section_ids_for_version(old_vid))
        new_sids = set(queries.get_section_ids_for_version(new_vid))
        if "section_id" in df.columns:
            df["_struct_ver"] = df["section_id"].apply(
                lambda s: "旧版" if s in old_sids else ("新版" if s in new_sids else "未知")
            )

    display_cols = [c for c in df.columns if c in
                    ["time", "user_id", "section_name", "record_type", "duration_seconds",
                     "completion_pct", "score", "total_questions", "correct_answers",
                     "question_id", "selected_answer", "correct_answer", "_struct_ver",
                     "mapping_type"]]

    col_rename = {
        "time": "时间", "user_id": "用户ID", "section_name": "小节",
        "record_type": "类型", "duration_seconds": "时长(秒)",
        "completion_pct": "完播率", "score": "分数",
        "total_questions": "总题数", "correct_answers": "正确数",
        "question_id": "题目ID", "selected_answer": "选择答案",
        "correct_answer": "正确答案", "_struct_ver": "结构版本",
        "mapping_type": "映射类型",
    }

    display_df = df[display_cols].copy()
    display_df.columns = [col_rename.get(c, c) for c in display_df.columns]

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    display_df = display_df.iloc[start_idx:end_idx]

    return dbc.Table.from_dataframe(
        display_df.head(50),
        striped=True, bordered=True, hover=True, size="sm",
        style={"font_size": "12px"},
    )


@app.callback(
    Output("drilldown-panel-card", "style"),
    Input("nav-drilldown", "n_clicks"),
    State("drilldown-panel-card", "style"),
)
def toggle_drilldown(n_clicks, current_style):
    if not n_clicks:
        return {"display": "none"}
    if current_style.get("display") == "none":
        return {"display": "block"}
    return {"display": "none"}


@app.callback(
    [Output("export-modal", "is_open"), Output("download-report", "data"),
     Output("export-status", "children")],
    [Input("btn-export", "n_clicks"), Input("btn-export-confirm", "n_clicks"),
     Input("btn-export-close", "n_clicks")],
    [State("chapter-selector", "value"), State("filter-state", "data")],
    prevent_initial_call=True,
)
def handle_export(export_clicks, confirm_clicks, close_clicks, chapter_id, filter_state):
    ctx = callback_context
    if not ctx.triggered:
        return False, None, ""

    trigger_id = ctx.triggered[0]["prop_id"].split(".")[0]

    if trigger_id == "btn-export":
        return True, None, html.P("准备生成报告...")

    if trigger_id == "btn-export-close":
        return False, None, ""

    if trigger_id == "btn-export-confirm":
        if not chapter_id:
            return False, None, ""

        chapters = queries.get_chapters()
        ch_name = "unknown"
        if not chapters.empty:
            row = chapters[chapters["id"] == chapter_id]
            if not row.empty:
                ch_name = row.iloc[0]["name"]

        try:
            mapped = _get_mapped_data(chapter_id)
            report_data, filename = export_service.build_report_data(
                chapter_id, queries, mapping_service, mapped
            )
            excel_bytes = export_service.export_to_excel(report_data, ch_name)
            b64 = base64.b64encode(excel_bytes).decode()
            download_data = {
                "content": f"data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,{b64}",
                "filename": filename,
                "base64": True,
            }
            return False, download_data, html.P("✅ 报告已生成！", className="text-success")
        except Exception as e:
            import traceback
            traceback.print_exc()
            return True, None, html.P(f"❌ 生成失败: {str(e)}", className="text-danger")

    return False, None, ""


if __name__ == "__main__":
    mode_label = "演示模式" if DEMO_MODE else "TimescaleDB 模式"
    print(f"🚀 启动课程内容更新影响分析系统 ({mode_label})")
    print(f"   访问地址: http://{APP_HOST}:{APP_PORT}")
    app.run(host=APP_HOST, port=APP_PORT, debug=APP_DEBUG)
