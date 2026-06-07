from dash import dcc, html
import dash_bootstrap_components as dbc
from components.charts import create_empty_figure


def get_maintenance_layout():
    return dbc.Container([
        html.Br(),
        dbc.Row([
            dbc.Col([
                html.H2("维修效率分析", className="fw-bold text-primary"),
                html.P("分析维修团队绩效，优化资源配置，持续提升维修效率", 
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
                    dbc.CardBody([
                        html.H6("平均修复时间(MTTR)", className="text-muted small"),
                        html.H2(id="mttr-value", className="fw-bold text-danger"),
                        html.Small("分钟/次", className="text-muted"),
                    ]),
                    dbc.Tooltip(
                        "从报修到修复完成的平均时间，反映维修响应速度",
                        target="mttr-value",
                    ),
                ], className="shadow-sm text-center"),
            ], md=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H6("平均故障间隔(MTBF)", className="text-muted small"),
                        html.H2(id="mtbf-value", className="fw-bold text-success"),
                        html.Small("小时", className="text-muted"),
                    ]),
                    dbc.Tooltip(
                        "两次突发故障之间的平均运行时间，反映设备可靠性",
                        target="mtbf-value",
                    ),
                ], className="shadow-sm text-center"),
            ], md=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H6("总工单数量", className="text-muted small"),
                        html.H2(id="total-orders", className="fw-bold text-primary"),
                        html.Small("次", className="text-muted"),
                    ]),
                ], className="shadow-sm text-center"),
            ], md=3),
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H6("平均人工成本", className="text-muted small"),
                        html.H2(id="avg-labor-cost", className="fw-bold text-warning"),
                        html.Small("元/单", className="text-muted"),
                    ]),
                ], className="shadow-sm text-center"),
            ], md=3),
        ], className="mb-4 g-3"),
        
        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.H5("维修时长分布", className="mb-0"),
                        dbc.Badge("识别异常工单", color="danger", className="ms-2"),
                    ]),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-maint-dist",
                            type="default",
                            children=[
                                dcc.Graph(id="maint-dist-chart", figure=create_empty_figure()),
                            ],
                        ),
                        html.Small([
                            html.Strong("说明："),
                            "绿色为30分钟内快速修复，黄色为1小时内，红色为超过2小时的复杂维修。"
                            "异常工单需分析是否存在备件不足、技能欠缺等问题。"
                        ], className="text-muted mt-2 d-block"),
                    ]),
                ], className="shadow-sm"),
            ], md=6),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader([
                        html.H5("维修人员效率对比", className="mb-0"),
                        dbc.Badge("柱状图=MTTR，折线=工单量", color="info", className="ms-2"),
                    ]),
                    dbc.CardBody([
                        dcc.Loading(
                            id="loading-person-chart",
                            type="default",
                            children=[
                                dcc.Graph(id="person-chart", figure=create_empty_figure()),
                            ],
                        ),
                        html.Small([
                            html.Strong("说明："),
                            "柱状图越低表示修复速度越快，折线越高表示完成工单越多。"
                            "可用于识别高绩效人员和需要培训的人员。"
                        ], className="text-muted mt-2 d-block"),
                    ]),
                ], className="shadow-sm"),
            ], md=6),
        ], className="mb-4 g-3"),
        
    ], fluid=True)
