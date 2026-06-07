from dash import dcc, html
import dash_bootstrap_components as dbc
from components.charts import create_empty_figure, create_pareto_chart


def get_pareto_layout():
    return dbc.Container([
        html.Br(),
        dbc.Row([
            dbc.Col([
                html.H2("停机原因Pareto分析", className="fw-bold text-primary"),
                html.P("识别造成80%停机的关键20%故障类型，聚焦改善资源投入", 
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
                        html.H5("Pareto分析图", className="mb-0"),
                        dbc.Badge("Pareto法则：80%的问题由20%的原因导致", 
                                  color="primary", className="ms-2"),
                    ]),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-pareto",
                            type="default",
                            children=[
                                dcc.Graph(id="pareto-chart", figure=create_empty_figure()),
                            ],
                        ),
                        html.Small([
                            html.Strong("图表说明："),
                            "柱状图表示各故障类型的停机时长，橙色折线表示累积占比。"
                            "橙色柱子为累计占比80%以内的关键故障类型，是优先改善对象。"
                        ], className="text-muted mt-2 d-block"),
                    ]),
                ], className="shadow-sm"),
            ], md=12),
        ], className="mb-4 g-3"),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.H5("关键故障详细分析", className="mb-0"),
                        dbc.Badge("点击上方柱状图可下钻查看", color="info", className="ms-2"),
                    ]),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-pareto-detail",
                            type="default",
                            children=[
                                html.Div(id="pareto-detail-container"),
                            ],
                        ),
                    ]),
                ], className="shadow-sm h-100"),
            ], md=12),
        ], className="mb-4 g-3"),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader(html.H5("改善建议", className="mb-0")),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-suggestions",
                            type="default",
                            children=[
                                html.Div(id="suggestions-container"),
                            ],
                        ),
                    ]),
                ], className="shadow-sm border-left-primary"),
            ], md=12),
        ], className="mb-4 g-3"),
        
    ], fluid=True)
