from dash import html, dcc
from data.metrics.definitions import RISK_TAGS, QUEUE_TYPES, SHIFTS, SOURCES


def filters_layout():
    risk_tag_options = [{"label": tag["name"], "value": tag["name"]} for tag in RISK_TAGS]
    shift_options = [{"label": s["name"], "value": s["name"]} for s in SHIFTS]
    queue_options = [{"label": q, "value": q} for q in QUEUE_TYPES]
    source_options = [{"label": s, "value": s} for s in SOURCES]
    
    return html.Div(
        className="filters-section",
        children=[
            html.Div(
                className="filters-row",
                children=[
                    html.Div(
                        className="filter-group",
                        children=[
                            html.Label(className="filter-label", children="风险标签"),
                            dcc.Dropdown(
                                id="filter-risk-tags",
                                options=risk_tag_options,
                                multi=True,
                                placeholder="选择风险标签...",
                                searchable=True,
                                clearable=True,
                            )
                        ]
                    ),
                    html.Div(
                        className="filter-group",
                        children=[
                            html.Label(className="filter-label", children="队列类型"),
                            dcc.Dropdown(
                                id="filter-queue-types",
                                options=queue_options,
                                multi=True,
                                placeholder="选择队列...",
                                clearable=True,
                            )
                        ]
                    ),
                    html.Div(
                        className="filter-group",
                        children=[
                            html.Label(className="filter-label", children="班次"),
                            dcc.Dropdown(
                                id="filter-shifts",
                                options=shift_options,
                                multi=True,
                                placeholder="选择班次...",
                                clearable=True,
                            )
                        ]
                    ),
                    html.Div(
                        className="filter-group",
                        children=[
                            html.Label(className="filter-label", children="视频来源"),
                            dcc.Dropdown(
                                id="filter-sources",
                                options=source_options,
                                multi=True,
                                placeholder="选择来源...",
                                clearable=True,
                            )
                        ]
                    ),
                    html.Div(
                        className="filter-group",
                        children=[
                            html.Label(className="filter-label", children="时间粒度"),
                            dcc.Dropdown(
                                id="filter-granularity",
                                options=[
                                    {"label": "5分钟", "value": "5m"},
                                    {"label": "1小时", "value": "1h"},
                                    {"label": "1天", "value": "1d"},
                                ],
                                value="1h",
                                clearable=False,
                                searchable=False,
                            )
                        ]
                    ),
                    html.Div(
                        className="filter-group",
                        style={"flex": "0 0 120px"},
                        children=[
                            html.Label(className="filter-label", children="操作"),
                            html.Button(
                                "导出数据",
                                id="btn-export",
                                className="export-btn",
                                n_clicks=0,
                            )
                        ]
                    ),
                ]
            ),
            html.Div(
                id="filter-breadcrumbs",
                className="filter-breadcrumbs",
                children=[]
            ),
            html.Div(id="export-status", style={"marginTop": "12px", "color": "var(--text-secondary)"})
        ]
    )
