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

    versions = queries.get_chapter_versions(chapter_id)
    if len(versions) < 2:
        return go.Figure().update_layout(title="章节映射（仅一个版本，无需映射）"), [], ""

    old_vid = versions.iloc[0]["id"]
    new_vid = versions.iloc[-1]["id"]

    mapping_df, unmapped_records = mapping_service.get_section_mapping(old_vid, new_vid)
    fig = build_mapping_table(mapping_df, unmapped_records)

    alert = ""
    if unmapped_records:
        items = []
        for rec in unmapped_records:
            items.append(html.Li(
                f"「{rec['section_name']}」({rec['version']}版本) - {rec['reason']}"
            ))
        alert = dbc.Alert([
            html.Strong("⚠️ 以下小节无法映射，对应学习记录已单独标记："),
            html.Ul(items),
        ], color="warning", dismissable=True)

    return fig, unmapped_records, alert


@app.callback(
    Output("viewing-chart", "figure"),
    [Input("chapter-selector", "value"), Input("version-selector", "value"),
     Input("exclude-transition", "value")],
    State("filter-state", "data"),
)
def update_viewing_chart(chapter_id, version_id, exclude_transition, filter_state):
    if not chapter_id:
        return go.Figure()

    df = queries.get_viewing_comparison(chapter_id, version_id)
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

    df = queries.get_quiz_comparison(chapter_id, version_id)
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
    df = queries.get_error_heatmap_data(chapter_id, version_id)
    return build_error_heatmap(df)


@app.callback(
    Output("discussion-chart", "figure"),
    [Input("chapter-selector", "value"), Input("version-selector", "value")],
)
def update_discussion_chart(chapter_id, version_id):
    if not chapter_id:
        return go.Figure()
    df = queries.get_discussion_aggregation(chapter_id, version_id)
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

    df = queries.get_refund_comparison(chapter_id, version_id)
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
    result = queries.get_learning_path_data(chapter_id, version_id)
    if isinstance(result, tuple):
        agg_df, flow_df = result
    else:
        agg_df, flow_df = result, pd.DataFrame()
    return build_learning_path_chart(agg_df, flow_df)


@app.callback(
    Output("stats-summary", "children"),
    Input("chapter-selector", "value"),
)
def update_stats_summary(chapter_id):
    if not chapter_id:
        return html.P("请选择章节")

    stats = queries.get_stable_period_stats(chapter_id)
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

    df = queries.get_raw_learning_records(
        chapter_id, version_id, record_type, start_date, end_date, page, page_size
    )

    if df.empty:
        return html.P("无匹配记录", className="text-muted")

    display_cols = [c for c in df.columns if c in
                    ["time", "user_id", "section_name", "record_type", "duration_seconds",
                     "completion_pct", "score", "total_questions", "correct_answers",
                     "question_id", "selected_answer", "correct_answer"]]

    col_rename = {
        "time": "时间", "user_id": "用户ID", "section_name": "小节",
        "record_type": "类型", "duration_seconds": "时长(秒)",
        "completion_pct": "完播率", "score": "分数",
        "total_questions": "总题数", "correct_answers": "正确数",
        "question_id": "题目ID", "selected_answer": "选择答案",
        "correct_answer": "正确答案",
    }

    display_df = df[display_cols].copy()
    display_df.columns = [col_rename.get(c, c) for c in display_df.columns]

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

        report_data, filename = export_service.build_report_data(chapter_id, queries)

        try:
            excel_bytes = export_service.export_to_excel(report_data, ch_name)
            b64 = base64.b64encode(excel_bytes).decode()
            download_data = {
                "content": f"data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,{b64}",
                "filename": filename,
                "base64": True,
            }
            return False, download_data, html.P("✅ 报告已生成！", className="text-success")
        except Exception as e:
            return True, None, html.P(f"❌ 生成失败: {str(e)}", className="text-danger")

    return False, None, ""


if __name__ == "__main__":
    mode_label = "演示模式" if DEMO_MODE else "TimescaleDB 模式"
    print(f"🚀 启动课程内容更新影响分析系统 ({mode_label})")
    print(f"   访问地址: http://{APP_HOST}:{APP_PORT}")
    app.run(host=APP_HOST, port=APP_PORT, debug=APP_DEBUG)
