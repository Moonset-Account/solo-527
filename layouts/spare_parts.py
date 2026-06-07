from dash import dcc, html
import dash_bootstrap_components as dbc
from components.charts import create_empty_figure


def get_spare_parts_layout():
    return dbc.Container([
        html.Br(),
        dbc.Row([
            dbc.Col([
                html.H2("备件关联分析", className="fw-bold text-primary"),
                html.P("分析故障类型与备件消耗的关联，优化备件库存和采购策略", 
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
                        html.H5("故障类型-备件关联度矩阵", className="mb-0"),
                        dbc.Badge("颜色越深关联度越高", color="info", className="ms-2"),
                    ]),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-parts-heatmap",
                            type="default",
                            children=[
                                dcc.Graph(id="parts-heatmap", figure=create_empty_figure()),
                            ],
                        ),
                        html.Small([
                            html.Strong("说明："),
                            "基于关联规则挖掘算法计算故障类型与备件的关联度。"
                            "高关联度的备件应作为对应故障的常备库存。"
                        ], className="text-muted mt-2 d-block"),
                    ]),
                ], className="shadow-sm"),
            ], md=12),
        ], className="mb-4 g-3"),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.H5("备件成本构成分析", className="mb-0"),
                        dbc.Badge("按故障类型堆叠", color="warning", className="ms-2"),
                    ]),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-cost-chart",
                            type="default",
                            children=[
                                dcc.Graph(id="cost-chart", figure=create_empty_figure()),
                            ],
                        ),
                        html.Small([
                            html.Strong("说明："),
                            "按故障类型统计备件成本构成，识别成本最高的故障类型和备件。"
                            "可用于评估预防性更换是否比故障后更换更经济。"
                        ], className="text-muted mt-2 d-block"),
                    ]),
                ], className="shadow-sm"),
            ], md=12),
        ], className="mb-4 g-3"),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader(html.H5("Top 5 强关联规则", className="mb-0")),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-top-correlations",
                            type="default",
                            children=[
                                html.Div(id="top-correlations-list"),
                            ],
                        ),
                    ]),
                ], className="shadow-sm"),
            ], md=12),
        ], className="mb-4 g-3"),
        
    ], fluid=True)
