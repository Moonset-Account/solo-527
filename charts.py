"""
图表生成模块
使用Plotly生成各种分析图表
"""
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from metrics import get_sankey_data


COLOR_PALETTE = {
    "primary": "#1f77b4",
    "secondary": "#ff7f0e",
    "success": "#2ca02c",
    "danger": "#d62728",
    "warning": "#ffc107",
    "info": "#17a2b8",
    "light": "#f8f9fa",
    "dark": "#343a40"
}

DEPT_COLORS = px.colors.qualitative.Set3
PATIENT_TYPE_COLORS = px.colors.qualitative.Pastel1


def create_sankey_chart(df: pd.DataFrame, title: str = "门诊流程瓶颈分析 - 桑基图") -> go.Figure:
    """创建桑基图展示流程瓶颈"""
    sankey_data = get_sankey_data(df)
    
    node_colors = [
        "#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
        "#59a14f", "#edc948", "#b07aa1", "#bab0ac"
    ]
    
    fig = go.Figure(data=[go.Sankey(
        node=dict(
            pad=15,
            thickness=20,
            line=dict(color="black", width=0.5),
            label=sankey_data["nodes"],
            color=node_colors[:len(sankey_data["nodes"])]
        ),
        link=dict(
            source=[l["source"] for l in sankey_data["links"]],
            target=[l["target"] for l in sankey_data["links"]],
            value=[l["value"] for l in sankey_data["links"]],
            color=["rgba(31, 119, 180, 0.4)"] * len(sankey_data["links"])
        )
    )])
    
    fig.update_layout(
        title=dict(text=title, font=dict(size=16)),
        font=dict(size=12),
        height=450,
        margin=dict(l=20, r=20, t=60, b=20)
    )
    
    return fig


def create_wait_distribution_chart(df: pd.DataFrame, wait_col: str = "wait_分诊_叫号") -> go.Figure:
    """创建等待时间分布图（直方图+箱线图）"""
    valid_data = df[wait_col].dropna()
    
    if len(valid_data) == 0:
        fig = go.Figure()
        fig.add_annotation(text="暂无数据", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False)
        return fig
    
    col_display = wait_col.replace("wait_", "").replace("_", "→")
    
    fig = go.Figure()
    
    fig.add_trace(go.Histogram(
        x=valid_data,
        name="分布",
        nbinsx=30,
        marker_color=COLOR_PALETTE["primary"],
        opacity=0.7,
        hovertemplate=f"{col_display}: %{{x:.1f}}分钟<br>样本数: %{{y}}<extra></extra>"
    ))
    
    stats = valid_data.describe()
    fig.add_vline(x=stats["50%"], line_dash="dash", line_color="orange", 
                  annotation_text=f"中位数: {stats['50%']:.1f}分钟", annotation_position="top right")
    fig.add_vline(x=stats["mean"], line_dash="dot", line_color="red",
                  annotation_text=f"均值: {stats['mean']:.1f}分钟", annotation_position="top left")
    
    fig.update_layout(
        title=dict(text=f"等待时间分布 - {col_display}", font=dict(size=14)),
        xaxis_title="等待时间（分钟）",
        yaxis_title="样本数",
        height=350,
        margin=dict(l=50, r=20, t=60, b=50),
        showlegend=False,
        barmode="overlay"
    )
    
    return fig


def create_dept_comparison_chart(df: pd.DataFrame, wait_col: str = "wait_分诊_叫号") -> go.Figure:
    """创建科室对比条形图"""
    from metrics import get_dept_comparison
    
    dept_stats = get_dept_comparison(df)
    
    if len(dept_stats) == 0:
        fig = go.Figure()
        fig.add_annotation(text="暂无数据", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False)
        return fig
    
    col_display = wait_col.replace("wait_", "").replace("_", "→")
    mean_col = f"{wait_col}_mean"
    count_col = f"{wait_col}_count"
    
    if mean_col not in dept_stats.columns:
        fig = go.Figure()
        fig.add_annotation(text="指标数据不可用", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False)
        return fig
    
    dept_stats = dept_stats.sort_values(mean_col, ascending=True)
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        y=dept_stats["dept_name"],
        x=dept_stats[mean_col],
        orientation="h",
        marker_color=DEPT_COLORS[:len(dept_stats)],
        text=dept_stats[mean_col].round(1),
        textposition="outside",
        hovertemplate=(
            "科室: %{y}<br>"
            f"平均等待: %{{x:.1f}}分钟<br>"
            "样本数: %{customdata}<extra></extra>"
        ),
        customdata=dept_stats[count_col]
    ))
    
    fig.update_layout(
        title=dict(text=f"各科室等待时间对比 - {col_display}", font=dict(size=14)),
        xaxis_title="平均等待时间（分钟）",
        yaxis_title="科室",
        height=400,
        margin=dict(l=120, r=50, t=60, b=50),
        showlegend=False
    )
    
    return fig


def create_hourly_trend_chart(df: pd.DataFrame) -> go.Figure:
    """创建日内趋势图（按小时）"""
    from metrics import get_hourly_trend
    
    hourly = get_hourly_trend(df)
    
    if len(hourly) == 0:
        fig = go.Figure()
        fig.add_annotation(text="暂无数据", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False)
        return fig
    
    wait_cols = [col for col in hourly.columns if col.startswith("wait_")]
    
    fig = go.Figure()
    
    line_styles = ['solid', 'dash', 'dot', 'dashdot', 'solid', 'dash']
    
    for i, col in enumerate(wait_cols[:5]):
        col_display = col.replace("wait_", "").replace("_", "→")
        fig.add_trace(go.Scatter(
            x=hourly["hour"],
            y=hourly[col],
            mode="lines+markers",
            name=col_display,
            line=dict(width=2, dash=line_styles[i % len(line_styles)]),
            marker=dict(size=6)
        ))
    
    fig.update_layout(
        title=dict(text="日内等待时间趋势（按小时）", font=dict(size=14)),
        xaxis_title="小时",
        yaxis_title="平均等待时间（分钟）",
        height=350,
        margin=dict(l=50, r=20, t=60, b=50),
        legend=dict(orientation="h", yanchor="bottom", y=-0.3, xanchor="center", x=0.5),
        hovermode="x unified"
    )
    
    fig.update_xaxes(tickmode="linear", tick0=7, dtick=1)
    
    return fig


def create_kpi_cards(filtered_df: pd.DataFrame, original_df: pd.DataFrame) -> list:
    """创建KPI指标卡片"""
    wait_cols = [
        ("wait_挂号_签到", "挂号→签到"),
        ("wait_分诊_叫号", "分诊→叫号"),
        ("wait_叫号_就诊", "叫号→就诊"),
        ("total_wait_time", "总等待")
    ]
    
    cards = []
    
    for col, display in wait_cols:
        if col in filtered_df.columns:
            current_mean = filtered_df[col].dropna().mean()
            original_mean = original_df[col].dropna().mean()
            
            if pd.notna(current_mean) and pd.notna(original_mean) and original_mean > 0:
                pct_change = (current_mean - original_mean) / original_mean * 100
            else:
                pct_change = 0
            
            cards.append({
                "title": display,
                "value": f"{current_mean:.1f} 分钟" if pd.notna(current_mean) else "N/A",
                "change": f"{pct_change:+.1f}%",
                "change_type": "danger" if pct_change > 0 else "success"
            })
    
    return cards


def create_patient_type_breakdown(df: pd.DataFrame) -> go.Figure:
    """创建患者类型分布饼图"""
    type_counts = df["patient_type"].value_counts().reset_index()
    type_counts.columns = ["patient_type", "count"]
    
    fig = px.pie(
        type_counts,
        values="count",
        names="patient_type",
        color_discrete_sequence=PATIENT_TYPE_COLORS,
        hole=0.4
    )
    
    fig.update_layout(
        title=dict(text="患者类型分布", font=dict(size=14)),
        height=300,
        margin=dict(l=20, r=20, t=60, b=20),
        legend=dict(orientation="h", yanchor="bottom", y=-0.2, xanchor="center", x=0.5)
    )
    
    return fig


def create_anomaly_analysis_chart(df: pd.DataFrame) -> go.Figure:
    """创建异常原因分析图"""
    if "anomaly_reason" not in df.columns:
        fig = go.Figure()
        fig.add_annotation(text="暂无异常数据", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False)
        return fig
    
    anomaly_df = df[df["is_anomaly"] & df["anomaly_reason"].notna()]
    
    if len(anomaly_df) == 0:
        fig = go.Figure()
        fig.add_annotation(text="暂无异常数据", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False)
        return fig
    
    reason_counts = anomaly_df["anomaly_reason"].value_counts().reset_index()
    reason_counts.columns = ["reason", "count"]
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=reason_counts["reason"],
        y=reason_counts["count"],
        marker_color=COLOR_PALETTE["danger"],
        text=reason_counts["count"],
        textposition="outside"
    ))
    
    fig.update_layout(
        title=dict(text="异常原因分布", font=dict(size=14)),
        xaxis_title="异常原因",
        yaxis_title="发生次数",
        height=300,
        margin=dict(l=50, r=20, t=60, b=80)
    )
    
    return fig
