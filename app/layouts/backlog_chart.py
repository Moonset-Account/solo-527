from dash import html, dcc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from datetime import datetime


def create_backlog_chart_layout():
    return html.Div(
        className="chart-card",
        children=[
            html.Div(
                className="chart-header",
                children=[
                    html.Div([
                        html.Div(className="chart-title", children="📈 队列积压趋势"),
                        html.Div(className="chart-subtitle", children="按时序展示各队列积压量与SLA违规量")
                    ]),
                    html.Div(className="chart-badge", children="实时更新")
                ]
            ),
            dcc.Graph(
                id="backlog-chart",
                figure=create_empty_backlog_figure(),
                config={"displayModeBar": True, "responsive": True},
                style={"height": "380px"}
            )
        ]
    )


def create_empty_backlog_figure():
    fig = go.Figure()
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"color": "#94a3b8", "family": "Inter"},
        margin={"l": 60, "r": 20, "t": 20, "b": 40},
        xaxis={
            "gridcolor": "rgba(51, 65, 85, 0.5)",
            "zerolinecolor": "rgba(51, 65, 85, 0.5)",
        },
        yaxis={
            "gridcolor": "rgba(51, 65, 85, 0.5)",
            "zerolinecolor": "rgba(51, 65, 85, 0.5)",
            "title": "积压数量（条）"
        },
        legend={"bgcolor": "rgba(0,0,0,0)", "orientation": "h", "y": 1.1},
        hovermode="x unified",
        transition={"duration": 500},
    )
    return fig


def render_backlog_chart(df: pd.DataFrame):
    if df.empty:
        return create_empty_backlog_figure()
    
    colors = ["#3b82f6", "#06b6d4", "#a855f7", "#ec4899", "#f97316"]
    queues = df["queue_name"].unique()
    
    fig = go.Figure()
    
    for i, queue in enumerate(queues):
        queue_data = df[df["queue_name"] == queue].sort_values("timestamp")
        color = colors[i % len(colors)]
        
        fig.add_trace(go.Scatter(
            x=queue_data["timestamp"],
            y=queue_data["backlog_count"],
            mode="lines",
            name=queue,
            line={"color": color, "width": 2.5, "shape": "spline"},
            fill="tozeroy",
            fillcolor=f"rgba{tuple(int(color.lstrip('#')[j:j+2], 16) for j in (0, 2, 4)) + (0.1,)}",
            hovertemplate=f"<b>{queue}</b><br>时间: %{{x}}<br>积压: %{{y}} 条<extra></extra>"
        ))
    
    sla_data = df.groupby("timestamp")["sla_breach_count"].sum().reset_index()
    fig.add_trace(go.Scatter(
        x=sla_data["timestamp"],
        y=sla_data["sla_breach_count"],
        mode="lines+markers",
        name="SLA违规",
        line={"color": "#ef4444", "width": 2, "dash": "dot"},
        marker={"size": 4, "color": "#ef4444"},
        yaxis="y2",
        hovertemplate="<b>SLA违规</b><br>时间: %{x}<br>数量: %{y}<extra></extra>"
    ))
    
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"color": "#94a3b8", "family": "Inter"},
        margin={"l": 60, "r": 60, "t": 10, "b": 40},
        xaxis={
            "gridcolor": "rgba(51, 65, 85, 0.5)",
            "zerolinecolor": "rgba(51, 65, 85, 0.5)",
        },
        yaxis={
            "gridcolor": "rgba(51, 65, 85, 0.5)",
            "zerolinecolor": "rgba(51, 65, 85, 0.5)",
            "title": "积压数量（条）",
            "title_font": {"size": 12},
        },
        yaxis2={
            "gridcolor": "rgba(51, 65, 85, 0.3)",
            "zeroline": False,
            "title": "SLA违规",
            "title_font": {"size": 12, "color": "#ef4444"},
            "tickfont": {"color": "#ef4444"},
            "overlaying": "y",
            "side": "right",
        },
        legend={"bgcolor": "rgba(0,0,0,0)", "orientation": "h", "y": 1.15, "x": 0},
        hovermode="x unified",
        transition={"duration": 500, "easing": "cubic-in-out"},
    )
    
    return fig
