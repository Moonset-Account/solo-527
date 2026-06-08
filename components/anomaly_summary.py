import dash_bootstrap_components as dbc
from dash import html
from utils.helpers import severity_color, format_pct, format_currency


def render_anomaly_summary(summary):
    anomalies = summary.get("anomalies", [])
    stats = summary.get("stats", {})

    critical = [a for a in anomalies if a["severity"] == "critical"]
    warnings = [a for a in anomalies if a["severity"] == "warning"]
    info = [a for a in anomalies if a["severity"] == "info"]

    stat_cards = dbc.Row([
        dbc.Col(_stat_card("总订单", f"{stats.get('total_orders', 0):,}", "#3498db"), width=2),
        dbc.Col(_stat_card("退餐率", format_pct(stats.get("cancel_rate")), "#e74c3c"), width=2),
        dbc.Col(_stat_card("营业收入", format_currency(stats.get("total_revenue")), "#27ae60"), width=2),
        dbc.Col(_stat_card("总成本", format_currency(stats.get("total_cost")), "#e67e22"), width=2),
        dbc.Col(_stat_card("毛利率", format_pct(stats.get("gross_margin_rate")), "#9b59b6"), width=2),
        dbc.Col(_stat_card("异常数", f"{len(anomalies)}", "#e74c3c" if len(critical) > 0 else "#27ae60"), width=2),
    ], className="mb-3")

    anomaly_list = []
    if critical:
        anomaly_list.append(html.H6("严重异常", style={"color": "#e74c3c"}))
        for a in critical:
            anomaly_list.append(_anomaly_item(a))
    if warnings:
        anomaly_list.append(html.H6("预警提示", style={"color": "#f39c12"}))
        for a in warnings:
            anomaly_list.append(_anomaly_item(a))
    if info:
        anomaly_list.append(html.H6("信息提示", style={"color": "#3498db"}))
        for a in info:
            anomaly_list.append(_anomaly_item(a))
    if not anomalies:
        anomaly_list.append(html.Div("当前筛选条件下无异常", className="text-success text-center py-3"))

    anomaly_card = dbc.Card([
        dbc.CardHeader(html.Strong("异常摘要"), className="bg-light"),
        dbc.CardBody(anomaly_list, style={"maxHeight": "400px", "overflowY": "auto"}),
    ])

    return html.Div([stat_cards, anomaly_card])


def _stat_card(title, value, color):
    return dbc.Card([
        dbc.CardBody([
            html.Div(title, className="text-muted", style={"fontSize": "0.85em"}),
            html.Div(value, style={"fontSize": "1.4em", "fontWeight": "bold", "color": color}),
        ], className="py-2 px-3"),
    ], className="text-center")


def _anomaly_item(a):
    color = severity_color(a["severity"])
    return html.Div([
        html.Span(f"[{a['type']}]", style={"color": color, "fontWeight": "bold", "marginRight": "8px"}),
        html.Span(f"{a['dish']}", style={"fontWeight": "bold", "marginRight": "4px"}),
        html.Span(f"({a['window']})", style={"color": "#666", "marginRight": "8px"}),
        html.Span(a["detail"]),
    ], className="py-1 border-bottom", style={"fontSize": "0.9em"})
