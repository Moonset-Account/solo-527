import os
import sys
import pandas as pd
from datetime import datetime, timedelta

from dash import Dash, dcc, html, Input, Output, State, callback_context, dash_table, no_update
import dash_bootstrap_components as dbc
import plotly.graph_objects as go

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.database.mock_data import (
    get_samples_df, get_returns_df, get_thresholds_df, 
    update_threshold, SAMPLE_TYPES, SAMPLE_TYPE_NAMES, 
    DEPARTMENTS, STAGES, STAGE_NAMES
)
from src.utils.data_processor import (
    process_full_pipeline, filter_by_criteria, 
    get_stage_duration_stats, get_timeout_summary, 
    get_department_comparison
)
from src.utils.exporter import export_to_excel, generate_export_filename
from src.components.charts import (
    create_stage_boxplot, create_stage_duration_barchart,
    create_timeout_rate_chart, create_department_comparison_chart,
    create_sample_timeline, create_return_reasons_chart,
    create_priority_pie_chart, create_trend_chart
)

app = Dash(__name__, external_stylesheets=[dbc.themes.FLATLY], suppress_callback_exceptions=True)
server = app.server

app.title = "医院检验样本时效看板"


def load_raw_data():
    """加载原始数据（不做处理）"""
    samples_raw = get_samples_df()
    returns_raw = get_returns_df()
    thresholds_raw = get_thresholds_df()
    return samples_raw, returns_raw, thresholds_raw


def get_initial_date_range():
    samples_raw, _, _ = load_raw_data()
    if samples_raw is not None and not samples_raw.empty:
        min_date = samples_raw['collected_at'].min().date()
        max_date = samples_raw['collected_at'].max().date()
        return min_date, max_date
    today = datetime.now().date()
    return today - timedelta(days=30), today


min_date, max_date = get_initial_date_range()


navbar = dbc.NavbarSimple(
    children=[
        dbc.NavItem(dbc.NavLink("时效看板", href="#", active=True)),
    ],
    brand="🏥 医院检验样本时效看板",
    brand_href="#",
    color="primary",
    dark=True,
    fluid=True,
    className="mb-4"
)


filter_card = dbc.Card([
    dbc.CardHeader("📋 筛选条件"),
    dbc.CardBody([
        dbc.Row([
            dbc.Col([
                html.Label("时间范围", className="fw-bold"),
                dcc.DatePickerRange(
                    id='date-range-picker',
                    min_date_allowed=min_date,
                    max_date_allowed=max_date,
                    start_date=min_date,
                    end_date=max_date,
                    display_format='YYYY-MM-DD',
                    className="w-100"
                )
            ], md=4),
            dbc.Col([
                html.Label("样本类型", className="fw-bold"),
                dcc.Dropdown(
                    id='sample-type-dropdown',
                    options=[{'label': name, 'value': key} for key, name in SAMPLE_TYPE_NAMES.items()],
                    multi=True,
                    placeholder="选择样本类型（默认全选）",
                    className="w-100"
                )
            ], md=4),
            dbc.Col([
                html.Label("优先级", className="fw-bold"),
                dcc.Dropdown(
                    id='priority-dropdown',
                    options=[
                        {'label': '急诊', 'value': 'emergency'},
                        {'label': '常规', 'value': 'routine'}
                    ],
                    multi=True,
                    placeholder="选择优先级（默认全选）",
                    className="w-100"
                )
            ], md=4),
        ], className="mb-3"),
        dbc.Row([
            dbc.Col([
                html.Label("申请科室", className="fw-bold"),
                dcc.Dropdown(
                    id='department-dropdown',
                    options=[{'label': d, 'value': d} for d in DEPARTMENTS],
                    multi=True,
                    placeholder="选择科室（默认全选）",
                    className="w-100"
                )
            ], md=5),
            dbc.Col([
                html.Label("快速筛选", className="fw-bold"),
                dbc.Checklist(
                    id='quick-filters',
                    options=[
                        {'label': ' 仅显示超时样本', 'value': 'timeout'},
                        {'label': ' 仅显示退回样本', 'value': 'returned'}
                    ],
                    value=[],
                    inline=True,
                    className="mt-2"
                )
            ], md=4),
            dbc.Col([
                html.Label(" ", className="fw-bold d-block"),
                dbc.Button("📤 导出报告", id="export-btn", color="success", className="w-100 mt-1"),
                dcc.Download(id="download-excel")
            ], md=3),
        ])
    ])
], className="mb-4")


def create_kpi_card(title, value, subtitle="", color="primary", icon="📊"):
    return dbc.Card([
        dbc.CardBody([
            html.Div([
                html.Span(icon, className="display-4", style={"opacity": 0.3, "position": "absolute", "right": "15px", "top": "10px"}),
                html.H5(title, className="card-title text-muted mb-1"),
                html.H3(value, className=f"text-{color} fw-bold mb-0"),
                html.Small(subtitle, className="text-muted") if subtitle else None
            ], style={"position": "relative"})
        ])
    ], className="h-100 shadow-sm")


kpi_row = dbc.Row(id='kpi-cards-row', className="mb-4 g-3")

tab_card = dbc.Card([
    dbc.CardHeader(
        dbc.Tabs(
            [
                dbc.Tab(label="📈 时效概览", tab_id="overview-tab"),
                dbc.Tab(label="📦 箱线图分析", tab_id="boxplot-tab"),
                dbc.Tab(label="🏥 科室对比", tab_id="department-tab"),
                dbc.Tab(label="⚠️ 超时与退回", tab_id="timeout-tab"),
                dbc.Tab(label="📅 趋势分析", tab_id="trend-tab"),
                dbc.Tab(label="⚙️ 阈值配置", tab_id="threshold-tab"),
            ],
            id="main-tabs",
            active_tab="overview-tab",
        )
    ),
    dbc.CardBody(id="tabs-content", className="p-4")
], className="mb-4")

sample_modal = dbc.Modal(
    [
        dbc.ModalHeader(dbc.ModalTitle("🔍 样本详情下钻"), close_button=True),
        dbc.ModalBody(id="sample-modal-body"),
        dbc.ModalFooter(
            dbc.Button("关闭", id="close-modal", className="ms-auto", color="secondary")
        ),
    ],
    id="sample-modal",
    size="xl",
    centered=True,
    is_open=False,
)

app.layout = dbc.Container([
    dcc.Store(id='threshold-version', data=1),
    dcc.Store(id='cached-thresholds', data=None),
    navbar,
    filter_card,
    kpi_row,
    tab_card,
    sample_modal,
    html.Footer([
        html.Hr(),
        html.P("医院检验样本时效看板 | 检验科主任专用", className="text-center text-muted small")
    ])
], fluid=True, className="px-4")


def process_data_with_current_thresholds(start_date, end_date, sample_types, priorities, departments):
    """使用当前阈值配置处理数据"""
    samples_raw = get_samples_df(start_date, end_date, sample_types, priorities, departments)
    returns_raw = get_returns_df(start_date, end_date)
    thresholds_raw = get_thresholds_df()
    
    if samples_raw is None or samples_raw.empty:
        return pd.DataFrame(), pd.DataFrame(), thresholds_raw
    
    df = process_full_pipeline(samples_raw, thresholds_raw, returns_raw)
    return df, returns_raw, thresholds_raw


@app.callback(
    Output('kpi-cards-row', 'children'),
    Output('tabs-content', 'children'),
    Input('date-range-picker', 'start_date'),
    Input('date-range-picker', 'end_date'),
    Input('sample-type-dropdown', 'value'),
    Input('priority-dropdown', 'value'),
    Input('department-dropdown', 'value'),
    Input('quick-filters', 'value'),
    Input('main-tabs', 'active_tab'),
    Input('threshold-version', 'data'),
    prevent_initial_call=False
)
def update_dashboard(start_date, end_date, sample_types, priorities, departments, quick_filters, active_tab, threshold_version):
    start_dt = pd.to_datetime(start_date) if start_date else None
    end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None
    
    only_timeout = 'timeout' in (quick_filters or [])
    only_returned = 'returned' in (quick_filters or [])
    
    df_processed, returns_raw, thresholds_current = process_data_with_current_thresholds(
        start_dt, end_dt, sample_types, priorities, departments
    )
    
    df_filtered = filter_by_criteria(
        df_processed,
        start_date=start_dt,
        end_date=end_dt,
        sample_types=sample_types,
        priorities=priorities,
        departments=departments,
        only_timeout=only_timeout,
        only_returned=only_returned
    )
    
    returns_filtered = returns_raw.copy()
    if not returns_filtered.empty and not df_filtered.empty:
        returns_filtered = returns_filtered[returns_filtered['sample_id'].isin(df_filtered['sample_id'])]
    
    total_samples = len(df_filtered)
    emergency_count = len(df_filtered[df_filtered['priority'] == 'emergency']) if 'priority' in df_filtered.columns else 0
    routine_count = len(df_filtered[df_filtered['priority'] == 'routine']) if 'priority' in df_filtered.columns else 0
    
    timeout_count = int(df_filtered['any_timeout'].sum()) if 'any_timeout' in df_filtered.columns else 0
    timeout_rate = round(timeout_count / total_samples * 100, 2) if total_samples > 0 else 0
    
    return_count = int(df_filtered['has_return'].sum()) if 'has_return' in df_filtered.columns else 0
    return_rate = round(return_count / total_samples * 100, 2) if total_samples > 0 else 0
    
    avg_total_duration = df_filtered['total_duration_minutes'].mean() if 'total_duration_minutes' in df_filtered.columns else None
    avg_duration_str = f"{avg_total_duration:.1f} 分钟" if avg_total_duration and pd.notna(avg_total_duration) else "-"
    
    kpi_cards = [
        dbc.Col(create_kpi_card("总样本数", f"{total_samples:,}", f"急诊: {emergency_count:,} | 常规: {routine_count:,}", "primary", "🧪"), md=3),
        dbc.Col(create_kpi_card("超时样本", f"{timeout_count:,}", f"超时率: {timeout_rate}%", "danger" if timeout_rate > 15 else "warning", "⏰"), md=3),
        dbc.Col(create_kpi_card("退回样本", f"{return_count:,}", f"退回率: {return_rate}%", "warning" if return_rate > 5 else "info", "↩️"), md=3),
        dbc.Col(create_kpi_card("平均总耗时", avg_duration_str, "从采样到报告发布", "success", "⏱️"), md=3),
    ]
    
    tab_content = html.Div()
    
    if active_tab == "overview-tab":
        timeout_summary = get_timeout_summary(df_filtered, thresholds_current)
        
        tab_content = dbc.Row([
            dbc.Col([
                dcc.Graph(figure=create_stage_duration_barchart(df_filtered, group_by='priority'), config={'displayModeBar': False}),
            ], md=8),
            dbc.Col([
                dcc.Graph(figure=create_priority_pie_chart(df_filtered), config={'displayModeBar': False}),
            ], md=4),
            dbc.Col([
                html.H6("各环节超时情况", className="mt-3 mb-2 fw-bold"),
                dcc.Graph(figure=create_timeout_rate_chart(timeout_summary), config={'displayModeBar': False}),
            ], md=12),
        ], className="g-3")
    
    elif active_tab == "boxplot-tab":
        tab_content = dbc.Row([
            dbc.Col([
                html.Label("选择样本类型查看箱线图:"),
                dcc.Dropdown(
                    id='boxplot-sample-type',
                    options=[{'label': '全部样本类型', 'value': 'all'}] + 
                            [{'label': name, 'value': key} for key, name in SAMPLE_TYPE_NAMES.items()],
                    value='all',
                    clearable=False,
                    className="mb-3"
                ),
                dcc.Graph(id='boxplot-graph', config={'displayModeBar': False}),
            ], md=12),
            dbc.Col([
                html.H6("各环节耗时统计", className="mt-3 mb-2 fw-bold"),
                html.Div(id='boxplot-stats-table')
            ], md=12)
        ], className="g-3")
    
    elif active_tab == "department-tab":
        dept_df = get_department_comparison(df_filtered)
        
        tab_content = dbc.Row([
            dbc.Col([
                dcc.Graph(figure=create_department_comparison_chart(dept_df), config={'displayModeBar': False}),
            ], md=12),
            dbc.Col([
                html.H6("科室时效排名", className="mt-3 mb-2 fw-bold"),
                dash_table.DataTable(
                    data=dept_df.to_dict('records'),
                    columns=[
                        {'name': '科室', 'id': 'department'},
                        {'name': '样本数', 'id': 'sample_count'},
                        {'name': '平均总耗时(分钟)', 'id': 'avg_total_duration_minutes'},
                        {'name': '超时数', 'id': 'timeout_count'},
                        {'name': '超时率(%)', 'id': 'timeout_rate'},
                        {'name': '退回数', 'id': 'return_count'},
                        {'name': '退回率(%)', 'id': 'return_rate'},
                    ],
                    page_size=15,
                    sort_action='native',
                    style_table={'overflowX': 'auto'},
                    style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
                    style_cell={'textAlign': 'left', 'padding': '8px'},
                    style_data_conditional=[
                        {
                            'if': {'filter_query': '{timeout_rate} > 20', 'column_id': 'timeout_rate'},
                            'backgroundColor': '#FFC7CE',
                            'color': '#9C0006'
                        }
                    ]
                )
            ], md=12)
        ], className="g-3")
    
    elif active_tab == "timeout-tab":
        abnormal_samples = df_filtered[
            (df_filtered['any_timeout'] == True) | 
            (df_filtered['has_return'] == True)
        ].copy() if not df_filtered.empty else pd.DataFrame()
        
        tab_content = dbc.Row([
            dbc.Col([
                dcc.Graph(figure=create_return_reasons_chart(returns_filtered), config={'displayModeBar': False}),
            ], md=6),
            dbc.Col([
                html.H6("超时/异常样本列表", className="mb-2 fw-bold"),
                html.P("点击行可下钻查看样本详情", className="text-muted small"),
                html.Div(id='abnormal-samples-table')
            ], md=6),
        ], className="g-3")
    
    elif active_tab == "trend-tab":
        tab_content = dbc.Row([
            dbc.Col([
                dbc.RadioItems(
                    id='trend-freq',
                    options=[
                        {'label': ' 按日', 'value': 'D'},
                        {'label': ' 按周', 'value': 'W'},
                        {'label': ' 按月', 'value': 'M'},
                    ],
                    value='D',
                    inline=True,
                    className="mb-3"
                ),
                dcc.Graph(id='trend-graph', config={'displayModeBar': False}),
            ], md=12)
        ], className="g-3")
    
    elif active_tab == "threshold-tab":
        th_df = get_thresholds_df()
        
        tab_content = dbc.Row([
            dbc.Col([
                html.H6("超时阈值配置（按样本类型和优先级设置各环节阈值）", className="mb-3 fw-bold"),
                html.Div([
                    dbc.Alert(
                        "💡 修改阈值后，超时率、异常样本列表和导出报告将自动使用新阈值重新计算", 
                        color="info", 
                        dismissable=True
                    )
                ], id="threshold-config-message"),
                dash_table.DataTable(
                    id='threshold-table',
                    data=th_df.to_dict('records'),
                    columns=[
                        {'name': '样本类型', 'id': 'sample_type_name', 'editable': False},
                        {'name': '优先级', 'id': 'priority_name', 'editable': False},
                        {'name': '环节', 'id': 'stage_display_name', 'editable': False},
                        {'name': '阈值(分钟)', 'id': 'threshold_minutes', 'editable': True, 'type': 'numeric'},
                        {'name': '说明', 'id': 'description', 'editable': False},
                    ],
                    page_size=15,
                    sort_action='native',
                    filter_action='native',
                    style_table={'overflowX': 'auto'},
                    style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
                    style_cell={'textAlign': 'left', 'padding': '8px'},
                    style_data_conditional=[
                        {
                            'if': {'column_id': 'threshold_minutes'},
                            'backgroundColor': '#fff3cd',
                            'fontWeight': 'bold'
                        }
                    ]
                ),
                html.Div([
                    html.Small("💡 说明：点击阈值(分钟)列的数值可直接修改，修改后点击下方「保存阈值配置」按钮生效。", 
                              className="text-muted")
                ], className="mt-2"),
                dbc.Button(
                    "💾 保存阈值配置", 
                    id="save-thresholds-btn", 
                    color="primary", 
                    className="mt-3"
                ),
            ], md=12)
        ], className="g-3")
    
    return kpi_cards, tab_content


@app.callback(
    Output('boxplot-graph', 'figure'),
    Output('boxplot-stats-table', 'children'),
    Input('boxplot-sample-type', 'value'),
    State('date-range-picker', 'start_date'),
    State('date-range-picker', 'end_date'),
    State('sample-type-dropdown', 'value'),
    State('priority-dropdown', 'value'),
    State('department-dropdown', 'value'),
    State('quick-filters', 'value'),
    Input('threshold-version', 'data'),
    prevent_initial_call=False
)
def update_boxplot(selected_type, start_date, end_date, sample_types, priorities, departments, quick_filters, threshold_version):
    start_dt = pd.to_datetime(start_date) if start_date else None
    end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None
    
    only_timeout = 'timeout' in (quick_filters or [])
    only_returned = 'returned' in (quick_filters or [])
    
    df_processed, _, _ = process_data_with_current_thresholds(
        start_dt, end_dt, sample_types, priorities, departments
    )
    
    df_filtered = filter_by_criteria(
        df_processed,
        start_date=start_dt,
        end_date=end_dt,
        sample_types=sample_types,
        priorities=priorities,
        departments=departments,
        only_timeout=only_timeout,
        only_returned=only_returned
    )
    
    if selected_type != 'all':
        df_filtered = df_filtered[df_filtered['sample_type'] == selected_type]
    
    fig = create_stage_boxplot(df_filtered, sample_type=selected_type if selected_type != 'all' else None)
    
    stats = get_stage_duration_stats(df_filtered)
    stats_rows = []
    for stage_key, stage_data in stats.items():
        stats_rows.append({
            '环节': STAGE_NAMES[stage_key],
            '样本数': stage_data['count'],
            '平均值': stage_data['mean'],
            '中位数': stage_data['median'],
            'P25': stage_data['p25'],
            'P75': stage_data['p75'],
            'P95': stage_data['p95'],
            '最小值': stage_data['min'],
            '最大值': stage_data['max'],
        })
    
    stats_table = dash_table.DataTable(
        data=stats_rows,
        columns=[{'name': col, 'id': col} for col in ['环节', '样本数', '平均值', '中位数', 'P25', 'P75', 'P95', '最小值', '最大值']],
        page_size=5,
        style_table={'overflowX': 'auto'},
        style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
        style_cell={'textAlign': 'center', 'padding': '8px'},
    )
    
    return fig, stats_table


@app.callback(
    Output('trend-graph', 'figure'),
    Input('trend-freq', 'value'),
    State('date-range-picker', 'start_date'),
    State('date-range-picker', 'end_date'),
    State('sample-type-dropdown', 'value'),
    State('priority-dropdown', 'value'),
    State('department-dropdown', 'value'),
    State('quick-filters', 'value'),
    Input('threshold-version', 'data'),
    prevent_initial_call=False
)
def update_trend(freq, start_date, end_date, sample_types, priorities, departments, quick_filters, threshold_version):
    start_dt = pd.to_datetime(start_date) if start_date else None
    end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None
    
    only_timeout = 'timeout' in (quick_filters or [])
    only_returned = 'returned' in (quick_filters or [])
    
    df_processed, _, _ = process_data_with_current_thresholds(
        start_dt, end_dt, sample_types, priorities, departments
    )
    
    df_filtered = filter_by_criteria(
        df_processed,
        start_date=start_dt,
        end_date=end_dt,
        sample_types=sample_types,
        priorities=priorities,
        departments=departments,
        only_timeout=only_timeout,
        only_returned=only_returned
    )
    
    return create_trend_chart(df_filtered, freq=freq)


@app.callback(
    Output('abnormal-samples-table', 'children'),
    State('date-range-picker', 'start_date'),
    State('date-range-picker', 'end_date'),
    State('sample-type-dropdown', 'value'),
    State('priority-dropdown', 'value'),
    State('department-dropdown', 'value'),
    State('quick-filters', 'value'),
    Input('threshold-version', 'data'),
    prevent_initial_call=False
)
def update_abnormal_table(start_date, end_date, sample_types, priorities, departments, quick_filters, threshold_version):
    start_dt = pd.to_datetime(start_date) if start_date else None
    end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None
    
    only_timeout = 'timeout' in (quick_filters or [])
    only_returned = 'returned' in (quick_filters or [])
    
    df_processed, _, _ = process_data_with_current_thresholds(
        start_dt, end_dt, sample_types, priorities, departments
    )
    
    df_filtered = filter_by_criteria(
        df_processed,
        start_date=start_dt,
        end_date=end_dt,
        sample_types=sample_types,
        priorities=priorities,
        departments=departments,
        only_timeout=only_timeout,
        only_returned=only_returned
    )
    
    abnormal_samples = df_filtered[
        (df_filtered['any_timeout'] == True) | 
        (df_filtered['has_return'] == True)
    ].copy()
    
    if abnormal_samples.empty:
        return html.Div("暂无异常样本数据", className="text-center text-muted p-5")
    
    display_cols = [
        'sample_id', 'sample_type_name', 'priority_name', 'requesting_department',
        'total_duration_minutes', 'timeout_stages', 'has_return', 'return_reason'
    ]
    available_cols = [c for c in display_cols if c in abnormal_samples.columns]
    
    abnormal_display = abnormal_samples[available_cols].copy()
    
    if 'timeout_stages' in abnormal_display.columns:
        abnormal_display['timeout_stages'] = abnormal_display['timeout_stages'].apply(
            lambda x: ', '.join(x) if isinstance(x, list) and len(x) > 0 else ''
        )
    
    col_mapping = {
        'sample_id': '样本编号',
        'sample_type_name': '样本类型',
        'priority_name': '优先级',
        'requesting_department': '申请科室',
        'total_duration_minutes': '总耗时(分钟)',
        'timeout_stages': '超时环节',
        'has_return': '是否退回',
        'return_reason': '退回原因'
    }
    abnormal_display = abnormal_display.rename(columns=col_mapping)
    
    return dash_table.DataTable(
        data=abnormal_display.to_dict('records'),
        columns=[{'name': col, 'id': col} for col in abnormal_display.columns],
        page_size=10,
        sort_action='native',
        row_selectable='single',
        style_table={'overflowX': 'auto'},
        style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
        style_cell={'textAlign': 'left', 'padding': '6px', 'fontSize': '12px'},
        style_data_conditional=[
            {
                'if': {'filter_query': '{是否退回} = true'},
                'backgroundColor': '#fff3cd'
            }
        ],
        id='abnormal-table-clickable'
    )


@app.callback(
    Output('sample-modal', 'is_open'),
    Output('sample-modal-body', 'children'),
    Input('abnormal-table-clickable', 'selected_rows'),
    Input('close-modal', 'n_clicks'),
    State('date-range-picker', 'start_date'),
    State('date-range-picker', 'end_date'),
    State('sample-type-dropdown', 'value'),
    State('priority-dropdown', 'value'),
    State('department-dropdown', 'value'),
    State('quick-filters', 'value'),
    Input('threshold-version', 'data'),
    prevent_initial_call=True
)
def open_sample_modal(selected_rows, close_clicks, start_date, end_date, sample_types, priorities, departments, quick_filters, threshold_version):
    ctx = callback_context
    if not ctx.triggered:
        return False, html.Div()
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    if trigger_id == 'close-modal':
        return False, html.Div()
    
    if not selected_rows or len(selected_rows) == 0:
        return False, html.Div()
    
    start_dt = pd.to_datetime(start_date) if start_date else None
    end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None
    
    only_timeout = 'timeout' in (quick_filters or [])
    only_returned = 'returned' in (quick_filters or [])
    
    df_processed, returns_raw, thresholds_current = process_data_with_current_thresholds(
        start_dt, end_dt, sample_types, priorities, departments
    )
    
    df_filtered = filter_by_criteria(
        df_processed,
        start_date=start_dt,
        end_date=end_dt,
        sample_types=sample_types,
        priorities=priorities,
        departments=departments,
        only_timeout=only_timeout,
        only_returned=only_returned
    )
    
    abnormal_samples = df_filtered[
        (df_filtered['any_timeout'] == True) | 
        (df_filtered['has_return'] == True)
    ].copy()
    
    if abnormal_samples.empty or selected_rows[0] >= len(abnormal_samples):
        return False, html.Div()
    
    selected_sample = abnormal_samples.iloc[[selected_rows[0]]]
    sample_id = selected_sample.iloc[0]['sample_id']
    
    sample_returns = returns_raw[returns_raw['sample_id'] == sample_id] if not returns_raw.empty else pd.DataFrame()
    
    timeline_fig = create_sample_timeline(selected_sample, thresholds_current)
    
    sample_info = selected_sample.iloc[0]
    
    info_rows = [
        ('样本编号', sample_info.get('sample_id', '-')),
        ('样本类型', sample_info.get('sample_type_name', '-')),
        ('优先级', sample_info.get('priority_name', '-')),
        ('申请科室', sample_info.get('requesting_department', '-')),
        ('患者ID', sample_info.get('patient_id', '-')),
        ('检测项目', sample_info.get('test_items', '-')),
        ('状态', '退回' if sample_info.get('has_return') else ('超时' if sample_info.get('any_timeout') else '正常')),
    ]
    
    time_rows = [
        ('采样时间', sample_info.get('collected_at'), sample_info.get('collected_at_source')),
        ('送检时间', sample_info.get('dispatched_at'), sample_info.get('dispatched_at_source')),
        ('接收时间', sample_info.get('received_at'), sample_info.get('received_at_source')),
        ('检测时间', sample_info.get('tested_at'), sample_info.get('tested_at_source')),
        ('复核时间', sample_info.get('reviewed_at'), sample_info.get('reviewed_at_source')),
        ('报告发布时间', sample_info.get('reported_at'), sample_info.get('reported_at_source')),
    ]
    
    modal_content = dbc.Row([
        dbc.Col([
            html.H6("基本信息", className="fw-bold mb-2"),
            dbc.Table([
                html.Tbody([
                    html.Tr([html.Th(k, className="bg-light", style={"width": "30%"}), html.Td(str(v))])
                    for k, v in info_rows
                ])
            ], bordered=True, size="sm", className="mb-3"),
            
            html.H6("各环节时间", className="fw-bold mb-2"),
            dbc.Table([
                html.Thead(html.Tr([html.Th("环节"), html.Th("时间"), html.Th("数据来源")])),
                html.Tbody([
                    html.Tr([
                        html.Th(k, className="bg-light"),
                        html.Td(v.strftime('%Y-%m-%d %H:%M:%S') if pd.notna(v) and hasattr(v, 'strftime') else '-'),
                        html.Td(
                            html.Span("补录", className="badge bg-warning text-dark") 
                            if src == 'manual' 
                            else html.Span("自动采集", className="badge bg-success")
                        )
                    ])
                    for k, v, src in time_rows
                ])
            ], bordered=True, size="sm", className="mb-3"),
        ], md=5),
        
        dbc.Col([
            html.H6("时间线分析", className="fw-bold mb-2"),
            dcc.Graph(figure=timeline_fig, config={'displayModeBar': False}),
            
            html.H6("退回记录（如有）", className="fw-bold mt-3 mb-2"),
            dash_table.DataTable(
                data=sample_returns.to_dict('records') if not sample_returns.empty else [],
                columns=[
                    {'name': '退回时间', 'id': 'return_time'},
                    {'name': '退回原因', 'id': 'return_reason'},
                    {'name': '责任科室', 'id': 'responsible_department'},
                    {'name': '退回人', 'id': 'returned_by'},
                    {'name': '备注', 'id': 'notes'},
                ] if not sample_returns.empty else [],
                page_size=3,
                style_table={'overflowX': 'auto'},
                style_header={'backgroundColor': '#f8f9fa', 'fontWeight': 'bold'},
                style_cell={'textAlign': 'left', 'padding': '6px', 'fontSize': '12px'},
            ) if not sample_returns.empty else html.P("该样本无退回记录", className="text-muted"),
        ], md=7)
    ], className="g-4")
    
    return True, modal_content


@app.callback(
    Output('threshold-version', 'data'),
    Output('threshold-config-message', 'children'),
    Input('save-thresholds-btn', 'n_clicks'),
    State('threshold-table', 'data'),
    State('threshold-version', 'data'),
    prevent_initial_call=True
)
def save_threshold_config(n_clicks, rows, current_version):
    if not n_clicks or not rows:
        return no_update, no_update
    
    try:
        updated_count = 0
        for row in rows:
            sample_type = None
            priority = None
            stage_name = None
            new_threshold = None
            
            for key, val in row.items():
                if key == 'sample_type_name':
                    for k, v in SAMPLE_TYPE_NAMES.items():
                        if v == val:
                            sample_type = k
                            break
                elif key == 'priority_name':
                    priority = 'emergency' if val == '急诊' else 'routine'
                elif key == 'stage_display_name':
                    for k, v in STAGE_NAMES.items():
                        if v == val:
                            stage_name = k
                            break
                elif key == 'threshold_minutes':
                    new_threshold = val
            
            if sample_type and priority and stage_name and new_threshold is not None:
                try:
                    new_threshold_int = int(float(new_threshold))
                    if new_threshold_int > 0:
                        success = update_threshold(sample_type, priority, stage_name, new_threshold_int)
                        if success:
                            updated_count += 1
                except (ValueError, TypeError):
                    pass
        
        new_version = current_version + 1
        
        message = dbc.Alert(
            f"✅ 阈值配置已保存！已更新 {updated_count} 条配置。所有页面将使用新阈值重新计算。", 
            color="success", 
            duration=5000, 
            dismissable=True
        )
        
        return new_version, message
        
    except Exception as e:
        return no_update, dbc.Alert(f"❌ 保存失败: {str(e)}", color="danger", duration=5000, dismissable=True)


@app.callback(
    Output("download-excel", "data"),
    Input("export-btn", "n_clicks"),
    State('date-range-picker', 'start_date'),
    State('date-range-picker', 'end_date'),
    State('sample-type-dropdown', 'value'),
    State('priority-dropdown', 'value'),
    State('department-dropdown', 'value'),
    State('quick-filters', 'value'),
    Input('threshold-version', 'data'),
    prevent_initial_call=True
)
def export_report(n_clicks, start_date, end_date, sample_types, priorities, departments, quick_filters, threshold_version):
    if not n_clicks:
        return None
    
    start_dt = pd.to_datetime(start_date) if start_date else None
    end_dt = pd.to_datetime(end_date) + timedelta(days=1) if end_date else None
    
    only_timeout = 'timeout' in (quick_filters or [])
    only_returned = 'returned' in (quick_filters or [])
    
    df_processed, returns_raw, thresholds_current = process_data_with_current_thresholds(
        start_dt, end_dt, sample_types, priorities, departments
    )
    
    df_filtered = filter_by_criteria(
        df_processed,
        start_date=start_dt,
        end_date=end_dt,
        sample_types=sample_types,
        priorities=priorities,
        departments=departments,
        only_timeout=only_timeout,
        only_returned=only_returned
    )
    
    returns_filtered = returns_raw.copy()
    if not returns_filtered.empty and not df_filtered.empty:
        returns_filtered = returns_filtered[returns_filtered['sample_id'].isin(df_filtered['sample_id'])]
    
    excel_data = export_to_excel(
        df_filtered,
        start_date=start_dt,
        end_date=end_dt,
        sample_types=sample_types,
        priorities=priorities,
        departments=departments,
        only_timeout=only_timeout,
        only_returned=only_returned,
        returns_df=returns_filtered,
        thresholds_df=thresholds_current
    )
    
    filename = generate_export_filename()
    
    return dcc.send_bytes(excel_data.getvalue(), filename=filename)


if __name__ == '__main__':
    port = int(os.getenv('DASH_PORT', 8050))
    host = os.getenv('DASH_HOST', '0.0.0.0')
    debug = os.getenv('DASH_DEBUG', 'False').lower() == 'true'
    app.run(host=host, port=port, debug=debug)
