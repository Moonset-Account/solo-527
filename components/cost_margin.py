import plotly.graph_objects as go
from dash import dcc, html
import dash_bootstrap_components as dbc


def render_cost_margin(df):
    if df.empty:
        return html.Div("无数据", className="text-muted text-center py-5")

    df_sorted = df.sort_values("total_profit", ascending=True)

    fig = go.Figure()

    fig.add_trace(go.Bar(
        y=df_sorted["dish_name"],
        x=df_sorted["total_cost"],
        name="总成本",
        orientation="h",
        marker_color="#e67e22",
        opacity=0.7,
    ))

    fig.add_trace(go.Bar(
        y=df_sorted["dish_name"],
        x=df_sorted["total_profit"],
        name="总毛利",
        orientation="h",
        marker_color="#27ae60",
        opacity=0.7,
    ))

    fig.add_trace(go.Scatter(
        y=df_sorted["dish_name"],
        x=df_sorted["margin_rate"],
        name="毛利率(%)",
        mode="markers+lines",
        line=dict(color="#9b59b6", width=1.5),
        marker=dict(size=6, color="#9b59b6"),
        xaxis="x2",
    ))

    fig.update_layout(
        title="成本毛利分析",
        barmode="stack",
        height=max(400, len(df_sorted) * 24 + 80),
        margin=dict(l=140, r=60, t=50, b=40),
        hovermode="y unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        plot_bgcolor="#fafafa",
        xaxis=dict(title="金额(¥)", side="bottom"),
        xaxis2=dict(title="毛利率(%)", overlaying="x", side="top"),
    )

    avg_margin = df["margin_rate"].mean()
    best = df.iloc[0] if len(df) > 0 else None
    worst = df.iloc[-1] if len(df) > 0 else None

    insights = []
    insights.append(f"整体平均毛利率: {avg_margin:.1f}%")
    if best is not None:
        insights.append(f"最高毛利: {best['dish_name']}（{best['margin_rate']:.1f}%）")
    if worst is not None and len(df) > 1:
        insights.append(f"最低毛利: {worst['dish_name']}（{worst['margin_rate']:.1f}%）")

    insight_div = html.Div([
        html.Strong("毛利洞察: "),
        html.Span(" | ".join(insights)),
    ], className="mt-2", style={"fontSize": "0.9em"})

    return html.Div([
        dcc.Graph(figure=fig, config={"displayModeBar": True, "displaylogo": False}),
        insight_div,
    ])
