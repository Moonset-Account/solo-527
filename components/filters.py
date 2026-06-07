from dash import dcc, html
import dash_bootstrap_components as dbc
from services.data_service import get_dimension_options, get_date_range


def create_filter_panel():
    date_range = get_date_range()
    
    return dbc.Card(
        dbc.CardBody([
            html.Div([
                dbc.Row([
                    dbc.Col([
                        html.Label("时间范围", className="fw-bold text-muted small"),
                        dcc.DatePickerRange(
                            id="date-range",
                            min_date_allowed=date_range["min_date"],
                            max_date_allowed=date_range["max_date"],
                            start_date=date_range["min_date"],
                            end_date=date_range["max_date"],
                            display_format="YYYY-MM-DD",
                            className="w-100",
                        ),
                    ], md=3),
                    dbc.Col([
                        html.Label("产线", className="fw-bold text-muted small"),
                        dcc.Dropdown(
                            id="line-filter",
                            options=get_dimension_options("line"),
                            value=None,
                            multi=True,
                            placeholder="全部产线",
                            searchable=False,
                        ),
                    ], md=2),
                    dbc.Col([
                        html.Label("设备", className="fw-bold text-muted small"),
                        dcc.Dropdown(
                            id="equipment-filter",
                            options=get_dimension_options("equipment"),
                            value=None,
                            multi=True,
                            placeholder="全部设备",
                            searchable=True,
                        ),
                    ], md=2),
                    dbc.Col([
                        html.Label("班次", className="fw-bold text-muted small"),
                        dcc.Dropdown(
                            id="shift-filter",
                            options=get_dimension_options("shift"),
                            value=None,
                            multi=True,
                            placeholder="全部班次",
                            searchable=False,
                        ),
                    ], md=1),
                    dbc.Col([
                        html.Label("故障类型", className="fw-bold text-muted small"),
                        dcc.Dropdown(
                            id="fault-filter",
                            options=get_dimension_options("fault_type"),
                            value=None,
                            multi=True,
                            placeholder="全部类型",
                            searchable=True,
                        ),
                    ], md=2),
                    dbc.Col([
                        html.Label("维修人员", className="fw-bold text-muted small"),
                        dcc.Dropdown(
                            id="person-filter",
                            options=get_dimension_options("repair_person"),
                            value=None,
                            multi=True,
                            placeholder="全部人员",
                            searchable=True,
                        ),
                    ], md=2),
                ], className="g-3 align-items-end"),
                dbc.Row([
                    dbc.Col([
                        html.Div([
                            dbc.RadioItems(
                                id="breakdown-type-filter",
                                options=[
                                    {"label": "全部停机", "value": "all"},
                                    {"label": "仅突发故障", "value": "unplanned"},
                                    {"label": "仅计划检修", "value": "planned"},
                                ],
                                value="all",
                                inline=True,
                            ),
                        ], className="mt-2"),
                    ], md=6),
                    dbc.Col([
                        html.Div([
                            dbc.Button(
                                "重置筛选",
                                id="reset-filters-btn",
                                color="secondary",
                                size="sm",
                                outline=True,
                                className="float-end",
                            ),
                            dbc.Button(
                                "导出报告",
                                id="export-btn",
                                color="primary",
                                size="sm",
                                className="float-end me-2",
                            ),
                            dcc.Download(id="download-report"),
                        ], className="mt-2"),
                    ], md=6),
                ], className="mt-2"),
            ]),
            dbc.Tooltip(
                "计划检修不计入故障考核，仅突发故障用于设备可靠性评估",
                target="breakdown-type-filter",
            ),
        ]),
        className="mb-4 shadow-sm",
    )


def create_filter_store():
    return dcc.Store(
        id="filter-state",
        data={
            "start_date": None,
            "end_date": None,
            "line_ids": None,
            "equipment_ids": None,
            "shift_ids": None,
            "fault_codes": None,
            "repair_persons": None,
            "breakdown_type": "all",
        },
    )
