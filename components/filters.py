import dash_bootstrap_components as dbc
from dash import html, dcc
from config import WINDOW_NAMES, CUISINE_TYPES, MEAL_PERIODS
from utils.helpers import COST_RANGES


def render_filter_bar():
    return dbc.Card([
        dbc.CardHeader(html.Strong("筛选条件"), className="bg-light"),
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.Label("窗口"),
                    dcc.Dropdown(
                        id="filter-window",
                        options=[{"label": n, "value": n} for n in WINDOW_NAMES],
                        multi=True,
                        placeholder="全部窗口",
                        className="mb-2",
                    ),
                ], width=2),
                dbc.Col([
                    html.Label("菜系"),
                    dcc.Dropdown(
                        id="filter-cuisine",
                        options=[{"label": t, "value": t} for t in CUISINE_TYPES],
                        multi=True,
                        placeholder="全部菜系",
                        className="mb-2",
                    ),
                ], width=2),
                dbc.Col([
                    html.Label("时段"),
                    dcc.Dropdown(
                        id="filter-meal",
                        options=[{"label": p, "value": p} for p in MEAL_PERIODS],
                        multi=True,
                        placeholder="全部时段",
                        className="mb-2",
                    ),
                ], width=2),
                dbc.Col([
                    html.Label("成本区间"),
                    dcc.Dropdown(
                        id="filter-cost",
                        options=[{"label": r["label"], "value": r["label"]} for r in COST_RANGES],
                        multi=True,
                        placeholder="全部区间",
                        className="mb-2",
                    ),
                ], width=2),
                dbc.Col([
                    html.Label("月份"),
                    dcc.Dropdown(
                        id="filter-month",
                        options=[{"label": f"{m}月", "value": m} for m in range(1, 13)],
                        multi=True,
                        placeholder="全部月份",
                        className="mb-2",
                    ),
                ], width=2),
                dbc.Col([
                    html.Label(" "),
                    dbc.ButtonGroup([
                        dbc.Button("重置", id="btn-reset-filters", color="secondary", size="sm"),
                        dbc.Button("导出", id="btn-export", color="success", size="sm"),
                    ], className="mb-2"),
                ], width=2),
            ]),
            html.Div(id="filter-context-display", className="text-muted mt-1", style={"fontSize": "0.85em"}),
        ]),
    ], className="mb-3")


def build_filter_dict(window, cuisine, meal, cost, month):
    filters = {}
    if window:
        import pandas as pd
        import os
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "cleaned")
        windows_df = pd.read_csv(os.path.join(data_dir, "windows.csv"), encoding="utf-8-sig")
        wid_map = dict(zip(windows_df["name"], windows_df["id"]))
        filters["window_id"] = [wid_map.get(w) for w in window if w in wid_map]
    if cuisine:
        filters["cuisine_type"] = cuisine
    if meal:
        filters["meal_period"] = meal
    if cost:
        selected_ranges = [r for r in COST_RANGES if r["label"] in cost]
        if selected_ranges:
            filters["cost_range"] = selected_ranges
    if month:
        filters["month"] = month
    return filters if filters else None


def render_filter_context(window, cuisine, meal, cost, month):
    parts = []
    if window:
        parts.append(f"窗口: {', '.join(window)}")
    if cuisine:
        parts.append(f"菜系: {', '.join(cuisine)}")
    if meal:
        parts.append(f"时段: {', '.join(meal)}")
    if cost:
        parts.append(f"成本: {', '.join(cost)}")
    if month:
        parts.append(f"月份: {', '.join(f'{m}月' for m in month)}")
    if parts:
        return html.Span(["当前筛选: "] + [html.Strong(p) for p in parts])
    return html.Span("当前筛选: 全部", className="text-muted")
