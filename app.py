import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import dash
from dash import html, dcc, Input, Output, State, ctx
import dash_bootstrap_components as dbc

from api import (
    cached_anomaly_summary,
    cached_satisfaction_matrix,
    cached_sales_trend,
    cached_cancel_reasons,
    cached_cost_margin,
    cached_weather_correlation,
)
from api.cache import cache_stats
from components.filters import (
    render_filter_bar,
    build_filter_dict,
    render_filter_context,
)
from components.anomaly_summary import render_anomaly_summary
from components.satisfaction_matrix import render_satisfaction_matrix
from components.sales_trend import render_sales_trend
from components.cancel_reason import render_cancel_reasons
from components.cost_margin import render_cost_margin
from components.weather_correlation import render_weather_correlation

app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    suppress_callback_exceptions=True,
)
app.title = "园区食堂菜品满意度分析"

app.layout = dbc.Container([
    dbc.Row([
        dbc.Col(html.H2("园区食堂菜品满意度分析系统", className="mb-0"), width=10),
        dbc.Col(html.Div(id="cache-status", className="text-muted text-end pt-2", style={"fontSize": "0.8em"}), width=2),
    ], className="mt-3 mb-2"),

    render_filter_bar(),

    html.Div(id="anomaly-section"),

    dbc.Tabs([
        dbc.Tab(label="满意度矩阵", tab_id="tab-matrix", children=[
            html.Div(id="tab-matrix-content", className="mt-3"),
        ]),
        dbc.Tab(label="销量趋势", tab_id="tab-trend", children=[
            html.Div(id="tab-trend-content", className="mt-3"),
        ]),
        dbc.Tab(label="退餐原因", tab_id="tab-cancel", children=[
            html.Div(id="tab-cancel-content", className="mt-3"),
        ]),
        dbc.Tab(label="成本毛利", tab_id="tab-margin", children=[
            html.Div(id="tab-margin-content", className="mt-3"),
        ]),
        dbc.Tab(label="天气关联", tab_id="tab-weather", children=[
            html.Div(id="tab-weather-content", className="mt-3"),
        ]),
    ], id="main-tabs", active_tab="tab-matrix", className="mt-3"),

    dcc.Store(id="filter-state"),

    html.Div(id="export-toast"),

], fluid=True, className="px-4")


@app.callback(
    [
        Output("filter-state", "data"),
        Output("filter-context-display", "children"),
    ],
    [
        Input("filter-window", "value"),
        Input("filter-cuisine", "value"),
        Input("filter-meal", "value"),
        Input("filter-cost", "value"),
        Input("filter-month", "value"),
        Input("btn-reset-filters", "n_clicks"),
    ],
)
def update_filter_state(window, cuisine, meal, cost, month, reset_clicks):
    if ctx.triggered_id == "btn-reset-filters":
        return None, render_filter_context(None, None, None, None, None)

    filters = build_filter_dict(window, cuisine, meal, cost, month)
    context = render_filter_context(window, cuisine, meal, cost, month)
    return filters, context


@app.callback(
    Output("anomaly-section", "children"),
    Input("filter-state", "data"),
)
def update_anomaly(filters):
    summary = cached_anomaly_summary(filters)
    return render_anomaly_summary(summary)


@app.callback(
    Output("tab-matrix-content", "children"),
    Input("filter-state", "data"),
)
def update_matrix(filters):
    df = cached_satisfaction_matrix(filters)
    return render_satisfaction_matrix(df)


@app.callback(
    Output("tab-trend-content", "children"),
    Input("filter-state", "data"),
)
def update_trend(filters):
    df = cached_sales_trend(filters)
    return render_sales_trend(df)


@app.callback(
    Output("tab-cancel-content", "children"),
    Input("filter-state", "data"),
)
def update_cancel(filters):
    df = cached_cancel_reasons(filters)
    return render_cancel_reasons(df)


@app.callback(
    Output("tab-margin-content", "children"),
    Input("filter-state", "data"),
)
def update_margin(filters):
    df = cached_cost_margin(filters)
    return render_cost_margin(df)


@app.callback(
    Output("tab-weather-content", "children"),
    Input("filter-state", "data"),
)
def update_weather(filters):
    df = cached_weather_correlation(filters)
    return render_weather_correlation(df)


@app.callback(
    Output("cache-status", "children"),
    Input("filter-state", "data"),
)
def show_cache_status(_):
    stats = cache_stats()
    return f"缓存: {stats['active_keys']}/{stats['total_keys']}"


@app.callback(
    [
        Output("filter-window", "value"),
        Output("filter-cuisine", "value"),
        Output("filter-meal", "value"),
        Output("filter-cost", "value"),
        Output("filter-month", "value"),
    ],
    Input("btn-reset-filters", "n_clicks"),
)
def reset_filters(n):
    if n:
        return None, None, None, None, None
    return dash.no_update, dash.no_update, dash.no_update, dash.no_update, dash.no_update


@app.callback(
    Output("export-toast", "children"),
    Input("btn-export", "n_clicks"),
    State("filter-state", "data"),
)
def handle_export(n_clicks, filters):
    if not n_clicks:
        return ""
    try:
        from tasks.export import export_to_excel
        filepath = export_to_excel(filters)
        return dbc.Alert(f"导出成功: {filepath}", color="success", dismissable=True, className="mt-2")
    except Exception as e:
        return dbc.Alert(f"导出失败: {str(e)}", color="danger", dismissable=True, className="mt-2")


if __name__ == "__main__":
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    cleaned_dir = os.path.join(data_dir, "cleaned")

    if not os.path.exists(os.path.join(cleaned_dir, "orders.csv")):
        print("Cleaned data not found. Running seed and clean pipeline...")
        from db.seed import main as seed_main
        from data.clean import run as clean_main

        seed_main()
        clean_main()

    print("Preloading data into cache...")
    from api.aggregation import _base_joins
    _base_joins()
    print("Data cached. Starting Dash server...")
    app.run(debug=False, host="0.0.0.0", port=8052)
