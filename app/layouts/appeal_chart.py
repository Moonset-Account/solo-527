from dash import html, dcc
import plotly.graph_objects as go
import pandas as pd


def create_appeal_chart_layout():
    return html.Div(
        className="chart-card",
        children=[
            html.Div(
                className="chart-header",
                children=[
                    html.Div([
                        html.Div(className="chart-title", children="⚖️ 申诉逆转率分析"),
                        html.Div(className="chart-subtitle", children="按原风险标签统计申诉成功率（关键！非最终状态）")
                    ]),
                    html.Div(className="chart-badge", children="原始标签维度")
                ]
            ),
            dcc.Graph(
                id="appeal-chart",
                figure=create_empty_appeal_figure(),
                config={"displayModeBar": True, "responsive": True},
                style={"height": "380px"}
            )
        ]
    )


def create_empty_appeal_figure():
    fig = go.Figure()
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"color": "#94a3b8", "family": "Inter"},
        margin={"l": 60, "r": 20, "t": 20, "b": 60},
    )
    return fig


def render_appeal_chart(df: pd.DataFrame):
    if df.empty:
        return create_empty_appeal_figure()
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        name="申诉成功",
        x=df["original_risk_tag"],
        y=df["appeal_success"],
        marker_color="rgba(34, 197, 94, 0.85)",
        marker_line={"color": "rgba(34, 197, 94, 1)", "width": 1},
        hovertemplate="<b>%{x}</b><br>申诉成功: %{y}<extra></extra>",
        text=df["appeal_success"],
        textposition="auto",
        textfont={"color": "white", "size": 11},
    ))
    
    fig.add_trace(go.Bar(
        name="申诉失败",
        x=df["original_risk_tag"],
        y=df["appeal_failed"],
        marker_color="rgba(239, 68, 68, 0.75)",
        marker_line={"color": "rgba(239, 68, 68, 1)", "width": 1},
        hovertemplate="<b>%{x}</b><br>申诉失败: %{y}<extra></extra>",
        text=df["appeal_failed"],
        textposition="auto",
        textfont={"color": "white", "size": 11},
    ))
    
    fig.add_trace(go.Scatter(
        name="逆转率",
        x=df["original_risk_tag"],
        y=df["reversal_rate"],
        mode="lines+markers",
        yaxis="y2",
        line={"color": "#f97316", "width": 3},
        marker={"size": 8, "color": "#f97316", "line": {"color": "white", "width": 1}},
        hovertemplate="<b>%{x}</b><br>逆转率: %{y:.1f}%<extra></extra>",
    ))
    
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"color": "#94a3b8", "family": "Inter"},
        margin={"l": 60, "r": 60, "t": 10, "b": 60},
        xaxis={
            "gridcolor": "rgba(51, 65, 85, 0.3)",
            "zeroline": False,
            "tickangle": -30,
        },
        yaxis={
            "gridcolor": "rgba(51, 65, 85, 0.3)",
            "zeroline": False,
            "title": "申诉数量（条）",
            "title_font": {"size": 12},
        },
        yaxis2={
            "gridcolor": "rgba(51, 65, 85, 0.2)",
            "zeroline": False,
            "title": "逆转率 (%)",
            "title_font": {"size": 12, "color": "#f97316"},
            "tickfont": {"color": "#f97316"},
            "overlaying": "y",
            "side": "right",
            "range": [0, 100],
        },
        barmode="stack",
        legend={"bgcolor": "rgba(0,0,0,0)", "orientation": "h", "y": 1.15, "x": 0},
        transition={"duration": 500, "easing": "cubic-in-out"},
    )
    
    return fig
