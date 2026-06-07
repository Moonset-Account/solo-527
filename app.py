import dash
from dash import dcc, html, dash_table, Input, Output, State, callback_context
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
from data_service import DataService

load_dotenv()

app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP], suppress_callback_exceptions=True)
app.title = '冷库温区利用率分析工作台'

ds = DataService()

zones_df = ds.get_zones()
customers = ds.get_customers()
product_types = ds.get_product_types()

app.layout = dbc.Container([
    html.H1('冷库温区利用率分析运营复盘工作台', className='text-center my-4'),
    
    dbc.Row([
        dbc.Col([
            html.Div([
                html.H5('筛选条件', className='mb-3'),
                html.Label('选择温区：'),
                dcc.Dropdown(
                    id='zone-filter',
                    options=[{'label': row.zone_name, 'value': row.id} for _, row in zones_df.iterrows()],
                    value=zones_df['id'].tolist(),
                    multi=True,
                    className='mb-3'
                ),
                html.Label('选择客户：'),
                dcc.Dropdown(
                    id='customer-filter',
                    options=[{'label': c, 'value': c} for c in customers],
                    value=[],
                    multi=True,
                    className='mb-3'
                ),
                html.Label('货品类型：'),
                dcc.Dropdown(
                    id='product-filter',
                    options=[{'label': p, 'value': p} for p in product_types],
                    value=[],
                    multi=True,
                    className='mb-3'
                ),
                html.Label('日期范围：'),
                dcc.DatePickerRange(
                    id='date-range',
                    start_date=datetime.now() - timedelta(days=30),
                    end_date=datetime.now(),
                    display_format='YYYY-MM-DD',
                    className='mb-3'
                ),
                dbc.Checkbox(
                    id='exclude-alarm-inbound',
                    label='排除报警期间入库数据',
                    value=False,
                    className='mb-3'
                ),
                dbc.Button('应用筛选', id='apply-filter', color='primary', className='w-100')
            ], style={'background': '#f8f9fa', 'padding': '15px', 'border-radius': '8px'})
        ], width=3),
        
        dbc.Col([
            dbc.Tabs([
                dbc.Tab(label='概览仪表盘', tab_id='overview'),
                dbc.Tab(label='温区热力图', tab_id='heatmap'),
                dbc.Tab(label='报警分析', tab_id='alarm'),
                dbc.Tab(label='库位占用', tab_id='location'),
                dbc.Tab(label='客户对比', tab_id='customer'),
                dbc.Tab(label='明细数据', tab_id='detail'),
                dbc.Tab(label='口径说明', tab_id='metrics')
            ], id='main-tabs', active_tab='overview'),
            
            html.Div(id='overview-content', className='mt-4'),
            
            html.Div(id='heatmap-container', className='mt-4', style={'display': 'none'}, children=[
                dbc.Row([
                    dbc.Col([
                        html.Label('选择温区查看热力图：'),
                        dcc.Dropdown(
                            id='heatmap-zone-select',
                            options=[{'label': row.zone_name, 'value': row.id} for _, row in zones_df.iterrows()],
                            value=zones_df['id'].iloc[0] if not zones_df.empty else None,
                            className='mb-3'
                        )
                    ], width=6),
                    dbc.Col([
                        html.Label('选择日期：'),
                        dcc.DatePickerSingle(
                            id='heatmap-date',
                            date=datetime.now().strftime('%Y-%m-%d'),
                            display_format='YYYY-MM-DD',
                            className='mb-3'
                        )
                    ], width=6)
                ]),
                html.Hr(),
                html.Div(id='heatmap-chart')
            ]),
            
            html.Div(id='alarm-content', className='mt-4', style={'display': 'none'}),
            html.Div(id='location-content', className='mt-4', style={'display': 'none'}),
            html.Div(id='customer-content', className='mt-4', style={'display': 'none'}),
            
            html.Div(id='detail-container', className='mt-4', style={'display': 'none'}, children=[
                dbc.Tabs([
                    dbc.Tab(label='批次明细', tab_id='batch-detail'),
                    dbc.Tab(label='入库明细', tab_id='inbound-detail'),
                    dbc.Tab(label='出库明细', tab_id='outbound-detail'),
                    dbc.Tab(label='开门记录', tab_id='door-detail'),
                    dbc.Tab(label='温度记录', tab_id='temp-detail')
                ], id='detail-tabs', active_tab='batch-detail'),
                html.Hr(),
                html.Div(id='detail-table')
            ]),
            
            html.Div(id='metrics-content', className='mt-4', style={'display': 'none'})
        ], width=9)
    ]),
    
    dbc.Modal([
        dbc.ModalHeader('添加人工备注'),
        dbc.ModalBody([
            dcc.Store(id='note-related-type'),
            dcc.Store(id='note-related-id'),
            dbc.Textarea(id='note-text', placeholder='请输入备注内容...', rows=4, className='mb-3'),
            dbc.Input(id='note-author', placeholder='备注人', className='mb-3'),
            dbc.Checkbox(id='note-is-anomaly', label='标记为异常点', value=False)
        ]),
        dbc.ModalFooter([
            dbc.Button('取消', id='cancel-note', color='secondary'),
            dbc.Button('保存', id='save-note', color='primary')
        ])
    ], id='note-modal', is_open=False)
], fluid=True)


def generate_kpi_cards(zone_ids, start_date, end_date):
    utilization = ds.get_utilization_by_zone(start_date, end_date)
    alarms = ds.get_alarms(zone_ids, start_date, end_date)
    inbound = ds.get_inbound_records(zone_ids, start_date, end_date, include_alarm_period=True)
    outbound = ds.get_outbound_records(zone_ids, start_date, end_date)
    
    avg_utilization = utilization['utilization_rate'].mean() if not utilization.empty else 0
    total_alarm_hours = alarms['duration_hours'].sum() if not alarms.empty else 0
    total_inbound = inbound['quantity'].sum() if not inbound.empty else 0
    total_outbound = outbound['quantity'].sum() if not outbound.empty else 0
    
    return dbc.Row([
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H4(f'{avg_utilization:.1f}%', className='card-title text-primary'),
                html.P('平均库位利用率', className='card-text')
            ])
        ])),
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H4(f'{total_alarm_hours:.1f}h', className='card-title text-danger'),
                html.P('累计报警时长', className='card-text')
            ])
        ])),
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H4(f'{int(total_inbound)}', className='card-title text-success'),
                html.P('入库托盘数', className='card-text')
            ])
        ])),
        dbc.Col(dbc.Card([
            dbc.CardBody([
                html.H4(f'{int(total_outbound)}', className='card-title text-info'),
                html.P('出库托盘数', className='card-text')
            ])
        ]))
    ], className='mb-4')


def generate_overview_charts(zone_ids, start_date, end_date, exclude_alarm):
    charts = []
    
    temp_stats = ds.get_temperature_stats(zone_ids, start_date, end_date)
    if not temp_stats.empty:
        fig_temp = go.Figure()
        for _, row in temp_stats.iterrows():
            fig_temp.add_trace(go.Bar(
                x=[row['zone_name']],
                y=[row['avg_temp']],
                name=row['zone_name'],
                error_y=dict(type='data', array=[row['temp_std']]),
                text=f"{row['avg_temp']:.1f}°C",
                textposition='auto'
            ))
        fig_temp.update_layout(title='各温区平均温度', barmode='group')
        charts.append(dbc.Col(dcc.Graph(figure=fig_temp), width=6))
    
    utilization = ds.get_utilization_by_zone(start_date, end_date)
    if not utilization.empty:
        fig_util = px.bar(
            utilization,
            x='zone_name',
            y='utilization_rate',
            title='各温区库位利用率',
            color='utilization_rate',
            color_continuous_scale='RdYlGn_r',
            text='utilization_rate'
        )
        fig_util.update_traces(texttemplate='%{text:.1f}%', textposition='outside')
        charts.append(dbc.Col(dcc.Graph(figure=fig_util), width=6))
    
    alarms = ds.get_alarms(zone_ids, start_date, end_date)
    if not alarms.empty:
        alarm_counts = alarms.groupby(['zone_name', 'alarm_type']).size().reset_index(name='count')
        fig_alarm = px.bar(
            alarm_counts,
            x='zone_name',
            y='count',
            color='alarm_type',
            title='各温区报警类型分布',
            barmode='stack'
        )
        charts.append(dbc.Col(dcc.Graph(figure=fig_alarm), width=6))
    
    inbound = ds.get_inbound_records(zone_ids, start_date, end_date, include_alarm_period=not exclude_alarm)
    if not inbound.empty:
        inbound['date'] = pd.to_datetime(inbound['inbound_time']).dt.date
        daily_inbound = inbound.groupby('date')['quantity'].sum().reset_index()
        fig_inbound = px.line(
            daily_inbound,
            x='date',
            y='quantity',
            title='每日入库趋势',
            markers=True
        )
        
        alarm_inbound = inbound[inbound['is_during_alarm']]
        if not alarm_inbound.empty:
            alarm_inbound['date'] = pd.to_datetime(alarm_inbound['inbound_time']).dt.date
            daily_alarm = alarm_inbound.groupby('date')['quantity'].sum().reset_index()
            fig_inbound.add_trace(go.Scatter(
                x=daily_alarm['date'],
                y=daily_alarm['quantity'],
                mode='markers',
                marker=dict(size=12, color='red', symbol='star'),
                name='报警期间入库',
                hovertemplate='日期: %{x}<br>报警期间入库: %{y} 托盘'
            ))
        
        charts.append(dbc.Col(dcc.Graph(figure=fig_inbound), width=6))
    
    return dbc.Row(charts)


def generate_heatmap_tab(zone_ids, start_date, end_date):
    return html.Div([
        dbc.Row([
            dbc.Col([
                html.Label('选择温区查看热力图：'),
                dcc.Dropdown(
                    id='heatmap-zone-select',
                    options=[{'label': row.zone_name, 'value': row.id} for _, row in zones_df.iterrows()],
                    value=zone_ids[0] if zone_ids else None,
                    className='mb-3'
                )
            ], width=6),
            dbc.Col([
                html.Label('选择日期：'),
                dcc.DatePickerSingle(
                    id='heatmap-date',
                    date=datetime.now(),
                    display_format='YYYY-MM-DD',
                    className='mb-3'
                )
            ], width=6)
        ])
    ])


def generate_heatmap_tab_content(zone_ids, start_date, end_date, selected_zone, selected_date):
    controls = generate_heatmap_tab(zone_ids, start_date, end_date)
    
    if not selected_zone:
        heatmap_content = html.Div('请选择温区')
    else:
        heatmap_data = ds.get_heatmap_data(selected_zone, selected_date)
        
        if heatmap_data.empty:
            heatmap_content = html.Div('暂无数据')
        else:
            heatmap_data['rack_key'] = heatmap_data['aisle'] + '-' + heatmap_data['rack']
            heatmap_data['y_label'] = 'L' + heatmap_data['level'].astype(str) + '-P' + heatmap_data['position'].astype(str)
            
            pivot_data = heatmap_data.pivot_table(
                index='y_label',
                columns='rack_key',
                values='quantity',
                fill_value=0
            )
            
            fig = go.Figure(data=go.Heatmap(
                z=pivot_data.values,
                x=pivot_data.columns,
                y=pivot_data.index,
                colorscale='RdYlGn_r',
                text=heatmap_data.pivot_table(
                    index='y_label',
                    columns='rack_key',
                    values='location_code',
                    aggfunc='first'
                ).values,
                hovertemplate='库位: %{text}<br>占用: %{z} 托盘<extra></extra>'
            ))
            
            fig.update_layout(
                title=f'{zones_df[zones_df["id"] == selected_zone]["zone_name"].iloc[0]} 库位热力图',
                xaxis_title='通道-货架',
                yaxis_title='层-位置',
                height=600
            )
            
            heatmap_content = html.Div([
                dcc.Graph(figure=fig),
                html.H5('库位说明', className='mt-3'),
                html.P('颜色越深表示该库位占用的托盘数越多，绿色表示空闲，红色表示占用较多')
            ])
    
    return html.Div([controls, html.Hr(), heatmap_content])


def generate_alarm_tab(zone_ids, start_date, end_date):
    alarms = ds.get_alarms(zone_ids, start_date, end_date)
    
    if alarms.empty:
        return html.Div('暂无报警数据', className='text-center my-5')
    
    duration_by_type = alarms.groupby('alarm_type')['duration_hours'].sum().reset_index()
    fig_duration = px.pie(
        duration_by_type,
        values='duration_hours',
        names='alarm_type',
        title='报警时长分布',
        hole=0.4
    )
    
    alarms['date'] = pd.to_datetime(alarms['alarm_start']).dt.date
    daily_alarms = alarms.groupby('date').agg(
        count=('id', 'count'),
        total_duration=('duration_hours', 'sum')
    ).reset_index()
    
    fig_daily = go.Figure()
    fig_daily.add_trace(go.Bar(
        x=daily_alarms['date'],
        y=daily_alarms['count'],
        name='报警次数',
        yaxis='y1'
    ))
    fig_daily.add_trace(go.Scatter(
        x=daily_alarms['date'],
        y=daily_alarms['total_duration'],
        name='累计时长(h)',
        yaxis='y2',
        mode='lines+markers'
    ))
    fig_daily.update_layout(
        title='每日报警趋势',
        yaxis=dict(title='报警次数'),
        yaxis2=dict(title='累计时长(h)', overlaying='y', side='right')
    )
    
    alarm_table = alarms[['alarm_start', 'alarm_end', 'zone_name', 'alarm_type', 
                          'severity', 'duration_hours', 'description']].copy()
    alarm_table['alarm_start'] = alarm_table['alarm_start'].dt.strftime('%Y-%m-%d %H:%M')
    alarm_table['alarm_end'] = alarm_table['alarm_end'].dt.strftime('%Y-%m-%d %H:%M')
    alarm_table['duration_hours'] = alarm_table['duration_hours'].round(2)
    
    severity_colors = {'error': '#dc3545', 'warning': '#ffc107', 'info': '#17a2b8'}
    
    return html.Div([
        dbc.Row([
            dbc.Col(dcc.Graph(figure=fig_duration), width=6),
            dbc.Col(dcc.Graph(figure=fig_daily), width=6)
        ]),
        html.H5('报警明细', className='mt-4'),
        dash_table.DataTable(
            id='alarm-table',
            columns=[
                {'name': '开始时间', 'id': 'alarm_start'},
                {'name': '结束时间', 'id': 'alarm_end'},
                {'name': '温区', 'id': 'zone_name'},
                {'name': '报警类型', 'id': 'alarm_type'},
                {'name': '严重程度', 'id': 'severity'},
                {'name': '持续时长(h)', 'id': 'duration_hours'},
                {'name': '描述', 'id': 'description'}
            ],
            data=alarm_table.to_dict('records'),
            page_size=10,
            style_table={'overflowX': 'auto'},
            style_data_conditional=[
                {
                    'if': {'filter_query': '{severity} = "error"'},
                    'backgroundColor': '#ffcccc'
                },
                {
                    'if': {'filter_query': '{severity} = "warning"'},
                    'backgroundColor': '#fff3cd'
                }
            ],
            row_selectable='single'
        ),
        dbc.Button('添加备注', id='add-alarm-note', color='secondary', className='mt-3')
    ])


def generate_location_tab(zone_ids, start_date, end_date):
    utilization = ds.get_utilization_by_zone(start_date, end_date)
    
    if utilization.empty:
        return html.Div('暂无库位数据', className='text-center my-5')
    
    fig_loc = go.Figure()
    fig_loc.add_trace(go.Bar(
        x=utilization['zone_name'],
        y=utilization['total_capacity'],
        name='总容量',
        marker_color='#e9ecef'
    ))
    fig_loc.add_trace(go.Bar(
        x=utilization['zone_name'],
        y=utilization['occupied_pallets'],
        name='已占用',
        marker_color='#007bff'
    ))
    fig_loc.update_layout(
        title='各温区库位容量对比',
        barmode='overlay',
        yaxis_title='托盘数'
    )
    
    loc_table = utilization[['zone_name', 'total_capacity', 'occupied_pallets', 
                             'utilization_rate', 'active_batches']].copy()
    loc_table.columns = ['温区', '总容量(托盘)', '已占用(托盘)', '利用率(%)', '活跃批次数']
    
    return html.Div([
        dcc.Graph(figure=fig_loc),
        html.H5('库位占用明细', className='mt-4'),
        dash_table.DataTable(
            columns=[{'name': col, 'id': col} for col in loc_table.columns],
            data=loc_table.to_dict('records'),
            page_size=10
        )
    ])


def generate_customer_tab(zone_ids, start_date, end_date):
    customer_stats = ds.get_utilization_by_customer(start_date, end_date)
    
    if customer_stats.empty:
        return html.Div('暂无客户数据', className='text-center my-5')
    
    fig_share = px.pie(
        customer_stats,
        values='total_pallets',
        names='customer',
        title='客户库存占比',
        hole=0.4
    )
    
    fig_compare = px.bar(
        customer_stats,
        x='customer',
        y=['total_pallets', 'batch_count'],
        title='客户库存对比',
        barmode='group'
    )
    
    return html.Div([
        dbc.Row([
            dbc.Col(dcc.Graph(figure=fig_share), width=6),
            dbc.Col(dcc.Graph(figure=fig_compare), width=6)
        ]),
        html.H5('客户明细', className='mt-4'),
        dash_table.DataTable(
            columns=[
                {'name': '客户', 'id': 'customer'},
                {'name': '总托盘数', 'id': 'total_pallets'},
                {'name': '批次数', 'id': 'batch_count'},
                {'name': '使用温区数', 'id': 'zones_used'},
                {'name': '平均存储天数', 'id': 'avg_storage_days'},
                {'name': '占比(%)', 'id': 'share_pct'}
            ],
            data=customer_stats.to_dict('records'),
            page_size=10
        )
    ])


def generate_detail_tab(zone_ids, customers_list, product_list, start_date, end_date, exclude_alarm):
    tabs = dbc.Tabs([
        dbc.Tab(label='批次明细', tab_id='batch-detail'),
        dbc.Tab(label='入库明细', tab_id='inbound-detail'),
        dbc.Tab(label='出库明细', tab_id='outbound-detail'),
        dbc.Tab(label='开门记录', tab_id='door-detail'),
        dbc.Tab(label='温度记录', tab_id='temp-detail')
    ], id='detail-tabs', active_tab='batch-detail')
    
    return html.Div([
        tabs
    ])


def generate_detail_tab_content(zone_ids, customers, products, start_date, end_date, exclude_alarm, active_tab):
    tabs = generate_detail_tab(zone_ids, customers, products, start_date, end_date, exclude_alarm)
    
    if active_tab == 'batch-detail':
        batches = ds.get_batches(zone_ids, customers, products, None, start_date, end_date)
        if batches.empty:
            detail_content = html.Div('暂无批次数据')
        else:
            display_cols = ['batch_number', 'customer', 'product_type', 'product_name', 
                            'quantity', 'zone_name', 'inbound_time', 'is_active']
            display_df = batches[display_cols].copy()
            display_df['inbound_time'] = pd.to_datetime(display_df['inbound_time']).dt.strftime('%Y-%m-%d %H:%M')
            
            detail_content = dash_table.DataTable(
                columns=[{'name': col, 'id': col} for col in display_cols],
                data=display_df.to_dict('records'),
                page_size=20,
                filter_action='native',
                sort_action='native',
                style_table={'overflowX': 'auto'},
                row_selectable='single'
            )
    
    elif active_tab == 'inbound-detail':
        inbound = ds.get_inbound_records(zone_ids, start_date, end_date, include_alarm_period=not exclude_alarm)
        if inbound.empty:
            detail_content = html.Div('暂无入库数据')
        else:
            display_cols = ['inbound_time', 'batch_number', 'customer', 'product_type', 
                            'zone_name', 'quantity', 'temperature_on_arrival', 'is_during_alarm']
            display_df = inbound[display_cols].copy()
            display_df['inbound_time'] = pd.to_datetime(display_df['inbound_time']).dt.strftime('%Y-%m-%d %H:%M')
            
            detail_content = dash_table.DataTable(
                columns=[{'name': col, 'id': col} for col in display_cols],
                data=display_df.to_dict('records'),
                page_size=20,
                filter_action='native',
                sort_action='native',
                style_table={'overflowX': 'auto'},
                style_data_conditional=[
                    {
                        'if': {'filter_query': '{is_during_alarm} = true'},
                        'backgroundColor': '#ffcccc'
                    }
                ]
            )
    
    elif active_tab == 'outbound-detail':
        outbound = ds.get_outbound_records(zone_ids, start_date, end_date)
        if outbound.empty:
            detail_content = html.Div('暂无出库数据')
        else:
            display_cols = ['outbound_time', 'batch_number', 'customer', 'product_type', 
                            'zone_name', 'quantity', 'temperature_on_departure']
            display_df = outbound[display_cols].copy()
            display_df['outbound_time'] = pd.to_datetime(display_df['outbound_time']).dt.strftime('%Y-%m-%d %H:%M')
            
            detail_content = dash_table.DataTable(
                columns=[{'name': col, 'id': col} for col in display_cols],
                data=display_df.to_dict('records'),
                page_size=20,
                filter_action='native',
                sort_action='native',
                style_table={'overflowX': 'auto'}
            )
    
    elif active_tab == 'door-detail':
        door_events = ds.get_door_events(zone_ids, start_date, end_date)
        if door_events.empty:
            detail_content = html.Div('暂无开门记录')
        else:
            display_cols = ['event_time', 'zone_name', 'door_id', 'event_type', 'duration_seconds', 'operator']
            display_df = door_events[display_cols].copy()
            display_df['event_time'] = pd.to_datetime(display_df['event_time']).dt.strftime('%Y-%m-%d %H:%M')
            
            detail_content = dash_table.DataTable(
                columns=[{'name': col, 'id': col} for col in display_cols],
                data=display_df.to_dict('records'),
                page_size=20,
                filter_action='native',
                sort_action='native',
                style_table={'overflowX': 'auto'}
            )
    
    elif active_tab == 'temp-detail':
        temp_readings = ds.get_temperature_readings(zone_ids, start_date, end_date)
        if temp_readings.empty:
            detail_content = html.Div('暂无温度记录')
        else:
            temp_readings = temp_readings.head(1000)
            display_cols = ['time', 'zone_name', 'temperature', 'humidity']
            display_df = temp_readings[display_cols].copy()
            display_df['time'] = pd.to_datetime(display_df['time']).dt.strftime('%Y-%m-%d %H:%M')
            
            detail_content = dash_table.DataTable(
                columns=[{'name': col, 'id': col} for col in display_cols],
                data=display_df.to_dict('records'),
                page_size=20,
                filter_action='native',
                sort_action='native',
                style_table={'overflowX': 'auto'}
            )
    else:
        detail_content = html.Div('请选择明细类型')
    
    return html.Div([tabs, html.Hr(), detail_content])


def generate_metrics_tab():
    return html.Div([
        html.H4('指标口径说明'),
        html.Hr(),
        dbc.Card([
            dbc.CardBody([
                html.H5('库位利用率', className='card-title'),
                html.P('计算公式：已占用托盘数 / 总容量托盘数 × 100%'),
                html.P('统计范围：当前在库的活跃批次'),
                html.P('更新频率：实时')
            ])
        ], className='mb-3'),
        dbc.Card([
            dbc.CardBody([
                html.H5('报警时长', className='card-title'),
                html.P('定义：从报警开始到报警结束的时间间隔'),
                html.P('统计单位：小时'),
                html.P('说明：未结束的报警不计算时长')
            ])
        ], className='mb-3'),
        dbc.Card([
            dbc.CardBody([
                html.H5('报警期间入库标注', className='card-title'),
                html.P('定义：入库时间处于任何报警时间区间内的入库记录'),
                html.P('用途：该类入库数据不作为正常温控考核依据'),
                html.P('显示：图表中以红色星形标记突出显示')
            ])
        ], className='mb-3'),
        dbc.Card([
            dbc.CardBody([
                html.H5('温度超范围率', className='card-title'),
                html.P('计算公式：超出目标温度范围的读数数 / 总读数数 × 100%'),
                html.P('目标温度范围：根据各温区设定的目标温度上下限')
            ])
        ], className='mb-3'),
        html.H4('数据校验规则', className='mt-4'),
        html.Hr(),
        html.Ul([
            html.Li('下钻校验：点击图表数据点可查看对应明细数据'),
            html.Li('对比校验：支持多温区、多客户、多货品类型的横向对比'),
            html.Li('时间窗口校验：支持按日、周、月不同时间粒度筛选'),
            html.Li('口径一致性：所有图表使用统一的筛选条件和计算口径')
        ])
    ])


@app.callback(
    [Output('overview-content', 'style'),
     Output('heatmap-container', 'style'),
     Output('alarm-content', 'style'),
     Output('location-content', 'style'),
     Output('customer-content', 'style'),
     Output('detail-container', 'style'),
     Output('metrics-content', 'style')],
    [Input('main-tabs', 'active_tab')]
)
def toggle_tab_visibility(active_tab):
    hidden = {'display': 'none'}
    visible = {'display': 'block', 'margin-top': '1rem'}
    return (
        visible if active_tab == 'overview' else hidden,
        visible if active_tab == 'heatmap' else hidden,
        visible if active_tab == 'alarm' else hidden,
        visible if active_tab == 'location' else hidden,
        visible if active_tab == 'customer' else hidden,
        visible if active_tab == 'detail' else hidden,
        visible if active_tab == 'metrics' else hidden
    )


@app.callback(
    Output('overview-content', 'children'),
    [Input('apply-filter', 'n_clicks')],
    [State('zone-filter', 'value'),
     State('date-range', 'start_date'),
     State('date-range', 'end_date'),
     State('exclude-alarm-inbound', 'value')]
)
def render_overview(n_clicks, zone_ids, start_date, end_date, exclude_alarm):
    start_dt = pd.to_datetime(start_date)
    end_dt = pd.to_datetime(end_date)
    return html.Div([
        generate_kpi_cards(zone_ids, start_dt, end_dt),
        generate_overview_charts(zone_ids, start_dt, end_dt, exclude_alarm)
    ])


@app.callback(
    Output('heatmap-chart', 'children'),
    [Input('apply-filter', 'n_clicks'),
     Input('heatmap-zone-select', 'value'),
     Input('heatmap-date', 'date')]
)
def render_heatmap(n_clicks, selected_zone, selected_date):
    if not selected_zone:
        return html.Div('请选择温区')
    
    heatmap_data = ds.get_heatmap_data(selected_zone, selected_date)
    
    if heatmap_data.empty:
        return html.Div('暂无数据')
    
    heatmap_data['rack_key'] = heatmap_data['aisle'] + '-' + heatmap_data['rack']
    heatmap_data['y_label'] = 'L' + heatmap_data['level'].astype(str) + '-P' + heatmap_data['position'].astype(str)
    
    pivot_data = heatmap_data.pivot_table(
        index='y_label',
        columns='rack_key',
        values='quantity',
        fill_value=0
    )
    
    fig = go.Figure(data=go.Heatmap(
        z=pivot_data.values,
        x=pivot_data.columns,
        y=pivot_data.index,
        colorscale='RdYlGn_r',
        text=heatmap_data.pivot_table(
            index='y_label',
            columns='rack_key',
            values='location_code',
            aggfunc='first'
        ).values,
        hovertemplate='库位: %{text}<br>占用: %{z} 托盘<extra></extra>'
    ))
    
    fig.update_layout(
        title=f'{zones_df[zones_df["id"] == selected_zone]["zone_name"].iloc[0]} 库位热力图',
        xaxis_title='通道-货架',
        yaxis_title='层-位置',
        height=600
    )
    
    return html.Div([
        dcc.Graph(figure=fig),
        html.H5('库位说明', className='mt-3'),
        html.P('颜色越深表示该库位占用的托盘数越多，绿色表示空闲，红色表示占用较多')
    ])


@app.callback(
    Output('alarm-content', 'children'),
    [Input('apply-filter', 'n_clicks')],
    [State('zone-filter', 'value'),
     State('date-range', 'start_date'),
     State('date-range', 'end_date')]
)
def render_alarm(n_clicks, zone_ids, start_date, end_date):
    start_dt = pd.to_datetime(start_date)
    end_dt = pd.to_datetime(end_date)
    return generate_alarm_tab(zone_ids, start_dt, end_dt)


@app.callback(
    Output('location-content', 'children'),
    [Input('apply-filter', 'n_clicks')],
    [State('zone-filter', 'value'),
     State('date-range', 'start_date'),
     State('date-range', 'end_date')]
)
def render_location(n_clicks, zone_ids, start_date, end_date):
    start_dt = pd.to_datetime(start_date)
    end_dt = pd.to_datetime(end_date)
    return generate_location_tab(zone_ids, start_dt, end_dt)


@app.callback(
    Output('customer-content', 'children'),
    [Input('apply-filter', 'n_clicks')],
    [State('zone-filter', 'value'),
     State('date-range', 'start_date'),
     State('date-range', 'end_date')]
)
def render_customer(n_clicks, zone_ids, start_date, end_date):
    start_dt = pd.to_datetime(start_date)
    end_dt = pd.to_datetime(end_date)
    return generate_customer_tab(zone_ids, start_dt, end_dt)


@app.callback(
    Output('detail-table', 'children'),
    [Input('apply-filter', 'n_clicks'),
     Input('detail-tabs', 'active_tab')],
    [State('zone-filter', 'value'),
     State('customer-filter', 'value'),
     State('product-filter', 'value'),
     State('date-range', 'start_date'),
     State('date-range', 'end_date'),
     State('exclude-alarm-inbound', 'value')]
)
def render_detail_table(n_clicks, active_tab, zone_ids, customers, products, start_date, end_date, exclude_alarm):
    start_dt = pd.to_datetime(start_date)
    end_dt = pd.to_datetime(end_date)
    
    if active_tab == 'batch-detail':
        batches = ds.get_batches(zone_ids, customers, products, None, start_dt, end_dt)
        if batches.empty:
            return html.Div('暂无批次数据')
        
        display_cols = ['batch_number', 'customer', 'product_type', 'product_name', 
                        'quantity', 'zone_name', 'inbound_time', 'is_active']
        display_df = batches[display_cols].copy()
        display_df['inbound_time'] = pd.to_datetime(display_df['inbound_time']).dt.strftime('%Y-%m-%d %H:%M')
        
        return dash_table.DataTable(
            columns=[{'name': col, 'id': col} for col in display_cols],
            data=display_df.to_dict('records'),
            page_size=20,
            filter_action='native',
            sort_action='native',
            style_table={'overflowX': 'auto'},
            row_selectable='single'
        )
    
    elif active_tab == 'inbound-detail':
        inbound = ds.get_inbound_records(zone_ids, start_dt, end_dt, include_alarm_period=not exclude_alarm)
        if inbound.empty:
            return html.Div('暂无入库数据')
        
        display_cols = ['inbound_time', 'batch_number', 'customer', 'product_type', 
                        'zone_name', 'quantity', 'temperature_on_arrival', 'is_during_alarm']
        display_df = inbound[display_cols].copy()
        display_df['inbound_time'] = pd.to_datetime(display_df['inbound_time']).dt.strftime('%Y-%m-%d %H:%M')
        
        return dash_table.DataTable(
            columns=[{'name': col, 'id': col} for col in display_cols],
            data=display_df.to_dict('records'),
            page_size=20,
            filter_action='native',
            sort_action='native',
            style_table={'overflowX': 'auto'},
            style_data_conditional=[
                {
                    'if': {'filter_query': '{is_during_alarm} = true'},
                    'backgroundColor': '#ffcccc'
                }
            ]
        )
    
    elif active_tab == 'outbound-detail':
        outbound = ds.get_outbound_records(zone_ids, start_dt, end_dt)
        if outbound.empty:
            return html.Div('暂无出库数据')
        
        display_cols = ['outbound_time', 'batch_number', 'customer', 'product_type', 
                        'zone_name', 'quantity', 'temperature_on_departure']
        display_df = outbound[display_cols].copy()
        display_df['outbound_time'] = pd.to_datetime(display_df['outbound_time']).dt.strftime('%Y-%m-%d %H:%M')
        
        return dash_table.DataTable(
            columns=[{'name': col, 'id': col} for col in display_cols],
            data=display_df.to_dict('records'),
            page_size=20,
            filter_action='native',
            sort_action='native',
            style_table={'overflowX': 'auto'}
        )
    
    elif active_tab == 'door-detail':
        door_events = ds.get_door_events(zone_ids, start_dt, end_dt)
        if door_events.empty:
            return html.Div('暂无开门记录')
        
        display_cols = ['event_time', 'zone_name', 'door_id', 'event_type', 'duration_seconds', 'operator']
        display_df = door_events[display_cols].copy()
        display_df['event_time'] = pd.to_datetime(display_df['event_time']).dt.strftime('%Y-%m-%d %H:%M')
        
        return dash_table.DataTable(
            columns=[{'name': col, 'id': col} for col in display_cols],
            data=display_df.to_dict('records'),
            page_size=20,
            filter_action='native',
            sort_action='native',
            style_table={'overflowX': 'auto'}
        )
    
    elif active_tab == 'temp-detail':
        temp_readings = ds.get_temperature_readings(zone_ids, start_dt, end_dt)
        if temp_readings.empty:
            return html.Div('暂无温度记录')
        
        temp_readings = temp_readings.head(1000)
        display_cols = ['time', 'zone_name', 'temperature', 'humidity']
        display_df = temp_readings[display_cols].copy()
        display_df['time'] = pd.to_datetime(display_df['time']).dt.strftime('%Y-%m-%d %H:%M')
        
        return dash_table.DataTable(
            columns=[{'name': col, 'id': col} for col in display_cols],
            data=display_df.to_dict('records'),
            page_size=20,
            filter_action='native',
            sort_action='native',
            style_table={'overflowX': 'auto'}
        )
    
    return html.Div('请选择明细类型')


@app.callback(
    Output('metrics-content', 'children'),
    [Input('main-tabs', 'active_tab')]
)
def render_metrics(active_tab):
    if active_tab == 'metrics':
        return generate_metrics_tab()
    return html.Div()


@app.callback(
    [Output('note-modal', 'is_open'),
     Output('note-related-type', 'value'),
     Output('note-related-id', 'value')],
    [Input('add-alarm-note', 'n_clicks')],
    [State('alarm-table', 'selected_rows'),
     State('alarm-table', 'data')],
    prevent_initial_call=True
)
def open_note_modal(n_clicks, selected_rows, table_data):
    if n_clicks and selected_rows and table_data:
        idx = selected_rows[0]
        alarm_id = idx + 1
        return True, 'alarm', alarm_id
    return False, '', None


@app.callback(
    Output('note-modal', 'is_open', allow_duplicate=True),
    [Input('cancel-note', 'n_clicks'),
     Input('save-note', 'n_clicks')],
    [State('note-related-type', 'value'),
     State('note-related-id', 'value'),
     State('note-text', 'value'),
     State('note-author', 'value'),
     State('note-is-anomaly', 'value')],
    prevent_initial_call=True
)
def handle_note_modal(cancel_clicks, save_clicks, related_type, related_id, note_text, author, is_anomaly):
    ctx = callback_context
    if ctx.triggered[0]['prop_id'] == 'save-note.n_clicks':
        if note_text and related_type and related_id:
            ds.add_manual_note(related_type, related_id, note_text, author, is_anomaly)
    return False


if __name__ == '__main__':
    print("启动冷库温区利用率分析工作台...")
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', '8050'))
    debug = os.getenv('DEBUG', 'true').lower() == 'true'
    app.run_server(debug=debug, host=host, port=port)
