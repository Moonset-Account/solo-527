from dash import dcc, html
import dash_bootstrap_components as dbc
from components.charts import create_empty_figure


def get_line_compare_layout():
    return dbc.Container([
        html.Br(),
        dbc.Row([
            dbc.Col([
                html.H2("产线对比分析", className="fw-bold text-primary"),
                html.P("跨产线横向对比，识别设备管理薄弱产线，推广最佳实践", 
                       className="text-muted mb-0"),
            ], md=8),
            dbc.Col([
                dbc.Button(
                    "返回概览",
                    href="/",
                    color="secondary",
                    outline=True,
                    className="float-end",
                ),
            ], md=4, className="align-self-center"),
        ], className="mb-4"),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.H5("各产线停机时长对比", className="mb-0"),
                        dbc.Badge("计划检修与突发故障分离", color="info", className="ms-2"),
                    ]),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-line-compare",
                            type="default",
                            children=[
                                dcc.Graph(id="line-compare-chart", figure=create_empty_figure()),
                            ],
                        ),
                        html.Small([
                            html.Strong("说明："),
                            "绿色为计划检修时长，橙色为突发故障时长。"
                            "突发故障占比高的产线需重点关注设备可靠性。"
                        ], className="text-muted mt-2 d-block"),
                    ]),
                ], className="shadow-sm"),
            ], md=8),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader(html.H5("产线关键指标", className="mb-0")),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-line-summary",
                            type="default",
                            children=[
                                html.Div(id="line-summary-cards"),
                            ],
                        ),
                    ]),
                ], className="shadow-sm h-100"),
            ], md=4),
        ], className="mb-4 g-3"),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.H5("产线×班次停机热力图", className="mb-0"),
                        dbc.Badge("识别高发时段", color="warning", className="ms-2"),
                    ]),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-heatmap",
                            type="default",
                            children=[
                                dcc.Graph(id="heatmap-chart", figure=create_empty_figure()),
                            ],
                        ),
                        html.Small([
                            html.Strong("说明："),
                            "颜色越深表示该产线在该班次的停机时长越长。"
                            "可用于识别特定产线在特定班次的管理薄弱环节。"
                        ], className="text-muted mt-2 d-block"),
                    ]),
                ], className="shadow-sm"),
            ], md=12),
        ], className="mb-4 g-3"),
        
    ], fluid=True)
