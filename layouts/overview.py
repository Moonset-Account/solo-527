from dash import dcc, html
import dash_bootstrap_components as dbc
from components.kpi_cards import create_kpi_row
from components.filters import create_filter_panel, create_filter_store
from components.charts import create_trend_chart, create_empty_figure


def get_overview_layout():
    return dbc.Container([
        html.Br(),
        dbc.Row([
            dbc.Col([
                html.H2("工厂设备停机原因看板", className="fw-bold text-primary"),
                html.P("多维度分析设备停机数据，识别根因、优化资源配置、降低故障率", 
                       className="text-muted mb-0"),
            ], md=8),
            dbc.Col([
                html.Div([
                    html.Small("数据更新时间：", className="text-muted"),
                    html.Small(id="data-update-time", className="text-primary"),
                ], className="text-end mt-2"),
            ], md=4, className="align-self-center"),
        ], className="mb-4"),
        
        create_filter_panel(),
        create_filter_store(),
        
        dcc.Loading(
            id="loading-kpi",
            type="default",
            children=[
                html.Div(id="kpi-cards-container"),
            ],
        ),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.H5("停机时长趋势", className="mb-0"),
                        dbc.Badge("按时日聚合", color="light", text_color="muted", className="ms-2"),
                    ]),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-trend",
                            type="default",
                            children=[
                                dcc.Graph(id="trend-chart", figure=create_empty_figure()),
                            ],
                        ),
                        html.Small([
                            html.Strong("口径说明："),
                            "绿色区域为计划检修时长，橙色区域为突发故障时长。"
                            "计划检修不计入设备可靠性考核，仅突发故障用于考核。"
                        ], className="text-muted"),
                    ]),
                ], className="shadow-sm h-100"),
            ], md=12),
        ], className="mb-4 g-3"),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.H5("Top 5 故障类型", className="mb-0"),
                        dbc.Badge("按时长排序", color="warning", className="ms-2"),
                    ]),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-top-faults",
                            type="default",
                            children=[
                                html.Div(id="top-faults-list"),
                            ],
                        ),
                    ]),
                ], className="shadow-sm h-100"),
            ], md=6),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.H5("产线停机排名", className="mb-0"),
                        dbc.Badge("按突发故障", color="danger", className="ms-2"),
                    ]),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-top-lines",
                            type="default",
                            children=[
                                html.Div(id="top-lines-list"),
                            ],
                        ),
                    ]),
                ], className="shadow-sm h-100"),
            ], md=6),
        ], className="mb-4 g-3"),
        
        html.Footer([
            html.Hr(),
            html.Small(
                "© 2024 工厂设备管理系统 | 本看板数据仅用于内部管理分析 | 计划检修与突发故障已分离统计",
                className="text-muted d-block text-center",
            ),
        ], className="mt-5"),
        
    ], fluid=True)
