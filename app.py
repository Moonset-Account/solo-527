import dash
from dash import dcc, html, Input, Output, State, callback_context
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.analysis.time_slicer import TimeSlicer
from src.analysis.anomaly_detector import AnomalyDetector
from src.analysis.metrics import QueueMetrics, ServeMetrics, ReviewMetrics
from src.analysis.cache_manager import CacheManager
from src.utils.data_generator import generate_mock_data
from src.utils.exporter import export_to_csv, export_to_pdf

app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
app.title = "校园食堂窗口排队分析系统"
server = app.server

cache_manager = CacheManager(server)

orders_df, windows_df, dishes_df, reviews_df, outages_df = generate_mock_data()

time_slicer = TimeSlicer()
anomaly_detector = AnomalyDetector()
orders_df = anomaly_detector.clean_data(orders_df, outages_df)

available_dates = sorted(orders_df['queue_start_time'].dt.date.unique())
available_floors = sorted(orders_df['floor'].unique())
available_time_slots = ['breakfast', 'lunch', 'dinner', 'night_snack', 'all']

window_name_map = dict(zip(windows_df['id'], windows_df['name']))
dish_name_map = dict(zip(dishes_df['id'], dishes_df['name']))


def create_heatmap_figure(selected_date, selected_floor, selected_time_slot):
    filtered = orders_df[orders_df['queue_start_time'].dt.date == selected_date]
    
    if selected_floor != 'all':
        filtered = filtered[filtered['floor'] == selected_floor]
    
    if selected_time_slot != 'all':
        filtered = filtered[filtered['time_slot'] == selected_time_slot]
    
    filtered = filtered[~filtered['is_abnormal']]
    
    if filtered.empty:
        return go.Figure()
    
    filtered['time_bucket'] = filtered['queue_start_time'].apply(
        lambda x: time_slicer.get_time_bucket(x, 10)
    )
    
    pivot = filtered.pivot_table(
        index='window_id',
        columns='time_bucket',
        values='total_wait',
        aggfunc='mean'
    ).fillna(0)
    
    pivot.index = pivot.index.map(window_name_map)
    
    fig = go.Figure(data=go.Heatmap(
        z=pivot.values,
        x=[t.strftime('%H:%M') for t in pivot.columns],
        y=pivot.index,
        colorscale='RdYlGn_r',
        colorbar_title='平均等待时间(分钟)',
        hoverongaps=False
    ))
    
    fig.update_layout(
        title='窗口热力图 - 按时间段平均等待时间',
        xaxis_title='时间',
        yaxis_title='窗口',
        height=500
    )
    
    return fig


def create_dish_distribution_figure(selected_window, selected_date):
    filtered = orders_df[orders_df['queue_start_time'].dt.date == selected_date]
    
    if selected_window != 'all':
        filtered = filtered[filtered['window_id'] == selected_window]
    
    filtered = filtered[~filtered['is_abnormal']]
    
    if filtered.empty:
        return go.Figure()
    
    dish_stats = filtered.groupby('dish_id').agg(
        count=('order_no', 'count'),
        avg_serve_time=('wait_serve', 'mean')
    ).reset_index()
    
    dish_stats['dish_name'] = dish_stats['dish_id'].map(dish_name_map)
    
    fig = px.bar(
        dish_stats,
        x='dish_name',
        y='count',
        color='avg_serve_time',
        color_continuous_scale='Viridis',
        labels={'dish_name': '菜品', 'count': '出餐份数', 'avg_serve_time': '平均出餐时间(分钟)'}
    )
    
    fig.update_layout(
        title='菜品出餐分布',
        height=400
    )
    
    return fig


def create_payment_wait_figure(selected_floor, selected_time_slot):
    serve_metrics = ServeMetrics(orders_df)
    payment_analysis = serve_metrics.get_payment_wait_analysis()
    
    if payment_analysis.empty:
        return go.Figure()
    
    if selected_floor != 'all':
        payment_analysis = payment_analysis[payment_analysis['floor'] == selected_floor]
    
    if selected_time_slot != 'all':
        payment_analysis = payment_analysis[payment_analysis['time_slot'] == selected_time_slot]
    
    payment_analysis['window_name'] = payment_analysis['window_id'].map(window_name_map)
    
    fig = px.box(
        payment_analysis,
        x='window_name',
        y='avg_payment_wait',
        color='is_big_break',
        labels={'window_name': '窗口', 'avg_payment_wait': '平均支付等待(分钟)', 'is_big_break': '大课间'}
    )
    
    fig.update_layout(
        title='支付等待时间分析',
        height=400
    )
    
    return fig


def create_big_break_figure():
    serve_metrics = ServeMetrics(orders_df)
    bb_analysis = serve_metrics.get_big_break_analysis()
    
    if bb_analysis.empty:
        return go.Figure()
    
    bb_analysis['window_name'] = bb_analysis['window_id'].map(window_name_map)
    
    fig = px.bar(
        bb_analysis,
        x='window_name',
        y='avg_total_wait',
        color='period_type',
        barmode='group',
        labels={'window_name': '窗口', 'avg_total_wait': '平均总等待(分钟)', 'period_type': '时段类型'}
    )
    
    fig.update_layout(
        title='大课间 vs 普通时段等待对比',
        height=400
    )
    
    return fig


def create_queue_start_figure(selected_window):
    queue_metrics = QueueMetrics(orders_df)
    patterns = queue_metrics.analyze_queue_start_patterns()
    
    if patterns.empty:
        return go.Figure()
    
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
                name=f'{slot} 平均排队开始时间',
                hovertext=slot_data['avg_queue_start_time']
            ))
    
    fig.update_layout(
        title='学生排队开始时间分析（小时）',
        yaxis_title='时间（小时）',
        height=400,
        barmode='group'
    )
    
    return fig


def create_serve_time_figure(selected_window):
    serve_metrics = ServeMetrics(orders_df)
    patterns = serve_metrics.analyze_serve_patterns()
    
    if patterns.empty:
        return go.Figure()
    
    if selected_window != 'all':
        patterns = patterns[patterns['window_id'] == selected_window]
    
    patterns['window_name'] = patterns['window_id'].map(window_name_map)
    
    fig = px.scatter(
        patterns,
        x='window_name',
        y='avg_serve_duration',
        size='serve_count',
        color='time_slot',
        labels={'window_name': '窗口', 'avg_serve_duration': '平均出餐时间(分钟)', 'serve_count': '出餐量', 'time_slot': '时段'}
    )
    
    fig.update_layout(
        title='窗口出餐时间分析',
        height=400
    )
    
    return fig


def create_rating_trend_figure(selected_window):
    review_metrics = ReviewMetrics(reviews_df, orders_df)
    trends = review_metrics.analyze_rating_trends()
    
    if trends.empty:
        return go.Figure()
    
    if selected_window != 'all':
        trends = trends[trends['window_id'] == selected_window]
    
    trends['window_name'] = trends['window_id'].map(window_name_map)
    
    fig = px.line(
        trends,
        x='date',
        y='avg_rating',
        color='window_name',
        markers=True,
        labels={'date': '日期', 'avg_rating': '平均评分', 'window_name': '窗口'}
    )
    
    fig.update_layout(
        title='评分趋势',
        height=400
    )
    
    return fig


def get_window_detail_timeline(window_id, selected_date):
    filtered = orders_df[
        (orders_df['window_id'] == window_id) &
        (orders_df['queue_start_time'].dt.date == selected_date)
    ].copy()
    
    if filtered.empty:
        return go.Figure(), pd.DataFrame()
    
    filtered = filtered.sort_values('queue_start_time')
    
    fig = go.Figure()
    
    for idx, row in filtered.iterrows():
        fig.add_trace(go.Scatter(
            x=[row['queue_start_time'], row['payment_time'], row['serve_time']],
            y=[row['order_no'], row['order_no'], row['order_no']],
            mode='lines+markers',
            line=dict(width=3),
            marker=dict(size=8),
            name=row['order_no'],
            text=[
                f'取号: {row["queue_start_time"].strftime("%H:%M:%S")}',
                f'支付: {row["payment_time"].strftime("%H:%M:%S")}',
                f'出餐: {row["serve_time"].strftime("%H:%M:%S")}'
            ],
            hoverinfo='text',
            showlegend=False
        ))
    
    fig.add_trace(go.Scatter(
        x=[None], y=[None], mode='markers',
        marker=dict(size=10, color='blue'),
        name='取号'
    ))
    fig.add_trace(go.Scatter(
        x=[None], y=[None], mode='markers',
        marker=dict(size=10, color='orange'),
        name='支付'
    ))
    fig.add_trace(go.Scatter(
        x=[None], y=[None], mode='markers',
        marker=dict(size=10, color='green'),
        name='出餐'
    ))
    
    fig.update_layout(
        title=f'{window_name_map.get(window_id, "窗口")} - 取号/支付/出餐时间线',
        xaxis_title='时间',
        yaxis_title='订单号',
        height=500,
        showlegend=True
    )
    
    detail_df = filtered[['order_no', 'queue_start_time', 'payment_time', 'serve_time',
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
                    options=[{'label': str(d), 'value': d} for d in available_dates],
                    value=available_dates[0] if available_dates else None,
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
                dbc.Button("刷新数据", id='refresh-btn', color='primary', className='w-100 mb-2'),
                dbc.Button("导出CSV", id='export-csv-btn', color='success', className='w-100 mb-2'),
                dbc.Button("导出PDF", id='export-pdf-btn', color='info', className='w-100'),
                dcc.Download(id='download-data')
            ]
        )
    ],
    className='h-100'
)

main_content = dbc.Card(
    [
        dbc.CardHeader("校园食堂窗口排队分析系统"),
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
                                            dcc.Graph(id='queue-start-figure')
                                        ], width=6),
                                        dbc.Col([
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
                                            html.Img(id='wordcloud-img', style={'width': '100%', 'height': '400px'})
                                        ], width=6),
                                        dbc.Col([
                                            html.H5("差评关键词"),
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
                                            html.Label("点击选择窗口查看详情"),
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
                                                options=[{'label': str(d), 'value': d} for d in available_dates],
                                                value=available_dates[0] if available_dates else None,
                                                clearable=False
                                            )
                                        ], width=6)
                                    ], className='mb-4'),
                                    dbc.Row([
                                        dbc.Col([
                                            dcc.Graph(id='timeline-figure')
                                        ], width=12)
                                    ], className='mb-4'),
                                    dbc.Row([
                                        dbc.Col([
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
     Input('refresh-btn', 'n_clicks')]
)
def update_heatmap(selected_date, selected_floor, selected_time_slot, n_clicks):
    if selected_date is None:
        return go.Figure()
    
    if isinstance(selected_date, str):
        selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
    
    return create_heatmap_figure(selected_date, selected_floor, selected_time_slot)


@app.callback(
    Output('dish-distribution-figure', 'figure'),
    [Input('date-selector', 'value'),
     Input('window-selector', 'value'),
     Input('refresh-btn', 'n_clicks')]
)
def update_dish_distribution(selected_date, selected_window, n_clicks):
    if selected_date is None:
        return go.Figure()
    
    if isinstance(selected_date, str):
        selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
    
    return create_dish_distribution_figure(selected_window, selected_date)


@app.callback(
    Output('payment-wait-figure', 'figure'),
    [Input('floor-selector', 'value'),
     Input('time-slot-selector', 'value'),
     Input('refresh-btn', 'n_clicks')]
)
def update_payment_wait(selected_floor, selected_time_slot, n_clicks):
    return create_payment_wait_figure(selected_floor, selected_time_slot)


@app.callback(
    Output('big-break-figure', 'figure'),
    [Input('refresh-btn', 'n_clicks')]
)
def update_big_break(n_clicks):
    return create_big_break_figure()


@app.callback(
    Output('queue-start-figure', 'figure'),
    [Input('window-selector', 'value'),
     Input('refresh-btn', 'n_clicks')]
)
def update_queue_start(selected_window, n_clicks):
    return create_queue_start_figure(selected_window)


@app.callback(
    Output('serve-time-figure', 'figure'),
    [Input('window-selector', 'value'),
     Input('refresh-btn', 'n_clicks')]
)
def update_serve_time(selected_window, n_clicks):
    return create_serve_time_figure(selected_window)


@app.callback(
    Output('rating-trend-figure', 'figure'),
    [Input('window-selector', 'value'),
     Input('refresh-btn', 'n_clicks')]
)
def update_rating_trend(selected_window, n_clicks):
    return create_rating_trend_figure(selected_window)


@app.callback(
    [Output('timeline-figure', 'figure'),
     Output('order-detail-table', 'children')],
    [Input('detail-window-selector', 'value'),
     Input('detail-date-selector', 'value')]
)
def update_window_detail(window_id, selected_date):
    if window_id is None or selected_date is None:
        return go.Figure(), html.Div()
    
    if isinstance(selected_date, str):
        selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
    
    fig, detail_df = get_window_detail_timeline(window_id, selected_date)
    
    table = dbc.Table.from_dataframe(
        detail_df,
        striped=True,
        bordered=True,
        hover=True,
        responsive=True
    )
    
    return fig, table


@app.callback(
    Output('queue-stats-table', 'children'),
    [Input('window-selector', 'value'),
     Input('refresh-btn', 'n_clicks')]
)
def update_queue_stats(selected_window, n_clicks):
    queue_metrics = QueueMetrics(orders_df)
    patterns = queue_metrics.analyze_queue_start_patterns()
    
    if patterns.empty:
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
     Input('refresh-btn', 'n_clicks')]
)
def update_wordcloud(selected_window, n_clicks):
    review_metrics = ReviewMetrics(reviews_df, orders_df)
    
    window_id = selected_window if selected_window != 'all' else None
    keywords_df = review_metrics.get_keyword_frequency(window_id=window_id, min_rating=2)
    
    from wordcloud import WordCloud
    import io
    import base64
    
    if keywords_df.empty:
        return '', html.Div("暂无关键词数据")
    
    word_freq = dict(zip(keywords_df['keyword'], keywords_df['count']))
    
    wc = WordCloud(
        font_path='/System/Library/Fonts/PingFang.ttc',
        width=800,
        height=400,
        background_color='white',
        colormap='viridis'
    )
    wc.generate_from_frequencies(word_freq)
    
    img = io.BytesIO()
    wc.to_image().save(img, format='PNG')
    img_str = 'data:image/png;base64,' + base64.b64encode(img.getvalue()).decode()
    
    table = dbc.Table.from_dataframe(
        keywords_df.head(20),
        striped=True,
        bordered=True,
        hover=True,
        responsive=True
    )
    
    return img_str, table


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


if __name__ == '__main__':
    app.run_server(debug=True, port=8050)
