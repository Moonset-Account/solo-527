import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from config import TRANSITION_WINDOW_DAYS


COLORS = {
    "更新前": "#4C78A8",
    "过渡期": "#E45756",
    "更新后": "#54A24B",
    "transition_bg": "rgba(228, 87, 86, 0.08)",
    "update_line": "#E45756",
    "heatmap": "YlOrRd",
}

PERIOD_STYLES = {
    "更新前": {"dash": "solid", "width": 2},
    "过渡期": {"dash": "dash", "width": 2},
    "更新后": {"dash": "solid", "width": 2},
}


def _add_update_annotation(fig, update_date, row=None, col=None):
    if update_date is None:
        return fig

    update_str = str(pd.Timestamp(update_date))[:10]
    transition_end_str = str(pd.Timestamp(update_date) + pd.Timedelta(days=TRANSITION_WINDOW_DAYS))[:10]

    xref = "x"
    if row is not None and col is not None:
        n_xaxes = len([k for k in fig.layout if k.startswith("xaxis")])
        if n_xaxes == 0:
            n_cols = 1
        else:
            xaxis_keys = [k for k in fig.layout if k.startswith("xaxis")]
            max_idx = 0
            for k in xaxis_keys:
                k_clean = k.replace("xaxis", "")
                if k_clean == "":
                    max_idx = max(max_idx, 1)
                elif k_clean.isdigit():
                    max_idx = max(max_idx, int(k_clean))
            n_cols = max_idx
        idx = (row - 1) * n_cols + col
        xref = f"x{idx}" if idx > 1 else "x"

    fig.add_shape(
        type="rect",
        x0=update_str, x1=transition_end_str,
        y0=0, y1=1,
        xref=xref, yref="paper",
        fillcolor=COLORS["transition_bg"],
        layer="below", line_width=0,
    )

    fig.add_shape(
        type="line",
        x0=update_str, x1=update_str,
        y0=0, y1=1,
        xref=xref, yref="paper",
        line=dict(dash="dash", color=COLORS["update_line"], width=2),
    )

    fig.add_annotation(
        x=update_str, y=1.0,
        xref=xref, yref="paper",
        text="📅 更新日",
        showarrow=False,
        font=dict(color=COLORS["update_line"], size=11),
        xanchor="left",
    )

    return fig


def build_viewing_chart(viewing_df, update_date):
    if viewing_df.empty:
        return go.Figure().update_layout(title="观看数据对比（无数据）")

    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.08,
        subplot_titles=("日均观看时长（秒）", "平均完播率"),
    )

    for period in ["更新前", "过渡期", "更新后"]:
        subset = viewing_df[viewing_df["period"] == period]
        if subset.empty:
            continue
        style = PERIOD_STYLES[period]
        fig.add_trace(go.Scatter(
            x=subset["date"], y=subset["avg_duration"],
            mode="lines+markers", name=f"{period}-时长",
            line=dict(color=COLORS[period], dash=style["dash"], width=style["width"]),
            marker=dict(size=4),
            legendgroup=period,
        ), row=1, col=1)
        fig.add_trace(go.Scatter(
            x=subset["date"], y=subset["avg_completion"],
            mode="lines+markers", name=f"{period}-完播率",
            line=dict(color=COLORS[period], dash=style["dash"], width=style["width"]),
            marker=dict(size=4),
            legendgroup=period,
            showlegend=False,
        ), row=2, col=1)

    _add_update_annotation(fig, update_date, row=1, col=1)
    _add_update_annotation(fig, update_date, row=2, col=1)

    fig.update_layout(
        height=500,
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(t=80, b=40),
    )
    fig.update_yaxes(title_text="时长(秒)", row=1, col=1)
    fig.update_yaxes(title_text="完播率", row=2, col=1, tickformat=".0%")
    return fig


def build_quiz_chart(quiz_df, update_date):
    if quiz_df.empty:
        return go.Figure().update_layout(title="测验数据对比（无数据）")

    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.08,
        subplot_titles=("日均平均分", "日均答题人数"),
    )

    for period in ["更新前", "过渡期", "更新后"]:
        subset = quiz_df[quiz_df["period"] == period]
        if subset.empty:
            continue
        style = PERIOD_STYLES[period]
        fig.add_trace(go.Scatter(
            x=subset["date"], y=subset["avg_score"],
            mode="lines+markers", name=f"{period}-平均分",
            line=dict(color=COLORS[period], dash=style["dash"], width=style["width"]),
            marker=dict(size=4),
            legendgroup=period,
        ), row=1, col=1)
        fig.add_trace(go.Bar(
            x=subset["date"], y=subset["unique_users"],
            name=f"{period}-答题人数",
            marker_color=COLORS[period],
            legendgroup=period,
            showlegend=False,
        ), row=2, col=1)

    _add_update_annotation(fig, update_date, row=1, col=1)
    _add_update_annotation(fig, update_date, row=2, col=1)

    fig.update_layout(
        height=500,
        hovermode="x unified",
        barmode="group",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(t=80, b=40),
    )
    fig.update_yaxes(title_text="分数", row=1, col=1, tickformat=".0%")
    fig.update_yaxes(title_text="人数", row=2, col=1)
    return fig


def build_error_heatmap(error_df):
    if error_df.empty:
        return go.Figure().update_layout(title="错题热力图（无数据）")

    pivot = error_df.pivot_table(
        index="section_name", columns="question_id", values="error_count",
        fill_value=0, aggfunc="sum"
    )

    fig = go.Figure(go.Heatmap(
        z=pivot.values,
        x=[f"题目{c}" for c in pivot.columns],
        y=pivot.index,
        colorscale=COLORS["heatmap"],
        text=pivot.values,
        texttemplate="%{text}",
        hovertemplate="小节: %{y}<br>题目: %{x}<br>错误次数: %{z}<extra></extra>",
    ))

    fig.update_layout(
        title="错题热力图（小节 × 题目）",
        height=max(300, len(pivot.index) * 45 + 100),
        xaxis_title="题目",
        yaxis_title="小节",
    )
    return fig


def build_discussion_chart(discussion_df, update_date):
    if discussion_df.empty:
        return go.Figure().update_layout(title="讨论主题聚合（无数据）")

    topic_totals = discussion_df.groupby("tag")["count"].sum().sort_values(ascending=False)

    fig = make_subplots(
        rows=1, cols=2,
        column_widths=[0.4, 0.6],
        subplot_titles=("主题分布", "主题趋势"),
    )

    fig.add_trace(go.Bar(
        x=topic_totals.values,
        y=topic_totals.index,
        orientation="h",
        marker_color="#4C78A8",
        text=topic_totals.values,
        textposition="auto",
    ), row=1, col=1)

    for period in ["更新前", "过渡期", "更新后"]:
        subset = discussion_df[discussion_df["period"] == period]
        if subset.empty:
            continue
        style = PERIOD_STYLES[period]
        fig.add_trace(go.Scatter(
            x=subset["date"], y=subset["count"],
            mode="lines", name=period,
            line=dict(color=COLORS[period], dash=style["dash"], width=style["width"]),
            legendgroup=period,
        ), row=1, col=2)

    if update_date is not None:
        update_str = str(pd.Timestamp(update_date))[:10]
        fig.add_shape(
            type="line",
            x0=update_str, x1=update_str,
            y0=0, y1=1,
            xref="x2", yref="paper",
            line=dict(dash="dash", color=COLORS["update_line"], width=2),
        )
        fig.add_annotation(
            x=update_str, y=1.0,
            xref="x2", yref="paper",
            text="📅 更新日",
            showarrow=False,
            font=dict(color=COLORS["update_line"], size=11),
            xanchor="left",
        )

    fig.update_layout(
        height=400,
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.05, xanchor="right", x=1),
        margin=dict(t=80, b=40),
    )
    return fig


def build_refund_chart(refund_df, update_date):
    if refund_df.empty:
        return go.Figure().update_layout(title="退款趋势对比（无数据）")

    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.08,
        subplot_titles=("退款数量趋势", "按周期汇总"),
    )

    for period in ["更新前", "过渡期", "更新后"]:
        subset = refund_df[refund_df["period"] == period] if "period" in refund_df.columns else pd.DataFrame()
        if subset.empty:
            continue
        style = PERIOD_STYLES[period]
        fig.add_trace(go.Scatter(
            x=subset["date"], y=subset["refund_count"],
            mode="lines+markers", name=period,
            line=dict(color=COLORS[period], dash=style["dash"], width=style["width"]),
            marker=dict(size=4),
            fill="tozeroy" if period == "更新后" else None,
            fillcolor="rgba(84, 162, 75, 0.1)" if period == "更新后" else None,
        ), row=1, col=1)

    if "period" in refund_df.columns:
        summary = refund_df.groupby("period").agg(
            total=("refund_count", "sum"),
            avg_daily=("refund_count", "mean"),
        ).reset_index()
        period_order = ["更新前", "过渡期", "更新后"]
        summary["sort_key"] = summary["period"].map({p: i for i, p in enumerate(period_order)})
        summary = summary.sort_values("sort_key")

        fig.add_trace(go.Bar(
            x=summary["period"],
            y=summary["avg_daily"],
            marker_color=[COLORS.get(p, "#999") for p in summary["period"]],
            text=[f"{v:.1f}/天" for v in summary["avg_daily"]],
            textposition="auto",
        ), row=2, col=1)

    _add_update_annotation(fig, update_date, row=1, col=1)

    fig.update_layout(
        height=500,
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(t=80, b=40),
    )
    return fig


def build_learning_path_chart(path_agg_df, flow_df):
    if path_agg_df.empty:
        return go.Figure().update_layout(title="学习路径变化（无数据）")

    fig = make_subplots(
        rows=2, cols=1,
        vertical_spacing=0.12,
        subplot_titles=("事件类型趋势", "学习流转 Top20"),
        specs=[[{"type": "xy"}], [{"type": "domain"}]],
    )

    for event_type in path_agg_df["event_type"].unique():
        subset = path_agg_df[path_agg_df["event_type"] == event_type]
        for period in ["更新前", "过渡期", "更新后"]:
            p_subset = subset[subset["period"] == period]
            if p_subset.empty:
                continue
            style = PERIOD_STYLES[period]
            fig.add_trace(go.Scatter(
                x=p_subset["date"], y=p_subset["count"],
                mode="lines", name=f"{event_type}-{period}",
                line=dict(color=COLORS[period], dash=style["dash"], width=style["width"]),
                legendgroup=period,
            ), row=1, col=1)

    if not flow_df.empty:
        labels = list(set(flow_df["from_name"].tolist() + flow_df["to_name"].tolist()))
        label_map = {name: i for i, name in enumerate(labels)}
        fig.add_trace(go.Sankey(
            node=dict(
                pad=15, thickness=20,
                line=dict(color="black", width=0.5),
                label=labels,
                color="#4C78A8",
            ),
            link=dict(
                source=[label_map[r["from_name"]] for _, r in flow_df.iterrows()],
                target=[label_map[r["to_name"]] for _, r in flow_df.iterrows()],
                value=flow_df["count"].tolist(),
            ),
        ), row=2, col=1)

    fig.update_layout(
        height=800,
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(t=80, b=40),
    )
    return fig


def build_version_table(versions_df):
    if versions_df.empty:
        return go.Figure().update_layout(title="章节版本表（无数据）")

    headers = ["版本号", "更新日期", "变更描述", "当前版本"]
    rows = []
    for _, row in versions_df.iterrows():
        rows.append([
            f"V{row['version_number']}",
            str(row["updated_at"])[:10],
            row["change_description"] or "",
            "✅" if row.get("is_current") else "",
        ])

    fig = go.Figure(go.Table(
        header=dict(
            values=headers,
            fill_color="#4C78A8",
            font=dict(color="white", size=13),
            align="left",
            height=35,
        ),
        cells=dict(
            values=list(zip(*rows)) if rows else [[] for _ in headers],
            fill_color=[["#f8f9fa", "white"][i % 2] for i in range(len(rows))],
            align="left",
            height=30,
            font=dict(size=12),
        ),
    ))

    fig.update_layout(
        height=max(120, len(rows) * 40 + 80),
        margin=dict(t=20, b=10),
    )
    return fig


def build_mapping_table(mapping_df, unmapped_records):
    if mapping_df.empty and not unmapped_records:
        return go.Figure().update_layout(title="章节映射（无需映射）")

    headers = ["旧小节", "新小节", "映射类型"]
    rows = []
    for _, row in mapping_df.iterrows():
        rows.append([
            row.get("旧小节名称", row.get("old_section_name", "")),
            row.get("新小节名称", row.get("new_section_name", "")),
            row.get("映射类型", row.get("mapping_type", "")),
        ])

    for rec in unmapped_records:
        rows.append([
            rec.get("section_name", "") if rec.get("version") == "old" else "—",
            rec.get("section_name", "") if rec.get("version") == "new" else "—",
            f"⚠️ {rec.get('reason', '无法映射')}",
        ])

    fig = go.Figure(go.Table(
        header=dict(
            values=headers,
            fill_color="#E45756" if unmapped_records else "#4C78A8",
            font=dict(color="white", size=13),
            align="left",
            height=35,
        ),
        cells=dict(
            values=list(zip(*rows)) if rows else [[] for _ in headers],
            fill_color=[["#fff3cd", "#fff3cd"][i % 2] if unmapped_records
                        else ["#f8f9fa", "white"][i % 2]
                        for i in range(len(rows))],
            align="left",
            height=30,
            font=dict(size=12),
        ),
    ))

    title_suffix = f"（⚠️ {len(unmapped_records)} 项无法映射）" if unmapped_records else ""
    fig.update_layout(
        title=f"章节结构映射{title_suffix}",
        height=max(120, len(rows) * 40 + 80),
        margin=dict(t=50, b=10),
    )
    return fig
