"""
医院门诊等待时间分析工作台
主应用入口
"""
import dash
from dash import dcc, html, Input, Output, State, callback_context, dash_table
import dash_bootstrap_components as dbc
import pandas as pd
from datetime import datetime
import io
import base64

from data_generator import load_data, generate_mock_data, save_data
from metrics import calculate_wait_times, filter_dataframe, compute_summary_metrics, detect_anomalies
from charts import (
    create_sankey_chart, create_wait_distribution_chart,
    create_dept_comparison_chart, create_hourly_trend_chart,
    create_kpi_cards, create_patient_type_breakdown, create_anomaly_analysis_chart
)
from config_manager import (
    load_annotations, add_annotation,
    load_schedule_config, save_schedule_config,
    load_permission_config, save_permission_config, apply_permission_filter
)

app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
server = app.server

DATA_PATH = "data/mock_visit_data.parquet"
DATA_UPDATE_TIME = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def load_and_prepare_data():
    """加载并准备数据"""
    try:
        df = load_data(DATA_PATH)
    except:
        df = generate_mock_data(num_patients=3000, days=14)
        save_data(df, DATA_PATH)
    df = calculate_wait_times(df)
    df = detect_anomalies(df)
    
    permission_config = load_permission_config()
    df = apply_permission_filter(df, permission_config)
    
    return df

df = load_and_prepare_data()
permission_config = load_permission_config()
schedule_config = load_schedule_config()

app.title = "医院门诊等待时间分析工作台"

sidebar_style = {
    "position": "fixed",
    "top": 0,
    "left": 0,
    "bottom": 0,
    "width": "300px",
    "padding": "20px",
    "background-color": "#f8f9fa",
    "border-right": "1px solid #dee2e6",
    "overflow-y": "auto"
}

content_style = {
    "margin-left": "320px",
    "margin-right": "20px",
    "padding": "20px"
}

def get_filter_options():
    """获取筛选选项"""
    depts = sorted(df["dept_name"].unique().tolist())
    doctors = sorted(df["doctor_name"].unique().tolist())
    time_slots = sorted(df["time_slot"].unique().tolist())
    patient_types = sorted(df["patient_type"].unique().tolist())
    date_min = df["reg_time"].min().date().strftime("%Y-%m-%d")
    date_max = df["reg_time"].max().date().strftime("%Y-%m-%d")
    
    return depts, doctors, time_slots, patient_types, date_min, date_max

depts, doctors, time_slots, patient_types, date_min, date_max = get_filter_options()

wait_options = [
    {"label": "挂号→签到", "value": "wait_挂号_签到"},
    {"label": "签到→分诊", "value": "wait_签到_分诊"},
    {"label": "分诊→叫号", "value": "wait_分诊_叫号"},
    {"label": "叫号→就诊", "value": "wait_叫号_就诊"},
    {"label": "就诊→缴费", "value": "wait_就诊_缴费"},
    {"label": "缴费→取药", "value": "wait_缴费_取药"},
    {"label": "总等待时间", "value": "total_wait_time"},
]

sidebar = html.Div(
    [
        html.H4("🏥 筛选条件", className="mb-4"),
        html.Hr(),
        
        dbc.Card(
            [
                dbc.CardHeader("科室筛选"),
                dbc.CardBody(
                    dcc.Dropdown(
                        id="dept-filter",
                        options=[{"label": d, "value": d} for d in depts],
                        multi=True,
                        placeholder="选择科室...",
                        className="mb-2"
                    )
                )
            ],
            className="mb-3"
        ),
        
        dbc.Card(
            [
                dbc.CardHeader("医生筛选"),
                dbc.CardBody(
                    dcc.Dropdown(
                        id="doctor-filter",
                        options=[{"label": d, "value": d} for d in doctors],
                        multi=True,
                        placeholder="选择医生...",
                        className="mb-2"
                    )
                )
            ],
            className="mb-3"
        ),
        
        dbc.Card(
            [
                dbc.CardHeader("时段筛选"),
                dbc.CardBody(
                    dcc.Checklist(
                        id="time-slot-filter",
                        options=[{"label": t, "value": t} for t in time_slots],
                        labelStyle={"display": "block"},
                        className="mb-2"
                    )
                )
            ],
            className="mb-3"
        ),
        
        dbc.Card(
            [
                dbc.CardHeader("患者类型"),
                dbc.CardBody(
                    dcc.Checklist(
                        id="patient-type-filter",
                        options=[{"label": t, "value": t} for t in patient_types],
                        labelStyle={"display": "block"},
                        className="mb-2"
                    )
                )
            ],
            className="mb-3"
        ),
        
        dbc.Card(
            [
                dbc.CardHeader("日期范围"),
                dbc.CardBody(
                    dcc.DatePickerRange(
                        id="date-filter",
                        start_date=date_min,
                        end_date=date_max,
                        min_date_allowed=date_min,
                        max_date_allowed=date_max,
                        display_format="YYYY-MM-DD",
                        className="mb-2"
                    )
                )
            ],
            className="mb-3"
        ),
        
        dbc.Card(
            [
                dbc.CardHeader("异常过滤"),
                dbc.CardBody(
                    [
                        dbc.Checklist(
                            id="exclude-anomalies",
                            options=[{"label": "排除异常样本", "value": "exclude"}],
                            className="mb-2"
                        ),
                        dbc.Button(
                            "刷新数据",
                            id="refresh-btn",
                            color="primary",
                            size="sm",
                            className="w-100 mt-2"
                        )
                    ]
                )
            ],
            className="mb-3"
        ),
        
        html.Hr(),
        html.Div(id="filter-summary", className="text-muted small"),
    ],
    style=sidebar_style
)

header = dbc.Card(
    [
        dbc.CardBody(
            [
                dbc.Row(
                    [
                        dbc.Col(
                            [
                                html.H2("医院门诊等待时间分析工作台", className="mb-0"),
                                html.Small(
                                    f"数据更新时间: {DATA_UPDATE_TIME}",
                                    className="text-muted"
                                )
                            ],
                            width=8
                        ),
                        dbc.Col(
                            [
                                dbc.ButtonGroup(
                                    [
                                        dbc.Button("导出Excel", id="export-btn", color="success", size="sm"),
                                        dbc.Button("定时报表", id="schedule-btn", color="info", size="sm"),
                                        dbc.Button("权限设置", id="permission-btn", color="secondary", size="sm"),
                                    ],
                                    className="float-end"
                                ),
                                dcc.Download(id="download-data")
                            ],
                            width=4
                        )
                    ]
                )
            ]
        )
    ],
    className="mb-4"
)

kpi_section = dbc.Row(
    [
        dbc.Col(dbc.Card(
            dbc.CardBody(
                [
                    html.H6("样本总量", className="card-subtitle text-muted"),
                    html.H3(id="kpi-samples", className="card-title mt-2"),
                    html.Small(id="kpi-samples-change", className="text-success")
                ]
            ),
            className="text-center"
        ), width=2),
        dbc.Col(dbc.Card(
            dbc.CardBody(
                [
                    html.H6("挂号→签到", className="card-subtitle text-muted"),
                    html.H3(id="kpi-reg-checkin", className="card-title mt-2"),
                    html.Small(id="kpi-reg-checkin-change", className="")
                ]
            ),
            className="text-center"
        ), width=2),
        dbc.Col(dbc.Card(
            dbc.CardBody(
                [
                    html.H6("分诊→叫号", className="card-subtitle text-muted"),
                    html.H3(id="kpi-triage-call", className="card-title mt-2"),
                    html.Small(id="kpi-triage-call-change", className="")
                ]
            ),
            className="text-center"
        ), width=2),
        dbc.Col(dbc.Card(
            dbc.CardBody(
                [
                    html.H6("叫号→就诊", className="card-subtitle text-muted"),
                    html.H3(id="kpi-call-consult", className="card-title mt-2"),
                    html.Small(id="kpi-call-consult-change", className="")
                ]
            ),
            className="text-center"
        ), width=2),
        dbc.Col(dbc.Card(
            dbc.CardBody(
                [
                    html.H6("异常样本", className="card-subtitle text-muted"),
                    html.H3(id="kpi-anomalies", className="card-title mt-2 text-danger"),
                    html.Small("标记异常数", className="text-muted")
                ]
            ),
            className="text-center border-danger"
        ), width=2),
        dbc.Col(dbc.Card(
            dbc.CardBody(
                [
                    html.H6("平均总等待", className="card-subtitle text-muted"),
                    html.H3(id="kpi-total-wait", className="card-title mt-2"),
                    html.Small(id="kpi-total-wait-change", className="")
                ]
            ),
            className="text-center bg-primary text-white"
        ), width=2),
    ],
    className="mb-4"
)

chart_section = html.Div(
    [
        dbc.Row(
            [
                dbc.Col(
                    [
                        dbc.Card(
                            [
                                dbc.CardHeader(
                                    dbc.Row(
                                        [
                                            dbc.Col(html.H5("📊 流程瓶颈桑基图", className="mb-0"), width=8),
                                            dbc.Col(
                                                dcc.Dropdown(
                                                    id="sankey-metric",
                                                    options=wait_options,
                                                    value="wait_分诊_叫号"
                                                ),
                                                width=4
                                            )
                                        ]
                                    )
                                ),
                                dbc.CardBody(dcc.Graph(id="sankey-chart"))
                            ]
                        )
                    ],
                    width=12
                )
            ],
            className="mb-4"
        ),
        
        dbc.Row(
            [
                dbc.Col(
                    dbc.Card(
                        [
                            dbc.CardHeader(
                                dbc.Row(
                                    [
                                        dbc.Col(html.H5("📈 等待时间分布", className="mb-0"), width=6),
                                        dbc.Col(
                                            dcc.Dropdown(
                                                id="dist-metric",
                                                options=wait_options,
                                                value="wait_分诊_叫号"
                                            ),
                                            width=6
                                        )
                                    ]
                                )
                            ),
                            dbc.CardBody(dcc.Graph(id="distribution-chart"))
                        ]
                    ),
                    width=6
                ),
                dbc.Col(
                    dbc.Card(
                        [
                            dbc.CardHeader(
                                dbc.Row(
                                    [
                                        dbc.Col(html.H5("🏥 科室对比", className="mb-0"), width=6),
                                        dbc.Col(
                                            dcc.Dropdown(
                                                id="dept-compare-metric",
                                                options=wait_options,
                                                value="wait_分诊_叫号"
                                            ),
                                            width=6
                                        )
                                    ]
                                )
                            ),
                            dbc.CardBody(dcc.Graph(id="dept-compare-chart"))
                        ]
                    ),
                    width=6
                )
            ],
            className="mb-4"
        ),
        
        dbc.Row(
            [
                dbc.Col(
                    dbc.Card(
                        [
                            dbc.CardHeader(html.H5("⏰ 日内时间趋势", className="mb-0")),
                            dbc.CardBody(dcc.Graph(id="hourly-trend-chart"))
                        ]
                    ),
                    width=6
                ),
                dbc.Col(
                    dbc.Card(
                        [
                            dbc.CardHeader(html.H5("👥 患者类型分布", className="mb-0")),
                            dbc.CardBody(dcc.Graph(id="patient-type-chart"))
                        ]
                    ),
                    width=3
                ),
                dbc.Col(
                    dbc.Card(
                        [
                            dbc.CardHeader(html.H5("⚠️ 异常原因分析", className="mb-0")),
                            dbc.CardBody(dcc.Graph(id="anomaly-chart"))
                        ]
                    ),
                    width=3
                )
            ],
            className="mb-4"
        ),
        
        dbc.Row(
            [
                dbc.Col(
                    dbc.Card(
                        [
                            dbc.CardHeader(
                                dbc.Row(
                                    [
                                        dbc.Col(html.H5("📋 样本明细（可选择异常样本）", className="mb-0"), width=8),
                                        dbc.Col(
                                            dbc.ButtonGroup(
                                                [
                                                    dbc.Button("仅显示异常", id="show-anomalies-btn", color="warning", size="sm"),
                                                    dbc.Button("添加注释", id="add-comment-btn", color="info", size="sm"),
                                                ],
                                                className="float-end"
                                            ),
                                            width=4
                                        )
                                    ]
                                )
                            ),
                            dbc.CardBody(
                                [
                                    dash_table.DataTable(
                                        id="sample-table",
                                        columns=[
                                            {"name": "就诊ID", "id": "visit_id"},
                                            {"name": "科室", "id": "dept_name"},
                                            {"name": "医生", "id": "doctor_name"},
                                            {"name": "患者类型", "id": "patient_type"},
                                            {"name": "时段", "id": "time_slot"},
                                            {"name": "挂号时间", "id": "reg_time_str"},
                                            {"name": "分诊→叫号(分)", "id": "wait_分诊_叫号"},
                                            {"name": "总等待(分)", "id": "total_wait_time"},
                                            {"name": "是否异常", "id": "is_anomaly"},
                                            {"name": "异常原因", "id": "anomaly_reason"},
                                            {"name": "运营注释", "id": "annotation"},
                                            {"name": "注释人", "id": "annotation_author"},
                                            {"name": "注释时间", "id": "annotation_time"},
                                        ],
                                        page_size=10,
                                        style_table={"overflowX": "auto"},
                                        style_cell={"textAlign": "left", "padding": "8px", "fontSize": "12px"},
                                        style_header={"backgroundColor": "#f8f9fa", "fontWeight": "bold"},
                                        style_data_conditional=[
                                            {
                                                "if": {"filter_query": "{is_anomaly} = True"},
                                                "backgroundColor": "#fff3cd"
                                            },
                                            {
                                                "if": {"column_id": "annotation", "filter_query": "{annotation} != ''"},
                                                "backgroundColor": "#d4edda"
                                            }
                                        ],
                                        row_selectable="multi",
                                        selected_rows=[],
                                    )
                                ]
                            )
                        ]
                    ),
                    width=12
                )
            ],
            className="mb-4"
        ),
    ]
)

app.layout = html.Div(
    [
        dcc.Store(id="data-store"),
        dcc.Store(id="filtered-data-store"),
        dcc.Store(id="refresh-trigger", data=0),
        sidebar,
        html.Div(
            [
                header,
                kpi_section,
                chart_section
            ],
            style=content_style
        ),
        dbc.Modal(
            [
                dbc.ModalHeader("导出数据"),
                dbc.ModalBody(
                    [
                        html.P("导出内容将包含:"),
                        html.Ul(
                            [
                                html.Li("筛选条件信息"),
                                html.Li("数据更新时间"),
                                html.Li("样本量统计"),
                                html.Li("当前筛选的所有样本数据")
                            ]
                        ),
                        dbc.Checklist(
                            id="export-options",
                            options=[
                                {"label": "包含原始时间戳", "value": "include_timestamps"},
                                {"label": "包含计算指标", "value": "include_metrics"},
                                {"label": "仅导出异常样本", "value": "only_anomalies"},
                            ],
                            value=["include_metrics"],
                            labelStyle={"display": "block"}
                        )
                    ]
                ),
                dbc.ModalFooter(
                    [
                        dbc.Button("取消", id="close-export-modal", className="ms-auto"),
                        dbc.Button("确认导出", id="confirm-export-btn", color="primary"),
                    ]
                ),
            ],
            id="export-modal",
            is_open=False,
        ),
        dbc.Modal(
            [
                dbc.ModalHeader("定时报表设置"),
                dbc.ModalBody(
                    [
                        dbc.Form(
                            [
                                dbc.Label("报表频率"),
                                dcc.Dropdown(
                                    id="schedule-frequency",
                                    options=[
                                        {"label": "每小时", "value": "hourly"},
                                        {"label": "每天", "value": "daily"},
                                        {"label": "每周", "value": "weekly"},
                                    ],
                                    value="daily",
                                    className="mb-3"
                                ),
                                dbc.Label("报表格式"),
                                dcc.Dropdown(
                                    id="schedule-format",
                                    options=[
                                        {"label": "Excel (.xlsx)", "value": "xlsx"},
                                        {"label": "PDF", "value": "pdf"},
                                        {"label": "HTML", "value": "html"},
                                    ],
                                    value="xlsx",
                                    className="mb-3"
                                ),
                                dbc.Label("接收邮箱"),
                                dbc.Input(
                                    id="schedule-email",
                                    type="email",
                                    placeholder="example@hospital.com",
                                    className="mb-3"
                                ),
                            ]
                        )
                    ]
                ),
                dbc.ModalFooter(
                    [
                        dbc.Button("取消", id="close-schedule-modal", className="ms-auto"),
                        dbc.Button("保存设置", id="save-schedule-btn", color="primary"),
                    ]
                ),
            ],
            id="schedule-modal",
            is_open=False,
        ),
        dbc.Modal(
            [
                dbc.ModalHeader("权限视图设置"),
                dbc.ModalBody(
                    [
                        html.P("选择角色视图，控制数据可见范围:"),
                        dbc.RadioItems(
                            id="permission-role",
                            options=[
                                {"label": "🏥 管理员视图（全部数据）", "value": "admin"},
                                {"label": "📊 科室主任视图（本科室数据）", "value": "dept_head"},
                                {"label": "👨‍⚕️ 医生视图（个人数据）", "value": "doctor"},
                                {"label": "🔍 运营分析视图（脱敏聚合）", "value": "analyst"},
                            ],
                            value="admin",
                            className="mb-3"
                        ),
                        html.Hr(),
                        dbc.Switch(
                            id="permission-desensitize",
                            label="启用数据脱敏",
                            value=True,
                            className="mb-2"
                        ),
                        dbc.Switch(
                            id="permission-export",
                            label="允许导出数据",
                            value=True,
                            className="mb-2"
                        ),
                    ]
                ),
                dbc.ModalFooter(
                    [
                        dbc.Button("取消", id="close-permission-modal", className="ms-auto"),
                        dbc.Button("应用设置", id="apply-permission-btn", color="primary"),
                    ]
                ),
            ],
            id="permission-modal",
            is_open=False,
        ),
        dbc.Modal(
            [
                dbc.ModalHeader("添加异常样本注释"),
                dbc.ModalBody(
                    [
                        html.P(id="annotation-visit-info", className="text-muted mb-3"),
                        dbc.Label("注释内容"),
                        dbc.Textarea(
                            id="annotation-content",
                            placeholder="请输入异常样本分析注释...",
                            rows=4,
                            className="mb-3"
                        ),
                        dbc.Label("注释人"),
                        dbc.Input(
                            id="annotation-author",
                            placeholder="运营分析员",
                            value="运营分析员",
                            className="mb-3"
                        ),
                    ]
                ),
                dbc.ModalFooter(
                    [
                        dbc.Button("取消", id="close-annotation-modal", className="ms-auto"),
                        dbc.Button("保存注释", id="save-annotation-btn", color="primary"),
                    ]
                ),
            ],
            id="annotation-modal",
            is_open=False,
        ),
        dbc.Toast(
            id="toast",
            is_open=False,
            duration=4000,
            style={"position": "fixed", "top": 20, "right": 20, "width": 350}
        ),
    ]
)

@app.callback(
    [Output("filtered-data-store", "data"),
     Output("filter-summary", "children")],
    [Input("dept-filter", "value"),
     Input("doctor-filter", "value"),
     Input("time-slot-filter", "value"),
     Input("patient-type-filter", "value"),
     Input("date-filter", "start_date"),
     Input("date-filter", "end_date"),
     Input("exclude-anomalies", "value"),
     Input("refresh-btn", "n_clicks"),
     Input("refresh-trigger", "data")]
)
def update_filtered_data(dept_values, doctor_values, time_slot_values, 
                        patient_type_values, start_date, end_date,
                        exclude_anomalies, refresh_clicks, refresh_trigger):
    """更新筛选后的数据"""
    global df
    ctx = callback_context
    
    if ctx.triggered:
        trigger_id = ctx.triggered[0]["prop_id"].split(".")[0]
        if trigger_id in ["refresh-btn", "refresh-trigger"]:
            df = load_and_prepare_data()
    
    exclude = exclude_anomalies is not None and "exclude" in exclude_anomalies
    
    filtered = filter_dataframe(
        df,
        depts=dept_values,
        doctors=doctor_values,
        time_slots=time_slot_values,
        patient_types=patient_type_values,
        date_range=(start_date, end_date),
        exclude_anomalies=exclude
    )
    
    annotations = load_annotations()
    filtered["annotation"] = filtered["visit_id"].map(
        lambda x: annotations.get(x, {}).get("comment", "") if x in annotations else ""
    )
    filtered["annotation_author"] = filtered["visit_id"].map(
        lambda x: annotations.get(x, {}).get("author", "") if x in annotations else ""
    )
    filtered["annotation_time"] = filtered["visit_id"].map(
        lambda x: annotations.get(x, {}).get("created_at", "") if x in annotations else ""
    )
    
    summary_parts = [
        f"样本量: {len(filtered)}",
        f"科室: {len(dept_values) if dept_values else '全部'}",
        f"医生: {len(doctor_values) if doctor_values else '全部'}"
    ]
    
    permission_config = load_permission_config()
    if permission_config.get("current_role", "admin") != "admin":
        role_display = {
            "dept_head": "科室主任",
            "doctor": "医生",
            "analyst": "运营分析"
        }
        summary_parts.append(f"角色: {role_display.get(permission_config['current_role'], permission_config['current_role'])}")
    
    summary = " | ".join(summary_parts)
    
    if "reg_time" in filtered.columns:
        filtered["reg_time_str"] = pd.to_datetime(filtered["reg_time"], errors="coerce").dt.strftime("%Y-%m-%d %H:%M")
    filtered["is_anomaly"] = filtered["is_anomaly"].astype(str)
    
    return filtered.to_dict("records"), summary

@app.callback(
    [Output("kpi-samples", "children"),
     Output("kpi-reg-checkin", "children"),
     Output("kpi-triage-call", "children"),
     Output("kpi-call-consult", "children"),
     Output("kpi-anomalies", "children"),
     Output("kpi-total-wait", "children")],
    [Input("filtered-data-store", "data")]
)
def update_kpis(filtered_data):
    """更新KPI指标"""
    if not filtered_data:
        return "0", "0 分钟", "0 分钟", "0 分钟", "0", "0 分钟"
    
    filtered = pd.DataFrame(filtered_data)
    
    samples = len(filtered)
    anomalies = filtered[filtered["is_anomaly"] == "True"].shape[0]
    
    reg_checkin = filtered["wait_挂号_签到"].mean() if "wait_挂号_签到" in filtered.columns else 0
    triage_call = filtered["wait_分诊_叫号"].mean() if "wait_分诊_叫号" in filtered.columns else 0
    call_consult = filtered["wait_叫号_就诊"].mean() if "wait_叫号_就诊" in filtered.columns else 0
    total_wait = filtered["total_wait_time"].mean() if "total_wait_time" in filtered.columns else 0
    
    return (
        f"{samples:,}",
        f"{reg_checkin:.1f} 分钟",
        f"{triage_call:.1f} 分钟",
        f"{call_consult:.1f} 分钟",
        f"{anomalies}",
        f"{total_wait:.1f} 分钟"
    )

@app.callback(
    Output("sankey-chart", "figure"),
    [Input("filtered-data-store", "data"),
     Input("sankey-metric", "value")]
)
def update_sankey(filtered_data, metric):
    """更新桑基图"""
    if not filtered_data:
        return {}
    filtered = pd.DataFrame(filtered_data)
    return create_sankey_chart(filtered)

@app.callback(
    Output("distribution-chart", "figure"),
    [Input("filtered-data-store", "data"),
     Input("dist-metric", "value")]
)
def update_distribution(filtered_data, metric):
    """更新分布图"""
    if not filtered_data:
        return {}
    filtered = pd.DataFrame(filtered_data)
    return create_wait_distribution_chart(filtered, metric)

@app.callback(
    Output("dept-compare-chart", "figure"),
    [Input("filtered-data-store", "data"),
     Input("dept-compare-metric", "value")]
)
def update_dept_compare(filtered_data, metric):
    """更新科室对比图"""
    if not filtered_data:
        return {}
    filtered = pd.DataFrame(filtered_data)
    return create_dept_comparison_chart(filtered, metric)

@app.callback(
    Output("hourly-trend-chart", "figure"),
    [Input("filtered-data-store", "data")]
)
def update_hourly_trend(filtered_data):
    """更新日内趋势图"""
    if not filtered_data:
        return {}
    filtered = pd.DataFrame(filtered_data)
    if "reg_time" in filtered.columns:
        filtered["reg_time"] = pd.to_datetime(filtered["reg_time"], errors="coerce")
    return create_hourly_trend_chart(filtered)

@app.callback(
    Output("patient-type-chart", "figure"),
    [Input("filtered-data-store", "data")]
)
def update_patient_type(filtered_data):
    """更新患者类型分布图"""
    if not filtered_data:
        return {}
    filtered = pd.DataFrame(filtered_data)
    return create_patient_type_breakdown(filtered)

@app.callback(
    Output("anomaly-chart", "figure"),
    [Input("filtered-data-store", "data")]
)
def update_anomaly_chart(filtered_data):
    """更新异常原因图"""
    if not filtered_data:
        return {}
    filtered = pd.DataFrame(filtered_data)
    filtered["is_anomaly_bool"] = filtered["is_anomaly"] == "True"
    return create_anomaly_analysis_chart(filtered)

@app.callback(
    Output("sample-table", "data"),
    [Input("filtered-data-store", "data"),
     Input("show-anomalies-btn", "n_clicks")],
    [State("sample-table", "data")]
)
def update_sample_table(filtered_data, show_anomalies_clicks, current_data):
    """更新样本表格"""
    if not filtered_data:
        return []
    
    filtered = pd.DataFrame(filtered_data)
    
    ctx = callback_context
    if ctx.triggered and "show-anomalies-btn" in ctx.triggered[0]["prop_id"]:
        filtered = filtered[filtered["is_anomaly"] == "True"]
    
    display_cols = [
        "visit_id", "dept_name", "doctor_name", "patient_type",
        "time_slot", "reg_time_str", "wait_分诊_叫号",
        "total_wait_time", "is_anomaly", "anomaly_reason",
        "annotation", "annotation_author", "annotation_time"
    ]
    
    for col in display_cols:
        if col not in filtered.columns:
            filtered[col] = ""
    
    return filtered[display_cols].to_dict("records")

@app.callback(
    Output("export-modal", "is_open"),
    [Input("export-btn", "n_clicks"),
     Input("close-export-modal", "n_clicks"),
     Input("confirm-export-btn", "n_clicks")],
    [State("export-modal", "is_open")]
)
def toggle_export_modal(export_click, close_click, confirm_click, is_open):
    """切换导出模态框"""
    ctx = callback_context
    if ctx.triggered:
        return not is_open
    return is_open

@app.callback(
    Output("schedule-modal", "is_open"),
    [Input("schedule-btn", "n_clicks"),
     Input("close-schedule-modal", "n_clicks"),
     Input("save-schedule-btn", "n_clicks")],
    [State("schedule-modal", "is_open")]
)
def toggle_schedule_modal(schedule_click, close_click, save_click, is_open):
    """切换定时报表模态框"""
    ctx = callback_context
    if ctx.triggered:
        return not is_open
    return is_open

@app.callback(
    Output("permission-modal", "is_open"),
    [Input("permission-btn", "n_clicks"),
     Input("close-permission-modal", "n_clicks"),
     Input("apply-permission-btn", "n_clicks")],
    [State("permission-modal", "is_open")]
)
def toggle_permission_modal(perm_click, close_click, apply_click, is_open):
    """切换权限模态框"""
    ctx = callback_context
    if ctx.triggered:
        return not is_open
    return is_open

@app.callback(
    Output("download-data", "data"),
    [Input("confirm-export-btn", "n_clicks")],
    [State("filtered-data-store", "data"),
     State("export-options", "value"),
     State("dept-filter", "value"),
     State("doctor-filter", "value"),
     State("time-slot-filter", "value"),
     State("patient-type-filter", "value"),
     State("date-filter", "start_date"),
     State("date-filter", "end_date")]
)
def export_data(n_clicks, filtered_data, export_options, depts, doctors, 
                time_slots, patient_types, start_date, end_date):
    """导出数据"""
    if not n_clicks or not filtered_data:
        return None
    
    filtered = pd.DataFrame(filtered_data)
    
    if "only_anomalies" in export_options:
        filtered = filtered[filtered["is_anomaly"] == "True"]
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        info_data = pd.DataFrame(
            {
                "项目": ["数据更新时间", "导出时间", "样本量", "科室筛选", 
                        "医生筛选", "时段筛选", "患者类型筛选", "日期范围"],
                "内容": [
                    DATA_UPDATE_TIME,
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    len(filtered),
                    ", ".join(depts) if depts else "全部",
                    ", ".join(doctors) if doctors else "全部",
                    ", ".join(time_slots) if time_slots else "全部",
                    ", ".join(patient_types) if patient_types else "全部",
                    f"{start_date} 至 {end_date}"
                ]
            }
        )
        info_data.to_excel(writer, sheet_name="导出说明", index=False)
        
        if "include_metrics" in export_options:
            metric_cols = [col for col in filtered.columns if col.startswith("wait_")] + ["total_wait_time", "consult_duration"]
            metric_cols = [col for col in metric_cols if col in filtered.columns]
            if metric_cols:
                filtered[metric_cols].describe().to_excel(writer, sheet_name="指标统计")
        
        data_cols = ["visit_id", "dept_name", "doctor_name", "patient_type", "time_slot"]
        if "include_timestamps" in export_options:
            time_cols = ["reg_time", "checkin_time", "triage_time", "call_time", 
                        "consult_start_time", "consult_end_time", "payment_time", "medicine_time"]
            time_cols = [col for col in time_cols if col in filtered.columns]
            data_cols += time_cols
        if "include_metrics" in export_options:
            metric_cols = [col for col in filtered.columns if col.startswith("wait_")] + ["total_wait_time"]
            data_cols += metric_cols
        data_cols += ["is_anomaly", "anomaly_reason"]
        
        data_cols = [col for col in data_cols if col in filtered.columns]
        filtered[data_cols].to_excel(writer, sheet_name="明细数据", index=False)
    
    output.seek(0)
    
    filename = f"门诊等待分析_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return dcc.send_bytes(output.getvalue(), filename)

@app.callback(
    Output("annotation-modal", "is_open"),
    Output("annotation-visit-info", "children"),
    [Input("add-comment-btn", "n_clicks"),
     Input("close-annotation-modal", "n_clicks"),
     Input("save-annotation-btn", "n_clicks")],
    [State("annotation-modal", "is_open"),
     State("sample-table", "selected_rows"),
     State("sample-table", "data")]
)
def toggle_annotation_modal(add_click, close_click, save_click, is_open, selected_rows, table_data):
    """切换注释模态框"""
    ctx = callback_context
    
    if not ctx.triggered:
        return is_open, ""
    
    trigger_id = ctx.triggered[0]["prop_id"].split(".")[0]
    
    if trigger_id == "add-comment-btn":
        info = ""
        if selected_rows and table_data and len(selected_rows) > 0:
            selected_visits = [table_data[i]["visit_id"] for i in selected_rows]
            info = f"已选择 {len(selected_visits)} 个样本: {', '.join(selected_visits[:3])}{'...' if len(selected_visits) > 3 else ''}"
        else:
            info = "请先在表格中选择需要添加注释的样本"
        return True, info
    
    if trigger_id in ["close-annotation-modal", "save-annotation-btn"]:
        return False, ""
    
    return is_open, ""

@app.callback(
    Output("toast", "children", allow_duplicate=True),
    Output("toast", "is_open", allow_duplicate=True),
    Output("refresh-trigger", "data", allow_duplicate=True),
    Input("save-annotation-btn", "n_clicks"),
    [State("sample-table", "selected_rows"),
     State("sample-table", "data"),
     State("annotation-content", "value"),
     State("annotation-author", "value"),
     State("refresh-trigger", "data")],
    prevent_initial_call=True
)
def save_annotation(save_click, selected_rows, table_data, content, author, current_trigger):
    """保存注释"""
    if not save_click or not selected_rows or not table_data or not content:
        return "", False, dash.no_update
    
    selected_visits = [table_data[i]["visit_id"] for i in selected_rows]
    count = 0
    for visit_id in selected_visits:
        add_annotation(visit_id, content, author)
        count += 1
    
    return dbc.Toast(f"已为 {count} 个样本保存注释！", header="成功", icon="success"), True, current_trigger + 1

@app.callback(
    Output("schedule-modal", "is_open", allow_duplicate=True),
    Input("save-schedule-btn", "n_clicks"),
    [State("schedule-frequency", "value"),
     State("schedule-format", "value"),
     State("schedule-email", "value")],
    prevent_initial_call=True
)
def save_schedule_settings(save_click, frequency, format_type, email):
    """保存定时报表设置"""
    if not save_click:
        return dash.no_update
    
    config = {
        "frequency": frequency,
        "format": format_type,
        "email": email,
        "enabled": True
    }
    save_schedule_config(config)
    global schedule_config
    schedule_config = config
    
    return False

@app.callback(
    Output("permission-modal", "is_open", allow_duplicate=True),
    Output("refresh-trigger", "data"),
    Input("apply-permission-btn", "n_clicks"),
    [State("permission-role", "value"),
     State("permission-desensitize", "value"),
     State("permission-export", "value"),
     State("dept-filter", "value"),
     State("doctor-filter", "value"),
     State("refresh-trigger", "data")],
    prevent_initial_call=True
)
def apply_permission_settings(apply_click, role, desensitize, allow_export, dept_filter, doctor_filter, current_trigger):
    """应用权限设置"""
    if not apply_click:
        return dash.no_update, dash.no_update
    
    config = {
        "current_role": role,
        "desensitize": desensitize,
        "allow_export": allow_export,
        "allowed_depts": dept_filter if role == "dept_head" and dept_filter else [],
        "allowed_doctors": doctor_filter if role == "doctor" and doctor_filter else []
    }
    save_permission_config(config)
    
    global df, permission_config
    permission_config = config
    df = load_and_prepare_data()
    
    return False, current_trigger + 1

@app.callback(
    Output("export-btn", "disabled"),
    Input("permission-role", "value"),
    Input("permission-export", "value")
)
def update_export_permission(role, allow_export):
    """根据权限更新导出按钮状态"""
    return not allow_export

@app.callback(
    Output("toast", "children"),
    Output("toast", "is_open"),
    [Input("save-schedule-btn", "n_clicks"),
     Input("apply-permission-btn", "n_clicks")],
    [State("toast", "is_open")]
)
def show_toast(save_click, apply_click, toast_open):
    """显示提示信息"""
    ctx = callback_context
    if not ctx.triggered or toast_open:
        return "", False
    
    trigger_id = ctx.triggered[0]["prop_id"].split(".")[0]
    if trigger_id == "save-schedule-btn":
        return dbc.Toast("定时报表设置已保存！", header="成功", icon="success"), True
    elif trigger_id == "apply-permission-btn":
        return dbc.Toast("权限设置已应用，数据已刷新！", header="成功", icon="success"), True
    
    return "", False

if __name__ == "__main__":
    print("=" * 60)
    print("医院门诊等待时间分析工作台")
    print("=" * 60)
    print(f"数据更新时间: {DATA_UPDATE_TIME}")
    print(f"总样本量: {len(df)} 条")
    print(f"异常样本: {df['is_anomaly'].sum()} 条")
    print("=" * 60)
    print("访问地址: http://127.0.0.1:8050")
    print("=" * 60)
    app.run(debug=True, port=8050)
