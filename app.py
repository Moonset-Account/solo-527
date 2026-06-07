import dash
from dash import dcc, html, Input, Output, State, callback_context, ALL
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.analysis.time_slicer import TimeSlicer
from src.analysis.anomaly_detector import AnomalyDetector
from src.analysis.metrics import QueueMetrics, ServeMetrics, ReviewMetrics
from src.analysis.cache_manager import CacheManager
from src.database import QueryLayer
from src.database.connection import get_engine
from src.utils.data_generator import generate_mock_data
from src.utils.exporter import export_to_csv, export_to_pdf

app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP], suppress_callback_exceptions=True)
app.title = "校园食堂窗口排队分析系统"
server = app.server

cache_manager = CacheManager(server)

USE_MOCK = os.environ.get('USE_MOCK', 'auto').lower() in ['true', '1', 'yes']


def test_db_connection():
    try:
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception:
        return False


def load_data_from_db():
    try:
        from src.database.models import Window, Dish, Order, Review, WindowOutage
        from sqlalchemy import text
        engine = get_engine()
        
        windows_df = pd.read_sql("SELECT * FROM windows WHERE is_active = TRUE", engine)
        dishes_df = pd.read_sql("SELECT * FROM dishes", engine)
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=7)
        orders_query = text("""
            SELECT * FROM orders 
            WHERE queue_start_time >= :start_date 
            AND queue_start_time < :end_date
            ORDER BY queue_start_time DESC
            LIMIT 5000
        """)
        orders_df = pd.read_sql(orders_query, engine, params={"start_date": start_date, "end_date": end_date + timedelta(days=1)})
        
        reviews_query = text("""
            SELECT * FROM reviews 
            WHERE create_time >= :start_date 
            ORDER BY create_time DESC
            LIMIT 1000
        """)
        reviews_df = pd.read_sql(reviews_query, engine, params={"start_date": start_date})
        
        outages_query = text("""
            SELECT * FROM window_outages 
            WHERE start_time >= :start_date 
            ORDER BY start_time DESC
        """)
        outages_df = pd.read_sql(outages_query, engine, params={"start_date": start_date - timedelta(days=1)})
        
        return orders_df, windows_df, dishes_df, reviews_df, outages_df
    except Exception as e:
        print(f"从数据库加载数据失败: {e}")
        return None


if USE_MOCK:
    print("环境变量 USE_MOCK=true，使用模拟数据")
    orders_df, windows_df, dishes_df, reviews_df, outages_df = generate_mock_data(days=7, orders_per_day=600)
else:
    print("尝试连接 TimescaleDB...")
    if test_db_connection():
        print("数据库连接成功，从数据库加载数据...")
        db_data = load_data_from_db()
        if db_data is not None and len(db_data[0]) > 0:
            orders_df, windows_df, dishes_df, reviews_df, outages_df = db_data
            USE_MOCK = False
        else:
            print("数据库中数据不足，回退到模拟数据")
            orders_df, windows_df, dishes_df, reviews_df, outages_df = generate_mock_data(days=7, orders_per_day=600)
            USE_MOCK = True
    else:
        print("数据库连接失败，回退到模拟数据")
        orders_df, windows_df, dishes_df, reviews_df, outages_df = generate_mock_data(days=7, orders_per_day=600)
        USE_MOCK = True

time_slicer = TimeSlicer()
anomaly_detector = AnomalyDetector()

if not USE_MOCK:
    orders_df['queue_start_time'] = pd.to_datetime(orders_df['queue_start_time'])
    orders_df['payment_time'] = pd.to_datetime(orders_df['payment_time'])
    orders_df['serve_time'] = pd.to_datetime(orders_df['serve_time'])
    if 'is_abnormal' not in orders_df.columns:
        orders_df = anomaly_detector.clean_data(orders_df, outages_df)
else:
    orders_df = anomaly_detector.clean_data(orders_df, outages_df)

mock_data = {
    'orders': orders_df,
    'windows': windows_df,
    'dishes': dishes_df,
    'reviews': reviews_df,
    'outages': outages_df
}
query_layer = QueryLayer(use_mock=USE_MOCK, mock_data=mock_data)

available_dates = sorted(orders_df['queue_start_time'].dt.date.unique())
available_floors = sorted(orders_df['floor'].unique())
available_time_slots = ['breakfast', 'lunch', 'dinner', 'night_snack', 'all']

window_name_map = dict(zip(windows_df['id'], windows_df['name']))
window_id_map = {v: k for k, v in window_name_map.items()}
dish_name_map = dict(zip(dishes_df['id'], dishes_df['name']))


def get_chinese_font_path():
    font_paths = [
        '/System/Library/Fonts/PingFang.ttc',
        '/System/Library/Fonts/STHeiti Medium.ttc',
        '/System/Library/Fonts/STHeiti Light.ttc',
        '/System/Library/Fonts/Supplemental/Songti.ttc',
        '/Library/Fonts/Arial Unicode.ttf',
    ]
    for path in font_paths:
        if os.path.exists(path):
            return path
    return None


CHINESE_FONT_PATH = get_chinese_font_path()


def get_cached_data(key_prefix, compute_func, *args, **kwargs):
    timeout = 300
    return cache_manager.get_or_compute(key_prefix, compute_func, *args, timeout=timeout, **kwargs)


def create_heatmap_figure(selected_date, selected_floor, selected_time_slot):
    if isinstance(selected_date, str):
        selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
    
    def _compute():
        heatmap_data = query_layer.get_window_heatmap_data(
            selected_date, selected_floor, selected_time_slot, bucket_minutes=10
        )
        if heatmap_data.empty:
            return None
        
        heatmap_data = heatmap_data.set_index('window_id')
        heatmap_data.index = heatmap_data.index.map(window_name_map)
        return heatmap_data
    
    heatmap_data = get_cached_data('heatmap', _compute, selected_date, selected_floor, selected_time_slot)
    
    if heatmap_data is None or heatmap_data.empty:
        fig = go.Figure()
        fig.update_layout(title='暂无数据', height=500)
        return fig
    
    fig = go.Figure(data=go.Heatmap(
        z=heatmap_data.values,
        x=[t.strftime('%H:%M') for t in heatmap_data.columns],
        y=heatmap_data.index,
        colorscale='RdYlGn_r',
        colorbar_title='平均等待时间(分钟)',
        hoverongaps=False,
        customdata=np.array([[idx for _ in heatmap_data.columns] for idx in heatmap_data.index]),
        hovertemplate='窗口: %{y}<br>时间: %{x}<br>平均等待: %{z:.1f}分钟<extra></extra>'
    ))
    
    fig.update_layout(
        title='窗口热力图 - 点击窗口查看详情',
        xaxis_title='时间',
        yaxis_title='窗口',
        height=500,
        clickmode='event+select'
    )
    
    return fig


def create_dish_distribution_figure(selected_window, selected_date):
    if isinstance(selected_date, str):
        selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
    
    def _compute():
        return query_layer.get_dish_distribution(selected_window, selected_date)
    
    dish_stats = get_cached_data('dish_dist', _compute, selected_window, selected_date)
    
    if dish_stats is None or dish_stats.empty:
        fig = go.Figure()
        fig.update_layout(title='暂无数据', height=400)
        return fig
    
    dish_stats['dish_name'] = dish_stats['dish_id'].map(dish_name_map)
    
    fig = px.bar(
        dish_stats,
        x='dish_name',
        y='serve_count',
        color='avg_serve_time',
        color_continuous_scale='Viridis',
        labels={'dish_name': '菜品', 'serve_count': '出餐份数', 'avg_serve_time': '平均出餐时间(分钟)'},
        hover_data=['avg_total_wait']
    )
    
    fig.update_layout(title='菜品出餐分布', height=400)
    return fig


def create_payment_wait_figure(selected_floor, selected_time_slot):
    def _compute():
        return query_layer.get_payment_wait_analysis(selected_floor, selected_time_slot)
    
    payment_analysis = get_cached_data('payment_wait', _compute, selected_floor, selected_time_slot)
    
    if payment_analysis is None or payment_analysis.empty:
        fig = go.Figure()
        fig.update_layout(title='暂无数据', height=400)
        return fig
    
    payment_analysis['window_name'] = payment_analysis['window_id'].map(window_name_map)
    
    fig = px.box(
        payment_analysis,
        x='window_name',
        y='avg_payment_wait',
        color='is_big_break',
        labels={'window_name': '窗口', 'avg_payment_wait': '平均支付等待(分钟)', 'is_big_break': '大课间'},
        points='all'
    )
    
    fig.update_layout(title='支付等待时间分析', height=400)
    return fig


def create_big_break_figure():
    def _compute():
        return query_layer.get_big_break_comparison()
    
    bb_analysis = get_cached_data('big_break', _compute)
    
    if bb_analysis is None or bb_analysis.empty:
        fig = go.Figure()
        fig.update_layout(title='暂无数据', height=400)
        return fig
    
    bb_analysis['window_name'] = bb_analysis['window_id'].map(window_name_map)
    bb_analysis['period_label'] = bb_analysis['is_big_break'].map({True: '大课间', False: '普通时段'})
    
    fig = px.bar(
        bb_analysis,
        x='window_name',
        y='avg_total_wait',
        color='period_label',
        barmode='group',
        labels={'window_name': '窗口', 'avg_total_wait': '平均总等待(分钟)', 'period_label': '时段类型'},
        text_auto='.1f'
    )
    
    fig.update_layout(title='大课间 vs 普通时段等待对比', height=400)
    return fig


def create_queue_start_figure(selected_window):
    def _compute():
        metrics = QueueMetrics(orders_df)
        return metrics.analyze_queue_start_patterns()
    
    patterns = get_cached_data('queue_patterns', _compute)
    
    if patterns is None or patterns.empty:
        fig = go.Figure()
        fig.update_layout(title='暂无数据', height=400)
        return fig
    
    if selected_window != 'all':
        patterns = patterns[patterns['window_id'] == selected_window]
    
    patterns['window_name'] = patterns['window_id'].map(window_name_map)
    
    fig = go.Figure()
    
    for slot in ['breakfast', 'lunch', 'dinner']:
        slot_data = patterns[patterns['time_slot'] == slot]
        if not slot_data.empty:
            fig.add_trace(go.Bar(
                x=slot_data['window_name'],
                y=slot_data['avg_queue_start'] / 60,
                name=f'{slot} 平均排队开始',
                hovertext=slot_data['avg_queue_start_time'],
                customdata=slot_data['window_id'],
            ))
    
    fig.update_layout(
        title='学生排队开始时间分析（小时）',
        yaxis_title='时间（小时）',
        height=400,
        barmode='group',
        clickmode='event+select'
    )
    
    return fig


def create_serve_time_figure(selected_window):
    def _compute():
        metrics = ServeMetrics(orders_df)
        return metrics.analyze_serve_patterns()
    
    patterns = get_cached_data('serve_patterns', _compute)
    
    if patterns is None or patterns.empty:
        fig = go.Figure()
        fig.update_layout(title='暂无数据', height=400)
        return fig
    
    if selected_window != 'all':
        patterns = patterns[patterns['window_id'] == selected_window]
    
    patterns['window_name'] = patterns['window_id'].map(window_name_map)
    
    fig = px.scatter(
        patterns,
        x='window_name',
        y='avg_serve_duration',
        size='serve_count',
        color='time_slot',
        custom_data=['window_id'],
        labels={'window_name': '窗口', 'avg_serve_duration': '平均出餐时间(分钟)', 
                'serve_count': '出餐量', 'time_slot': '时段'}
    )
    
    fig.update_layout(title='窗口出餐时间分析', height=400, clickmode='event+select')
    return fig


def create_rating_trend_figure(selected_window):
    def _compute():
        return query_layer.get_rating_trends(selected_window if selected_window != 'all' else None)
    
    trends = get_cached_data('rating_trends', _compute, selected_window)
    
    if trends is None or trends.empty:
        fig = go.Figure()
        fig.update_layout(title='暂无数据', height=400)
        return fig
    
    trends['window_name'] = trends['window_id'].map(window_name_map)
    
    fig = px.line(
        trends,
        x='date',
        y='avg_rating',
        color='window_name',
        markers=True,
        labels={'date': '日期', 'avg_rating': '平均评分', 'window_name': '窗口'}
    )
    
    fig.update_layout(title='评分趋势（7日移动平均）', height=400)
    return fig


def create_window_timeline_figure(window_id, selected_date, include_abnormal=False):
    if isinstance(selected_date, str):
        selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
    
    timeline_data = query_layer.get_window_raw_timeline(window_id, selected_date, include_abnormal)
    
    if timeline_data.empty:
        fig = go.Figure()
        fig.update_layout(
            title=f'{window_name_map.get(window_id, "窗口")} - 暂无数据',
            xaxis_title='时间',
            yaxis_title='订单号',
            height=500
        )
        return fig, pd.DataFrame()
    
    timeline_data = timeline_data.sort_values('queue_start_time').reset_index(drop=True)
    timeline_data['y_pos'] = range(len(timeline_data))
    
    fig = go.Figure()
    
    colors = {'queue': '#3B82F6', 'payment': '#F59E0B', 'serve': '#10B981', 'abnormal': '#EF4444'}
    
    for _, row in timeline_data.iterrows():
        line_color = colors['abnormal'] if row['is_abnormal'] else '#6B7280'
        
        fig.add_trace(go.Scatter(
            x=[row['queue_start_time'], row['payment_time'], row['serve_time']],
            y=[row['y_pos'], row['y_pos'], row['y_pos']],
            mode='lines+markers',
            line=dict(width=4, color=line_color),
            marker=dict(
                size=10,
                color=[colors['queue'], colors['payment'], colors['serve']],
                line=dict(width=2, color='white')
            ),
            name=row['order_no'],
            text=[
                f'取号: {row["queue_start_time"].strftime("%H:%M:%S")}<br>排队等: {row["wait_queue"]:.1f}分',
                f'支付: {row["payment_time"].strftime("%H:%M:%S")}<br>支付等: {row["wait_payment"]:.1f}分',
                f'出餐: {row["serve_time"].strftime("%H:%M:%S")}<br>出餐等: {row["wait_serve"]:.1f}分'
            ],
            hoverinfo='text',
            showlegend=False,
            opacity=0.4 if row['is_abnormal'] else 1.0
        ))
    
    fig.add_trace(go.Scatter(
        x=[None], y=[None], mode='markers',
        marker=dict(size=12, color=colors['queue'], line=dict(width=2, color='white')),
        name='取号开始'
    ))
    fig.add_trace(go.Scatter(
        x=[None], y=[None], mode='markers',
        marker=dict(size=12, color=colors['payment'], line=dict(width=2, color='white')),
        name='支付完成'
    ))
    fig.add_trace(go.Scatter(
        x=[None], y=[None], mode='markers',
        marker=dict(size=12, color=colors['serve'], line=dict(width=2, color='white')),
        name='出餐完成'
    ))
    
    y_tick_labels = timeline_data['order_no'].tolist()
    fig.update_layout(
        title=f'{window_name_map.get(window_id, "窗口")} - 取号/支付/出餐时间线',
        xaxis_title='时间',
        yaxis_title='订单号',
        yaxis=dict(
            tickvals=list(range(len(timeline_data))),
            ticktext=[lbl[-6:] if len(lbl) > 10 else lbl for lbl in y_tick_labels]
        ),
        height=550,
        showlegend=True,
        legend=dict(orientation='h', y=1.1),
        hovermode='closest'
    )
    
    detail_df = timeline_data[['order_no', 'queue_start_time', 'payment_time', 'serve_time',
                                'wait_queue', 'wait_payment', 'wait_serve', 'total_wait', 'is_abnormal']].copy()
    detail_df.columns = ['订单号', '取号时间', '支付时间', '出餐时间', '排队等待(分)', '支付等待(分)', '出餐等待(分)', '总等待(分)', '异常']
    
    return fig, detail_df


sidebar = dbc.Card(
    [
        dbc.CardHeader("筛选条件"),
        dbc.CardBody(
            [
                html.Label("选择日期"),
                dcc.Dropdown(
                    id='date-selector',
                    options=[{'label': str(d), 'value': str(d)} for d in available_dates],
                    value=str(available_dates[0]) if available_dates else None,
                    clearable=False,
                    className='mb-3'
                ),
                html.Label("选择楼层"),
                dcc.Dropdown(
                    id='floor-selector',
                    options=[{'label': f'{f}楼', 'value': f} for f in available_floors] + [{'label': '全部', 'value': 'all'}],
                    value='all',
                    clearable=False,
                    className='mb-3'
                ),
                html.Label("选择时段"),
                dcc.Dropdown(
                    id='time-slot-selector',
                    options=[{'label': s, 'value': s} for s in available_time_slots],
                    value='all',
                    clearable=False,
                    className='mb-3'
                ),
                html.Label("选择窗口"),
                dcc.Dropdown(
                    id='window-selector',
                    options=[{'label': name, 'value': wid} for wid, name in window_name_map.items()] + [{'label': '全部', 'value': 'all'}],
                    value='all',
                    clearable=False,
                    className='mb-3'
                ),
                html.Hr(),
                html.Div([
                    dbc.Button("🔄 刷新缓存", id='refresh-btn', color='primary', className='w-100 mb-2'),
                    dbc.Button("📥 导出CSV", id='export-csv-btn', color='success', className='w-100 mb-2'),
                    dbc.Button("📄 导出PDF", id='export-pdf-btn', color='info', className='w-100'),
                ]),
                dcc.Download(id='download-data'),
                html.Div(id='cache-status', className='mt-3 small text-muted'),
                dcc.Store(id='selected-window-store', data=None),
                dcc.Store(id='last-refresh-time', data=None),
            ]
        )
    ],
    className='h-100'
)

main_content = dbc.Card(
    [
        dbc.CardHeader([
            html.H5("校园食堂窗口排队分析系统", className='d-inline'),
            html.Span(id='connection-status', className='badge bg-secondary ms-2 float-end')
        ]),
        dbc.CardBody(
            [
                dbc.Tabs(
                    [
                        dbc.Tab(
                            label="总览分析",
                            tab_id='tab-overview',
                            children=[
                                html.Div([
                                    dbc.Row([
                                        dbc.Col([
                                            dbc.Alert([
                                                html.Strong("提示："),
                                                "点击热力图中的任意位置可跳转到对应的窗口详情页"
                                            ], color='info', className='mb-3'),
                                            dcc.Graph(id='heatmap-figure')
                                        ], width=12)
                                    ], className='mb-4'),
                                    dbc.Row([
                                        dbc.Col([
                                            dcc.Graph(id='dish-distribution-figure')
                                        ], width=6),
                                        dbc.Col([
                                            dcc.Graph(id='payment-wait-figure')
                                        ], width=6)
                                    ], className='mb-4'),
                                    dbc.Row([
                                        dbc.Col([
                                            dcc.Graph(id='big-break-figure')
                                        ], width=12)
                                    ])
                                ])
                            ]
                        ),
                        dbc.Tab(
                            label="排队&出餐分析",
                            tab_id='tab-queue',
                            children=[
                                html.Div([
                                    dbc.Row([
                                        dbc.Col([
                                            dbc.Alert("点击柱状图可快速筛选对应窗口", color='info', className='mb-2'),
                                            dcc.Graph(id='queue-start-figure')
                                        ], width=6),
                                        dbc.Col([
                                            dbc.Alert("点击散点可快速筛选对应窗口", color='info', className='mb-2'),
                                            dcc.Graph(id='serve-time-figure')
                                        ], width=6)
                                    ], className='mb-4'),
                                    dbc.Row([
                                        dbc.Col([
                                            html.H5("排队开始时间统计"),
                                            html.Div(id='queue-stats-table')
                                        ], width=12)
                                    ])
                                ])
                            ]
                        ),
                        dbc.Tab(
                            label="评价分析",
                            tab_id='tab-review',
                            children=[
                                html.Div([
                                    dbc.Row([
                                        dbc.Col([
                                            dcc.Graph(id='rating-trend-figure')
                                        ], width=12)
                                    ], className='mb-4'),
                                    dbc.Row([
                                        dbc.Col([
                                            html.H5("评价词云"),
                                            html.Img(id='wordcloud-img', style={'width': '100%', 'height': '400px', 'object-fit': 'contain'})
                                        ], width=6),
                                        dbc.Col([
                                            html.H5("差评关键词 TOP20"),
                                            html.Div(id='keyword-table')
                                        ], width=6)
                                    ])
                                ])
                            ]
                        ),
                        dbc.Tab(
                            label="窗口详情",
                            tab_id='tab-detail',
                            children=[
                                html.Div([
                                    dbc.Row([
                                        dbc.Col([
                                            dbc.Card([
                                                dbc.CardHeader("窗口选择"),
                                                dbc.CardBody([
                                                    dbc.Row([
                                                        dbc.Col([
                                                            html.Label("选择窗口"),
                                                            dcc.Dropdown(
                                                                id='detail-window-selector',
                                                                options=[{'label': name, 'value': wid} for wid, name in window_name_map.items()],
                                                                value=list(window_name_map.keys())[0] if window_name_map else None,
                                                                clearable=False
                                                            )
                                                        ], width=6),
                                                        dbc.Col([
                                                            html.Label("选择日期"),
                                                            dcc.Dropdown(
                                                                id='detail-date-selector',
                                                                options=[{'label': str(d), 'value': str(d)} for d in available_dates],
                                                                value=str(available_dates[0]) if available_dates else None,
                                                                clearable=False
                                                            )
                                                        ], width=6)
                                                    ]),
                                                    dbc.Row([
                                                        dbc.Col([
                                                            dbc.Checklist(
                                                                options=[{"label": "包含异常订单", "value": "include_abnormal"}],
                                                                value=[],
                                                                id='include-abnormal-check',
                                                                switch=True,
                                                                className='mt-2'
                                                            )
                                                        ], width=6),
                                                        dbc.Col([
                                                            html.Div(id='window-summary-stats', className='text-end mt-2')
                                                        ], width=6)
                                                    ])
                                                ])
                                            ])
                                        ], width=12)
                                    ], className='mb-4'),
                                    dbc.Row([
                                        dbc.Col([
                                            dcc.Graph(id='timeline-figure')
                                        ], width=12)
                                    ], className='mb-4'),
                                    dbc.Row([
                                        dbc.Col([
                                            html.H5("原始订单明细"),
                                            html.Div(id='order-detail-table')
                                        ], width=12)
                                    ])
                                ])
                            ]
                        )
                    ],
                    id='tabs',
                    active_tab='tab-overview'
                )
            ]
        )
    ]
)

app.layout = dbc.Container(
    [
        html.H1("校园食堂窗口排队分析系统", className='text-center my-4'),
        dbc.Row(
            [
                dbc.Col(sidebar, width=3),
                dbc.Col(main_content, width=9)
            ]
        )
    ],
    fluid=True
)


@app.callback(
    Output('heatmap-figure', 'figure'),
    [Input('date-selector', 'value'),
     Input('floor-selector', 'value'),
     Input('time-slot-selector', 'value'),
     Input('last-refresh-time', 'data')]
)
def update_heatmap(selected_date, selected_floor, selected_time_slot, _):
    if selected_date is None:
        return go.Figure()
    return create_heatmap_figure(selected_date, selected_floor, selected_time_slot)


@app.callback(
    Output('dish-distribution-figure', 'figure'),
    [Input('date-selector', 'value'),
     Input('window-selector', 'value'),
     Input('last-refresh-time', 'data')]
)
def update_dish_distribution(selected_date, selected_window, _):
    if selected_date is None:
        return go.Figure()
    return create_dish_distribution_figure(selected_window, selected_date)


@app.callback(
    Output('payment-wait-figure', 'figure'),
    [Input('floor-selector', 'value'),
     Input('time-slot-selector', 'value'),
     Input('last-refresh-time', 'data')]
)
def update_payment_wait(selected_floor, selected_time_slot, _):
    return create_payment_wait_figure(selected_floor, selected_time_slot)


@app.callback(
    Output('big-break-figure', 'figure'),
    [Input('last-refresh-time', 'data')]
)
def update_big_break(_):
    return create_big_break_figure()


@app.callback(
    Output('queue-start-figure', 'figure'),
    [Input('window-selector', 'value'),
     Input('last-refresh-time', 'data')]
)
def update_queue_start(selected_window, _):
    return create_queue_start_figure(selected_window)


@app.callback(
    Output('serve-time-figure', 'figure'),
    [Input('window-selector', 'value'),
     Input('last-refresh-time', 'data')]
)
def update_serve_time(selected_window, _):
    return create_serve_time_figure(selected_window)


@app.callback(
    Output('rating-trend-figure', 'figure'),
    [Input('window-selector', 'value'),
     Input('last-refresh-time', 'data')]
)
def update_rating_trend(selected_window, _):
    return create_rating_trend_figure(selected_window)


@app.callback(
    [Output('timeline-figure', 'figure'),
     Output('order-detail-table', 'children'),
     Output('window-summary-stats', 'children')],
    [Input('detail-window-selector', 'value'),
     Input('detail-date-selector', 'value'),
     Input('include-abnormal-check', 'value')]
)
def update_window_detail(window_id, selected_date, include_abnormal):
    if window_id is None or selected_date is None:
        return go.Figure(), html.Div(), ''
    
    include_abn = 'include_abnormal' in include_abnormal if include_abnormal else False
    
    fig, detail_df = create_window_timeline_figure(window_id, selected_date, include_abn)
    
    if detail_df.empty:
        table = html.Div("该时段暂无订单数据")
        stats = html.Span("订单数: 0", className='badge bg-secondary')
    else:
        table = dbc.Table.from_dataframe(
            detail_df,
            striped=True,
            bordered=True,
            hover=True,
            responsive=True,
            size='sm'
        )
        normal_count = len(detail_df[detail_df['异常'] == False])
        abnormal_count = len(detail_df[detail_df['异常'] == True])
        avg_wait = detail_df['总等待(分)'].mean()
        stats = html.Span([
            f"订单数: {len(detail_df)} (正常: {normal_count}, 异常: {abnormal_count}), 平均总等待: {avg_wait:.1f}分",
        ], className='badge bg-info')
    
    return fig, table, stats


@app.callback(
    Output('queue-stats-table', 'children'),
    [Input('window-selector', 'value'),
     Input('last-refresh-time', 'data')]
)
def update_queue_stats(selected_window, _):
    metrics = QueueMetrics(orders_df)
    patterns = metrics.analyze_queue_start_patterns()
    
    if patterns is None or patterns.empty:
        return html.Div("暂无数据")
    
    if selected_window != 'all':
        patterns = patterns[patterns['window_id'] == selected_window]
    
    patterns['window_name'] = patterns['window_id'].map(window_name_map)
    
    display_cols = ['window_name', 'time_slot', 'avg_queue_start_time', 'median_queue_start_time', 'queue_count']
    display_df = patterns[display_cols].copy()
    display_df.columns = ['窗口', '时段', '平均排队开始', '中位数排队开始', '订单数']
    
    return dbc.Table.from_dataframe(
        display_df,
        striped=True,
        bordered=True,
        hover=True,
        responsive=True
    )


@app.callback(
    [Output('wordcloud-img', 'src'),
     Output('keyword-table', 'children')],
    [Input('window-selector', 'value'),
     Input('last-refresh-time', 'data')]
)
def update_wordcloud(selected_window, _):
    review_metrics = ReviewMetrics(reviews_df, orders_df)
    
    window_id = selected_window if selected_window != 'all' else None
    keywords_df = review_metrics.get_keyword_frequency(window_id=window_id, min_rating=2)
    
    from wordcloud import WordCloud
    import io
    import base64
    
    if keywords_df is None or keywords_df.empty:
        return '', html.Div("暂无关键词数据")
    
    word_freq = dict(zip(keywords_df['keyword'], keywords_df['count']))
    
    wc_kwargs = {
        'width': 800,
        'height': 400,
        'background_color': 'white',
        'colormap': 'RdYlGn_r',
        'prefer_horizontal': 0.9
    }
    if CHINESE_FONT_PATH:
        wc_kwargs['font_path'] = CHINESE_FONT_PATH
    
    wc = WordCloud(**wc_kwargs)
    wc.generate_from_frequencies(word_freq)
    
    img = io.BytesIO()
    wc.to_image().save(img, format='PNG')
    img_str = 'data:image/png;base64,' + base64.b64encode(img.getvalue()).decode()
    
    table = dbc.Table.from_dataframe(
        keywords_df.head(20),
        striped=True,
        bordered=True,
        hover=True,
        responsive=True,
        size='sm'
    )
    
    return img_str, table


@app.callback(
    [Output('detail-window-selector', 'value'),
     Output('detail-date-selector', 'value'),
     Output('tabs', 'active_tab')],
    [Input('heatmap-figure', 'clickData'),
     Input('queue-start-figure', 'clickData'),
     Input('serve-time-figure', 'clickData')],
    [State('date-selector', 'value'),
     State('detail-window-selector', 'value'),
     State('detail-date-selector', 'value')],
    prevent_initial_call=True
)
def handle_graph_clicks(heatmap_click, queue_click, serve_click, current_date, curr_win, curr_date):
    ctx = callback_context
    if not ctx.triggered:
        return dash.no_update, dash.no_update, dash.no_update
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    target_window = curr_win
    target_date = curr_date
    
    if trigger_id == 'heatmap-figure' and heatmap_click:
        y_value = heatmap_click['points'][0]['y']
        if y_value in window_id_map:
            target_window = window_id_map[y_value]
            target_date = current_date
    
    elif trigger_id == 'queue-start-figure' and queue_click:
        if 'customdata' in queue_click['points'][0]:
            target_window = queue_click['points'][0]['customdata']
    
    elif trigger_id == 'serve-time-figure' and serve_click:
        if 'customdata' in serve_click['points'][0]:
            target_window = serve_click['points'][0]['customdata'][0]
    
    return target_window, target_date, 'tab-detail'


@app.callback(
    [Output('cache-status', 'children'),
     Output('last-refresh-time', 'data')],
    [Input('refresh-btn', 'n_clicks')],
    prevent_initial_call=True
)
def refresh_cache(n_clicks):
    if n_clicks is None:
        return dash.no_update, dash.no_update
    
    cache_manager.invalidate_all()
    
    if not query_layer.use_mock:
        query_layer.refresh_caches()
        mode_note = "（含连续聚合视图）"
    else:
        mode_note = ""
    
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    status = html.Span([
        html.I(className='fas fa-check-circle me-1'),
        f'缓存已刷新{mode_note} ({now})'
    ], className='text-success')
    
    return status, now


@app.callback(
    Output('download-data', 'data'),
    [Input('export-csv-btn', 'n_clicks'),
     Input('export-pdf-btn', 'n_clicks')],
    [State('date-selector', 'value'),
     State('floor-selector', 'value'),
     State('time-slot-selector', 'value')],
    prevent_initial_call=True
)
def export_data(csv_clicks, pdf_clicks, selected_date, selected_floor, selected_time_slot):
    ctx = callback_context
    if not ctx.triggered:
        return None
    
    button_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    filtered = orders_df.copy()
    
    if selected_date:
        if isinstance(selected_date, str):
            selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
        filtered = filtered[filtered['queue_start_time'].dt.date == selected_date]
    
    if selected_floor != 'all':
        filtered = filtered[filtered['floor'] == selected_floor]
    
    if selected_time_slot != 'all':
        filtered = filtered[filtered['time_slot'] == selected_time_slot]
    
    if button_id == 'export-csv-btn':
        return dcc.send_data_frame(filtered.to_csv, f"canteen_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
    elif button_id == 'export-pdf-btn':
        pdf_path = export_to_pdf(filtered, windows_df)
        return dcc.send_file(pdf_path)
    
    return None


@app.callback(
    Output('connection-status', 'children'),
    Input('last-refresh-time', 'data')
)
def update_connection_status(_):
    mode = "模拟数据模式" if query_layer.use_mock else "TimescaleDB 模式"
    return html.Span(mode, className='badge bg-success me-1')


if __name__ == '__main__':
    print("=" * 60)
    print("校园食堂窗口排队分析系统启动中...")
    print("=" * 60)
    print(f"数据模式: {'模拟数据' if query_layer.use_mock else 'TimescaleDB'}")
    print(f"窗口数量: {len(windows_df)}")
    print(f"菜品数量: {len(dishes_df)}")
    print(f"订单数量: {len(orders_df)}")
    print(f"评价数量: {len(reviews_df)}")
    print("=" * 60)
    print("访问地址: http://localhost:8050")
    print("=" * 60)
    app.run_server(debug=True, port=8050)
