import plotly.graph_objects as go
from dash import dcc, html


def render_sales_trend(df, weather_df=None):
    if df.empty:
        return html.Div("无数据", className="text-muted text-center py-5")

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=df["date"],
        y=df["order_count"],
        name="日订单量",
        mode="lines",
        line=dict(color="#3498db", width=1.5),
        fill="tozeroy",
        fillcolor="rgba(52,152,219,0.1)",
    ))

    if "revenue" in df.columns:
        fig.add_trace(go.Scatter(
            x=df["date"],
            y=df["revenue"],
            name="日营收(¥)",
            mode="lines",
            line=dict(color="#27ae60", width=1.5, dash="dot"),
            yaxis="y2",
        ))

    if len(df) >= 7:
        df_copy = df.copy()
        df_copy["ma7"] = df_copy["order_count"].rolling(7, min_periods=1).mean()
        fig.add_trace(go.Scatter(
            x=df_copy["date"],
            y=df_copy["ma7"],
            name="7日均线",
            mode="lines",
            line=dict(color="#e74c3c", width=2, dash="dash"),
        ))

    layout_kwargs = dict(
        title="销量趋势",
        xaxis_title="日期",
        hovermode="x unified",
        height=400,
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        plot_bgcolor="#fafafa",
        yaxis=dict(title="订单量"),
    )

    if "revenue" in df.columns:
        layout_kwargs["yaxis2"] = dict(title="营收(¥)", overlaying="y", side="right")

    fig.update_layout(**layout_kwargs)

    return dcc.Graph(figure=fig, config={"displayModeBar": True, "displaylogo": False})
