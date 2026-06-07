import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from typing import Dict, Optional, Tuple
from datetime import datetime


def create_route_map(temp_df: pd.DataFrame, selected_batch: Optional[str] = None) -> go.Figure:
    if temp_df.empty:
        fig = go.Figure()
        fig.update_layout(
            title="路线回放 - 无数据",
            template="plotly_white"
        )
        return fig
    
    plot_df = temp_df.copy()
    if selected_batch and selected_batch != 'ALL':
        plot_df = plot_df[plot_df['batch_id'] == selected_batch]
    
    if plot_df.empty:
        fig = go.Figure()
        fig.update_layout(title="路线回放 - 无数据", template="plotly_white")
        return fig
    
    color_map = {True: '#27ae60', False: '#e74c3c'}
    
    fig = go.Figure()
    
    for batch_id in plot_df['batch_id'].unique():
        batch_data = plot_df[plot_df['batch_id'] == batch_id].sort_values('timestamp')
        
        if len(batch_data) < 2:
            continue
        
        fig.add_trace(go.Scattermapbox(
            lat=batch_data['latitude'],
            lon=batch_data['longitude'],
            mode='lines+markers',
            line=dict(width=2, color='#3498db'),
            marker=dict(
                size=8,
                color=batch_data['probe_calibrated'].map(color_map),
                opacity=0.7
            ),
            text=batch_data.apply(
                lambda x: f"""
                批次: {x['batch_id']}<br>
                时间: {x['timestamp'].strftime('%Y-%m-%d %H:%M')}<br>
                温度: {x['temperature']:.1f}°C<br>
                探头校准: {'是' if x['probe_calibrated'] else '否'}<br>
                开门: {'是' if x['door_open'] else '否'}
                """,
                axis=1
            ),
            hoverinfo='text',
            name=batch_id,
            showlegend=True
        ))
    
    center_lat = plot_df['latitude'].mean() if not plot_df['latitude'].isna().all() else 35
    center_lon = plot_df['longitude'].mean() if not plot_df['longitude'].isna().all() else 110
    
    fig.update_layout(
        title=dict(
            text="🚛 运输路线回放",
            font=dict(size=16, color='#2c3e50')
        ),
        mapbox=dict(
            style="carto-positron",
            zoom=4,
            center=dict(lat=center_lat, lon=center_lon)
        ),
        margin=dict(l=0, r=0, t=40, b=0),
        height=400,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        ),
        template="plotly_white"
    )
    
    return fig


def create_temperature_curve(temp_df: pd.DataFrame, 
                              shipment_df: pd.DataFrame,
                              selected_batch: Optional[str] = None) -> go.Figure:
    if temp_df.empty:
        fig = go.Figure()
        fig.update_layout(title="温度曲线 - 无数据", template="plotly_white")
        return fig
    
    plot_df = temp_df.copy()
    
    if selected_batch and selected_batch != 'ALL':
        plot_df = plot_df[plot_df['batch_id'] == selected_batch]
    
    if plot_df.empty:
        fig = go.Figure()
        fig.update_layout(title="温度曲线 - 无数据", template="plotly_white")
        return fig
    
    fig = go.Figure()
    
    batches = plot_df['batch_id'].unique()
    colors = px.colors.qualitative.Set3[:len(batches)]
    
    for idx, batch_id in enumerate(batches):
        batch_data = plot_df[plot_df['batch_id'] == batch_id].sort_values('timestamp')
        shipment_info = shipment_df[shipment_df['batch_id'] == batch_id].iloc[0] if len(shipment_df[shipment_df['batch_id'] == batch_id]) > 0 else None
        
        color = colors[idx % len(colors)]
        
        fig.add_trace(go.Scatter(
            x=batch_data['timestamp'],
            y=batch_data['temperature'],
            mode='lines',
            name=f'{batch_id} - {shipment_info["product_type"] if shipment_info is not None else ""}',
            line=dict(color=color, width=2),
            opacity=0.8,
            hovertext=batch_data.apply(
                lambda x: f"""
                批次: {x['batch_id']}<br>
                时间: {x['timestamp'].strftime('%Y-%m-%d %H:%M')}<br>
                温度: {x['temperature']:.1f}°C<br>
                探头: {x['probe_id']}<br>
                校准: {'正常' if x['probe_calibrated'] else '未校准 ⚠️'}<br>
                数据质量: {x['data_quality']}
                """,
                axis=1
            ),
            hoverinfo='text'
        ))
        
        if shipment_info is not None:
            y_min = shipment_info.get('target_temp_min', plot_df['temperature'].min())
            y_max = shipment_info.get('target_temp_max', plot_df['temperature'].max())
            
            fig.add_hrect(
                y0=y_min, y1=y_max,
                line_width=0,
                fillcolor='rgba(39, 174, 96, 0.1)',
                layer='below',
                annotation_text=shipment_info.get('product_type', ''),
                annotation_position='top right'
            )
    
    door_open_points = plot_df[plot_df['door_open']]
    if not door_open_points.empty:
        fig.add_trace(go.Scatter(
            x=door_open_points['timestamp'],
            y=door_open_points['temperature'],
            mode='markers',
            marker=dict(
                symbol='square',
                size=8,
                color='#e74c3c',
                line=dict(color='#c0392b', width=1)
            ),
            name='开门记录',
            hovertext=door_open_points.apply(
                lambda x: f'🚪 开门<br>时间: {x["timestamp"].strftime("%Y-%m-%d %H:%M")}<br>温度: {x["temperature"]:.1f}°C',
                axis=1
            ),
            hoverinfo='text'
        ))
    
    fig.update_layout(
        title=dict(
            text="🌡️ 箱内温度变化曲线",
            font=dict(size=16, color='#2c3e50')
        ),
        xaxis_title="时间",
        yaxis_title="温度 (°C)",
        height=350,
        template="plotly_white",
        hovermode='x unified',
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        ),
        margin=dict(l=50, r=20, t=60, b=50)
    )
    
    return fig


def create_anomaly_duration_chart(anomaly_df: pd.DataFrame) -> go.Figure:
    if anomaly_df.empty:
        fig = go.Figure()
        fig.update_layout(title="异常时长分析 - 无数据", template="plotly_white")
        return fig
    
    agg_df = anomaly_df.copy()
    agg_df['duration_hours'] = agg_df['duration_minutes'] / 60
    
    type_agg = agg_df.groupby('anomaly_type').agg({
        'duration_minutes': ['sum', 'count', 'mean'],
        'anomaly_id': 'count'
    }).reset_index()
    type_agg.columns = ['异常类型', '总时长(分钟)', '异常次数', '平均时长(分钟)', 'count']
    
    color_map = {
        '高温异常': '#e74c3c',
        '低温异常': '#3498db',
        '长时间开门': '#f39c12',
        '探头未校准': '#9b59b6',
        '设备故障': '#e67e22',
        '延误送达': '#1abc9c'
    }
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        x=type_agg['异常类型'],
        y=type_agg['总时长(分钟)'] / 60,
        marker=dict(
            color=[color_map.get(t, '#95a5a6') for t in type_agg['异常类型']]
        ),
        text=type_agg.apply(
            lambda x: f'{x["总时长(分钟)"]/60:.1f}小时<br>({x["异常次数"]}次)',
            axis=1
        ),
        textposition='outside',
        hovertext=type_agg.apply(
            lambda x: f"""
            异常类型: {x['异常类型']}<br>
            总时长: {x['总时长(分钟)']/60:.1f}小时<br>
            异常次数: {x['异常次数']}<br>
            平均时长: {x['平均时长(分钟)']:.1f}分钟
            """,
            axis=1
        ),
        hoverinfo='text'
    ))
    
    fig.update_layout(
        title=dict(
            text="⏱️ 异常时长统计",
            font=dict(size=16, color='#2c3e50')
        ),
        xaxis_title="异常类型",
        yaxis_title="总时长 (小时)",
        height=350,
        template="plotly_white",
        margin=dict(l=50, r=20, t=60, b=80)
    )
    
    return fig


def create_responsibility_segment_chart(anomaly_df: pd.DataFrame) -> go.Figure:
    if anomaly_df.empty:
        fig = go.Figure()
        fig.update_layout(title="责任段分析 - 无数据", template="plotly_white")
        return fig
    
    seg_agg = anomaly_df.groupby('responsible_segment').agg({
        'anomaly_id': 'count',
        'duration_minutes': 'sum'
    }).reset_index()
    seg_agg.columns = ['责任段', '异常数量', '总时长(分钟)']
    seg_agg = seg_agg.sort_values('异常数量', ascending=True)
    
    colors = ['#3498db', '#e74c3c', '#f39c12', '#27ae60', '#9b59b6', '#1abc9c']
    
    fig = go.Figure()
    
    fig.add_trace(go.Bar(
        y=seg_agg['责任段'],
        x=seg_agg['异常数量'],
        orientation='h',
        marker=dict(color=colors[:len(seg_agg)]),
        text=seg_agg['异常数量'],
        textposition='outside',
        hovertext=seg_agg.apply(
            lambda x: f"""
            责任段: {x['责任段']}<br>
            异常数量: {x['异常数量']}<br>
            总时长: {x['总时长(分钟)']/60:.1f}小时
            """,
            axis=1
        ),
        hoverinfo='text'
    ))
    
    fig.update_layout(
        title=dict(
            text="🎯 责任段异常分布",
            font=dict(size=16, color='#2c3e50')
        ),
        xaxis_title="异常数量",
        yaxis_title="责任段",
        height=350,
        template="plotly_white",
        margin=dict(l=100, r=40, t=60, b=50)
    )
    
    return fig


def create_severity_pie_chart(anomaly_df: pd.DataFrame) -> go.Figure:
    if anomaly_df.empty:
        fig = go.Figure()
        fig.update_layout(title="严重程度分布 - 无数据", template="plotly_white")
        return fig
    
    sev_agg = anomaly_df.groupby('severity').agg({
        'anomaly_id': 'count'
    }).reset_index()
    sev_agg.columns = ['严重程度', '数量']
    
    color_map = {'高': '#e74c3c', '中': '#f39c12', '低': '#27ae60'}
    
    fig = go.Figure(data=[go.Pie(
        labels=sev_agg['严重程度'],
        values=sev_agg['数量'],
        hole=0.4,
        marker=dict(
            colors=[color_map.get(s, '#95a5a6') for s in sev_agg['严重程度']]
        ),
        textinfo='label+percent',
        textposition='outside',
        hovertext=sev_agg.apply(
            lambda x: f'严重程度: {x["严重程度"]}<br>数量: {x["数量"]}',
            axis=1
        ),
        hoverinfo='text'
    )])
    
    fig.update_layout(
        title=dict(
            text="⚠️ 异常严重程度分布",
            font=dict(size=16, color='#2c3e50')
        ),
        height=300,
        template="plotly_white",
        margin=dict(l=20, r=20, t=60, b=20),
        showlegend=True
    )
    
    return fig


def create_kpi_cards(shipment_df: pd.DataFrame, temp_df: pd.DataFrame, anomaly_df: pd.DataFrame) -> Dict:
    kpis = {}
    
    total_batches = len(shipment_df)
    kpis['total_batches'] = {
        'value': total_batches,
        'label': '运输批次',
        'icon': '📦'
    }
    
    total_anomalies = len(anomaly_df)
    anomaly_rate = total_anomalies / total_batches * 100 if total_batches > 0 else 0
    kpis['total_anomalies'] = {
        'value': f'{total_anomalies}',
        'label': f'异常事件 (异常率: {anomaly_rate:.1f}%)',
        'icon': '⚠️'
    }
    
    if not temp_df.empty:
        avg_temp = temp_df['temperature'].mean()
        kpis['avg_temp'] = {
            'value': f'{avg_temp:.1f}°C',
            'label': '平均温度',
            'icon': '🌡️'
        }
    else:
        kpis['avg_temp'] = {'value': '-', 'label': '平均温度', 'icon': '🌡️'}
    
    high_severity = len(anomaly_df[anomaly_df['severity'] == '高']) if not anomaly_df.empty else 0
    kpis['high_severity'] = {
        'value': high_severity,
        'label': '高严重异常',
        'icon': '🔴'
    }
    
    if not temp_df.empty:
        uncalibrated = temp_df[~temp_df['probe_calibrated']]['batch_id'].nunique()
        kpis['uncalibrated'] = {
            'value': uncalibrated,
            'label': '探头未校准批次',
            'icon': '🔧'
        }
    else:
        kpis['uncalibrated'] = {'value': 0, 'label': '探头未校准批次', 'icon': '🔧'}
    
    if not temp_df.empty:
        door_open_count = temp_df['door_open'].sum()
        kpis['door_open'] = {
            'value': int(door_open_count),
            'label': '开门记录数',
            'icon': '🚪'
        }
    else:
        kpis['door_open'] = {'value': 0, 'label': '开门记录数', 'icon': '🚪'}
    
    return kpis


def create_door_event_timeline(door_events_df: pd.DataFrame) -> go.Figure:
    if door_events_df.empty:
        fig = go.Figure()
        fig.update_layout(title="开门事件时间线 - 无数据", template="plotly_white")
        return fig
    
    df = door_events_df.copy()
    df = df.sort_values('door_open_time')
    
    fig = go.Figure()
    
    for idx, row in df.iterrows():
        fig.add_trace(go.Scatter(
            x=[row['door_open_time'], row['door_close_time']],
            y=[row['batch_id'], row['batch_id']],
            mode='lines+markers',
            line=dict(width=10, color='#f39c12'),
            marker=dict(
                size=[12, 12],
                color=['#27ae60', '#e74c3c'],
                symbol=['circle', 'circle']
            ),
            name=row['event_id'],
            showlegend=False,
            hovertext=f"""
            批次: {row['batch_id']}<br>
            开门: {row['door_open_time'].strftime('%Y-%m-%d %H:%M')}<br>
            关门: {row['door_close_time'].strftime('%Y-%m-%d %H:%M')}<br>
            时长: {row['duration_minutes']:.0f}分钟<br>
            地点: {row.get('location', '-')}<br>
            责任方: {row.get('responsible_party', '-')}<br>
            原因: {row.get('reason', '-')}
            """,
            hoverinfo='text'
        ))
    
    fig.update_layout(
        title=dict(
            text="🚪 开门事件时间线",
            font=dict(size=16, color='#2c3e50')
        ),
        xaxis_title="时间",
        yaxis_title="批次",
        height=350,
        template="plotly_white",
        margin=dict(l=120, r=20, t=60, b=50)
    )
    
    return fig
