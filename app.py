import os
import dash
from dash import dcc, html, Input, Output
import dash_bootstrap_components as dbc

from layouts.overview import get_overview_layout
from layouts.pareto import get_pareto_layout
from layouts.line_compare import get_line_compare_layout
from layouts.maintenance import get_maintenance_layout
from layouts.spare_parts import get_spare_parts_layout
from callbacks.chart_callbacks import register_callbacks

app = dash.Dash(
    __name__,
    external_stylesheets=[
        dbc.themes.BOOTSTRAP,
        "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css",
        "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Roboto+Slab:wght@400;600;700&display=swap",
    ],
    suppress_callback_exceptions=True,
    title="工厂设备停机原因看板",
    meta_tags=[
        {"name": "viewport", "content": "width=device-width, initial-scale=1"},
    ],
)

server = app.server

sidebar = html.Div([
    html.Div([
        html.H4("设备管理", className="text-white fw-bold mb-0"),
        html.Small("停机分析看板", className="text-white-50"),
    ], className="mb-5 p-3"),
    
    dbc.Nav([
        dbc.NavLink([
            html.I(className="bi bi-speedometer2 me-2"),
            "总体概览",
        ], href="/", id="nav-overview", active="exact"),
        dbc.NavLink([
            html.I(className="bi bi-bar-chart me-2"),
            "Pareto分析",
        ], href="/pareto", id="nav-pareto", active="exact"),
        dbc.NavLink([
            html.I(className="bi bi-layers me-2"),
            "产线对比",
        ], href="/line-compare", id="nav-line", active="exact"),
        dbc.NavLink([
            html.I(className="bi bi-people me-2"),
            "维修效率",
        ], href="/maintenance", id="nav-maint", active="exact"),
        dbc.NavLink([
            html.I(className="bi bi-box-seam me-2"),
            "备件关联",
        ], href="/spare-parts", id="nav-parts", active="exact"),
    ], vertical=True, pills=True, className="flex-column"),
    
    html.Div([
        html.Hr(className="text-white-50"),
        html.Small("版本 v1.0.0", className="text-white-50 d-block"),
        html.Small("© 2024 工厂设备管理", className="text-white-50 d-block"),
    ], className="mt-auto p-3 position-absolute bottom-0 start-0 end-0"),
], className="sidebar")

content = html.Div([
    dcc.Location(id="url", refresh=False),
    html.Div(id="page-content"),
], className="main-content")

app.layout = html.Div([
    sidebar,
    content,
])

register_callbacks(app)


@app.callback(
    Output("page-content", "children"),
    Input("url", "pathname"),
)
def display_page(pathname):
    if pathname == "/pareto":
        return get_pareto_layout()
    elif pathname == "/line-compare":
        return get_line_compare_layout()
    elif pathname == "/maintenance":
        return get_maintenance_layout()
    elif pathname == "/spare-parts":
        return get_spare_parts_layout()
    else:
        return get_overview_layout()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8050))
    app.run_server(
        host="0.0.0.0",
        port=port,
        debug=False,
    )
