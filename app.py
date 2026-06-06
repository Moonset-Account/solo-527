import json
import base64
from datetime import datetime, date
from io import BytesIO

import dash
from dash import dcc, html, Input, Output, State, callback, ALL, ctx
import dash_bootstrap_components as dbc
import plotly.graph_objects as go

from config import Config
from database import init_db
from data_service import DataService
from chart_components import ChartComponents
from report_exporter import ReportExporter

app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    suppress_callback_exceptions=True,
    title="招聘流程效率仪表盘",
)

server = app.server

init_db()
data_service = DataService()
report_exporter = ReportExporter(data_service)

dim_options = data_service.get_dimension_options()


def create_filter_panel():
    return dbc.Card(
        [
            dbc.CardHeader(
                [
                    html.H5("🔍 筛选条件", className="mb-0"),
                ]
            ),
            dbc.CardBody(
                [
                    html.Div(
                        [
                            dbc.Label("保存的筛选组合"),
                            dcc.Dropdown(
                                id="saved-filter-dropdown",
                                options=[],
                                placeholder="选择已保存的筛选...",
                                clearable=True,
                            ),
                            dbc.Row(
                                [
                                    dbc.Col(
                                        dbc.Input(
                                            id="filter-name-input",
                                            placeholder="输入筛选名称...",
                                            type="text",
                                        ),
                                        width=8,
                                    ),
                                    dbc.Col(
                                        dbc.Button(
                                            "保存筛选",
                                            id="save-filter-btn",
                                            color="primary",
                                            className="w-100",
                                        ),
                                        width=4,
                                    ),
                                ],
                                className="mt-2",
                            ),
                        ],
                        className="mb-4",
                    ),
                    html.Hr(),
                    html.Div(
                        [
                            dbc.Label("职位"),
                            dcc.Dropdown(
                                id="filter-position",
                                options=[{"label": p, "value": p} for p in dim_options["positions"]],
                                multi=True,
                                placeholder="选择职位...",
                            ),
                        ],
                        className="mb-3",
                    ),
                    html.Div(
                        [
                            dbc.Label("部门"),
                            dcc.Dropdown(
                                id="filter-department",
                                options=[{"label": d, "value": d} for d in dim_options["departments"]],
                                multi=True,
                                placeholder="选择部门...",
                            ),
                        ],
                        className="mb-3",
                    ),
                    html.Div(
                        [
                            dbc.Label("招聘官"),
                            dcc.Dropdown(
                                id="filter-recruiter",
                                options=[{"label": r, "value": r} for r in dim_options["recruiters"]],
                                multi=True,
                                placeholder="选择招聘官...",
                            ),
                        ],
                        className="mb-3",
                    ),
                    html.Div(
                        [
                            dbc.Label("渠道"),
                            dcc.Dropdown(
                                id="filter-channel",
                                options=[{"label": c, "value": c} for c in dim_options["channels"]],
                                multi=True,
                                placeholder="选择渠道...",
                            ),
                        ],
                        className="mb-3",
                    ),
                    html.Div(
                        [
                            dbc.Label("当前阶段"),
                            dcc.Dropdown(
                                id="filter-stage",
                                options=[{"label": s, "value": s} for s in Config.STAGES],
                                multi=True,
                                placeholder="选择阶段...",
                            ),
                        ],
                        className="mb-3",
                    ),
                    html.Div(
                        [
                            dbc.Label("申请日期范围"),
                            dcc.DatePickerRange(
                                id="filter-date-range",
                                display_format="YYYY-MM-DD",
                                start_date_placeholder_text="开始日期",
                                end_date_placeholder_text="结束日期",
                                clearable=True,
                                className="w-100",
                            ),
                        ],
                        className="mb-3",
                    ),
                    html.Div(
                        [
                            dbc.Button(
                                "重置筛选",
                                id="reset-filter-btn",
                                color="secondary",
                                outline=True,
                                className="w-100",
                            ),
                        ]
                    ),
                ]
            ),
        ],
        className="h-100",
    )


def create_kpi_row():
    return dbc.Row(
        [
            dbc.Col(dcc.Graph(id="kpi-total", config={"displayModeBar": False}), width=2),
            dbc.Col(dcc.Graph(id="kpi-hired", config={"displayModeBar": False}), width=2),
            dbc.Col(dcc.Graph(id="kpi-conversion", config={"displayModeBar": False}), width=2),
            dbc.Col(dcc.Graph(id="kpi-cycle", config={"displayModeBar": False}), width=2),
            dbc.Col(dcc.Graph(id="kpi-inprocess", config={"displayModeBar": False}), width=2),
            dbc.Col(
                dbc.Card(
                    [
                        dbc.CardBody(
                            [
                                html.H6("📊 操作", className="card-title"),
                                dbc.Button(
                                    "导出报告",
                                    id="export-btn",
                                    color="success",
                                    className="w-100 mb-2",
                                ),
                                dcc.Download(id="download-excel"),
                                dbc.Button(
                                    "数据校验",
                                    id="check-quality-btn",
                                    color="warning",
                                    outline=True,
                                    className="w-100",
                                ),
                            ],
                            className="d-flex flex-column justify-content-center",
                        )
                    ],
                    className="h-100",
                ),
                width=2,
            ),
        ],
        className="mb-4 g-2",
    )


def create_charts_row():
    return [
        dbc.Row(
            [
                dbc.Col(
                    dbc.Card(
                        [
                            dbc.CardHeader(
                                [
                                    html.H5("📈 招聘漏斗", className="mb-0"),
                                    dcc.Dropdown(
                                        id="funnel-group-by",
                                        options=[
                                            {"label": "不分组", "value": "none"},
                                            {"label": "按职位", "value": "position"},
                                            {"label": "按部门", "value": "department"},
                                            {"label": "按招聘官", "value": "recruiter"},
                                            {"label": "按渠道", "value": "channel"},
                                        ],
                                        value="none",
                                        clearable=False,
                                        style={"width": "150px"},
                                    ),
                                ],
                                className="d-flex justify-content-between align-items-center",
                            ),
                            dbc.CardBody(dcc.Graph(id="funnel-chart")),
                        ]
                    ),
                    width=6,
                ),
                dbc.Col(
                    dbc.Card(
                        [
                            dbc.CardHeader(
                                [
                                    html.H5("⏱️ 阶段耗时", className="mb-0"),
                                    dcc.Dropdown(
                                        id="duration-group-by",
                                        options=[
                                            {"label": "不分组", "value": "none"},
                                            {"label": "按职位", "value": "position"},
                                            {"label": "按部门", "value": "department"},
                                            {"label": "按招聘官", "value": "recruiter"},
                                            {"label": "按渠道", "value": "channel"},
                                        ],
                                        value="none",
                                        clearable=False,
                                        style={"width": "150px"},
                                    ),
                                ],
                                className="d-flex justify-content-between align-items-center",
                            ),
                            dbc.CardBody(dcc.Graph(id="duration-chart")),
                        ]
                    ),
                    width=6,
                ),
            ],
            className="mb-4 g-2",
        ),
        dbc.Row(
            [
                dbc.Col(
                    dbc.Card(
                        [
                            dbc.CardHeader(html.H5("🎯 渠道质量分析", className="mb-0")),
                            dbc.CardBody(dcc.Graph(id="channel-chart")),
                        ]
                    ),
                    width=6,
                ),
                dbc.Col(
                    dbc.Card(
                        [
                            dbc.CardHeader(html.H5("👥 面试官负载", className="mb-0")),
                            dbc.CardBody(dcc.Graph(id="interviewer-chart")),
                        ]
                    ),
                    width=6,
                ),
            ],
            className="mb-4 g-2",
        ),
        dbc.Row(
            [
                dbc.Col(
                    dbc.Card(
                        [
                            dbc.CardHeader(
                                [
                                    html.H5("😊 候选人体验", className="mb-0"),
                                    dcc.Dropdown(
                                        id="feedback-group-by",
                                        options=[
                                            {"label": "总体", "value": "none"},
                                            {"label": "按部门", "value": "department"},
                                            {"label": "按渠道", "value": "channel"},
                                            {"label": "按招聘官", "value": "recruiter"},
                                        ],
                                        value="none",
                                        clearable=False,
                                        style={"width": "150px"},
                                    ),
                                ],
                                className="d-flex justify-content-between align-items-center",
                            ),
                            dbc.CardBody(dcc.Graph(id="feedback-chart")),
                        ]
                    ),
                    width=12,
                ),
            ],
            className="mb-4 g-2",
        ),
    ]


def create_data_quality_modal():
    return dbc.Modal(
        [
            dbc.ModalHeader(dbc.ModalTitle("🔍 数据质量校验结果")),
            dbc.ModalBody(id="quality-check-results"),
            dbc.ModalFooter(
                dbc.Button("关闭", id="close-quality-modal", className="ms-auto", n_clicks=0)
            ),
        ],
        id="quality-modal",
        is_open=False,
        size="lg",
    )


app.layout = dbc.Container(
    [
        dcc.Store(id="current-filters", data="{}"),
        dbc.Row(
            [
                dbc.Col(
                    html.H1("🎯 招聘流程效率仪表盘", className="text-center my-4"),
                    width=12,
                ),
            ]
        ),
        dbc.Row(
            [
                dbc.Col(create_filter_panel(), width=3),
                dbc.Col(
                    [
                        html.Div(id="data-alert-container"),
                        create_kpi_row(),
                        *create_charts_row(),
                    ],
                    width=9,
                ),
            ]
        ),
        create_data_quality_modal(),
    ],
    fluid=True,
    className="bg-light min-vh-100 py-3",
)


def get_current_filters(
    positions, departments, recruiters, channels, stages, date_range
) -> dict:
    filters = {}
    if positions:
        filters["positions"] = positions
    if departments:
        filters["departments"] = departments
    if recruiters:
        filters["recruiters"] = recruiters
    if channels:
        filters["channels"] = channels
    if stages:
        filters["stages"] = stages
    if date_range and date_range[0] and date_range[1]:
        filters["date_range"] = (date_range[0], date_range[1])
    return filters


@callback(
    Output("saved-filter-dropdown", "options"),
    Input("saved-filter-dropdown", "options"),
    Input("save-filter-btn", "n_clicks"),
    prevent_initial_call=False,
)
def update_saved_filters(options, n_clicks):
    saved = data_service.get_saved_filters()
    return [{"label": s["name"], "value": s["id"]} for s in saved]


@callback(
    Output("filter-position", "value"),
    Output("filter-department", "value"),
    Output("filter-recruiter", "value"),
    Output("filter-channel", "value"),
    Output("filter-stage", "value"),
    Output("filter-date-range", "start_date"),
    Output("filter-date-range", "end_date"),
    Input("saved-filter-dropdown", "value"),
    Input("reset-filter-btn", "n_clicks"),
    prevent_initial_call=False,
)
def load_saved_filter(filter_id, reset_clicks):
    triggered = ctx.triggered_id
    if triggered == "reset-filter-btn":
        return None, None, None, None, None, None, None

    if filter_id:
        saved = data_service.get_saved_filters()
        for s in saved:
            if s["id"] == filter_id:
                try:
                    config = json.loads(s["filter_config"])
                    start = None
                    end = None
                    if config.get("date_range"):
                        start, end = config["date_range"]
                    return (
                        config.get("positions") or [],
                        config.get("departments") or [],
                        config.get("recruiters") or [],
                        config.get("channels") or [],
                        config.get("stages") or [],
                        start,
                        end,
                    )
                except (json.JSONDecodeError, KeyError):
                    pass
    return dash.no_update, dash.no_update, dash.no_update, dash.no_update, dash.no_update, dash.no_update, dash.no_update


@callback(
    Output("saved-filter-dropdown", "value"),
    Input("save-filter-btn", "n_clicks"),
    State("filter-name-input", "value"),
    State("filter-position", "value"),
    State("filter-department", "value"),
    State("filter-recruiter", "value"),
    State("filter-channel", "value"),
    State("filter-stage", "value"),
    State("filter-date-range", "start_date"),
    State("filter-date-range", "end_date"),
    prevent_initial_call=True,
)
def save_current_filter(n_clicks, name, positions, departments, recruiters, channels, stages, start_date, end_date):
    if not name or not n_clicks:
        return dash.no_update

    filter_config = {
        "positions": positions or [],
        "departments": departments or [],
        "recruiters": recruiters or [],
        "channels": channels or [],
        "stages": stages or [],
        "date_range": [start_date, end_date] if (start_date and end_date) else None,
    }

    filter_id = data_service.save_filter(name, json.dumps(filter_config))
    return filter_id


@callback(
    Output("funnel-chart", "figure"),
    Output("duration-chart", "figure"),
    Output("channel-chart", "figure"),
    Output("interviewer-chart", "figure"),
    Output("feedback-chart", "figure"),
    Output("kpi-total", "figure"),
    Output("kpi-hired", "figure"),
    Output("kpi-conversion", "figure"),
    Output("kpi-cycle", "figure"),
    Output("kpi-inprocess", "figure"),
    Output("data-alert-container", "children"),
    Input("filter-position", "value"),
    Input("filter-department", "value"),
    Input("filter-recruiter", "value"),
    Input("filter-channel", "value"),
    Input("filter-stage", "value"),
    Input("filter-date-range", "start_date"),
    Input("filter-date-range", "end_date"),
    Input("funnel-group-by", "value"),
    Input("duration-group-by", "value"),
    Input("feedback-group-by", "value"),
)
def update_all_charts(
    positions,
    departments,
    recruiters,
    channels,
    stages,
    start_date,
    end_date,
    funnel_group,
    duration_group,
    feedback_group,
):
    date_range = (start_date, end_date) if (start_date and end_date) else None
    filters = get_current_filters(positions, departments, recruiters, channels, stages, date_range)

    alerts = []
    quality_issues = data_service.check_data_quality()
    for issue in quality_issues:
        color = "danger" if issue["severity"] == "error" else "warning"
        icon = "❌" if issue["severity"] == "error" else "⚠️"
        alerts.append(
            dbc.Alert(
                [
                    html.Strong(f"{icon} 数据质量{issue['severity']}: "),
                    issue["message"],
                ],
                color=color,
                dismissable=True,
            )
        )

    try:
        funnel_group_by = None if funnel_group == "none" else funnel_group
        funnel_df = data_service.get_funnel_data(filters, funnel_group_by)
        funnel_fig = ChartComponents.create_funnel_chart(funnel_df, funnel_group_by)

        duration_group_by = None if duration_group == "none" else duration_group
        duration_df = data_service.get_stage_duration_data(filters, duration_group_by)
        duration_fig = ChartComponents.create_stage_duration_chart(duration_df, duration_group_by)

        channel_df = data_service.get_channel_quality_data(filters)
        channel_fig = ChartComponents.create_channel_quality_chart(channel_df)

        interviewer_df = data_service.get_interviewer_workload(filters)
        interviewer_fig = ChartComponents.create_interviewer_workload_chart(interviewer_df)

        feedback_group_by = None if feedback_group == "none" else feedback_group
        feedback_df = data_service.get_feedback_data(filters, feedback_group_by)
        feedback_fig = ChartComponents.create_feedback_radar_chart(feedback_df)

        stats = data_service.get_summary_stats(filters)
        kpi_figs = ChartComponents.create_kpi_cards(stats)

        return (
            funnel_fig,
            duration_fig,
            channel_fig,
            interviewer_fig,
            feedback_fig,
            kpi_figs[0],
            kpi_figs[1],
            kpi_figs[2],
            kpi_figs[3],
            kpi_figs[4],
            alerts,
        )

    except Exception as e:
        error_alert = dbc.Alert(
            [
                html.Strong("❌ 数据加载失败: "),
                f"{str(e)}",
                html.Br(),
                html.Small("请检查数据库连接或筛选条件"),
            ],
            color="danger",
            dismissable=True,
        )
        alerts.append(error_alert)

        empty_fig = go.Figure()
        empty_fig.update_layout(
            annotations=[
                dict(
                    text="数据加载失败",
                    xref="paper",
                    yref="paper",
                    showarrow=False,
                    font=dict(size=16, color="red"),
                )
            ]
        )

        return (empty_fig,) * 5 + (empty_fig,) * 5 + (alerts,)


@callback(
    Output("download-excel", "data"),
    Input("export-btn", "n_clicks"),
    State("filter-position", "value"),
    State("filter-department", "value"),
    State("filter-recruiter", "value"),
    State("filter-channel", "value"),
    State("filter-stage", "value"),
    State("filter-date-range", "start_date"),
    State("filter-date-range", "end_date"),
    prevent_initial_call=True,
)
def export_report(n_clicks, positions, departments, recruiters, channels, stages, start_date, end_date):
    if not n_clicks:
        return dash.no_update

    date_range = (start_date, end_date) if (start_date and end_date) else None
    filters = get_current_filters(positions, departments, recruiters, channels, stages, date_range)

    excel_data = report_exporter.export_to_excel(filters)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return dcc.send_bytes(excel_data.getvalue(), f"招聘效率报告_{timestamp}.xlsx")


@callback(
    Output("quality-modal", "is_open"),
    Output("quality-check-results", "children"),
    Input("check-quality-btn", "n_clicks"),
    Input("close-quality-modal", "n_clicks"),
    State("quality-modal", "is_open"),
    prevent_initial_call=False,
)
def toggle_quality_modal(check_clicks, close_clicks, is_open):
    triggered = ctx.triggered_id

    if triggered == "check-quality-btn":
        issues = data_service.check_data_quality()

        if not issues:
            result = dbc.Alert("✅ 数据质量校验通过，未发现问题！", color="success")
        else:
            result_children = []
            for issue in issues:
                color = "danger" if issue["severity"] == "error" else "warning"
                result_children.append(
                    dbc.Alert(
                        [
                            html.H6([
                                "❌ " if issue["severity"] == "error" else "⚠️ ",
                                f"严重程度: {issue['severity'].upper()}"
                            ]),
                            html.P(issue["message"]),
                            html.Small(f"影响字段: {issue.get('field', '未知')}", className="text-muted"),
                        ],
                        color=color,
                        className="mb-2",
                    )
                )
            result = html.Div(result_children)

        return True, result

    if triggered == "close-quality-modal":
        return False, dash.no_update

    return is_open, dash.no_update


if __name__ == "__main__":
    app.run_server(debug=Config.DEBUG, host=Config.HOST, port=Config.PORT)
