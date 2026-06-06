import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from config import Config


class ChartComponents:
    COLORS = [
        "#1f77b4",
        "#ff7f0e",
        "#2ca02c",
        "#d62728",
        "#9467bd",
        "#8c564b",
        "#e377c2",
        "#7f7f7f",
        "#bcbd22",
        "#17becf",
    ]

    @classmethod
    def create_funnel_chart(cls, df: pd.DataFrame, group_by: str = None) -> go.Figure:
        if df.empty:
            fig = go.Figure()
            fig.update_layout(
                title="暂无数据",
                annotations=[
                    dict(
                        text="未找到符合条件的数据",
                        xref="paper",
                        yref="paper",
                        showarrow=False,
                        font=dict(size=20),
                    )
                ],
            )
            return fig

        if group_by and "group" in df.columns:
            fig = go.Figure()

            for idx, (group_name, group_df) in enumerate(df.groupby("group", sort=False)):
                fig.add_trace(
                    go.Funnel(
                        name=group_name,
                        y=group_df["stage_name"],
                        x=group_df["count"],
                        textinfo="value+percent initial",
                        marker=dict(color=cls.COLORS[idx % len(cls.COLORS)]),
                        visible=True,
                    )
                )

            fig.update_layout(
                title=f"招聘漏斗（按{group_by}分组）",
                barmode="group",
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            )
        else:
            fig = go.Figure(
                go.Funnel(
                    y=df["stage_name"],
                    x=df["count"],
                    textposition="inside",
                    textinfo="value+percent initial+percent previous",
                    marker=dict(
                        color=cls.COLORS[: len(df)],
                        line=dict(width=2, color="white"),
                    ),
                    connector=dict(line=dict(color="royalblue", dash="solid")),
                )
            )

            fig.update_layout(
                title="招聘流程漏斗",
                font=dict(size=12),
                margin=dict(l=0, r=0, t=40, b=0),
            )

        return fig

    @classmethod
    def create_stage_duration_chart(cls, df: pd.DataFrame, group_by: str = None) -> go.Figure:
        if df.empty:
            fig = go.Figure()
            fig.update_layout(
                title="暂无数据",
                annotations=[
                    dict(
                        text="未找到符合条件的数据",
                        xref="paper",
                        yref="paper",
                        showarrow=False,
                        font=dict(size=20),
                    )
                ],
            )
            return fig

        if group_by and "group" in df.columns:
            fig = px.bar(
                df,
                x="stage_name",
                y="avg_duration",
                color="group",
                barmode="group",
                error_y=None,
                title=f"各阶段平均耗时（按{group_by}分组，单位：天）",
                labels={"avg_duration": "平均耗时(天)", "stage_name": "阶段", "group": group_by},
                color_discrete_sequence=cls.COLORS,
            )
        else:
            fig = go.Figure()

            fig.add_trace(
                go.Bar(
                    name="平均耗时",
                    x=df["stage_name"],
                    y=df["avg_duration"],
                    marker_color=cls.COLORS[0],
                    text=df["avg_duration"],
                    textposition="auto",
                )
            )

            fig.add_trace(
                go.Scatter(
                    name="中位数",
                    x=df["stage_name"],
                    y=df["median_duration"],
                    mode="lines+markers",
                    line=dict(color=cls.COLORS[1], width=3),
                    marker=dict(size=8),
                )
            )

            fig.add_trace(
                go.Scatter(
                    name="P75",
                    x=df["stage_name"],
                    y=df["p75_duration"],
                    mode="lines+markers",
                    line=dict(color=cls.COLORS[2], width=2, dash="dash"),
                    marker=dict(size=6),
                )
            )

            fig.update_layout(
                title="各阶段耗时统计（单位：天）",
                xaxis_title="阶段",
                yaxis_title="耗时（天）",
                barmode="group",
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            )

        return fig

    @classmethod
    def create_channel_quality_chart(cls, df: pd.DataFrame) -> go.Figure:
        if df.empty:
            fig = go.Figure()
            fig.update_layout(
                title="暂无数据",
                annotations=[
                    dict(
                        text="未找到符合条件的数据",
                        xref="paper",
                        yref="paper",
                        showarrow=False,
                        font=dict(size=20),
                    )
                ],
            )
            return fig

        fig = go.Figure()

        fig.add_trace(
            go.Bar(
                name="简历数",
                x=df["channel"],
                y=df["total_candidates"],
                marker_color=cls.COLORS[0],
                yaxis="y",
                offsetgroup=0,
            )
        )

        fig.add_trace(
            go.Scatter(
                name="面试率(%)",
                x=df["channel"],
                y=df["interview_rate"],
                mode="lines+markers",
                line=dict(color=cls.COLORS[1], width=3),
                yaxis="y2",
            )
        )

        fig.add_trace(
            go.Scatter(
                name="入职转化率(%)",
                x=df["channel"],
                y=df["conversion_rate"],
                mode="lines+markers",
                line=dict(color=cls.COLORS[2], width=3, dash="dash"),
                yaxis="y2",
            )
        )

        fig.update_layout(
            title="渠道质量分析",
            xaxis=dict(title="渠道"),
            yaxis=dict(title="简历数量", side="left"),
            yaxis2=dict(
                title="转化率(%)",
                side="right",
                overlaying="y",
                range=[0, 100],
            ),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            hovermode="x unified",
        )

        return fig

    @classmethod
    def create_interviewer_workload_chart(cls, df: pd.DataFrame) -> go.Figure:
        if df.empty:
            fig = go.Figure()
            fig.update_layout(
                title="暂无数据",
                annotations=[
                    dict(
                        text="未找到符合条件的数据",
                        xref="paper",
                        yref="paper",
                        showarrow=False,
                        font=dict(size=20),
                    )
                ],
            )
            return fig

        pivot_df = df.pivot_table(
            index="interviewer",
            columns="stage_name",
            values="total_interviews",
            fill_value=0,
            aggfunc="sum",
        ).reset_index()

        stages = [s for s in ["一面", "二面", "HR面"] if s in pivot_df.columns]
        pivot_df["total"] = pivot_df[stages].sum(axis=1)
        pivot_df = pivot_df.sort_values("total", ascending=True)

        fig = go.Figure()

        for idx, stage in enumerate(stages):
            fig.add_trace(
                go.Bar(
                    name=stage,
                    y=pivot_df["interviewer"],
                    x=pivot_df[stage],
                    orientation="h",
                    marker=dict(color=cls.COLORS[idx % len(cls.COLORS)]),
                )
            )

        fig.update_layout(
            title="面试官负载分析",
            barmode="stack",
            xaxis_title="面试次数",
            yaxis_title="面试官",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        )

        return fig

    @classmethod
    def create_feedback_radar_chart(cls, df: pd.DataFrame) -> go.Figure:
        if df.empty:
            fig = go.Figure()
            fig.update_layout(
                title="暂无数据",
                annotations=[
                    dict(
                        text="未找到符合条件的数据",
                        xref="paper",
                        yref="paper",
                        showarrow=False,
                        font=dict(size=20),
                    )
                ],
            )
            return fig

        if "group" in df.columns:
            fig = go.Figure()
            for idx, (_, row) in enumerate(df.iterrows()):
                fig.add_trace(
                    go.Scatterpolar(
                        r=[
                            row["avg_overall"],
                            row["avg_interview"],
                            row["avg_communication"],
                            row["avg_speed"],
                        ],
                        theta=["整体评分", "面试体验", "沟通效果", "流程速度"],
                        fill="toself",
                        name=row["group"],
                        line=dict(color=cls.COLORS[idx % len(cls.COLORS)]),
                    )
                )
            title = "候选人体验评分（分组对比）"
        else:
            row = df.iloc[0]
            fig = go.Figure(
                go.Scatterpolar(
                    r=[row["avg_overall"], row["avg_interview"], row["avg_communication"], row["avg_speed"]],
                    theta=["整体评分", "面试体验", "沟通效果", "流程速度"],
                    fill="toself",
                    line=dict(color=cls.COLORS[0]),
                )
            )
            title = f"候选人体验评分（共{int(row['feedback_count'])}份反馈）"

        fig.update_layout(
            polar=dict(radialaxis=dict(visible=True, range=[0, 5])),
            showlegend=True,
            title=title,
        )

        return fig

    @classmethod
    def create_kpi_cards(cls, stats: dict) -> list:
        cards = []

        card_defs = [
            ("候选人总数", stats["total_candidates"], "#1f77b4"),
            ("已入职", stats["hired_count"], "#2ca02c"),
            ("整体转化率", f"{stats['conversion_rate']}%", "#ff7f0e"),
            ("平均周期(天)", stats["avg_cycle_days"], "#9467bd"),
            ("进行中", stats["in_process_count"], "#17becf"),
        ]

        for title, value, color in card_defs:
            card = go.Figure(
                go.Indicator(
                    mode="number",
                    value=float(value) if isinstance(value, (int, float)) else 0,
                    title={"text": title, "font": {"size": 14}},
                    number={"font": {"size": 28, "color": color}},
                    domain={"x": [0, 1], "y": [0, 1]},
                )
            )
            card.update_layout(
                height=120,
                margin=dict(l=10, r=10, t=10, b=10),
                paper_bgcolor="white",
                plot_bgcolor="white",
            )
            cards.append(card)

        return cards
