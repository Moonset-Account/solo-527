from dash import html
import dash_bootstrap_components as dbc
from utils.helpers import format_duration, get_caliber_note


def create_kpi_card(title, value, unit="", icon=None, trend=None, caliber_key=None, color=None):
    color_classes = {
        "primary": "text-primary",
        "warning": "text-warning",
        "danger": "text-danger",
        "success": "text-success",
        "info": "text-info",
    }
    
    text_class = color_classes.get(color, "text-primary")
    
    trend_element = None
    if trend is not None:
        trend_class = "text-success" if trend >= 0 else "text-danger"
        trend_icon = "▲" if trend >= 0 else "▼"
        trend_element = html.Small(
            f"{trend_icon} {abs(trend)}%",
            className=f"{trend_class} ms-2"
        )
    
    caliber_icon = None
    if caliber_key:
        caliber_icon = dbc.Badge(
            "?",
            color="light",
            text_color="muted",
            className="ms-1 rounded-circle cursor-pointer",
            id=f"caliber-{title}",
            style={"width": "18px", "height": "18px", "padding": "0", "fontSize": "10px", "lineHeight": "16px"},
        )
    
    return dbc.Card(
        dbc.CardBody([
            html.Div([
                html.Div([
                    html.H6([
                        title,
                        caliber_icon,
                    ], className="card-title text-muted mb-1 small"),
                    html.H2([
                        value if isinstance(value, str) else f"{value:,}",
                        html.Small(unit, className="text-muted ms-1 fs-6"),
                        trend_element,
                    ], className=f"mb-0 fw-bold {text_class}"),
                ], className="flex-grow-1"),
                icon and html.Div(
                    icon,
                    className=f"fs-1 {text_class} opacity-25 ms-3",
                ),
            ], className="d-flex align-items-center justify-content-between"),
        ]),
        className="shadow-sm h-100",
    )


def create_kpi_row(kpi_data):
    return dbc.Row([
        dbc.Col(create_kpi_card(
            title="总停机时长",
            value=format_duration(kpi_data.get("total_duration", 0)),
            color="primary",
            caliber_key="total_duration",
        ), md=3),
        dbc.Col(create_kpi_card(
            title="突发停机占比",
            value=f"{kpi_data.get('unplanned_ratio', 0)}%",
            color="warning",
            caliber_key="breakdown_type",
        ), md=3),
        dbc.Col(create_kpi_card(
            title="平均修复时间(MTTR)",
            value=f"{kpi_data.get('mttr', 0)}",
            unit="分钟",
            color="danger",
            caliber_key="mttr",
        ), md=3),
        dbc.Col(create_kpi_card(
            title="设备可用率",
            value=f"{kpi_data.get('availability', 0)}%",
            color="success",
            caliber_key="availability",
        ), md=3),
    ], className="mb-4 g-3")
