import plotly.graph_objects as go
from dash import dcc, html


def render_cancel_reasons(df):
    if df.empty:
        return html.Div("无退餐数据", className="text-muted text-center py-5")

    colors = ["#e74c3c", "#f39c12", "#e67e22", "#3498db", "#9b59b6", "#1abc9c", "#95a5a6"]

    fig = go.Figure()

    fig.add_trace(go.Pie(
        labels=df["cancel_reason"],
        values=df["count"],
        hole=0.45,
        marker=dict(colors=colors[:len(df)]),
        textinfo="label+percent",
        textposition="outside",
        hovertemplate="%{label}<br>数量: %{value}<br>占比: %{percent}<extra></extra>",
    ))

    fig.update_layout(
        title="退餐原因分布",
        height=400,
        showlegend=True,
        legend=dict(orientation="h", yanchor="bottom", y=-0.2, xanchor="center", x=0.5),
        plot_bgcolor="#fafafa",
    )

    total = df["count"].sum()
    top_reason = df.iloc[0]["cancel_reason"] if len(df) > 0 else "N/A"
    top_pct = f"{df.iloc[0]['count'] / total * 100:.1f}%" if total > 0 and len(df) > 0 else "N/A"

    insight = html.Div([
        html.Strong(f"首要退餐原因: {top_reason}"),
        html.Span(f"（占比 {top_pct}，共 {total} 笔退餐）", className="text-muted"),
    ], className="mt-2", style={"fontSize": "0.9em"})

    return html.Div([
        dcc.Graph(figure=fig, config={"displayModeBar": True, "displaylogo": False}),
        insight,
    ])
