import dash
from dash import dcc, html, Input, Output, State, callback_context
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from data_generator import ThresholdConfig
from compliance_engine import ComplianceCalculator
from report_exporter import ReportExporter
from database import get_database


db = None
df_shipments = pd.DataFrame()
df_samples = pd.DataFrame()
db_error = None
db_status = "连接中..."

try:
    db = get_database(init_sample_data=True)
    df_shipments, df_samples = db.load_data()
    db_status = "✓ TimescaleDB 已连接"
except Exception as e:
    db_error = str(e)
    db_status = f"✗ TimescaleDB 连接失败: {str(e)[:50]}..."
    print(f"[数据库错误] {e}")

default_threshold = ThresholdConfig()

calculator = ComplianceCalculator(
    min_temp=default_threshold.min_temp,
    max_temp=default_threshold.max_temp,
    min_samples=default_threshold.min_sample_count
)

if len(df_shipments) > 0 and len(df_samples) > 0:
    compliance_results = calculator.calculate_all_compliance(df_shipments, df_samples)
    df_compliance = calculator.results_to_dataframe(compliance_results)
    df_cleaned_all = []
    for r in compliance_results:
        for d in r.removed_details:
            d["box_id"] = r.box_id
            d["batch_no"] = r.batch_no
            d["route"] = r.route
            df_cleaned_all.append(d)
    df_cleaned = pd.DataFrame(df_cleaned_all)
else:
    df_compliance = pd.DataFrame()
    df_cleaned = pd.DataFrame()

app = dash.Dash(
    __name__, 
    external_stylesheets=[dbc.themes.FLATLY],
    assets_folder="static",
    assets_url_path="/static"
)
app.title = "冷链疫苗温度合规分析平台"
server = app.server


def create_kpi_card(title, value, subtitle="", color="primary"):
    return dbc.Card(
        dbc.CardBody([
            html.H6(title, className="card-subtitle mb-2 text-muted"),
            html.H3(value, className=f"card-title text-{color}"),
            html.P(subtitle, className="card-text small") if subtitle else None
        ]),
        className="h-100 shadow-sm"
    )


def create_temp_threshold_fig(min_temp, max_temp):
    fig = go.Figure()
    fig.add_hrect(
        y0=min_temp, y1=max_temp,
        fillcolor="rgba(46, 204, 113, 0.15)",
        line_width=0,
        layer="below",
        annotation_text="合规区间",
        annotation_position="top left"
    )
    fig.update_layout(
        height=60,
        margin=dict(l=10, r=10, t=5, b=5),
        showlegend=False,
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)"
    )
    fig.update_yaxes(visible=False, range=[min_temp - 3, max_temp + 3])
    fig.update_xaxes(visible=False)
    return fig


sidebar = dbc.Card([
    dbc.CardHeader([
        html.H5("⚙️ 系统配置", className="mb-0")
    ]),
    dbc.CardBody([
        html.H6("温度阈值配置", className="mt-2"),
        html.Div([
            dbc.Label("最低温度 (°C)"),
            dbc.Input(
                id="min-temp-input",
                type="number",
                value=default_threshold.min_temp,
                step=0.5,
                size="sm"
            )
        ], className="mb-3"),
        html.Div([
            dbc.Label("最高温度 (°C)"),
            dbc.Input(
                id="max-temp-input",
                type="number",
                value=default_threshold.max_temp,
                step=0.5,
                size="sm"
            )
        ], className="mb-3"),
        html.Div([
            dbc.Label("最少样本数"),
            dbc.Input(
                id="min-samples-input",
                type="number",
                value=default_threshold.min_sample_count,
                min=1,
                step=1,
                size="sm"
            )
        ], className="mb-3"),
        dcc.Graph(id="threshold-preview", config={"displayModeBar": False}),
        html.Hr(),
        html.H6("时间范围筛选"),
        dcc.DatePickerRange(
            id="date-range-picker",
            start_date=df_compliance["signoff_time"].min().date(),
            end_date=df_compliance["signoff_time"].max().date(),
            display_format="YYYY-MM-DD",
            className="mb-3 w-100"
        ),
        html.Div([
            dbc.Label("路线筛选"),
            dcc.Dropdown(
                id="route-filter",
                options=[{"label": r, "value": r} for r in sorted(df_compliance["route"].unique())],
                multi=True,
                placeholder="选择路线...",
                className="mb-3"
            )
        ]),
        html.Div([
            dbc.Label("站点筛选"),
            dcc.Dropdown(
                id="station-filter",
                options=[{"label": s, "value": s} for s in sorted(
                    pd.concat([df_compliance["from_station"], df_compliance["to_station"]]).unique()
                )],
                multi=True,
                placeholder="选择站点...",
                className="mb-3"
            )
        ]),
        html.Div([
            dbc.Label("状态筛选"),
            dcc.Checklist(
                id="status-filter",
                options=[
                    {"label": " 正常批次", "value": "normal"},
                    {"label": " 待复核", "value": "pending"},
                    {"label": " 申诉中", "value": "appealed"},
                    {"label": " 复核中", "value": "reviewing"}
                ],
                value=["normal", "pending", "appealed", "reviewing"],
                className="mb-3"
            )
        ]),
        html.Hr(),
        dbc.Button(
            "📊 导出报告",
            id="export-btn",
            color="success",
            className="w-100 mb-2",
            size="sm"
        ),
        dcc.Download(id="download-report"),
        dbc.Button(
            "🔄 刷新数据",
            id="refresh-btn",
            color="secondary",
            className="w-100",
            size="sm",
            outline=True
        )
    ])
], className="sticky-top")


main_content = dbc.Col([
    dbc.Row([
        dbc.Col(dbc.Card(id="kpi-total", className="h-100 shadow-sm"), md=3),
        dbc.Col(dbc.Card(id="kpi-valid", className="h-100 shadow-sm"), md=3),
        dbc.Col(dbc.Card(id="kpi-compliance", className="h-100 shadow-sm"), md=3),
        dbc.Col(dbc.Card(id="kpi-pending", className="h-100 shadow-sm"), md=3)
    ], className="mb-4"),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader(html.H6("📈 超温时长趋势", className="mb-0")),
                dbc.CardBody([
                    dcc.Graph(id="overtime-trend-chart", config={"displayModeBar": False})
                ])
            ], className="shadow-sm")
        ], md=12),
    ], className="mb-4"),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader(html.H6("🗺️ 路线合规分布", className="mb-0")),
                dbc.CardBody([
                    dcc.Graph(id="route-distribution-chart", config={"displayModeBar": False})
                ])
            ], className="shadow-sm h-100")
        ], md=6),
        dbc.Col([
            dbc.Card([
                dbc.CardHeader(html.H6("🏢 站点合规对比", className="mb-0")),
                dbc.CardBody([
                    dcc.Graph(id="station-comparison-chart", config={"displayModeBar": False})
                ])
            ], className="shadow-sm h-100")
        ], md=6),
    ], className="mb-4"),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader([
                    html.Div([
                        html.H6("📋 批次合规明细", className="mb-0 d-inline"),
                        dbc.Badge(
                            id="sample-warning-badge",
                            color="warning",
                            className="ms-2",
                            style={"display": "none"}
                        )
                    ])
                ]),
                dbc.CardBody([
                    dcc.Graph(id="compliance-table-chart", config={"displayModeBar": False})
                ])
            ], className="shadow-sm")
        ], md=12)
    ], className="mb-4"),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader(html.H6("📝 被剔除数据明细", className="mb-0")),
                dbc.CardBody([
                    html.Div(id="cleaned-data-table", className="table-responsive")
                ])
            ], className="shadow-sm")
        ], md=12)
    ], className="mb-4")
], md=10)


modal_sample_detail = dbc.Modal([
    dbc.ModalHeader(dbc.ModalTitle("温度采样曲线详情")),
    dbc.ModalBody([
        html.Div(id="modal-content")
    ]),
    dbc.ModalFooter([
        dbc.Button("关闭", id="close-modal", className="ms-auto")
    ])
], id="sample-detail-modal", size="xl", scrollable=True)


app.layout = dbc.Container([
    dbc.Row([
        dbc.Col([
            html.Div([
                html.H2("❄️ 冷链疫苗温度合规分析平台", className="text-primary mt-4 mb-1 d-inline"),
                html.Span([
                    dbc.Badge(
                        db_status,
                        color="success" if db and db.connected else "danger",
                        className="ms-3 align-middle"
                    )
                ]),
                html.P("疾控中心仓库复盘专用 · 时序数据智能分析", className="text-muted mb-0"),
            ])
        ])
    ]),
    
    dbc.Row(id="error-row", children=[
        dbc.Col(
            dbc.Alert([
                html.H4("⚠️ 无法连接 TimescaleDB 数据库", className="alert-heading"),
                html.P([
                    "请确保：",
                    html.Br(),
                    "1. PostgreSQL + TimescaleDB 服务正在运行",
                    html.Br(),
                    "2. 已配置 .env 文件中的数据库连接信息",
                    html.Br(),
                    "3. 数据库用户有创建表和 hypertable 的权限"
                ], className="mb-2"),
                html.Hr(),
                html.P([
                    html.Strong("错误详情："),
                    html.Code(db_error or "未知错误")
                ], className="small text-break")
            ], color="danger") if db_error else None,
            width=12
        )
    ]),
    
    html.Div(id="main-content-area", children=[
        dbc.Row([
            dbc.Col(sidebar, md=2),
            main_content
        ])
    ] if not db_error else []),
    
    modal_sample_detail,
    dcc.Store(id="selected-shipment-id")
], fluid=True, className="bg-light")


@app.callback(
    Output("threshold-preview", "figure"),
    [Input("min-temp-input", "value"), Input("max-temp-input", "value")]
)
def update_threshold_preview(min_temp, max_temp):
    return create_temp_threshold_fig(min_temp, max_temp)


@app.callback(
    [
        Output("kpi-total", "children"),
        Output("kpi-valid", "children"),
        Output("kpi-compliance", "children"),
        Output("kpi-pending", "children"),
        Output("overtime-trend-chart", "figure"),
        Output("route-distribution-chart", "figure"),
        Output("station-comparison-chart", "figure"),
        Output("compliance-table-chart", "figure"),
        Output("cleaned-data-table", "children"),
        Output("sample-warning-badge", "children"),
        Output("sample-warning-badge", "style")
    ],
    [
        Input("min-temp-input", "value"),
        Input("max-temp-input", "value"),
        Input("min-samples-input", "value"),
        Input("date-range-picker", "start_date"),
        Input("date-range-picker", "end_date"),
        Input("route-filter", "value"),
        Input("station-filter", "value"),
        Input("status-filter", "value"),
        Input("refresh-btn", "n_clicks")
    ]
)
def update_all_charts(min_temp, max_temp, min_samples, start_date, end_date, 
                       routes, stations, statuses, n_clicks):
    
    global calculator, compliance_results, df_compliance, df_cleaned
    global db, df_shipments, df_samples
    
    ctx = callback_context
    triggered = ctx.triggered[0]["prop_id"].split(".")[0] if ctx.triggered else ""
    
    if triggered in ["min-temp-input", "max-temp-input", "min-samples-input"]:
        calculator = ComplianceCalculator(
            min_temp=min_temp or 2.0,
            max_temp=max_temp or 8.0,
            min_samples=min_samples or 3
        )
        compliance_results = calculator.calculate_all_compliance(df_shipments, df_samples)
        df_compliance = calculator.results_to_dataframe(compliance_results)
        df_cleaned_all = []
        for r in compliance_results:
            for d in r.removed_details:
                d["box_id"] = r.box_id
                d["batch_no"] = r.batch_no
                d["route"] = r.route
                df_cleaned_all.append(d)
        df_cleaned = pd.DataFrame(df_cleaned_all)
    elif triggered == "refresh-btn":
        try:
            db = get_database(init_sample_data=False)
            df_shipments, df_samples = db.load_data()
        except Exception as e:
            print(f"刷新失败: {e}")
        calculator = ComplianceCalculator(
            min_temp=min_temp or 2.0,
            max_temp=max_temp or 8.0,
            min_samples=min_samples or 3
        )
        compliance_results = calculator.calculate_all_compliance(df_shipments, df_samples)
        df_compliance = calculator.results_to_dataframe(compliance_results)
        df_cleaned_all = []
        for r in compliance_results:
            for d in r.removed_details:
                d["box_id"] = r.box_id
                d["batch_no"] = r.batch_no
                d["route"] = r.route
                df_cleaned_all.append(d)
        df_cleaned = pd.DataFrame(df_cleaned_all)
    
    df = df_compliance.copy()
    
    if start_date:
        df = df[df["signoff_time"] >= pd.to_datetime(start_date)]
    if end_date:
        df = df[df["signoff_time"] <= pd.to_datetime(end_date) + timedelta(days=1)]
    
    if routes:
        df = df[df["route"].isin(routes)]
    
    if stations:
        df = df[df["from_station"].isin(stations) | df["to_station"].isin(stations)]
    
    if statuses:
        mask = pd.Series([False] * len(df))
        if "normal" in statuses:
            mask = mask | ((df["is_valid_for_ranking"]) & (df["review_status"].isin(["none", "resolved"])))
        if "pending" in statuses:
            mask = mask | (~df["is_valid_for_ranking"])
        if "appealed" in statuses:
            mask = mask | (df["review_status"] == "appealed")
        if "reviewing" in statuses:
            mask = mask | (df["review_status"] == "pending")
        df = df[mask]
    
    ranking_mask = (
        df["is_valid_for_ranking"] & 
        (~df["review_status"].isin(["pending", "appealed"]))
    )
    total_count = len(df)
    valid_count = ranking_mask.sum()
    avg_compliance = df[ranking_mask]["compliance_rate"].mean() if ranking_mask.sum() > 0 else 0
    
    pending_sample_mask = ~df["is_valid_for_ranking"]
    pending_review_mask = df["review_status"].isin(["pending", "appealed"])
    pending_count = int(pending_sample_mask.sum() + pending_review_mask.sum() - (pending_sample_mask & pending_review_mask).sum())
    
    kpi_total = dbc.CardBody([
        html.H6("总运输批次", className="card-subtitle mb-2 text-muted"),
        html.H3(f"{total_count}", className="card-title text-primary"),
        html.P("筛选范围内", className="card-text small")
    ])
    
    kpi_valid = dbc.CardBody([
        html.H6("有效统计批次", className="card-subtitle mb-2 text-muted"),
        html.H3(f"{int(valid_count)}", className="card-title text-success"),
        html.P(f"样本≥{min_samples or 3}次，排除复核中", className="card-text small")
    ])
    
    kpi_compliance = dbc.CardBody([
        html.H6("平均合规率", className="card-subtitle mb-2 text-muted"),
        html.H3(f"{avg_compliance:.1f}%", className="card-title text-info"),
        html.P("有效批次均值", className="card-text small")
    ])
    
    kpi_pending = dbc.CardBody([
        html.H6("待复核批次", className="card-subtitle mb-2 text-muted"),
        html.H3(f"{int(pending_count)}", className="card-title text-warning"),
        html.P("样本不足或申诉中", className="card-text small")
    ])
    
    fig_overtime = create_overtime_trend_chart(df)
    fig_route = create_route_distribution_chart(df)
    fig_station = create_station_comparison_chart(df)
    fig_table = create_compliance_table_chart(df, min_samples)
    
    cleaned_table = create_cleaned_data_table(df_cleaned, df)
    
    warning_pending = len(df) - df["is_valid_for_ranking"].sum()
    warning_style = {"display": "inline-block"} if warning_pending > 0 else {"display": "none"}
    warning_text = f"⚠️ {warning_pending} 个批次样本量不足，待复核"
    
    return kpi_total, kpi_valid, kpi_compliance, kpi_pending, fig_overtime, fig_route, fig_station, fig_table, cleaned_table, warning_text, warning_style


def create_overtime_trend_chart(df):
    if len(df) == 0:
        return go.Figure()
    
    df_daily = df.copy()
    df_daily["date"] = df_daily["signoff_time"].dt.date
    df_daily = df_daily[
        df_daily["is_valid_for_ranking"] & 
        (~df_daily["review_status"].isin(["pending", "appealed"]))
    ]
    
    daily_stats = df_daily.groupby("date").agg({
        "over_temp_duration_hours": "sum",
        "under_temp_duration_hours": "sum",
        "compliance_rate": "mean"
    }).reset_index()
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=daily_stats["date"],
        y=daily_stats["over_temp_duration_hours"],
        name="超温时长(小时)",
        marker_color="#e74c3c",
        yaxis="y"
    ))
    
    fig.add_trace(go.Bar(
        x=daily_stats["date"],
        y=daily_stats["under_temp_duration_hours"],
        name="低温时长(小时)",
        marker_color="#3498db",
        yaxis="y"
    ))
    
    fig.add_trace(go.Scatter(
        x=daily_stats["date"],
        y=daily_stats["compliance_rate"],
        name="平均合规率(%)",
        mode="lines+markers",
        line=dict(color="#2ecc71", width=3),
        marker=dict(size=8),
        yaxis="y2"
    ))
    
    fig.update_layout(
        barmode="stack",
        height=350,
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        yaxis=dict(title="时长(小时)", side="left"),
        yaxis2=dict(title="合规率(%)", side="right", overlaying="y", range=[80, 101]),
        margin=dict(l=50, r=50, t=40, b=30)
    )
    
    return fig


def create_route_distribution_chart(df):
    if len(df) == 0:
        return go.Figure()
    
    df_ranking = df[
        df["is_valid_for_ranking"] & 
        (~df["review_status"].isin(["pending", "appealed"]))
    ]
    
    if len(df_ranking) == 0:
        return go.Figure()
    
    route_stats = df_ranking.groupby("route").agg({
        "compliance_rate": "mean",
        "shipment_id": "count",
        "over_temp_duration_hours": "sum"
    }).reset_index()
    route_stats = route_stats.sort_values("compliance_rate", ascending=True)
    
    colors = ["#e74c3c" if x < 90 else "#f39c12" if x < 95 else "#2ecc71" 
              for x in route_stats["compliance_rate"]]
    
    fig = go.Figure()
    fig.add_trace(go.Bar(
        y=route_stats["route"],
        x=route_stats["compliance_rate"],
        orientation="h",
        marker_color=colors,
        text=route_stats["compliance_rate"].round(1).astype(str) + "%",
        textposition="outside",
        customdata=route_stats["shipment_id"],
        hovertemplate="<b>%{y}</b><br>合规率: %{x:.1f}%<br>运输次数: %{customdata}"
    ))
    
    fig.update_layout(
        height=400,
        xaxis=dict(title="平均合规率(%)", range=[80, 102]),
        margin=dict(l=120, r=30, t=30, b=30)
    )
    
    return fig


def create_station_comparison_chart(df):
    if len(df) == 0:
        return go.Figure()
    
    df_ranking = df[
        df["is_valid_for_ranking"] & 
        (~df["review_status"].isin(["pending", "appealed"]))
    ]
    
    if len(df_ranking) == 0:
        return go.Figure()
    
    from_stats = df_ranking.groupby("from_station").agg({
        "compliance_rate": "mean",
        "shipment_id": "count"
    }).reset_index()
    from_stats.columns = ["station", "compliance_rate", "count"]
    
    to_stats = df_ranking.groupby("to_station").agg({
        "compliance_rate": "mean",
        "shipment_id": "count"
    }).reset_index()
    to_stats.columns = ["station", "compliance_rate", "count"]
    
    station_stats = pd.concat([from_stats, to_stats]).groupby("station").agg({
        "compliance_rate": "mean",
        "count": "sum"
    }).reset_index()
    station_stats = station_stats.sort_values("compliance_rate", ascending=False)
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=station_stats["station"],
        y=station_stats["compliance_rate"],
        mode="markers",
        marker=dict(
            size=station_stats["count"] * 2 + 10,
            color=station_stats["compliance_rate"],
            colorscale="RdYlGn",
            showscale=True,
            cmin=85,
            cmax=100,
            colorbar=dict(title="合规率(%)")
        ),
        text=station_stats["station"] + "<br>合规率: " + station_stats["compliance_rate"].round(1).astype(str) + "%<br>运输: " + station_stats["count"].astype(str) + "次",
        hoverinfo="text"
    ))
    
    fig.add_hline(y=95, line_dash="dash", line_color="orange", annotation_text="目标线 95%")
    
    fig.update_layout(
        height=400,
        yaxis=dict(title="平均合规率(%)", range=[85, 101]),
        xaxis=dict(title="", tickangle=45),
        margin=dict(l=50, r=50, t=30, b=120)
    )
    
    return fig


def create_compliance_table_chart(df, min_samples):
    if len(df) == 0:
        return go.Figure()
    
    df_display = df.copy()
    df_display = df_display.sort_values("compliance_rate", ascending=False)
    
    df_display["status_label"] = df_display.apply(
        lambda row: "待复核-样本不足" if not row["is_valid_for_ranking"]
        else "复核中" if row["review_status"] == "pending"
        else "申诉中" if row["review_status"] == "appealed"
        else "已确认" if row["review_status"] == "resolved"
        else "正常", axis=1
    )
    
    df_display["compliance_display"] = df_display.apply(
        lambda row: f"{row['compliance_rate']:.1f}%" if row["is_valid_for_ranking"] else "—",
        axis=1
    )
    
    fig = go.Figure()
    
    header_values = ["箱号", "批号", "路线", "目的站点", "签收时间", "样本数", "合规率", "状态", "异常次数", "剔除数"]
    cell_values = [
        df_display["box_id"],
        df_display["batch_no"],
        df_display["route"],
        df_display["to_station"],
        df_display["signoff_time"].dt.strftime("%m-%d %H:%M"),
        df_display["sample_count"].astype(str),
        df_display["compliance_display"],
        df_display["status_label"],
        df_display["anomaly_count"].astype(str),
        df_display["removed_count"].astype(str)
    ]
    
    fill_colors = []
    for _, row in df_display.iterrows():
        if not row["is_valid_for_ranking"]:
            fill_colors.append("#fff3cd")
        elif row["review_status"] in ["pending", "appealed"]:
            fill_colors.append("#f8d7da")
        elif row["compliance_rate"] >= 99:
            fill_colors.append("#d4edda")
        elif row["compliance_rate"] >= 95:
            fill_colors.append("#d1ecf1")
        else:
            fill_colors.append("#f8d7da")
    
    fig.add_trace(go.Table(
        header=dict(
            values=header_values,
            fill_color="#2c3e50",
            font=dict(color="white", size=12),
            align="center",
            height=40
        ),
        cells=dict(
            values=cell_values,
            fill_color=[fill_colors],
            align="center",
            height=35,
            font=dict(size=11)
        )
    ))
    
    fig.update_layout(
        height=500,
        margin=dict(l=10, r=10, t=10, b=10)
    )
    
    return fig


def create_cleaned_data_table(df_cleaned_all, df_filtered):
    if len(df_cleaned_all) == 0 or len(df_filtered) == 0:
        return html.P("暂无被剔除的数据", className="text-muted")
    
    relevant_boxes = df_filtered["box_id"].unique()
    df_filtered_cleaned = df_cleaned_all[df_cleaned_all["box_id"].isin(relevant_boxes)]
    
    if len(df_filtered_cleaned) == 0:
        return html.P("暂无被剔除的数据", className="text-muted")
    
    df_display = df_filtered_cleaned.head(100).copy()
    df_display["temperature"] = df_display["temperature"].apply(
        lambda x: f"{x:.1f}" if pd.notna(x) else "NULL"
    )
    
    table = dbc.Table([
        html.Thead(html.Tr([
            html.Th("箱号"),
            html.Th("批号"),
            html.Th("采样时间"),
            html.Th("温度值"),
            html.Th("剔除原因")
        ])),
        html.Tbody([
            html.Tr([
                html.Td(row["box_id"]),
                html.Td(row["batch_no"]),
                html.Td(pd.to_datetime(row["timestamp"]).strftime("%Y-%m-%d %H:%M")),
                html.Td(row["temperature"]),
                html.Td(
                    dbc.Badge(row["reason"], color="warning", className="me-1")
                )
            ]) for _, row in df_display.iterrows()
        ])
    ], striped=True, bordered=True, hover=True, size="sm", className="mt-2")
    
    total_removed = len(df_filtered_cleaned)
    return html.Div([
        html.P([
            html.Strong(f"共剔除 {total_removed} 条异常数据"),
            html.Span(" （显示前100条）", className="text-muted")
        ]),
        table
    ])


@app.callback(
    Output("sample-detail-modal", "is_open"),
    Output("modal-content", "children"),
    Input("compliance-table-chart", "clickData"),
    Input("close-modal", "n_clicks"),
    State("sample-detail-modal", "is_open"),
    State("min-temp-input", "value"),
    State("max-temp-input", "value")
)
def display_sample_detail(clickData, n_clicks, is_open, min_temp, max_temp):
    ctx = callback_context
    triggered = ctx.triggered[0]["prop_id"].split(".")[0] if ctx.triggered else ""
    
    if triggered == "close-modal" and is_open:
        return False, None
    
    if triggered == "compliance-table-chart" and clickData:
        point = clickData["points"][0]
        row_idx = point.get("row")
        
        if row_idx is None:
            return is_open, None
        
        box_id = point["cell_values"][0]
        
        shipment = df_shipments[df_shipments["box_id"] == box_id].iloc[0]
        samples = df_samples[df_samples["box_id"] == box_id].copy()
        samples = samples.sort_values("timestamp")
        
        cleaned_samples, _ = calculator.cleaner.clean_samples(samples)
        valid_samples = cleaned_samples[~cleaned_samples["is_cleaned"]]
        
        fig = go.Figure()
        
        if len(valid_samples) > 0:
            fig.add_trace(go.Scatter(
                x=valid_samples["timestamp"],
                y=valid_samples["temperature"],
                mode="lines+markers",
                name="有效采样",
                line=dict(color="#2ecc71", width=2),
                marker=dict(size=6)
            ))
        
        cleaned_visible = cleaned_samples[cleaned_samples["is_cleaned"]]
        if len(cleaned_visible) > 0:
            fig.add_trace(go.Scatter(
                x=cleaned_visible["timestamp"],
                y=cleaned_visible["temperature"].apply(lambda x: x if pd.notna(x) and abs(x) < 50 else None),
                mode="markers",
                name="已剔除",
                marker=dict(size=10, color="#e74c3c", symbol="x"),
                text=cleaned_visible["cleaned_reason"],
                hoverinfo="text+x+y"
            ))
        
        fig.add_hrect(
            y0=min_temp, y1=max_temp,
            fillcolor="rgba(46, 204, 113, 0.15)",
            line_width=0,
            layer="below",
            annotation_text="合规区间",
            annotation_position="top left"
        )
        
        fig.add_hline(y=min_temp, line_dash="dash", line_color="orange", annotation_text=f"下限 {min_temp}°C")
        fig.add_hline(y=max_temp, line_dash="dash", line_color="orange", annotation_text=f"上限 {max_temp}°C")
        
        fig.update_layout(
            height=350,
            title=f"箱号: {box_id} | 批号: {shipment['batch_no']}",
            yaxis=dict(title="温度 (°C)"),
            xaxis=dict(title="采样时间"),
            hovermode="x unified",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )
        
        result_row = df_compliance[df_compliance["box_id"] == box_id].iloc[0]
        
        detail_cards = dbc.Row([
            dbc.Col(create_kpi_card("样本总数", f"{result_row['sample_count']}", "原始采样", "primary"), md=2),
            dbc.Col(create_kpi_card("有效样本", f"{result_row['valid_sample_count']}", "清洗后", "success"), md=2),
            dbc.Col(create_kpi_card("合规率", f"{result_row['compliance_rate']:.1f}%" if result_row['is_valid_for_ranking'] else "待复核", "", "info"), md=2),
            dbc.Col(create_kpi_card("超温时长", f"{result_row['over_temp_duration_hours']:.1f}h", "", "danger"), md=2),
            dbc.Col(create_kpi_card("最高温度", f"{result_row['max_temp']}°C" if pd.notna(result_row['max_temp']) else "—", "", "warning"), md=2),
            dbc.Col(create_kpi_card("最低温度", f"{result_row['min_temp']}°C" if pd.notna(result_row['min_temp']) else "—", "", "secondary"), md=2)
        ], className="mb-4")
        
        review_section = html.Div([
            html.H6("复核信息", className="mt-4 mb-3"),
            dbc.Alert([
                html.Strong(f"复核状态: "),
                result_row["review_note"] if result_row["review_note"] else "无申诉"
            ], color="info" if result_row["review_status"] == "none" else "warning"),
            
            html.H6("📷 签收照片", className="mt-4 mb-3"),
            dbc.Card([
                dbc.CardHeader([
                    dbc.Button(
                        "展开/收起照片",
                        id="photo-toggle-btn",
                        color="link",
                        size="sm",
                        className="p-0 text-decoration-none"
                    )
                ]),
                dbc.Collapse(
                    dbc.CardBody([
                        html.Div([
                            html.Img(
                                src=shipment["signoff_photo_url"],
                                style={
                                    "width": "100%",
                                    "maxHeight": "450px",
                                    "objectFit": "contain",
                                    "border": "1px solid #dee2e6",
                                    "borderRadius": "4px"
                                },
                                alt=f"签收照片 - {box_id}"
                            ),
                            html.P([
                                html.Strong("签收单号: "), box_id,
                                html.Span("  |  ", className="text-muted"),
                                html.Strong("签收时间: "), shipment["signoff_time"].strftime("%Y-%m-%d %H:%M")
                            ], className="text-center text-muted mt-2 small")
                        ])
                    ]),
                    id="photo-collapse",
                    is_open=True
                )
            ])
        ])
        
        content = html.Div([
            detail_cards,
            dcc.Graph(figure=fig),
            review_section
        ])
        
        return True, content
    
    return is_open, None


@app.callback(
    Output("photo-collapse", "is_open"),
    Input("photo-toggle-btn", "n_clicks"),
    State("photo-collapse", "is_open"),
    prevent_initial_call=True
)
def toggle_photo(n_clicks, is_open):
    return not is_open


@app.callback(
    Output("download-report", "data"),
    Input("export-btn", "n_clicks"),
    State("min-temp-input", "value"),
    State("max-temp-input", "value"),
    State("min-samples-input", "value"),
    prevent_initial_call=True
)
def export_report(n_clicks, min_temp, max_temp, min_samples):
    if n_clicks is None:
        return None
    
    calc = ComplianceCalculator(
        min_temp=min_temp or 2.0,
        max_temp=max_temp or 8.0,
        min_samples=min_samples or 3
    )
    results = calc.calculate_all_compliance(df_shipments, df_samples)
    df_res = calc.results_to_dataframe(results)
    
    df_cleaned_export = []
    for r in results:
        for d in r.removed_details:
            d["box_id"] = r.box_id
            d["batch_no"] = r.batch_no
            d["route"] = r.route
            df_cleaned_export.append(d)
    df_cleaned_exp = pd.DataFrame(df_cleaned_export)
    
    report_data = ReportExporter.export_compliance_report(
        df_res, df_samples, df_cleaned_exp, format="xlsx"
    )
    
    return dcc.send_bytes(report_data, ReportExporter.generate_filename("xlsx"))


if __name__ == "__main__":
    app.run_server(debug=True, port=8050)
