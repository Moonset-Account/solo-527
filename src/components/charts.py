import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from src.database.mock_data import STAGES, STAGE_NAMES, SAMPLE_TYPE_NAMES


def create_stage_boxplot(df, sample_type=None, priority=None):
    """
    创建各环节耗时箱线图
    """
    plot_data = []
    
    for stage in STAGES:
        col = f'{stage}_minutes'
        if col in df.columns:
            data = df[col].dropna()
            if len(data) > 0:
                plot_data.append({
                    'stage': STAGE_NAMES[stage],
                    'duration': data.values
                })
    
    if not plot_data:
        return go.Figure()
    
    fig = go.Figure()
    
    colors = px.colors.qualitative.Set3[:len(plot_data)]
    
    for i, item in enumerate(plot_data):
        fig.add_trace(go.Box(
            y=item['duration'],
            name=item['stage'],
            boxmean='sd',
            marker_color=colors[i % len(colors)],
            jitter=0.3,
            pointpos=-1.8,
            boxpoints='outliers'
        ))
    
    title = '各环节耗时分布（箱线图）'
    if sample_type:
        title += f' - {SAMPLE_TYPE_NAMES.get(sample_type, sample_type)}'
    if priority:
        priority_name = '急诊' if priority == 'emergency' else '常规'
        title += f'（{priority_name}）'
    
    fig.update_layout(
        title=title,
        yaxis_title='耗时（分钟）',
        xaxis_title='环节',
        showlegend=False,
        height=450,
        margin=dict(l=60, r=30, t=60, b=60),
        template='plotly_white'
    )
    
    return fig


def create_stage_duration_barchart(df, group_by='priority'):
    """
    创建各环节平均耗时柱状图，支持按优先级/样本类型分组
    """
    stage_data = []
    
    groups = df[group_by].unique() if group_by in df.columns else ['all']
    group_names = {
        'emergency': '急诊',
        'routine': '常规'
    }
    
    for group_val in groups:
        if group_val == 'all':
            group_df = df
        else:
            group_df = df[df[group_by] == group_val]
        
        for stage in STAGES:
            col = f'{stage}_minutes'
            if col in group_df.columns:
                avg_val = group_df[col].mean()
                median_val = group_df[col].median()
                if pd.notna(avg_val):
                    stage_data.append({
                        'group': group_names.get(group_val, str(group_val)),
                        'stage': STAGE_NAMES[stage],
                        'avg_duration': round(avg_val, 2),
                        'median_duration': round(median_val, 2)
                    })
    
    if not stage_data:
        return go.Figure()
    
    plot_df = pd.DataFrame(stage_data)
    
    fig = px.bar(
        plot_df,
        x='stage',
        y='avg_duration',
        color='group',
        barmode='group',
        text='avg_duration',
        title=f'各环节平均耗时对比（按{("优先级" if group_by == "priority" else "样本类型")}分组）',
        labels={
            'avg_duration': '平均耗时（分钟）',
            'stage': '环节',
            'group': '分组'
        },
        template='plotly_white',
        height=450
    )
    
    fig.update_traces(textposition='outside')
    fig.update_layout(
        margin=dict(l=60, r=30, t=60, b=60),
        legend_title_text='分组'
    )
    
    return fig


def create_timeout_rate_chart(timeout_summary):
    """
    创建超时率柱状图
    """
    stages = []
    rates = []
    counts = []
    
    for stage, data in timeout_summary.items():
        stages.append(STAGE_NAMES[stage])
        rates.append(data['timeout_rate'])
        counts.append(f"{data['timed_out']}/{data['total']}")
    
    if not stages:
        return go.Figure()
    
    colors = ['#EF553B' if r > 20 else '#FFA15A' if r > 10 else '#636EFA' for r in rates]
    
    fig = go.Figure(data=[
        go.Bar(
            x=stages,
            y=rates,
            text=rates,
            textposition='outside',
            marker_color=colors,
            customdata=counts,
            hovertemplate='环节: %{x}<br>超时率: %{y}%<br>超时数/总数: %{customdata}<extra></extra>'
        )
    ])
    
    fig.update_layout(
        title='各环节超时率统计',
        yaxis_title='超时率（%）',
        xaxis_title='环节',
        height=400,
        template='plotly_white',
        margin=dict(l=60, r=30, t=60, b=60),
        yaxis=dict(range=[0, max(rates) * 1.2 if rates else 100])
    )
    
    return fig


def create_department_comparison_chart(dept_df):
    """
    创建科室对比散点图（样本量 vs 超时率）
    """
    if dept_df.empty:
        return go.Figure()
    
    fig = px.scatter(
        dept_df,
        x='sample_count',
        y='timeout_rate',
        size='sample_count',
        color='timeout_rate',
        hover_name='department',
        hover_data={
            'sample_count': True,
            'timeout_rate': ':,.2f%',
            'return_rate': ':,.2f%',
            'avg_total_duration_minutes': True
        },
        title='科室对比：样本量 vs 超时率',
        labels={
            'sample_count': '样本量',
            'timeout_rate': '超时率（%）',
            'department': '科室',
            'return_rate': '退回率（%）',
            'avg_total_duration_minutes': '平均总耗时(分钟)'
        },
        color_continuous_scale='RdYlGn_r',
        height=450,
        template='plotly_white'
    )
    
    fig.update_layout(
        margin=dict(l=60, r=30, t=60, b=60)
    )
    
    return fig


def create_sample_timeline(sample_data, thresholds_df=None):
    """
    创建单样本时间线甘特图（下钻用）
    """
    if sample_data is None or sample_data.empty:
        return go.Figure()
    
    sample = sample_data.iloc[0]
    
    stages_timeline = [
        ('采样', 'collected_at', '#636EFA'),
        ('送检', 'dispatched_at', '#00CC96'),
        ('接收', 'received_at', '#AB63FA'),
        ('检测', 'tested_at', '#FFA15A'),
        ('复核', 'reviewed_at', '#19D3F3'),
        ('报告发布', 'reported_at', '#EF553B')
    ]
    
    fig = go.Figure()
    
    y_pos = 0
    base_time = sample['collected_at']
    
    for i in range(len(stages_timeline) - 1):
        stage_name, start_col, color = stages_timeline[i]
        next_name, end_col, next_color = stages_timeline[i + 1]
        
        if start_col in sample and end_col in sample:
            start_time = sample[start_col]
            end_time = sample[end_col]
            
            if pd.notna(start_time) and pd.notna(end_time):
                duration = (end_time - start_time).total_seconds() / 60
                
                source_col = f'{end_col}_source'
                source = sample.get(source_col, 'auto')
                source_label = '（补录）' if source == 'manual' else ''
                
                stage_key = f'{stages_timeline[i][1].replace("_at", "")}_to_{stages_timeline[i+1][1].replace("_at", "")}'
                
                is_timeout = False
                threshold_val = None
                if thresholds_df is not None and f'{stage_key}_timeout' in sample:
                    is_timeout = sample[f'{stage_key}_timeout']
                    threshold_val = sample.get(f'{stage_key}_threshold', None)
                
                bar_color = '#EF553B' if is_timeout else color
                
                fig.add_trace(go.Bar(
                    x=[duration],
                    y=[f'{stage_name}→{next_name}'],
                    orientation='h',
                    marker_color=bar_color,
                    base=[(start_time - base_time).total_seconds() / 60],
                    width=0.5,
                    hovertemplate=(
                        f'{stage_name}→{next_name}{source_label}<br>'
                        f'开始: {start_time.strftime("%Y-%m-%d %H:%M:%S")}<br>'
                        f'结束: {end_time.strftime("%Y-%m-%d %H:%M:%S")}<br>'
                        f'耗时: {duration:.2f} 分钟'
                        + (f'<br>阈值: {threshold_val} 分钟' if threshold_val else '')
                        + ('<br>状态: <b>超时</b>' if is_timeout else '')
                        + '<extra></extra>'
                    )
                ))
    
    fig.update_layout(
        title=f'样本 {sample["sample_id"]} 检验全流程时间线',
        xaxis_title='时间（分钟，从采样开始）',
        height=350,
        showlegend=False,
        template='plotly_white',
        margin=dict(l=120, r=30, t=60, b=60)
    )
    
    return fig


def create_return_reasons_chart(returns_df):
    """
    创建退回原因分布图
    """
    if returns_df.empty:
        return go.Figure()
    
    reason_counts = returns_df['return_reason'].value_counts().reset_index()
    reason_counts.columns = ['reason', 'count']
    
    fig = px.bar(
        reason_counts,
        x='count',
        y='reason',
        orientation='h',
        text='count',
        title='退回原因分布',
        labels={'count': '数量', 'reason': '退回原因'},
        color='count',
        color_continuous_scale='Reds',
        height=400,
        template='plotly_white'
    )
    
    fig.update_layout(
        margin=dict(l=150, r=30, t=60, b=30)
    )
    
    return fig


def create_priority_pie_chart(df):
    """
    创建急诊/常规样本占比饼图
    """
    if 'priority' not in df.columns:
        return go.Figure()
    
    priority_counts = df['priority'].value_counts().reset_index()
    priority_counts.columns = ['priority', 'count']
    priority_counts['name'] = priority_counts['priority'].map({'emergency': '急诊', 'routine': '常规'})
    
    fig = px.pie(
        priority_counts,
        values='count',
        names='name',
        title='样本优先级分布',
        color='name',
        color_discrete_map={'急诊': '#EF553B', '常规': '#636EFA'},
        height=350,
        hole=0.4,
        template='plotly_white'
    )
    
    fig.update_traces(textposition='inside', textinfo='percent+label')
    fig.update_layout(margin=dict(l=30, r=30, t=60, b=30))
    
    return fig


def create_trend_chart(df, freq='D'):
    """
    创建时效趋势图（按日/周/月）
    """
    if 'collected_at' not in df.columns or 'total_duration_minutes' not in df.columns:
        return go.Figure()
    
    trend_df = df.copy()
    trend_df['date'] = trend_df['collected_at'].dt.floor(freq)
    
    freq_map = {'D': '日', 'W': '周', 'M': '月'}
    
    trend_stats = trend_df.groupby('date').agg({
        'sample_id': 'count',
        'total_duration_minutes': ['mean', 'median'],
        'any_timeout': 'mean'
    }).round(2)
    
    trend_stats.columns = ['sample_count', 'avg_duration', 'median_duration', 'timeout_rate']
    trend_stats = trend_stats.reset_index()
    trend_stats['timeout_rate'] = (trend_stats['timeout_rate'] * 100).round(2)
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=trend_stats['date'],
        y=trend_stats['avg_duration'],
        name='平均总耗时',
        yaxis='y1',
        mode='lines+markers',
        line=dict(color='#636EFA', width=2)
    ))
    
    fig.add_trace(go.Scatter(
        x=trend_stats['date'],
        y=trend_stats['timeout_rate'],
        name='超时率(%)',
        yaxis='y2',
        mode='lines+markers',
        line=dict(color='#EF553B', width=2)
    ))
    
    fig.update_layout(
        title=f'时效趋势（按{freq_map.get(freq, freq)}）',
        xaxis_title='时间',
        yaxis=dict(
            title='平均总耗时（分钟）',
            titlefont=dict(color='#636EFA'),
            tickfont=dict(color='#636EFA')
        ),
        yaxis2=dict(
            title='超时率（%）',
            titlefont=dict(color='#EF553B'),
            tickfont=dict(color='#EF553B'),
            overlaying='y',
            side='right'
        ),
        height=400,
        template='plotly_white',
        margin=dict(l=60, r=60, t=60, b=60),
        legend=dict(orientation='h', y=1.1)
    )
    
    return fig
