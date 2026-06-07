from dash import dcc, html
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from utils.helpers import COLORS, format_duration


def create_empty_figure(message="暂无数据"):
    fig = go.Figure()
    fig.add_annotation(
        text=message,
        x=0.5,
        y=0.5,
        showarrow=False,
        font=dict(size=16, color="#999"),
        xref="paper",
        yref="paper",
    )
    fig.update_layout(
        plot_bgcolor="white",
        paper_bgcolor="white",
        xaxis=dict(showgrid=False, showticklabels=False, zeroline=False),
        yaxis=dict(showgrid=False, showticklabels=False, zeroline=False),
        margin=dict(l=20, r=20, t=20, b=20),
    )
    return fig


def create_trend_chart(trend_df: pd.DataFrame):
    if trend_df is None or len(trend_df) == 0:
        return create_empty_figure()
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=trend_df["date"],
        y=trend_df.get("unplanned", [0] * len(trend_df)),
        name="突发停机",
        fill="tozeroy",
        line=dict(color=COLORS["unplanned"], width=2),
        fillcolor=f"rgba(255, 107, 53, 0.3)",
    ))
    
    fig.add_trace(go.Scatter(
        x=trend_df["date"],
        y=trend_df.get("planned", [0] * len(trend_df)),
        name="计划检修",
        fill="tonexty",
        line=dict(color=COLORS["planned"], width=2),
        fillcolor=f"rgba(46, 204, 113, 0.3)",
    ))
    
    fig.update_layout(
        title=dict(text="停机时长趋势", font=dict(size=14, color=COLORS["text"])),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        xaxis=dict(title="日期", gridcolor="#f0f0f0"),
        yaxis=dict(title="停机时长(分钟)", gridcolor="#f0f0f0"),
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=50, r=20, t=60, b=40),
        hovermode="x unified",
    )
    
    return fig


def create_pareto_chart(pareto_data: dict):
    if not pareto_data.get("items"):
        return create_empty_figure()
    
    items = pareto_data["items"]
    names = [item["fault_name"] for item in items]
    durations = [item["duration"] for item in items]
    cumulative = [item["cumulative_percentage"] for item in items]
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=names,
        y=durations,
        name="停机时长",
        marker_color=[COLORS["unplanned"] if i < len(pareto_data["top_items"]) 
                      else COLORS["primary"] for i in range(len(names))],
        opacity=0.8,
    ))
    
    fig.add_trace(go.Scatter(
        x=names,
        y=cumulative,
        name="累积占比",
        yaxis="y2",
        mode="lines+markers",
        line=dict(color=COLORS["warning"], width=3),
        marker=dict(size=6),
    ))
    
    fig.add_hline(
        y=80,
        line_dash="dash",
        line_color="#888",
        annotation_text="80%参考线",
        annotation_position="right",
        yref="y2",
    )
    
    fig.update_layout(
        title=dict(text="停机原因Pareto分析（按时长排序）", font=dict(size=14, color=COLORS["text"])),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        xaxis=dict(title="故障类型", tickangle=-30),
        yaxis=dict(title="停机时长(分钟)", gridcolor="#f0f0f0"),
        yaxis2=dict(
            title="累积占比(%)",
            overlaying="y",
            side="right",
            range=[0, 105],
            showgrid=False,
        ),
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=50, r=50, t=60, b=80),
        hovermode="x unified",
    )
    
    return fig


def create_line_comparison_chart(line_data: dict):
    if not line_data.get("lines"):
        return create_empty_figure()
    
    lines = line_data["lines"]
    names = [l["line_name"] for l in lines]
    unplanned = [l["unplanned_duration"] for l in lines]
    planned = [l["planned_duration"] for l in lines]
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=names,
        y=unplanned,
        name="突发停机",
        marker_color=COLORS["unplanned"],
    ))
    
    fig.add_trace(go.Bar(
        x=names,
        y=planned,
        name="计划检修",
        marker_color=COLORS["planned"],
    ))
    
    fig.update_layout(
        title=dict(text="各产线停机时长对比", font=dict(size=14, color=COLORS["text"])),
        barmode="stack",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        xaxis=dict(title="产线"),
        yaxis=dict(title="停机时长(分钟)", gridcolor="#f0f0f0"),
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=50, r=20, t=60, b=40),
    )
    
    return fig


def create_heatmap_chart(heatmap_data: list):
    if not heatmap_data:
        return create_empty_figure()
    
    df = pd.DataFrame(heatmap_data)
    
    pivot = df.pivot_table(
        index="line_name",
        columns="shift_name",
        values="value",
        fill_value=0,
    )
    
    shift_order = ["早班", "中班", "晚班"]
    existing_shifts = [s for s in shift_order if s in pivot.columns]
    pivot = pivot[existing_shifts] if existing_shifts else pivot
    
    fig = px.imshow(
        pivot,
        color_continuous_scale="Oranges",
        labels=dict(x="班次", y="产线", color="停机时长(分钟)"),
        aspect="auto",
    )
    
    fig.update_layout(
        title=dict(text="产线×班次停机时长分布", font=dict(size=14, color=COLORS["text"])),
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=50, r=20, t=60, b=40),
    )
    
    fig.update_traces(
        hovertemplate="产线: %{y}<br>班次: %{x}<br>停机时长: %{z}分钟<extra></extra>"
    )
    
    return fig


def create_maintenance_distribution(efficiency_data: dict):
    if not efficiency_data.get("duration_distribution"):
        return create_empty_figure()
    
    dist = efficiency_data["duration_distribution"]
    buckets = [d["bucket"] for d in dist]
    counts = [d["count"] for d in dist]
    
    fig = go.Figure()
    
    colors = [COLORS["success"] if i < 2 else (COLORS["warning"] if i < 4 else COLORS["danger"]) 
              for i in range(len(buckets))]
    
    fig.add_trace(go.Bar(
        x=buckets,
        y=counts,
        marker_color=colors,
        opacity=0.8,
    ))
    
    fig.update_layout(
        title=dict(text="维修时长分布", font=dict(size=14, color=COLORS["text"])),
        xaxis=dict(title="维修时长区间"),
        yaxis=dict(title="工单数量", gridcolor="#f0f0f0"),
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=50, r=20, t=60, b=40),
    )
    
    return fig


def create_repair_person_chart(efficiency_data: dict):
    if not efficiency_data.get("by_person"):
        return create_empty_figure()
    
    persons = efficiency_data["by_person"]
    names = [p["person_name"] for p in persons]
    mttrs = [p["mttr"] for p in persons]
    counts = [p["completed_count"] for p in persons]
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=names,
        y=mttrs,
        name="平均修复时间(分钟)",
        marker_color=COLORS["primary"],
        opacity=0.7,
    ))
    
    fig.add_trace(go.Scatter(
        x=names,
        y=counts,
        name="完成工单数量",
        yaxis="y2",
        mode="lines+markers",
        line=dict(color=COLORS["unplanned"], width=2),
        marker=dict(size=8),
    ))
    
    fig.update_layout(
        title=dict(text="维修人员效率对比", font=dict(size=14, color=COLORS["text"])),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        xaxis=dict(title="维修人员"),
        yaxis=dict(title="MTTR(分钟)", gridcolor="#f0f0f0"),
        yaxis2=dict(
            title="工单数量",
            overlaying="y",
            side="right",
            showgrid=False,
        ),
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=50, r=50, t=60, b=40),
    )
    
    return fig


def create_spare_parts_heatmap(correlation_data: dict):
    if not correlation_data.get("matrix"):
        return create_empty_figure()
    
    matrix = correlation_data["matrix"]
    df = pd.DataFrame(matrix)
    
    pivot = df.pivot_table(
        index="fault_name",
        columns="part_name",
        values="correlation_score",
        fill_value=0,
    )
    
    fig = px.imshow(
        pivot,
        color_continuous_scale="Blues",
        labels=dict(x="备件名称", y="故障类型", color="关联度"),
        aspect="auto",
        vmin=0,
        vmax=1,
    )
    
    fig.update_layout(
        title=dict(text="故障类型-备件关联度矩阵", font=dict(size=14, color=COLORS["text"])),
        xaxis=dict(tickangle=-30),
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=50, r=20, t=60, b=80),
    )
    
    return fig


def create_cost_analysis_chart(correlation_data: dict):
    if not correlation_data.get("cost_analysis"):
        return create_empty_figure()
    
    cost_data = correlation_data["cost_analysis"]
    df = pd.DataFrame(cost_data)
    
    fig = px.bar(
        df,
        x="fault_name",
        y="cost",
        color="part_name",
        title="各故障类型备件成本构成",
        barmode="stack",
        color_discrete_sequence=COLORS["lines"],
    )
    
    fig.update_layout(
        title=dict(text="各故障类型备件成本构成", font=dict(size=14, color=COLORS["text"])),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        xaxis=dict(title="故障类型", tickangle=-30),
        yaxis=dict(title="备件成本(元)", gridcolor="#f0f0f0"),
        plot_bgcolor="white",
        paper_bgcolor="white",
        margin=dict(l=50, r=20, t=80, b=80),
    )
    
    return fig
