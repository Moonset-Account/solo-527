import plotly.graph_objects as go
from dash import dcc, html
import dash_bootstrap_components as dbc


def render_satisfaction_matrix(df):
    if df.empty:
        return html.Div("无数据", className="text-muted text-center py-5")

    df_sorted = df.sort_values("bayesian", ascending=True)

    colors = []
    hover_texts = []
    for _, row in df_sorted.iterrows():
        score = row["bayesian"]
        if score >= 3.5:
            colors.append("#27ae60")
        elif score >= 2.5:
            colors.append("#f39c12")
        else:
            colors.append("#e74c3c")

        sample_note = "" if row["sample_sufficient"] else " (样本不足)"
        hover_texts.append(
            f"{row['name']}<br>"
            f"窗口: {row['window_name']}<br>"
            f"菜系: {row['cuisine_type']}<br>"
            f"贝叶斯得分: {score:.2f}{sample_note}<br>"
            f"原始均分: {row['avg_score']:.2f}<br>"
            f"评价数: {int(row['rating_count'])}<br>"
            f"订单数: {int(row['order_count'])}<br>"
            f"退餐数: {int(row['cancel_count'])}"
        )

    fig = go.Figure(go.Bar(
        x=df_sorted["bayesian"],
        y=df_sorted["name"],
        orientation="h",
        marker_color=colors,
        text=df_sorted.apply(
            lambda r: f"{r['bayesian']:.2f}{'⚠' if not r['sample_sufficient'] else ''}", axis=1
        ),
        textposition="outside",
        hovertext=hover_texts,
        hoverinfo="text",
    ))

    fig.update_layout(
        title="菜品满意度矩阵（贝叶斯平滑）",
        xaxis_title="贝叶斯得分",
        xaxis=dict(range=[0, 5.5]),
        height=max(400, len(df_sorted) * 28 + 80),
        margin=dict(l=160, r=40, t=50, b=40),
        showlegend=False,
        plot_bgcolor="#fafafa",
    )

    fig.add_vline(x=2.5, line_dash="dash", line_color="#e74c3c", annotation_text="低分线")
    fig.add_vline(x=3.5, line_dash="dash", line_color="#27ae60", annotation_text="优良线")

    low_score_df = df[(df["sample_sufficient"]) & (df["bayesian"] < 2.5)]
    low_score_items = []
    if not low_score_df.empty:
        for _, row in low_score_df.iterrows():
            low_score_items.append(html.Li(f"{row['name']}（{row['window_name']}）- 得分 {row['bayesian']:.2f}，评价 {int(row['rating_count'])} 条"))

        low_score_section = dbc.Card([
            dbc.CardHeader(html.Strong("低分菜品榜（样本充足，评价≥10）"), className="bg-danger text-white"),
            dbc.CardBody(html.Ul(low_score_items, style={"fontSize": "0.85em"})),
        ], className="mt-3")
    else:
        low_score_section = html.Div("暂无样本充足的低分菜品", className="text-muted mt-2")

    insufficient = df[~df["sample_sufficient"]]
    insufficient_section = html.Div()
    if not insufficient.empty and len(insufficient) <= 10:
        names = ", ".join(insufficient["name"].tolist())
        insufficient_section = html.Div(
            f"以下菜品评价数不足10条，不纳入低分榜：{names}",
            className="text-muted mt-2",
            style={"fontSize": "0.8em"},
        )

    return html.Div([
        dcc.Graph(figure=fig, config={"displayModeBar": True, "displaylogo": False}),
        low_score_section,
        insufficient_section,
    ])
