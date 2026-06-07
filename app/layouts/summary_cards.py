from dash import html, dcc
from datetime import datetime, timedelta


def summary_cards_layout():
    return html.Div(
        className="alert-section",
        children=[
            html.Div(
                className="alert-cards-grid",
                id="alert-cards-container",
                children=[]
            )
        ]
    )


def create_summary_card(title, value, unit, message, icon="📊", severity="normal"):
    severity_class = f"alert-severity-{severity}" if severity != "normal" else ""
    
    icon_bg = {
        "high": {"backgroundColor": "rgba(239, 68, 68, 0.2)", "color": "#ef4444"},
        "medium": {"backgroundColor": "rgba(249, 115, 22, 0.2)", "color": "#f97316"},
        "normal": {"backgroundColor": "rgba(34, 197, 94, 0.15)", "color": "#22c55e"},
        "info": {"backgroundColor": "rgba(59, 130, 246, 0.15)", "color": "#3b82f6"},
    }.get(severity, {"backgroundColor": "rgba(59, 130, 246, 0.15)", "color": "#3b82f6"})
    
    return html.Div(
        className=f"alert-card {severity_class}",
        children=[
            html.Div(
                className="alert-card-icon",
                style=icon_bg,
                children=icon
            ),
            html.Div(className="alert-card-title", children=title),
            html.Div([
                html.Span(className="alert-card-value", children=str(value)),
                html.Span(className="alert-card-unit", children=unit)
            ]),
            html.Div(className="alert-card-message", children=message)
        ]
    )
