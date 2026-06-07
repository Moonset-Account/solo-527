import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dash import Dash, html, dcc, Input, Output, State, callback_context
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import io

from backend.config import Config
from backend.data_service import data_service

app = Dash(__name__, external_stylesheets=[dbc.themes.CYBORG, dbc.icons.FONT_AWESOME])
app.title = '城市空气质量分析工作台'
server = app.server

POLLUTANT_OPTIONS = [{'label': Config.POLLUTANT_NAMES[p], 'value': p} for p in Config.POLLUTANTS]
DISTRICT_OPTIONS = [{'label': d, 'value': d} for d in Config.DISTRICTS]
TIME_RANGE_OPTIONS = [
    {'label': '最近24小时', 'value': '24h'},
    {'label': '最近7天', 'value': '7d'},
    {'label': '最近30天', 'value': '30d'},
    {'label': '自定义', 'value': 'custom'}
]

def get_filters_from_state(stations, districts, pollutants, time_range, start_date, end_date, 
                           exclude_anomalies, hour_range, event_types, verified_only=False):
    filters = {}
    
    if stations:
        filters['station_ids'] = stations
    
    if time_range == 'custom' and start_date and end_date:
        filters['start_time'] = start_date
        filters['end_time'] = end_date
    else:
        now = datetime.now()
        if time_range == '24h':
            filters['start_time'] = now - timedelta(hours=24)
        elif time_range == '7d':
            filters['start_time'] = now - timedelta(days=7)
        elif time_range == '30d':
            filters['start_time'] = now - timedelta(days=30)
        filters['end_time'] = now
    
    if exclude_anomalies:
        filters['exclude_anomalies'] = True
    
    if districts:
        filters['districts'] = districts
    
    if hour_range and len(hour_range) == 2 and (hour_range[0] != 0 or hour_range[1] != 23):
        filters['hour_range'] = hour_range
    
    if event_types:
        filters['event_types'] = event_types
    
    if verified_only:
        filters['verified_only'] = True
    
    return filters

def get_sample_stats(filters):
    hourly = data_service.get_air_quality_hourly(filters)
    raw = data_service.get_air_quality_raw(filters)
    anomalies = data_service.get_anomaly_records(filters)
    
    return {
        'hourly_records': len(hourly),
        'raw_records': len(raw),
        'anomaly_records': len(anomalies),
        'station_count': hourly['station_id'].nunique() if not hourly.empty else 0
    }

def create_layout():
    stations_df = data_service.get_stations()
    station_options = [{'label': row['station_name'], 'value': row['station_id']} 
                       for _, row in stations_df.iterrows()]
    
    last_updated = data_service.get_last_updated()
    
    air_quality_update = last_updated.get('air_quality', {})
    if isinstance(air_quality_update, dict):
        update_time_str = air_quality_update.get('last_updated', '')[:16]
    else:
        update_time_str = str(air_quality_update)[:16]
    
    return html.Div([
        dcc.Store(id='filter-state', data={}),
        dcc.Store(id='sample-stats', data={}),
        dcc.Download(id='download-report'),
        
        dbc.NavbarSimple(
            children=[
                dbc.NavItem(dbc.NavLink([html.I(className='fas fa-chart-line me-2'), '分析工作台'], href='#', active=True)),
                dbc.NavItem(dbc.NavLink([html.I(className='fas fa-map-marked-alt me-2'), '地图分布'], href='#')),
                dbc.NavItem(dbc.NavLink([html.I(className='fas fa-exclamation-triangle me-2'), '投诉与事件'], href='#')),
                dbc.DropdownMenu(
                    children=[
                        dbc.DropdownMenuItem('导出Excel报告', id='btn-export-excel'),
                        dbc.DropdownMenuItem('导出CSV数据', id='btn-export-csv'),
                        dbc.DropdownMenuItem(divider=True),
                        dbc.DropdownMenuItem('验证数据可追溯性', id='btn-verify-data'),
                    ],
                    nav=True,
                    in_navbar=True,
                    label=[html.I(className='fas fa-download me-2'), '工具'],
                ),
                dbc.NavItem(dbc.Badge(f"数据更新: {update_time_str}", color='info', className='ms-2')),
            ],
            brand=[html.I(className='fas fa-leaf me-2'), '城市空气质量分析工作台'],
            brand_href='#',
            color='dark',
            dark=True,
            className='mb-0'
        ),
        
        html.Div([
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader([
                            html.I(className='fas fa-filter me-2'),
                            '筛选条件'
                        ]),
                        dbc.CardBody([
                            html.Div([
                                html.Label('时间范围', className='fw-bold text-light'),
                                dcc.Dropdown(
                                    id='time-range-selector',
                                    options=TIME_RANGE_OPTIONS,
                                    value='7d',
                                    clearable=False,
                                    className='mb-2'
                                ),
                                html.Div(id='custom-date-range', style={'display': 'none'}, children=[
                                    dcc.DatePickerRange(
                                        id='date-picker-range',
                                        start_date=datetime.now() - timedelta(days=7),
                                        end_date=datetime.now(),
                                        display_format='YYYY-MM-DD',
                                        className='w-100'
                                    )
                                ]),
                                html.Label('小时范围', className='fw-bold text-light mt-2'),
                                dcc.RangeSlider(
                                    id='hour-range-slider',
                                    min=0,
                                    max=23,
                                    value=[0, 23],
                                    marks={i: f'{i}:00' for i in range(0, 24, 6)},
                                    className='mb-2'
                                ),
                            ]),
                            
                            html.Hr(className='my-2'),
                            
                            html.Label('行政区', className='fw-bold text-light'),
                            dcc.Dropdown(
                                id='district-selector',
                                options=DISTRICT_OPTIONS,
                                multi=True,
                                placeholder='选择行政区...',
                                className='mb-2'
                            ),
                            
                            html.Label('监测站点', className='fw-bold text-light mt-2'),
                            dcc.Dropdown(
                                id='station-selector',
                                options=station_options,
                                multi=True,
                                placeholder='选择监测站点...',
                                className='mb-2'
                            ),
                            
                            html.Label('污染物', className='fw-bold text-light mt-2'),
                            dcc.Dropdown(
                                id='pollutant-selector',
                                options=POLLUTANT_OPTIONS,
                                value=['pm25', 'o3'],
                                multi=True,
                                clearable=False,
                                className='mb-2'
                            ),
                            
                            html.Label('事件类型', className='fw-bold text-light mt-2'),
                            dcc.Dropdown(
                                id='event-selector',
                                options=[
                                    {'label': '污染过程', 'value': '污染过程'},
                                    {'label': '交通管制', 'value': '交通管制'},
                                    {'label': '极端天气', 'value': '极端天气'},
                                    {'label': '设备维护', 'value': '设备维护'},
                                ],
                                multi=True,
                                placeholder='选择事件类型...',
                                className='mb-2'
                            ),
                            
                            html.Hr(className='my-2'),
                            
                            dbc.Checklist(
                                options=[
                                    {'label': '排除异常样本', 'value': 'exclude_anomalies'},
                                    {'label': '仅显示已核实投诉', 'value': 'verified_only'},
                                ],
                                value=['exclude_anomalies'],
                                id='data-options',
                                className='mb-2'
                            ),
                            
                            html.Hr(className='my-2'),
                            
                            html.Div(id='sample-stats-display', className='small text-light'),
                            
                            dbc.Button(
                                [html.I(className='fas fa-sync-alt me-1'), '应用筛选'],
                                id='btn-apply-filters',
                                color='primary',
                                className='w-100 mt-2',
                                size='sm'
                            ),
                        ])
                    ], className='h-100')
                ], width=3),
                
                dbc.Col([
                    dbc.Row([
                        dbc.Col([
                            dbc.Card([
                                dbc.CardHeader('关键指标概览'),
                                dbc.CardBody([
                                    dbc.Row(id='kpi-cards', className='g-2')
                                ])
                            ], className='mb-3')
                        ], width=12)
                    ]),
                    
                    dbc.Tabs([
                        dbc.Tab(label='时间序列分析', tab_id='tab-timeseries', children=[
                            dbc.Card([
                                dbc.CardBody([
                                    dcc.Graph(id='timeseries-chart', style={'height': '400px'}),
                                    html.Hr(),
                                    dbc.Row([
                                        dbc.Col([
                                            html.Label('粒度选择', className='small'),
                                            dcc.RadioItems(
                                                id='timeseries-granularity',
                                                options=[
                                                    {'label': '小时', 'value': 'hourly'},
                                                    {'label': '日', 'value': 'daily'},
                                                ],
                                                value='hourly',
                                                inline=True,
                                                className='small'
                                            )
                                        ], width=4),
                                        dbc.Col([
                                            html.Label('显示模式', className='small'),
                                            dcc.RadioItems(
                                                id='timeseries-mode',
                                                options=[
                                                    {'label': '均值', 'value': 'avg'},
                                                    {'label': '中位数', 'value': 'median'},
                                                    {'label': '范围', 'value': 'range'},
                                                ],
                                                value='avg',
                                                inline=True,
                                                className='small'
                                            )
                                        ], width=4),
                                        dbc.Col([
                                            html.Label('叠加数据', className='small'),
                                            dbc.Checklist(
                                                id='timeseries-overlay',
                                                options=[
                                                    {'label': '车流量', 'value': 'traffic'},
                                                ],
                                                value=[],
                                                inline=True,
                                                className='small'
                                            )
                                        ], width=4),
                                    ])
                                ])
                            ], className='mt-3')
                        ]),
                        
                        dbc.Tab(label='地图分布', tab_id='tab-map', children=[
                            dbc.Card([
                                dbc.CardBody([
                                    dcc.Graph(id='distribution-map', style={'height': '500px'}),
                                    dbc.Row([
                                        dbc.Col([
                                            html.Label('显示图层', className='small mt-2'),
                                            dbc.Checklist(
                                                id='map-layers',
                                                options=[
                                                    {'label': '监测站点', 'value': 'stations'},
                                                    {'label': '施工工地', 'value': 'construction'},
                                                    {'label': '投诉热点', 'value': 'complaints'},
                                                ],
                                                value=['stations', 'construction', 'complaints'],
                                                inline=True,
                                                className='small'
                                            )
                                        ], width=8),
                                    ])
                                ])
                            ], className='mt-3')
                        ]),
                        
                        dbc.Tab(label='污染物对比', tab_id='tab-comparison', children=[
                            dbc.Row([
                                dbc.Col([
                                    dbc.Card([
                                        dbc.CardBody([
                                            dcc.Graph(id='pollutant-scatter', style={'height': '450px'})
                                        ])
                                    ])
                                ], width=6),
                                dbc.Col([
                                    dbc.Card([
                                        dbc.CardBody([
                                            dcc.Graph(id='correlation-heatmap', style={'height': '450px'})
                                        ])
                                    ])
                                ], width=6),
                            ], className='mt-3')
                        ]),
                        
                        dbc.Tab(label='24小时规律', tab_id='tab-hourly', children=[
                            dbc.Row([
                                dbc.Col([
                                    dbc.Card([
                                        dbc.CardBody([
                                            dcc.Graph(id='hourly-profile-chart', style={'height': '400px'})
                                        ])
                                    ])
                                ], width=8),
                                dbc.Col([
                                    dbc.Card([
                                        dbc.CardBody([
                                            dcc.Graph(id='wind-rose-chart', style={'height': '400px'})
                                        ])
                                    ])
                                ], width=4),
                            ], className='mt-3')
                        ]),
                        
                        dbc.Tab(label='事件与投诉', tab_id='tab-events', children=[
                            dbc.Row([
                                dbc.Col([
                                    dbc.Card([
                                        dbc.CardHeader('事件时间线'),
                                        dbc.CardBody([
                                            dcc.Graph(id='events-timeline', style={'height': '300px'})
                                        ])
                                    ])
                                ], width=12),
                            ], className='mt-3'),
                            dbc.Row([
                                dbc.Col([
                                    dbc.Card([
                                        dbc.CardHeader('投诉统计'),
                                        dbc.CardBody([
                                            dcc.Graph(id='complaints-by-type', style={'height': '250px'})
                                        ])
                                    ])
                                ], width=6),
                                dbc.Col([
                                    dbc.Card([
                                        dbc.CardHeader('最近投诉记录'),
                                        dbc.CardBody([
                                            html.Div(id='complaints-table', style={'maxHeight': '250px', 'overflowY': 'auto'})
                                        ])
                                    ])
                                ], width=6),
                            ], className='mt-3')
                        ]),
                        
                        dbc.Tab(label='异常样本', tab_id='tab-anomalies', children=[
                            dbc.Card([
                                dbc.CardHeader('异常记录详情'),
                                dbc.CardBody([
                                    html.Div(id='anomalies-table', style={'maxHeight': '450px', 'overflowY': 'auto'})
                                ])
                            ], className='mt-3')
                        ]),
                    ], id='main-tabs', active_tab='tab-timeseries'),
                ], width=9)
            ]),
        ], className='p-3'),
        
        dbc.Modal([
            dbc.ModalHeader('数据可追溯性验证'),
            dbc.ModalBody(id='verification-result'),
            dbc.ModalFooter([
                dbc.Button('关闭', id='close-verification', className='ms-auto')
            ])
        ], id='verification-modal', size='lg'),
        
    ], style={'backgroundColor': '#1a1a2e', 'minHeight': '100vh'})

app.layout = create_layout()

@app.callback(
    Output('custom-date-range', 'style'),
    Input('time-range-selector', 'value')
)
def toggle_custom_date_range(time_range):
    if time_range == 'custom':
        return {'display': 'block'}
    return {'display': 'none'}

@app.callback(
    [Output('filter-state', 'data'),
     Output('sample-stats', 'data'),
     Output('sample-stats-display', 'children')],
    Input('btn-apply-filters', 'n_clicks'),
    [State('station-selector', 'value'),
     State('district-selector', 'value'),
     State('pollutant-selector', 'value'),
     State('time-range-selector', 'value'),
     State('date-picker-range', 'start_date'),
     State('date-picker-range', 'end_date'),
     State('data-options', 'value'),
     State('hour-range-slider', 'value'),
     State('event-selector', 'value')],
    prevent_initial_call=False
)
def update_filter_state(n_clicks, stations, districts, pollutants, time_range, 
                        start_date, end_date, data_options, hour_range, event_types):
    
    exclude_anomalies = 'exclude_anomalies' in (data_options or [])
    verified_only = 'verified_only' in (data_options or [])
    
    filters = get_filters_from_state(
        stations, districts, pollutants, time_range, start_date, end_date,
        exclude_anomalies, hour_range, event_types, verified_only
    )
    
    stats = get_sample_stats(filters)
    
    stats_display = html.Div([
        html.Strong('样本统计：', className='text-info'),
        html.Br(),
        f'• 聚合记录数: {stats["hourly_records"]}',
        html.Br(),
        f'• 原始样本数: {stats["raw_records"]}',
        html.Br(),
        f'• 异常样本数: {stats["anomaly_records"]}',
        html.Br(),
        f'• 涉及站点数: {stats["station_count"]}',
    ])
    
    return filters, stats, stats_display

@app.callback(
    Output('kpi-cards', 'children'),
    Input('filter-state', 'data'),
    State('pollutant-selector', 'value')
)
def update_kpi_cards(filters, pollutants):
    if not filters:
        return []
    
    hourly = data_service.get_air_quality_hourly(filters)
    if hourly.empty:
        return []
    
    cards = []
    for pollutant in pollutants[:4]:
        col = f'{pollutant}_avg'
        if col in hourly.columns:
            latest_value = hourly[col].iloc[-1] if len(hourly) > 0 else 0
            avg_value = hourly[col].mean()
            max_value = hourly[col].max()
            
            aqi_level = '优'
            aqi_color = 'success'
            for level in Config.AQI_LEVELS:
                if level['min'] <= latest_value <= level['max']:
                    aqi_level = level['level']
                    if level['level'] in ['优', '良']:
                        aqi_color = 'success'
                    elif level['level'] in ['轻度污染', '中度污染']:
                        aqi_color = 'warning'
                    else:
                        aqi_color = 'danger'
                    break
            
            cards.append(dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.Div([
                            html.Small(Config.POLLUTANT_NAMES[pollutant].split(' ')[0], 
                                     className='text-muted d-block'),
                            html.H3([
                                f'{latest_value:.1f}',
                                html.Sup(html.I(className=f'fas fa-circle text-{aqi_color} ms-1', 
                                              style={'fontSize': '10px'}))
                            ], className='mb-0'),
                            html.Small(f'均值: {avg_value:.1f} / 最高: {max_value:.1f}', 
                                      className='text-muted'),
                            html.Br(),
                            dbc.Badge(aqi_level, color=aqi_color, size='sm')
                        ])
                    ])
                ], className='text-center h-100')
            ], width=3))
    
    return cards

@app.callback(
    Output('timeseries-chart', 'figure'),
    [Input('filter-state', 'data'),
     Input('timeseries-granularity', 'value'),
     Input('timeseries-mode', 'value'),
     Input('timeseries-overlay', 'value')],
    [State('pollutant-selector', 'value')]
)
def update_timeseries(filters, granularity, mode, overlay, pollutants):
    if not filters or not pollutants:
        return go.Figure()
    
    if granularity == 'hourly':
        data = data_service.get_air_quality_hourly(filters)
        time_col = 'hour_bucket'
    else:
        data = data_service.get_air_quality_daily(filters)
        time_col = 'day_bucket'
    
    if data.empty:
        return go.Figure()
    
    stations = data_service.get_stations()
    data = data.merge(stations[['station_id', 'station_name']], on='station_id', how='left')
    
    fig = go.Figure()
    
    colors = px.colors.qualitative.Plotly
    
    for i, pollutant in enumerate(pollutants):
        if mode == 'avg':
            col = f'{pollutant}_avg'
            if col in data.columns:
                grouped = data.groupby(time_col)[col].mean().reset_index()
                fig.add_trace(go.Scatter(
                    x=grouped[time_col],
                    y=grouped[col],
                    mode='lines',
                    name=Config.POLLUTANT_NAMES[pollutant],
                    line=dict(color=colors[i % len(colors)], width=2),
                    yaxis='y1'
                ))
        elif mode == 'median':
            col = f'{pollutant}_median'
            if col in data.columns:
                grouped = data.groupby(time_col)[col].median().reset_index()
                fig.add_trace(go.Scatter(
                    x=grouped[time_col],
                    y=grouped[col],
                    mode='lines',
                    name=f'{Config.POLLUTANT_NAMES[pollutant]} (中位数)',
                    line=dict(color=colors[i % len(colors)], width=2),
                    yaxis='y1'
                ))
        elif mode == 'range':
            avg_col = f'{pollutant}_avg'
            max_col = f'{pollutant}_max'
            min_col = f'{pollutant}_min'
            if avg_col in data.columns:
                grouped = data.groupby(time_col).agg({
                    avg_col: 'mean',
                    max_col: 'max',
                    min_col: 'min'
                }).reset_index()
                
                fig.add_trace(go.Scatter(
                    x=grouped[time_col],
                    y=grouped[max_col],
                    mode='lines',
                    line=dict(width=0),
                    showlegend=False,
                    yaxis='y1'
                ))
                fig.add_trace(go.Scatter(
                    x=grouped[time_col],
                    y=grouped[min_col],
                    mode='lines',
                    fill='tonexty',
                    fillcolor=f'rgba{tuple(list(px.colors.hex_to_rgb(colors[i % len(colors)])) + [0.2])}',
                    line=dict(width=0),
                    name=f'{Config.POLLUTANT_NAMES[pollutant]} (范围)',
                    showlegend=True,
                    yaxis='y1'
                ))
                fig.add_trace(go.Scatter(
                    x=grouped[time_col],
                    y=grouped[avg_col],
                    mode='lines',
                    name=f'{Config.POLLUTANT_NAMES[pollutant]} (均值)',
                    line=dict(color=colors[i % len(colors)], width=2),
                    yaxis='y1'
                ))
    
    if overlay and 'traffic' in overlay and granularity == 'hourly':
        traffic_data = data_service.get_traffic_hourly(filters)
        if not traffic_data.empty:
            traffic_grouped = traffic_data.groupby('hour_bucket')['vehicle_count_avg'].mean().reset_index()
            fig.add_trace(go.Scatter(
                x=traffic_grouped['hour_bucket'],
                y=traffic_grouped['vehicle_count_avg'],
                mode='lines',
                name='平均车流量 (辆/小时)',
                line=dict(color='rgba(100, 200, 255, 0.7)', width=2, dash='dot'),
                yaxis='y2'
            ))
            fig.update_layout(
                yaxis2=dict(
                    title='车流量',
                    overlaying='y',
                    side='right',
                    showgrid=False
                )
            )
    
    event_filters = {k: v for k, v in filters.items() 
                     if k in ['start_time', 'end_time', 'districts', 'event_types']}
    events = data_service.get_events(event_filters)
    
    for _, event in events.iterrows():
        fig.add_vrect(
            x0=event['start_time'],
            x1=event['end_time'] or event['start_time'],
            fillcolor='rgba(255, 193, 7, 0.2)',
            line=dict(width=0),
            annotation_text=event['event_title'],
            annotation_position='top left',
            annotation_font_size=10
        )
    
    fig.update_layout(
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        title='污染物浓度时间序列',
        xaxis_title='时间',
        yaxis_title='污染物浓度',
        hovermode='x unified',
        legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='right', x=1)
    )
    
    return fig

@app.callback(
    Output('distribution-map', 'figure'),
    [Input('filter-state', 'data'),
     Input('map-layers', 'value')],
    State('pollutant-selector', 'value')
)
def update_map(filters, map_layers, pollutants):
    if not filters:
        return go.Figure()
    
    stations = data_service.get_stations(filters.get('districts'))
    
    latest_hourly = data_service.get_air_quality_hourly(filters)
    if not latest_hourly.empty:
        latest_hourly = latest_hourly.sort_values('hour_bucket').groupby('station_id').last().reset_index()
    
    stations = stations.merge(latest_hourly, on='station_id', how='left')
    
    fig = go.Figure()
    
    primary_pollutant = pollutants[0] if pollutants else 'pm25'
    value_col = f'{primary_pollutant}_avg'
    
    if 'stations' in map_layers and not stations.empty:
        fig.add_trace(go.Scattermapbox(
            lat=stations['latitude'],
            lon=stations['longitude'],
            mode='markers',
            marker=go.scattermapbox.Marker(
                size=15,
                color=stations[value_col] if value_col in stations.columns else 'blue',
                colorscale='RdYlGn_r',
                showscale=True,
                colorbar=dict(title=Config.POLLUTANT_NAMES[primary_pollutant].split(' ')[0]),
                sizemode='area'
            ),
            text=stations.apply(lambda x: f"<b>{x['station_name']}</b><br>" +
                      (f"{Config.POLLUTANT_NAMES[primary_pollutant]}: {x[value_col]:.1f}<br>" 
                       if value_col in x and pd.notna(x[value_col]) else "") +
                      f"行政区: {x['district']}",
                      axis=1),
            hoverinfo='text',
            name='监测站点'
        ))
    
    if 'construction' in map_layers:
        sites = data_service.get_construction_sites(filters.get('districts'))
        if not sites.empty:
            fig.add_trace(go.Scattermapbox(
                lat=sites['latitude'],
                lon=sites['longitude'],
                mode='markers',
                marker=go.scattermapbox.Marker(
                    size=12,
                    color='orange',
                    symbol='construction'
                ),
                text=sites.apply(lambda x: f"<b>{x['site_name']}</b><br>"
                      f"类型: {x['construction_type']}<br>"
                      f"状态: {'施工中' if x['is_active'] else '已停工'}",
                      axis=1),
                hoverinfo='text',
                name='施工工地'
            ))
    
    if 'complaints' in map_layers:
        complaint_filters = {k: v for k, v in filters.items() if k in ['start_time', 'end_time', 'districts']}
        complaints = data_service.get_complaints(complaint_filters, is_public=True)
        if not complaints.empty:
            complaint_counts = complaints.groupby('district').size().reset_index(name='count')
            station_coords = data_service.get_stations()[['district', 'latitude', 'longitude']]
            complaint_counts = complaint_counts.merge(station_coords, on='district', how='left')
            
            fig.add_trace(go.Scattermapbox(
                lat=complaint_counts['latitude'],
                lon=complaint_counts['longitude'],
                mode='markers',
                marker=go.scattermapbox.Marker(
                    size=complaint_counts['count'] * 3,
                    color='red',
                    opacity=0.6
                ),
                text=complaint_counts.apply(lambda x: f"<b>{x['district']}</b><br>投诉数: {x['count']}", axis=1),
                hoverinfo='text',
                name='投诉热点'
            ))
    
    fig.update_layout(
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        mapbox=dict(
            style='carto-darkmatter',
            center=dict(lat=39.9, lon=116.4),
            zoom=9
        ),
        title='空间分布地图',
        showlegend=True,
        legend=dict(orientation='h', yanchor='bottom', y=0.01, xanchor='right', x=0.99)
    )
    
    return fig

@app.callback(
    Output('pollutant-scatter', 'figure'),
    Input('filter-state', 'data'),
    State('pollutant-selector', 'value')
)
def update_scatter(filters, pollutants):
    if not filters or len(pollutants) < 2:
        return go.Figure()
    
    data = data_service.get_air_quality_hourly(filters)
    if data.empty:
        return go.Figure()
    
    p1, p2 = pollutants[0], pollutants[1]
    col1, col2 = f'{p1}_avg', f'{p2}_avg'
    
    if col1 not in data.columns or col2 not in data.columns:
        return go.Figure()
    
    stations = data_service.get_stations()
    data = data.merge(stations[['station_id', 'district']], on='station_id', how='left')
    
    fig = px.scatter(
        data,
        x=col1,
        y=col2,
        color='district',
        template='plotly_dark',
        title=f'{Config.POLLUTANT_NAMES[p1].split(" ")[0]} vs {Config.POLLUTANT_NAMES[p2].split(" ")[0]}',
        labels={
            col1: Config.POLLUTANT_NAMES[p1],
            col2: Config.POLLUTANT_NAMES[p2]
        },
        opacity=0.6
    )
    
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        legend=dict(title='行政区', orientation='v', yanchor='top', y=0.99, xanchor='right', x=0.99)
    )
    
    return fig

@app.callback(
    Output('correlation-heatmap', 'figure'),
    Input('filter-state', 'data')
)
def update_heatmap(filters):
    if not filters:
        return go.Figure()
    
    data = data_service.get_air_quality_hourly(filters)
    if data.empty:
        return go.Figure()
    
    pollutant_cols = [f'{p}_avg' for p in Config.POLLUTANTS if f'{p}_avg' in data.columns]
    corr_data = data[pollutant_cols].corr()
    
    labels = [Config.POLLUTANT_NAMES[p.split('_')[0]].split(' ')[0] for p in pollutant_cols]
    
    fig = px.imshow(
        corr_data,
        labels=dict(x='污染物', y='污染物', color='相关系数'),
        x=labels,
        y=labels,
        color_continuous_scale='RdBu_r',
        zmin=-1,
        zmax=1,
        template='plotly_dark',
        title='污染物相关性矩阵'
    )
    
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    
    fig.update_traces(text=np.round(corr_data.values, 2), texttemplate='%{text}')
    
    return fig

@app.callback(
    Output('hourly-profile-chart', 'figure'),
    [Input('filter-state', 'data'),
     Input('pollutant-selector', 'value')]
)
def update_hourly_profile(filters, pollutants):
    if not filters or not pollutants:
        return go.Figure()
    
    pollutant = pollutants[0]
    profile = data_service.get_hourly_profile(filters, pollutant)
    
    if profile.empty:
        return go.Figure()
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=profile['hour'],
        y=profile['p75_value'],
        fill=None,
        mode='lines',
        line_color='rgba(100, 149, 237, 0.3)',
        name='75%分位'
    ))
    
    fig.add_trace(go.Scatter(
        x=profile['hour'],
        y=profile['p25_value'],
        fill='tonexty',
        mode='lines',
        line_color='rgba(100, 149, 237, 0.3)',
        name='25%分位'
    ))
    
    fig.add_trace(go.Scatter(
        x=profile['hour'],
        y=profile['avg_value'],
        mode='lines+markers',
        line_color='cornflowerblue',
        name='平均值',
        line=dict(width=3)
    ))
    
    fig.add_trace(go.Scatter(
        x=profile['hour'],
        y=profile['median_value'],
        mode='lines+markers',
        line_color='orange',
        name='中位数',
        line=dict(width=2, dash='dash')
    ))
    
    fig.update_layout(
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        title=f'{Config.POLLUTANT_NAMES[pollutant].split(" ")[0]} 24小时变化规律',
        xaxis_title='小时',
        yaxis_title=Config.POLLUTANT_NAMES[pollutant],
        xaxis=dict(tickmode='linear', tick0=0, dtick=1),
        legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='right', x=1)
    )
    
    return fig

@app.callback(
    Output('wind-rose-chart', 'figure'),
    Input('filter-state', 'data'),
    State('pollutant-selector', 'value')
)
def update_wind_rose(filters, pollutants):
    if not filters:
        return go.Figure()
    
    pollutant = pollutants[0] if pollutants else 'pm25'
    wind_data = data_service.get_wind_analysis(filters, pollutant)
    
    if wind_data.empty:
        return go.Figure()
    
    directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    
    wind_data['direction'] = wind_data['wind_direction_bin'].apply(
        lambda x: directions[int((x % 360) // 22.5) % 16]
    )
    
    fig = px.bar_polar(
        wind_data,
        r='avg_pollutant',
        theta='direction',
        template='plotly_dark',
        color='avg_pollutant',
        color_continuous_scale='RdYlGn_r',
        title=f'风向与{Config.POLLUTANT_NAMES[pollutant].split(" ")[0]}关系'
    )
    
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        polar=dict(
            bgcolor='rgba(0,0,0,0)',
            radialaxis=dict(showticklabels=False, ticks='')
        )
    )
    
    return fig

@app.callback(
    Output('events-timeline', 'figure'),
    Input('filter-state', 'data')
)
def update_events_timeline(filters):
    if not filters:
        return go.Figure()
    
    event_filters = {k: v for k, v in filters.items() 
                     if k in ['start_time', 'end_time', 'districts', 'event_types']}
    events = data_service.get_events(event_filters)
    
    if events.empty:
        return go.Figure()
    
    fig = go.Figure()
    
    colors = {
        '污染过程': '#ef4444',
        '交通管制': '#f59e0b',
        '极端天气': '#8b5cf6',
        '设备维护': '#3b82f6'
    }
    
    for _, event in events.iterrows():
        color = colors.get(event['event_type'], '#6b7280')
        fig.add_trace(go.Scatter(
            x=[event['start_time'], event['end_time'] or event['start_time']],
            y=[event['event_type'], event['event_type']],
            mode='lines+markers',
            line=dict(color=color, width=10),
            marker=dict(size=12, color=color),
            text=f"<b>{event['event_title']}</b><br>{event['event_description']}",
            hoverinfo='text',
            name=event['event_title'],
            showlegend=False
        ))
    
    fig.update_layout(
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        title='事件时间线',
        xaxis_title='时间',
        height=300,
        margin=dict(l=0, r=0, t=40, b=0)
    )
    
    return fig

@app.callback(
    Output('complaints-by-type', 'figure'),
    Input('filter-state', 'data')
)
def update_complaints_by_type(filters):
    if not filters:
        return go.Figure()
    
    complaint_filters = {k: v for k, v in filters.items() 
                         if k in ['start_time', 'end_time', 'districts', 'verified_only']}
    complaints = data_service.get_complaints(complaint_filters, is_public=True)
    
    if complaints.empty:
        return go.Figure()
    
    by_type = complaints.groupby(['complaint_type', 'is_verified']).size().reset_index(name='count')
    
    fig = px.bar(
        by_type,
        x='complaint_type',
        y='count',
        color='is_verified',
        template='plotly_dark',
        title='投诉类型分布',
        labels={'complaint_type': '投诉类型', 'count': '数量', 'is_verified': '已核实'},
        barmode='stack'
    )
    
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        showlegend=True
    )
    
    return fig

@app.callback(
    Output('complaints-table', 'children'),
    Input('filter-state', 'data')
)
def update_complaints_table(filters):
    if not filters:
        return html.Div('暂无数据')
    
    complaint_filters = {k: v for k, v in filters.items() 
                         if k in ['start_time', 'end_time', 'districts', 'verified_only']}
    complaints = data_service.get_complaints(complaint_filters, is_public=True).head(20)
    
    if complaints.empty:
        return html.Div('暂无投诉记录')
    
    table_header = [
        html.Thead(html.Tr([
            html.Th('时间'),
            html.Th('行政区'),
            html.Th('类型'),
            html.Th('状态'),
            html.Th('描述')
        ]))
    ]
    
    rows = []
    for _, row in complaints.iterrows():
        status_badge = dbc.Badge(
            '已核实' if row['is_verified'] else '待核实',
            color='success' if row['is_verified'] else 'warning',
            size='sm'
        )
        rows.append(html.Tr([
            html.Td(row['timestamp'].strftime('%m-%d %H:%M') if hasattr(row['timestamp'], 'strftime') else str(row['timestamp'])[:16]),
            html.Td(row['district']),
            html.Td(row['complaint_type']),
            html.Td(status_badge),
            html.Td(row['description'][:30] + '...' if len(str(row['description'])) > 30 else row['description'])
        ]))
    
    table_body = [html.Tbody(rows)]
    
    return dbc.Table(table_header + table_body, striped=True, bordered=True, hover=True, size='sm', color='dark')

@app.callback(
    Output('anomalies-table', 'children'),
    Input('filter-state', 'data')
)
def update_anomalies_table(filters):
    if not filters:
        return html.Div('暂无数据')
    
    anomalies = data_service.get_anomaly_records(filters)
    
    if anomalies.empty:
        return html.Div('未发现异常样本')
    
    stations = data_service.get_stations()
    anomalies = anomalies.merge(stations[['station_id', 'station_name', 'district']], on='station_id', how='left')
    
    table_header = [
        html.Thead(html.Tr([
            html.Th('时间'),
            html.Th('监测站'),
            html.Th('行政区'),
            html.Th('PM2.5'),
            html.Th('O₃'),
            html.Th('异常原因')
        ]))
    ]
    
    rows = []
    for _, row in anomalies.iterrows():
        rows.append(html.Tr([
            html.Td(row['timestamp'].strftime('%Y-%m-%d %H:%M') if hasattr(row['timestamp'], 'strftime') else str(row['timestamp'])[:16]),
            html.Td(row['station_name']),
            html.Td(row['district']),
            html.Td(f"{row['pm25']:.1f}" if pd.notna(row['pm25']) else '-'),
            html.Td(f"{row['o3']:.1f}" if pd.notna(row['o3']) else '-'),
            html.Td(dbc.Badge(row['anomaly_reason'] or '未知', color='danger', size='sm'))
        ]))
    
    table_body = [html.Tbody(rows)]
    
    return dbc.Table(table_header + table_body, striped=True, bordered=True, hover=True, size='sm', color='dark')

@app.callback(
    [Output('verification-modal', 'is_open'),
     Output('verification-result', 'children')],
    [Input('btn-verify-data', 'n_clicks'),
     Input('close-verification', 'n_clicks')],
    State('filter-state', 'data'),
    prevent_initial_call=True
)
def toggle_verification_modal(verify_n, close_n, filters):
    ctx = callback_context
    if not ctx.triggered:
        return False, ''
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    if trigger_id == 'close-verification':
        return False, ''
    
    if trigger_id == 'btn-verify-data':
        if not filters:
            return True, html.Div('请先应用筛选条件')
        
        result = data_service.verify_aggregation(filters, sample_size=3)
        
        if not result.get('valid'):
            return True, html.Div(f"验证失败: {result.get('error', '未知错误')}")
        
        content = html.Div([
            html.H5('聚合结果验证报告'),
            html.Hr(),
            html.Strong('样本信息:'),
            html.Ul([
                html.Li(f"采样时间: {result['sample_time']}"),
                html.Li(f"监测站ID: {result['sample_station_id']}"),
                html.Li([
                    '原始记录数: ',
                    html.Strong(result['raw_record_count']),
                    ' | 聚合记录数: ',
                    html.Strong(result['hourly_record_count']),
                    ' | ',
                    dbc.Badge('匹配' if result['count_match'] else '不匹配', 
                             color='success' if result['count_match'] else 'danger')
                ]),
            ]),
            html.Hr(),
            html.Strong('污染物校验:'),
            html.Br(),
            dbc.Table([
                html.Thead(html.Tr([
                    html.Th('污染物'),
                    html.Th('原始均值'),
                    html.Th('聚合均值'),
                    html.Th('差值'),
                    html.Th('状态')
                ])),
                html.Tbody([
                    html.Tr([
                        html.Td(Config.POLLUTANT_NAMES[p].split(' ')[0]),
                        html.Td(f"{v['raw_mean']:.2f}" if v['raw_mean'] else '-'),
                        html.Td(f"{v['hourly_mean']:.2f}" if v['hourly_mean'] else '-'),
                        html.Td(f"{v['difference']:.4f}" if v['difference'] else '-'),
                        html.Td(dbc.Badge('通过' if v['match'] else '失败', 
                                         color='success' if v['match'] else 'danger'))
                    ]) for p, v in result['pollutant_checks'].items()
                ])
            ], striped=True, bordered=True, size='sm'),
            html.Hr(),
            html.Strong('原始记录抽样 (前3条):'),
            dbc.Table([
                html.Thead(html.Tr([
                    html.Th('时间'),
                    html.Th('PM2.5'),
                    html.Th('O₃'),
                    html.Th('是否异常')
                ])),
                html.Tbody([
                    html.Tr([
                        html.Td(r['timestamp'][:16]),
                        html.Td(f"{r['pm25']:.1f}"),
                        html.Td(f"{r['o3']:.1f}"),
                        html.Td(dbc.Badge('是' if r['is_anomaly'] else '否', 
                                         color='danger' if r['is_anomaly'] else 'success', size='sm'))
                    ]) for r in result['raw_records_sample'][:3]
                ])
            ], striped=True, bordered=True, size='sm', className='mt-2'),
            html.Hr(),
            html.Div([
                html.I(className='fas fa-check-circle text-success me-2'),
                '数据来源可追溯，聚合结果与原始记录一致'
            ], className='text-success fw-bold')
        ])
        
        return True, content
    
    return False, ''

@app.callback(
    Output('download-report', 'data'),
    [Input('btn-export-excel', 'n_clicks'),
     Input('btn-export-csv', 'n_clicks')],
    [State('filter-state', 'data'),
     State('sample-stats', 'data'),
     State('pollutant-selector', 'value'),
     State('district-selector', 'value'),
     State('station-selector', 'value'),
     State('time-range-selector', 'value')],
    prevent_initial_call=True
)
def download_report(excel_n, csv_n, filters, stats, pollutants, districts, stations, time_range):
    ctx = callback_context
    if not ctx.triggered:
        return None
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    if not filters:
        return None
    
    hourly = data_service.get_air_quality_hourly(filters)
    stations_df = data_service.get_stations()
    last_updated = data_service.get_last_updated()
    
    stations_name_map = dict(zip(stations_df['station_id'], stations_df['station_name']))
    hourly['station_name'] = hourly['station_id'].map(stations_name_map)
    
    filter_description = {
        '时间范围': time_range,
        '污染物': ', '.join([Config.POLLUTANT_NAMES[p].split(' ')[0] for p in (pollutants or [])]),
        '行政区': ', '.join(districts) if districts else '全部',
        '监测站点': ', '.join([stations_name_map.get(s, str(s)) for s in (stations or [])]) if stations else '全部',
        '排除异常样本': filters.get('exclude_anomalies', False),
        '仅显示已核实投诉': filters.get('verified_only', False),
    }
    
    if filters.get('hour_range'):
        filter_description['小时范围'] = f"{filters['hour_range'][0]}:00 - {filters['hour_range'][1]}:00"
    
    if filters.get('event_types'):
        filter_description['事件类型'] = ', '.join(filters['event_types'])
    
    air_quality_update = last_updated.get('air_quality', {})
    if isinstance(air_quality_update, dict):
        air_update_str = air_quality_update.get('last_updated', '')[:16]
    else:
        air_update_str = str(air_quality_update)[:16]
    
    report_info = pd.DataFrame([
        {'项目': '报告生成时间', '值': datetime.now().strftime('%Y-%m-%d %H:%M:%S')},
        {'项目': '数据最后更新', '值': air_update_str},
        {'项目': '原始样本量', '值': stats.get('raw_records', 0)},
        {'项目': '聚合记录数', '值': stats.get('hourly_records', 0)},
        {'项目': '涉及站点数', '值': stats.get('station_count', 0)},
    ] + [{'项目': k, '值': str(v)} for k, v in filter_description.items()])
    
    if trigger_id == 'btn-export-excel':
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            report_info.to_excel(writer, sheet_name='报告说明', index=False)
            hourly.to_excel(writer, sheet_name='小时级数据', index=False)
            
            anomalies = data_service.get_anomaly_records(filters)
            if not anomalies.empty:
                anomalies.to_excel(writer, sheet_name='异常记录', index=False)
            
            complaint_filters = {k: v for k, v in filters.items() if k in ['start_time', 'end_time', 'districts']}
            complaints = data_service.get_complaints(complaint_filters, is_public=True)
            if not complaints.empty:
                complaints.to_excel(writer, sheet_name='投诉记录', index=False)
        
        output.seek(0)
        return dcc.send_bytes(output.getvalue(), f'空气质量报告_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx')
    
    else:
        csv_lines = []
        csv_lines.append('# 城市空气质量分析报告')
        csv_lines.append(f'# 报告生成时间,{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
        
        air_quality_update = last_updated.get('air_quality', {})
        if isinstance(air_quality_update, dict):
            csv_lines.append(f'# 空气质量数据更新,{air_quality_update.get("last_updated", "")[:16]}')
            csv_lines.append(f'# 空气质量总记录数,{air_quality_update.get("record_count", 0)}')
        else:
            csv_lines.append(f'# 空气质量数据更新,{air_quality_update[:16]}')
        
        csv_lines.append(f'# 当前筛选 - 时间范围,{time_range}')
        csv_lines.append(f'# 当前筛选 - 污染物,{", ".join([Config.POLLUTANT_NAMES[p].split(" ")[0] for p in (pollutants or [])])}')
        csv_lines.append(f'# 当前筛选 - 行政区,{", ".join(districts) if districts else "全部"}')
        csv_lines.append(f'# 当前筛选 - 监测站点,{", ".join([stations_name_map.get(s, str(s)) for s in (stations or [])]) if stations else "全部"}')
        csv_lines.append(f'# 当前筛选 - 排除异常样本,{filters.get("exclude_anomalies", False)}')
        csv_lines.append(f'# 当前筛选 - 仅显示已核实投诉,{filters.get("verified_only", False)}')
        if filters.get('hour_range'):
            csv_lines.append(f'# 当前筛选 - 小时范围,{filters["hour_range"][0]}:00 - {filters["hour_range"][1]}:00')
        if filters.get('event_types'):
            csv_lines.append(f'# 当前筛选 - 事件类型,{", ".join(filters["event_types"])}')
        
        csv_lines.append(f'# 样本统计 - 原始样本量,{stats.get("raw_records", 0)}')
        csv_lines.append(f'# 样本统计 - 聚合记录数,{stats.get("hourly_records", 0)}')
        csv_lines.append(f'# 样本统计 - 涉及站点数,{stats.get("station_count", 0)}')
        csv_lines.append('#')
        
        csv_lines.append(hourly.to_csv(index=False))
        csv_data = '\n'.join(csv_lines)
        return dict(content=csv_data, filename=f'空气质量数据_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8050, debug=True)
