import plotly.graph_objects as go
from dash import dcc, html


def render_weather_correlation(df):
    if df.empty:
        return html.Div("无天气关联数据", className="text-muted text-center py-5")

    fig = go.Figure()

    fig.add_trace(go.Bar(
        x=df["weather_type"],
        y=df["avg_daily_orders"],
        name="平均日订单量",
        marker_color="#3498db",
    ))

    fig.update_layout(
        title="天气与销量关联",
        xaxis_title="天气类型",
        yaxis_title="平均日订单量",
        height=350,
        showlegend=True,
        plot_bgcolor="#fafafa",
    )

    if "avg_revenue" in df.columns:
        fig.add_trace(go.Scatter(
            x=df["weather_type"],
            y=df["avg_revenue"],
            name="平均单价",
            mode="markers+lines",
            line=dict(color="#e74c3c", width=2),
            marker=dict(size=8),
            yaxis="y2",
        ))
        fig.update_layout(yaxis2=dict(title="平均单价(¥)", overlaying="y", side="right"))

    overall_avg = df["avg_daily_orders"].mean()
    high_weather = df[df["avg_daily_orders"] > overall_avg * 1.1]
    low_weather = df[df["avg_daily_orders"] < overall_avg * 0.9]

    notes = []
    if not high_weather.empty:
        names = ", ".join(high_weather["weather_type"].tolist())
        notes.append(f"高于均值10%+: {names}")
    if not low_weather.empty:
        names = ", ".join(low_weather["weather_type"].tolist())
        notes.append(f"低于均值10%+: {names}")

    insight = html.Div()
    if notes:
        insight = html.Div([
            html.Strong("天气洞察: "),
            html.Span(" | ".join(notes)),
        ], className="mt-2", style={"fontSize": "0.9em"})

    return html.Div([
        dcc.Graph(figure=fig, config={"displayModeBar": True, "displaylogo": False}),
        insight,
    ])
