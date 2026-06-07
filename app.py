import dash
from dash import dcc, html, Input, Output, State, dash_table, callback_context
import dash_bootstrap_components as dbc
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import io

from src.data_pipeline import (
    generate_mock_data, clean_temperature_data, apply_filters,
    get_filter_summary, aggregate_by_batch
)
from src.components.charts import (
    create_route_map, create_temperature_curve,
    create_anomaly_duration_chart, create_responsibility_segment_chart,
    create_severity_pie_chart, create_kpi_cards, create_door_event_timeline
)

app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
app.title = "冷链物流温控追踪分析系统"
server = app.server

raw_data = generate_mock_data(num_batches=50, add_dirty_data=True)
cleaned_temp, dirty_records = clean_temperature_data(raw_data['temperature_records'])
raw_data['temperature_records'] = cleaned_temp

all_vehicles = sorted(raw_data['shipment_info']['vehicle_id'].unique().tolist())
all_routes = sorted(raw_data['shipment_info']['route_id'].unique().tolist())
all_batches = sorted(raw_data['shipment_info']['batch_id'].unique().tolist())
all_containers = sorted(raw_data['shipment_info']['container_id'].unique().tolist())
all_customers = sorted(raw_data['shipment_info']['customer_id'].unique().tolist())

min_date = raw_data['temperature_records']['timestamp'].min()
max_date = raw_data['temperature_records']['timestamp'].max()

def serialize_for_store(data_dict):
    result = {}
    for key, df in data_dict.items():
        df_copy = df.copy()
        for col in df_copy.columns:
            if pd.api.types.is_datetime64_any_dtype(df_copy[col]):
                df_copy[col] = df_copy[col].dt.strftime('%Y-%m-%d %H:%M:%S')
        result[key] = df_copy.to_dict('records')
    return result

def get_data_from_store_or_raw(data_store):
    if data_store and data_store.get('temperature_records'):
        result = {}
        for key, records in data_store.items():
            df = pd.DataFrame(records)
            for col in df.columns:
                if 'time' in col.lower() or 'date' in col.lower():
                    try:
                        df[col] = pd.to_datetime(df[col])
                    except:
                        pass
            result[key] = df
        return result
    else:
        return raw_data


def build_filter_panel():
    return dbc.Card([
        dbc.CardHeader([
            html.H5("🔍 数据筛选", className="mb-0"),
            html.Small("切换分析视角，筛选条件将应用于所有图表", className="text-muted")
        ]),
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.Label("车辆", className="filter-section-title"),
                    dcc.Dropdown(
                        id='filter-vehicles',
                        options=[{'label': v, 'value': v} for v in all_vehicles],
                        multi=True,
                        placeholder="选择车辆...",
                        className="mb-2"
                    )
                ], md=2),
                dbc.Col([
                    html.Label("路线", className="filter-section-title"),
                    dcc.Dropdown(
                        id='filter-routes',
                        options=[{'label': v, 'value': v} for v in all_routes],
                        multi=True,
                        placeholder="选择路线...",
                        className="mb-2"
                    )
                ], md=2),
                dbc.Col([
                    html.Label("批次", className="filter-section-title"),
                    dcc.Dropdown(
                        id='filter-batches',
                        options=[{'label': v, 'value': v} for v in all_batches],
                        multi=True,
                        placeholder="选择批次...",
                        className="mb-2"
                    )
                ], md=2),
                dbc.Col([
                    html.Label("温控箱", className="filter-section-title"),
                    dcc.Dropdown(
                        id='filter-containers',
                        options=[{'label': v, 'value': v} for v in all_containers],
                        multi=True,
                        placeholder="选择温控箱...",
                        className="mb-2"
                    )
                ], md=2),
                dbc.Col([
                    html.Label("客户", className="filter-section-title"),
                    dcc.Dropdown(
                        id='filter-customers',
                        options=[{'label': v, 'value': v} for v in all_customers],
                        multi=True,
                        placeholder="选择客户...",
                        className="mb-2"
                    )
                ], md=2),
                dbc.Col([
                    html.Label("时间窗口", className="filter-section-title"),
                    dcc.DatePickerRange(
                        id='filter-date-range',
                        start_date=min_date.date(),
                        end_date=max_date.date(),
                        min_date_allowed=min_date.date(),
                        max_date_allowed=max_date.date(),
                        display_format='YYYY-MM-DD',
                        className="mb-2"
                    )
                ], md=2),
            ]),
            dbc.Row([
                dbc.Col([
                    dbc.Button("🔄 重置筛选", id='btn-reset-filters', color='secondary', size='sm', outline=True),
                    dbc.Button("📊 应用筛选", id='btn-apply-filters', color='primary', size='sm', className='ms-2'),
                    dbc.Button("📥 导出报告", id='btn-export', color='success', size='sm', className='ms-2'),
                    dcc.Download(id='download-report')
                ], md=12, className="text-end mt-2")
            ])
        ])
    ], className="filter-panel mb-3")


def build_probe_warning():
    return html.Div(id='probe-warning-container', className='probe-warning', style={'display': 'none'})


def build_filter_summary():
    return html.Div(id='filter-summary-container', className='filter-summary', style={'display': 'none'})


def build_kpi_section():
    return dbc.Row(id='kpi-cards-row', className='mb-3')


def build_main_dashboard():
    return dbc.Tabs([
        dbc.Tab([
            html.Br(),
            dbc.Row([
                dbc.Col([
                    dcc.Graph(id='route-map-graph', config={'displayModeBar': True})
                ], md=6),
                dbc.Col([
                    dcc.Graph(id='temperature-curve-graph', config={'displayModeBar': True})
                ], md=6)
            ]),
            html.Br(),
            dbc.Row([
                dbc.Col([
                    html.Label("🔍 选择批次进行详细分析：", className="mb-2"),
                    dcc.Dropdown(
                        id='detail-batch-selector',
                        options=[{'label': '全部批次', 'value': 'ALL'}] + [{'label': b, 'value': b} for b in all_batches],
                        value='ALL',
                        clearable=False
                    ),
                    html.Small(id='selected-batch-info', className="text-muted mt-2 d-block")
                ], md=12)
            ])
        ], label="📍 路线与温度", tab_id="tab-route-temp"),
        
        dbc.Tab([
            html.Br(),
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("⚡ 快速追溯异常"),
                        dbc.CardBody([
                            dbc.Row([
                                dbc.Col([
                                    html.Label("选择异常："),
                                    dcc.Dropdown(
                                        id='anomaly-selector-quick',
                                        placeholder="从当前筛选范围选择异常...",
                                        clearable=True
                                    )
                                ], md=6),
                                dbc.Col([
                                    html.Label("追溯操作："),
                                    html.Div([
                                        dbc.Button("📍 查看温度曲线", id='btn-anomaly-trace-chart', color='primary', size='sm', className='me-2'),
                                        dbc.Button("📋 查看原始记录", id='btn-anomaly-trace-raw', color='info', size='sm', className='me-2'),
                                        dbc.Button("🗺️ 查看路线", id='btn-anomaly-trace-route', color='success', size='sm')
                                    ])
                                ], md=6)
                            ])
                        ])
                    ], className="mb-3")
                ], md=12)
            ]),
            dbc.Row([
                dbc.Col([
                    dcc.Graph(id='anomaly-duration-graph', config={'displayModeBar': True})
                ], md=6),
                dbc.Col([
                    dcc.Graph(id='responsibility-segment-graph', config={'displayModeBar': True})
                ], md=6)
            ]),
            html.Br(),
            dbc.Row([
                dbc.Col([
                    dcc.Graph(id='severity-pie-graph', config={'displayModeBar': True})
                ], md=4),
                dbc.Col([
                    dcc.Graph(id='door-event-timeline', config={'displayModeBar': True})
                ], md=8)
            ]),
            html.Br(),
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("📋 异常明细列表（点击异常类型可快速筛选）"),
                        dbc.CardBody([
                            dash_table.DataTable(
                                id='anomaly-list-table',
                                page_size=8,
                                style_table={'overflowX': 'auto', 'fontSize': '12px'},
                                style_cell={'textAlign': 'left', 'padding': '5px'},
                                style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
                                style_data_conditional=[
                                    {'if': {'filter_query': '{severity} = "高"'},
                                     'backgroundColor': '#ffebee', 'color': '#c62828'}
                                ],
                                filter_action='native',
                                sort_action='native',
                                row_selectable='single',
                                selected_rows=[],
                                active_cell=None
                            )
                        ])
                    ])
                ], md=12)
            ])
        ], label="⚠️ 异常分析", tab_id="tab-anomalies"),
        
        dbc.Tab([
            html.Br(),
            html.Div([
                html.H5("📋 原始数据追溯"),
                html.Small("发现异常后可追溯至原始记录，所有筛选条件、时间窗口和样本量均已显示", className="text-muted d-block mb-3")
            ]),
            html.Div(id='anomaly-trace-panel', className='mb-3', style={'display': 'none'}),
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("选择异常进行追溯"),
                        dbc.CardBody([
                            dbc.Row([
                                dbc.Col([
                                    html.Label("选择异常："),
                                    dcc.Dropdown(
                                        id='anomaly-selector-dropdown',
                                        placeholder="选择一个异常进行追溯...",
                                        clearable=True
                                    )
                                ], md=8),
                                dbc.Col([
                                    html.Label("操作："),
                                    html.Div([
                                        dbc.Button("🔍 追溯到温度曲线", id='btn-trace-to-chart', color='primary', size='sm', className='me-2'),
                                        dbc.Button("📋 只显示异常时间段数据", id='btn-trace-to-table', color='info', size='sm', className='me-2'),
                                        dbc.Button("❌ 清除追溯", id='btn-clear-trace', color='secondary', size='sm')
                                    ])
                                ], md=4)
                            ])
                        ])
                    ], className="mb-3")
                ], md=12)
            ]),
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader([
                            "温度记录数据",
                            html.Small(id='temp-table-stats', className="ms-2 text-muted")
                        ]),
                        dbc.CardBody([
                            dash_table.DataTable(
                                id='raw-temp-table',
                                page_size=15,
                                style_table={'overflowX': 'auto', 'fontSize': '12px'},
                                style_cell={'textAlign': 'left', 'padding': '5px'},
                                style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
                                filter_action='native',
                                sort_action='native',
                                export_format='xlsx'
                            )
                        ])
                    ])
                ], md=12)
            ]),
            html.Br(),
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("异常记录详情"),
                        dbc.CardBody([
                            dash_table.DataTable(
                                id='anomaly-detail-table',
                                page_size=10,
                                style_table={'overflowX': 'auto', 'fontSize': '12px'},
                                style_cell={'textAlign': 'left', 'padding': '5px'},
                                style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
                                filter_action='native',
                                sort_action='native'
                            )
                        ])
                    ])
                ], md=12)
            ])
        ], label="📋 原始数据追溯", tab_id="tab-raw-data"),
        
        dbc.Tab([
            html.Br(),
            html.Div([
                html.H5("📚 数据处理说明"),
                html.Small("了解系统如何处理数据入库、聚合、脏数据和导出", className="text-muted d-block mb-4")
            ]),
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("🏭 数据入库流程"),
                        dbc.CardBody([
                            html.Ol([
                                html.Li([html.Strong("数据源接入："), "支持冷链终端设备、GPS定位器、温感探头数据接入"]),
                                html.Li([html.Strong("Schema校验："), "按DATA_SCHEMA定义验证必填字段和数据类型"]),
                                html.Li([html.Strong("时间标准化："), "统一转换为UTC+8时区，处理跨时区数据"]),
                                html.Li([html.Strong("主键生成："), "按batch_id + timestamp生成唯一record_id"]),
                                html.Li([html.Strong("批次关联："), "将温度、开门、异常数据按batch_id关联"])
                            ])
                        ])
                    ], className="mb-3"),
                    
                    dbc.Card([
                        dbc.CardHeader("🔧 脏数据处理规则"),
                        dbc.CardBody([
                            html.Ul([
                                html.Li([html.Strong("缺失值(missing_value)："), "使用时间插值法填充温度数据"]),
                                html.Li([html.Strong("极端值(outlier)："), "温度>100°C或<-50°C标记为异常，用插值替换"]),
                                html.Li([html.Strong("GPS丢失(missing_gps)："), "前后向填充法补全经纬度"]),
                                html.Li([html.Strong(" stuck_value："), "检测连续相同值，标记并保留原值"]),
                                html.Li([html.Strong("data_quality字段："), "记录每条数据的质量状态，避免误判"])
                            ])
                        ])
                    ])
                ], md=6),
                
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader("📊 数据聚合逻辑"),
                        dbc.CardBody([
                            html.Ul([
                                html.Li([html.Strong("按批次聚合："), "计算平均温度、极值、标准差、开门次数"]),
                                html.Li([html.Strong("超标率计算："), "target_temp±0.5°C容差范围内外的记录占比"]),
                                html.Li([html.Strong("异常时长统计："), "连续超标时间段合并去重"]),
                                html.Li([html.Strong("责任段定位："), "按时间窗口匹配运输阶段（发货/中转/收货）"]),
                                html.Li([html.Strong("探头校准状态："), "独立维度展示，不参与温度异常判定"])
                            ])
                        ])
                    ], className="mb-3"),
                    
                    dbc.Card([
                        dbc.CardHeader("📤 导出与状态保留"),
                        dbc.CardBody([
                            html.Ul([
                                html.Li([html.Strong("筛选状态保留："), "导出文件名包含筛选条件摘要"]),
                                html.Li([html.Strong("报告头信息："), "Excel第一行写入筛选条件、时间窗口、样本量"]),
                                html.Li([html.Strong("多Sheet导出："), "温度记录、异常记录、批次汇总分Sheet存放"]),
                                html.Li([html.Strong("数据溯源："), "每条导出记录保留record_id可回查原始数据"]),
                                html.Li([html.Strong("校准状态标注："), "导出数据中单独列标记探头是否校准"])
                            ])
                        ])
                    ])
                ], md=6)
            ])
        ], label="📚 数据说明", tab_id="tab-data-docs")
        
    ], id='main-tabs', active_tab='tab-route-temp')


app.layout = dbc.Container([
    html.Br(),
    dbc.Row([
        dbc.Col([
            html.H2("❄️ 冷链物流温控追踪分析系统", className="text-center"),
            html.P("质量管理人员专用 - 数据口径统一 · 多视角切换 · 异常可追溯", 
                   className="text-center text-muted")
        ])
    ]),
    html.Hr(),
    build_filter_panel(),
    build_probe_warning(),
    build_filter_summary(),
    build_kpi_section(),
    build_main_dashboard(),
    
    dcc.Store(id='current-filters-store', data={}),
    dcc.Store(id='filtered-data-store', data={}),
    dcc.Store(id='selected-anomaly-store', data=None),
    dcc.Store(id='trace-anomaly-trigger', data=0),
    
    html.Footer([
        html.Hr(),
        html.P("冷链物流温控追踪系统 v1.0 | 数据口径定义见【数据说明】页", 
               className="text-center text-muted small")
    ])
], fluid=True, className="dashboard-container")


def get_current_filter_state(n_clicks, vehicles, routes, batches, containers, customers, date_range):
    filters = {}
    if vehicles:
        filters['vehicles'] = vehicles
    if routes:
        filters['routes'] = routes
    if batches:
        filters['batches'] = batches
    if containers:
        filters['containers'] = containers
    if customers:
        filters['customers'] = customers
    if date_range and date_range[0] and date_range[1]:
        start_dt = datetime.combine(date_range[0], datetime.min.time())
        end_dt = datetime.combine(date_range[1], datetime.max.time())
        filters['date_range'] = (start_dt, end_dt)
    return filters


@app.callback(
    [Output('current-filters-store', 'data'),
     Output('filtered-data-store', 'data')],
    [Input('btn-apply-filters', 'n_clicks')],
    [State('filter-vehicles', 'value'),
     State('filter-routes', 'value'),
     State('filter-batches', 'value'),
     State('filter-containers', 'value'),
     State('filter-customers', 'value'),
     State('filter-date-range', 'start_date'),
     State('filter-date-range', 'end_date')]
)
def apply_filter_changes(n_clicks, vehicles, routes, batches, containers, customers, start_date, end_date):
    date_range_tuple = None
    if start_date and end_date:
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date) + timedelta(days=1) - timedelta(seconds=1)
        date_range_tuple = (start_dt, end_dt)
    
    filtered = apply_filters(
        raw_data,
        vehicles=vehicles,
        routes=routes,
        batches=batches,
        containers=containers,
        customers=customers,
        date_range=date_range_tuple
    )
    
    serializable_filters = {
        'vehicles': vehicles,
        'routes': routes,
        'batches': batches,
        'containers': containers,
        'customers': customers,
        'start_date': start_date,
        'end_date': end_date
    }
    
    serialized_data = serialize_for_store(filtered)
    
    return serializable_filters, serialized_data


@app.callback(
    [Output('filter-vehicles', 'value'),
     Output('filter-routes', 'value'),
     Output('filter-batches', 'value'),
     Output('filter-containers', 'value'),
     Output('filter-customers', 'value'),
     Output('filter-date-range', 'start_date'),
     Output('filter-date-range', 'end_date'),
     Output('filtered-data-store', 'data'),
     Output('current-filters-store', 'data'),
     Output('selected-anomaly-store', 'data'),
     Output('anomaly-selector-dropdown', 'value')],
    [Input('btn-reset-filters', 'n_clicks')]
)
def reset_filters(n_clicks):
    if n_clicks is None:
        raise dash.exceptions.PreventUpdate
    return None, None, None, None, None, min_date.date(), max_date.date(), {}, {}, None, None


@app.callback(
    [Output('filter-summary-container', 'children'),
     Output('filter-summary-container', 'style')],
    [Input('current-filters-store', 'data'),
     Input('filtered-data-store', 'data')]
)
def update_filter_summary(filters, data_store):
    data = get_data_from_store_or_raw(data_store)
    temp_df = data['temperature_records']
    shipment_df = data['shipment_info']
    anomaly_df = data['anomaly_records']
    
    summary = get_filter_summary(filters or {}, data)
    
    parts = [html.Strong("📊 当前筛选结果：")]
    
    filter_parts = []
    if filters.get('vehicles'):
        filter_parts.append(f"车辆: {len(filters['vehicles'])}个")
    if filters.get('routes'):
        filter_parts.append(f"路线: {len(filters['routes'])}个")
    if filters.get('batches'):
        filter_parts.append(f"批次: {len(filters['batches'])}个")
    if filters.get('containers'):
        filter_parts.append(f"温控箱: {len(filters['containers'])}个")
    if filters.get('customers'):
        filter_parts.append(f"客户: {len(filters['customers'])}个")
    
    if filter_parts:
        parts.append(html.Span(" | ".join(filter_parts), className="ms-2"))
    
    parts.append(html.Span(f" | 样本量: {summary.get('total_records', 0)}条温度记录 / "
                           f"{summary.get('total_batches', 0)}个批次 / "
                           f"{summary.get('total_anomalies', 0)}个异常", 
                           className="ms-2"))
    
    if summary.get('date_range'):
        parts.append(html.Span(f" | 时间窗口: {summary['date_range']['start'].strftime('%Y-%m-%d')} "
                               f"至 {summary['date_range']['end'].strftime('%Y-%m-%d')}",
                               className="ms-2"))
    
    return parts, {'display': 'block'}


@app.callback(
    [Output('probe-warning-container', 'children'),
     Output('probe-warning-container', 'style')],
    [Input('filtered-data-store', 'data')]
)
def update_probe_warning(data_store):
    data = get_data_from_store_or_raw(data_store)
    temp_df = data['temperature_records']
    shipment_df = data['shipment_info']
    
    if temp_df.empty:
        return [], {'display': 'none'}
    
    uncalibrated_batches = temp_df[~temp_df['probe_calibrated']]['batch_id'].unique()
    if len(uncalibrated_batches) == 0:
        return [], {'display': 'none'}
    
    shipment_filtered = shipment_df[shipment_df['batch_id'].isin(uncalibrated_batches)]
    probe_info = temp_df[~temp_df['probe_calibrated']][['batch_id', 'probe_id', 'probe_last_calibration']].drop_duplicates('batch_id')
    
    warning_parts = [
        html.Strong("⚠️ 温度探头校准提示："),
        html.Span(f"当前筛选范围内有 {len(uncalibrated_batches)} 个批次使用了未校准的温度探头，",
                  className="ms-2"),
        html.Span("分析温度异常时请注意排除探头偏差因素，相关批次：", className="ms-1"),
        html.Span(", ".join(uncalibrated_batches.tolist()), className="ms-1 fw-bold")
    ]
    
    return warning_parts, {'display': 'block'}


@app.callback(
    Output('kpi-cards-row', 'children'),
    [Input('filtered-data-store', 'data')]
)
def update_kpi_cards(data_store):
    data = get_data_from_store_or_raw(data_store)
    temp_df = data['temperature_records']
    shipment_df = data['shipment_info']
    anomaly_df = data['anomaly_records']
    
    kpis = create_kpi_cards(shipment_df, temp_df, anomaly_df)
    
    cards = []
    for key, kpi in kpis.items():
        card = dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.Div([
                        html.Span(kpi['icon'], style={'fontSize': '24px'}),
                        html.Div([
                            html.Div(kpi['value'], className="metric-value"),
                            html.Div(kpi['label'], className="metric-label")
                        ], className="ms-3")
                    ], className="d-flex align-items-center")
                ])
            ])
        ], md=2, className="mb-2")
        cards.append(card)
    
    return cards


@app.callback(
    [Output('route-map-graph', 'figure'),
     Output('temperature-curve-graph', 'figure')],
    [Input('filtered-data-store', 'data'),
     Input('detail-batch-selector', 'value'),
     Input('selected-anomaly-store', 'data')]
)
def update_route_and_temp_charts(data_store, selected_batch, selected_anomaly):
    data = get_data_from_store_or_raw(data_store)
    temp_df = data['temperature_records']
    shipment_df = data['shipment_info']
    anomaly_df = data['anomaly_records']
    
    route_fig = create_route_map(temp_df, selected_batch)
    temp_fig = create_temperature_curve(temp_df, shipment_df, anomaly_df, selected_batch, selected_anomaly)
    
    return route_fig, temp_fig


@app.callback(
    Output('selected-batch-info', 'children'),
    [Input('detail-batch-selector', 'value'),
     Input('filtered-data-store', 'data')]
)
def update_selected_batch_info(selected_batch, data_store):
    if selected_batch == 'ALL' or not selected_batch:
        return "当前显示所有批次数据，选择单个批次可查看详细路线和温度曲线"
    
    data = get_data_from_store_or_raw(data_store)
    shipment_df = data['shipment_info']
    temp_df = data['temperature_records']
    
    shipment = shipment_df[shipment_df['batch_id'] == selected_batch]
    if shipment.empty:
        return ""
    
    s = shipment.iloc[0]
    batch_temp = temp_df[temp_df['batch_id'] == selected_batch]
    
    calibrated = batch_temp['probe_calibrated'].iloc[0] if len(batch_temp) > 0 else True
    probe_id = batch_temp['probe_id'].iloc[0] if len(batch_temp) > 0 else '-'
    
    info = (f"批次 {selected_batch} | {s.get('product_type', '')} | "
            f"目标温度: {s.get('target_temp_min', '')}~{s.get('target_temp_max', '')}°C | "
            f"路线: {s.get('route_name', '')} | "
            f"探头: {probe_id} {'✅ 已校准' if calibrated else '❌ 未校准 ⚠️'}")
    
    return info


@app.callback(
    [Output('anomaly-duration-graph', 'figure'),
     Output('responsibility-segment-graph', 'figure'),
     Output('severity-pie-graph', 'figure'),
     Output('door-event-timeline', 'figure')],
    [Input('filtered-data-store', 'data')]
)
def update_anomaly_charts(data_store):
    data = get_data_from_store_or_raw(data_store)
    anomaly_df = data['anomaly_records']
    door_df = data['door_events']
    
    duration_fig = create_anomaly_duration_chart(anomaly_df)
    segment_fig = create_responsibility_segment_chart(anomaly_df)
    severity_fig = create_severity_pie_chart(anomaly_df)
    door_fig = create_door_event_timeline(door_df)
    
    return duration_fig, segment_fig, severity_fig, door_fig


@app.callback(
    [Output('anomaly-detail-table', 'columns'),
     Output('anomaly-detail-table', 'data')],
    [Input('filtered-data-store', 'data')]
)
def update_anomaly_detail_table(data_store):
    data = get_data_from_store_or_raw(data_store)
    anomaly_df = data['anomaly_records'].copy()
    
    for col in ['start_time', 'end_time']:
        if col in anomaly_df.columns and pd.api.types.is_datetime64_any_dtype(anomaly_df[col]):
            anomaly_df[col] = anomaly_df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
    
    anomaly_display_cols = ['anomaly_id', 'batch_id', 'anomaly_type', 'start_time', 'end_time',
                            'duration_minutes', 'severity', 'responsible_segment', 'root_cause', 'resolved']
    anomaly_cols = [{'name': c, 'id': c} for c in anomaly_display_cols if c in anomaly_df.columns]
    anomaly_data = anomaly_df[anomaly_display_cols].to_dict('records') if not anomaly_df.empty else []
    
    return anomaly_cols, anomaly_data


@app.callback(
    [Output('anomaly-selector-quick', 'options'),
     Output('anomaly-list-table', 'columns'),
     Output('anomaly-list-table', 'data')],
    [Input('filtered-data-store', 'data')]
)
def update_anomaly_analysis_widgets(data_store):
    data = get_data_from_store_or_raw(data_store)
    anomaly_df = data['anomaly_records'].copy()
    
    dropdown_options = []
    for _, a in anomaly_df.iterrows():
        label = f"{a['anomaly_id']} | {a['anomaly_type']} | {a['batch_id']} | {a['severity']}危"
        dropdown_options.append({'label': label, 'value': a['anomaly_id']})
    
    for col in ['start_time', 'end_time']:
        if col in anomaly_df.columns and pd.api.types.is_datetime64_any_dtype(anomaly_df[col]):
            anomaly_df[col] = anomaly_df[col].dt.strftime('%Y-%m-%d %H:%M')
    
    display_cols = ['anomaly_id', 'batch_id', 'anomaly_type', 'start_time', 'end_time',
                    'duration_minutes', 'severity', 'responsible_segment', 'root_cause']
    table_cols = [{'name': c, 'id': c} for c in display_cols if c in anomaly_df.columns]
    table_data = anomaly_df[display_cols].to_dict('records') if not anomaly_df.empty else []
    
    return dropdown_options, table_cols, table_data


@app.callback(
    [Output('selected-anomaly-store', 'data'),
     Output('main-tabs', 'active_tab'),
     Output('detail-batch-selector', 'value'),
     Output('anomaly-selector-dropdown', 'value'),
     Output('anomaly-selector-quick', 'value')],
    [Input('btn-anomaly-trace-chart', 'n_clicks'),
     Input('btn-anomaly-trace-raw', 'n_clicks'),
     Input('btn-anomaly-trace-route', 'n_clicks'),
     Input('anomaly-list-table', 'selected_rows')],
    [State('anomaly-selector-quick', 'value'),
     State('filtered-data-store', 'data'),
     State('anomaly-list-table', 'data')]
)
def handle_anomaly_quick_trace(btn_chart, btn_raw, btn_route, selected_rows, 
                                selected_anomaly_id, data_store, table_data):
    ctx = callback_context
    if not ctx.triggered:
        raise dash.exceptions.PreventUpdate
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    active_anomaly = None
    target_tab = 'tab-anomalies'
    target_batch = 'ALL'
    
    if trigger_id == 'anomaly-list-table' and selected_rows and len(selected_rows) > 0:
        if table_data and selected_rows[0] < len(table_data):
            active_anomaly = table_data[selected_rows[0]].get('anomaly_id')
    else:
        active_anomaly = selected_anomaly_id
    
    if not active_anomaly:
        raise dash.exceptions.PreventUpdate
    
    data = get_data_from_store_or_raw(data_store)
    anomaly_df = data['anomaly_records']
    anomaly = anomaly_df[anomaly_df['anomaly_id'] == active_anomaly]
    
    if anomaly.empty:
        raise dash.exceptions.PreventUpdate
    
    batch_id = anomaly.iloc[0]['batch_id']
    target_batch = batch_id
    
    if trigger_id in ['btn-anomaly-trace-chart', 'btn-anomaly-trace-route']:
        target_tab = 'tab-route-temp'
    elif trigger_id == 'btn-anomaly-trace-raw':
        target_tab = 'tab-raw-data'
    
    return active_anomaly, target_tab, target_batch, active_anomaly, active_anomaly


@app.callback(
    Output('download-report', 'data'),
    [Input('btn-export', 'n_clicks')],
    [State('current-filters-store', 'data'),
     State('filtered-data-store', 'data')]
)
def export_report(n_clicks, filters, data_store):
    if n_clicks is None:
        raise dash.exceptions.PreventUpdate
    
    data = get_data_from_store_or_raw(data_store)
    temp_df = data['temperature_records']
    shipment_df = data['shipment_info']
    anomaly_df = data['anomaly_records']
    door_df = data['door_events']
    
    batch_agg = aggregate_by_batch(temp_df, shipment_df) if not temp_df.empty and not shipment_df.empty else pd.DataFrame()
    
    filter_str_parts = []
    if filters:
        if filters.get('vehicles'):
            filter_str_parts.append(f"车辆{len(filters['vehicles'])}个")
        if filters.get('routes'):
            filter_str_parts.append(f"路线{len(filters['routes'])}个")
        if filters.get('batches'):
            filter_str_parts.append(f"批次{len(filters['batches'])}个")
    
    filter_str = "_".join(filter_str_parts) if filter_str_parts else "全部数据"
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"冷链温控报告_{filter_str}_{timestamp}.xlsx"
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        summary_df = pd.DataFrame([
            {'项目': '导出时间', '值': datetime.now().strftime('%Y-%m-%d %H:%M:%S')},
            {'项目': '筛选条件', '值': str(filters) if filters else '无'},
            {'项目': '温度记录数', '值': len(temp_df)},
            {'项目': '运输批次数', '值': len(shipment_df)},
            {'项目': '异常事件数', '值': len(anomaly_df)},
            {'项目': '样本时间范围', '值': f"{temp_df['timestamp'].min() if not temp_df.empty else '-'} 至 {temp_df['timestamp'].max() if not temp_df.empty else '-'}"}
        ])
        summary_df.to_excel(writer, sheet_name='导出说明', index=False)
        
        if not temp_df.empty:
            temp_df.to_excel(writer, sheet_name='温度记录', index=False)
        if not anomaly_df.empty:
            anomaly_df.to_excel(writer, sheet_name='异常记录', index=False)
        if not batch_agg.empty:
            batch_agg.to_excel(writer, sheet_name='批次汇总', index=False)
        if not door_df.empty:
            door_df.to_excel(writer, sheet_name='开门记录', index=False)
    
    output.seek(0)
    return dcc.send_bytes(output.getvalue(), filename)


@app.callback(
    Output('anomaly-selector-dropdown', 'options'),
    [Input('filtered-data-store', 'data')]
)
def update_anomaly_dropdown(data_store):
    data = get_data_from_store_or_raw(data_store)
    anomaly_df = data['anomaly_records']
    
    if anomaly_df.empty:
        return []
    
    options = []
    for _, a in anomaly_df.iterrows():
        label = f"{a['anomaly_id']} | {a['anomaly_type']} | {a['batch_id']} | {a['severity']}危"
        options.append({'label': label, 'value': a['anomaly_id']})
    
    return options


@app.callback(
    [Output('selected-anomaly-store', 'data'),
     Output('main-tabs', 'active_tab'),
     Output('detail-batch-selector', 'value'),
     Output('anomaly-selector-dropdown', 'value')],
    [Input('btn-trace-to-chart', 'n_clicks'),
     Input('btn-clear-trace', 'n_clicks')],
    [State('anomaly-selector-dropdown', 'value'),
     State('filtered-data-store', 'data'),
     State('selected-anomaly-store', 'data')]
)
def handle_trace_buttons(trace_btn, clear_btn, selected_anomaly_id, data_store, current_anomaly):
    ctx = callback_context
    if not ctx.triggered:
        raise dash.exceptions.PreventUpdate
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    if trigger_id == 'btn-clear-trace':
        return None, 'tab-raw-data', 'ALL', None
    
    if trigger_id == 'btn-trace-to-chart':
        if not selected_anomaly_id:
            raise dash.exceptions.PreventUpdate
        
        data = get_data_from_store_or_raw(data_store)
        anomaly_df = data['anomaly_records']
        anomaly = anomaly_df[anomaly_df['anomaly_id'] == selected_anomaly_id]
        
        if anomaly.empty:
            raise dash.exceptions.PreventUpdate
        
        batch_id = anomaly.iloc[0]['batch_id']
        return selected_anomaly_id, 'tab-route-temp', batch_id, selected_anomaly_id
    
    raise dash.exceptions.PreventUpdate


@app.callback(
    [Output('anomaly-trace-panel', 'children'),
     Output('anomaly-trace-panel', 'style'),
     Output('temp-table-stats', 'children')],
    [Input('selected-anomaly-store', 'data'),
     Input('filtered-data-store', 'data'),
     Input('btn-trace-to-table', 'n_clicks')],
    [State('anomaly-selector-dropdown', 'value')]
)
def update_anomaly_trace_panel(selected_anomaly_id, data_store, trace_table_btn, dropdown_anomaly):
    data = get_data_from_store_or_raw(data_store)
    anomaly_df = data['anomaly_records']
    temp_df = data['temperature_records']
    
    active_anomaly = selected_anomaly_id or dropdown_anomaly
    
    stats_text = f"共 {len(temp_df)} 条温度记录"
    
    if not active_anomaly or anomaly_df.empty:
        return [], {'display': 'none'}, stats_text
    
    anomaly = anomaly_df[anomaly_df['anomaly_id'] == active_anomaly]
    if anomaly.empty:
        return [], {'display': 'none'}, stats_text
    
    a = anomaly.iloc[0]
    
    start_time = pd.to_datetime(a['start_time'])
    end_time = pd.to_datetime(a['end_time'])
    
    temp_in_range = temp_df[
        (temp_df['timestamp'] >= start_time) & 
        (temp_df['timestamp'] <= end_time) &
        (temp_df['batch_id'] == a['batch_id'])
    ]
    
    stats_text = f"异常时间段内: {len(temp_in_range)} 条记录 / 全部: {len(temp_df)} 条"
    
    panel_content = dbc.Card([
        dbc.CardHeader([
            html.Strong("🔍 正在追溯异常："),
            html.Span(f"{a['anomaly_id']} - {a['anomaly_type']}", className="ms-2")
        ]),
        dbc.CardBody([
            dbc.Row([
                dbc.Col([
                    html.Div([
                        html.Strong("批次："), a['batch_id'],
                        html.Br(),
                        html.Strong("异常类型："), 
                        html.Span(a['anomaly_type'], className=f"status-indicator status-{'danger' if a['severity'] == '高' else 'warning'} ms-1"),
                        html.Br(),
                        html.Strong("严重程度："), a['severity'],
                    ])
                ], md=3),
                dbc.Col([
                    html.Div([
                        html.Strong("开始时间："), start_time.strftime('%Y-%m-%d %H:%M'),
                        html.Br(),
                        html.Strong("结束时间："), end_time.strftime('%Y-%m-%d %H:%M'),
                        html.Br(),
                        html.Strong("持续时长："), f"{a['duration_minutes']:.0f} 分钟",
                    ])
                ], md=3),
                dbc.Col([
                    html.Div([
                        html.Strong("责任段："), a['responsible_segment'],
                        html.Br(),
                        html.Strong("根因分析："), a['root_cause'],
                        html.Br(),
                        html.Strong("处理状态："), '✅ 已处理' if a.get('resolved', False) else '❌ 未处理',
                    ])
                ], md=4),
                dbc.Col([
                    html.Div([
                        html.Strong("异常温度记录："), f"{len(temp_in_range)} 条",
                        html.Br(),
                        html.Strong("最高温度："), f"{temp_in_range['temperature'].max():.1f}°C" if not temp_in_range.empty else '-',
                        html.Br(),
                        html.Strong("最低温度："), f"{temp_in_range['temperature'].min():.1f}°C" if not temp_in_range.empty else '-',
                    ])
                ], md=2)
            ])
        ])
    ], className="border-danger")
    
    return panel_content, {'display': 'block'}, stats_text


@app.callback(
    [Output('raw-temp-table', 'columns'),
     Output('raw-temp-table', 'data')],
    [Input('filtered-data-store', 'data'),
     Input('btn-trace-to-table', 'n_clicks'),
     Input('btn-clear-trace', 'n_clicks')],
    [State('anomaly-selector-dropdown', 'value'),
     State('selected-anomaly-store', 'data')]
)
def update_raw_temp_table_with_trace(data_store, trace_btn, clear_btn, dropdown_anomaly, store_anomaly):
    ctx = callback_context
    data = get_data_from_store_or_raw(data_store)
    temp_df = data['temperature_records'].copy()
    anomaly_df = data['anomaly_records']
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0] if ctx.triggered else None
    
    active_anomaly = None
    if trigger_id == 'btn-trace-to-table':
        active_anomaly = dropdown_anomaly or store_anomaly
    elif trigger_id != 'btn-clear-trace':
        active_anomaly = store_anomaly
    
    if active_anomaly and not anomaly_df.empty and trigger_id != 'btn-clear-trace':
        anomaly = anomaly_df[anomaly_df['anomaly_id'] == active_anomaly]
        if not anomaly.empty:
            a = anomaly.iloc[0]
            start_time = pd.to_datetime(a['start_time'])
            end_time = pd.to_datetime(a['end_time'])
            temp_df = temp_df[
                (temp_df['timestamp'] >= start_time) & 
                (temp_df['timestamp'] <= end_time) &
                (temp_df['batch_id'] == a['batch_id'])
            ]
    
    for col in ['timestamp', 'probe_last_calibration']:
        if col in temp_df.columns and pd.api.types.is_datetime64_any_dtype(temp_df[col]):
            temp_df[col] = temp_df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
    
    temp_display_cols = ['record_id', 'batch_id', 'vehicle_id', 'container_id', 'timestamp',
                         'temperature', 'probe_id', 'probe_calibrated', 'door_open', 'data_quality']
    temp_cols = [{'name': c, 'id': c} for c in temp_display_cols if c in temp_df.columns]
    temp_data = temp_df[temp_display_cols].to_dict('records') if not temp_df.empty else []
    
    return temp_cols, temp_data


if __name__ == '__main__':
    app.run_server(debug=False, port=8051)
