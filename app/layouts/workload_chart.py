from dash import html, dcc
import plotly.graph_objects as go
import plotly.figure_factory as ff
import pandas as pd
import numpy as np


def create_workload_chart_layout():
    return html.Div(
        className="chart-card",
        children=[
            html.Div(
                className="chart-header",
                children=[
                    html.Div([
                        html.Div(className="chart-title", children="👥 审核员负载矩阵"),
                        html.Div(className="chart-subtitle", children="按班次展示审核员处理量与积压")
                    ]),
                    html.Div(className="chart-badge", children="热力图")
                ]
            ),
            dcc.Graph(
                id="workload-chart",
                figure=create_empty_workload_figure(),
                config={"displayModeBar": True, "responsive": True},
                style={"height": "380px"}
            )
        ]
    )


def create_empty_workload_figure():
    fig = go.Figure()
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"color": "#94a3b8", "family": "Inter"},
        margin={"l": 80, "r": 20, "t": 20, "b": 60},
    )
    return fig


def render_workload_chart(df: pd.DataFrame):
    if df.empty:
        return create_empty_workload_figure()
    
    pivot = df.pivot_table(
        index="reviewer_name",
        columns="shift",
        values="processed_count",
        fill_value=0
    )
    
    shifts_order = [s for s in ["早班", "午班", "夜班"] if s in pivot.columns]
    pivot = pivot[shifts_order]
    
    z = pivot.values
    x = list(pivot.columns)
    y = list(pivot.index)
    
    customdata = np.dstack((
        pivot.values,
        df.pivot_table(index="reviewer_name", columns="shift", values="avg_review_seconds", fill_value=0).reindex(index=y, columns=x).values,
        df.pivot_table(index="reviewer_name", columns="shift", values="current_backlog", fill_value=0).reindex(index=y, columns=x).values,
    ))
    
    fig = go.Figure(data=go.Heatmap(
        z=z,
        x=x,
        y=y,
        colorscale=[
            [0, "rgba(34, 197, 94, 0.3)"],
            [0.5, "rgba(249, 115, 22, 0.6)"],
            [1, "rgba(239, 68, 68, 0.9)"],
        ],
        showscale=True,
        colorbar={
            "title": "处理量",
            "titleside": "right",
            "tickfont": {"color": "#94a3b8"},
            "bgcolor": "rgba(0,0,0,0)",
        },
        customdata=customdata,
        hovertemplate=(
            "<b>%{y}</b><br>"
            "班次: %{x}<br>"
            "处理量: %{customdata[0]} 条<br>"
            "平均时长: %{customdata[1]:.1f} 秒<br>"
            "当前积压: %{customdata[2]} 条<extra></extra>"
        ),
        xgap=3,
        ygap=3,
    ))
    
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"color": "#94a3b8", "family": "Inter", "size": 12},
        margin={"l": 100, "r": 60, "t": 10, "b": 40},
        xaxis={
            "side": "top",
            "gridcolor": "rgba(51, 65, 85, 0.3)",
            "zeroline": False,
        },
        yaxis={
            "gridcolor": "rgba(51, 65, 85, 0.3)",
            "zeroline": False,
            "autorange": "reversed",
        },
        transition={"duration": 500, "easing": "cubic-in-out"},
    )
    
    return fig
