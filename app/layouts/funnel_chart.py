from dash import html, dcc
import plotly.graph_objects as go
import pandas as pd


def create_funnel_chart_layout():
    return html.Div(
        className="chart-card",
        children=[
            html.Div(
                className="chart-header",
                children=[
                    html.Div([
                        html.Div(className="chart-title", children="🔄 审核队列漏斗"),
                        html.Div(className="chart-subtitle", children="机器初筛到申诉全流程转化")
                    ]),
                    html.Div(className="chart-badge", children="转化率")
                ]
            ),
            dcc.Graph(
                id="funnel-chart",
                figure=create_empty_funnel_figure(),
                config={"displayModeBar": True, "responsive": True},
                style={"height": "380px"}
            )
        ]
    )


def create_empty_funnel_figure():
    fig = go.Figure()
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"color": "#94a3b8", "family": "Inter"},
        margin={"l": 20, "r": 20, "t": 20, "b": 20},
    )
    return fig


def render_funnel_chart(df: pd.DataFrame):
    if df.empty:
        return create_empty_funnel_figure()
    
    colors = [
        "rgba(59, 130, 246, 0.9)",
        "rgba(6, 182, 212, 0.85)",
        "rgba(168, 85, 247, 0.8)",
        "rgba(249, 115, 22, 0.75)",
        "rgba(236, 72, 153, 0.7)",
        "rgba(34, 197, 94, 0.65)",
    ]
    
    fig = go.Figure(go.Funnel(
        y=df["step_name"],
        x=df["count"],
        textposition="inside",
        textinfo="value+percent previous",
        opacity=0.9,
        marker={
            "color": colors[:len(df)],
            "line": {"width": 2, "color": "rgba(255,255,255,0.1)"}
        },
        connector={
            "line": {"color": "rgba(51, 65, 85, 0.8)", "dash": "solid", "width": 2},
            "fillcolor": "rgba(51, 65, 85, 0.3)"
        },
        textfont={"family": "Inter", "size": 13, "color": "white"},
        hovertemplate="<b>%{y}</b><br>数量: %{x:,}<br>转化率: %{percentPrevious:.1%}<extra></extra>"
    ))
    
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"color": "#94a3b8", "family": "Inter"},
        margin={"l": 20, "r": 20, "t": 10, "b": 20},
        funnelmode="stack",
        transition={"duration": 500, "easing": "cubic-in-out"},
    )
    
    return fig
