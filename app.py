import dash
from dash import dcc, html, Input, Output, State, dash_table
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import plotly.express as px
import sqlite3
import pandas as pd
import os
from datetime import datetime
import io
import base64

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'transfer_orders.db')

app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP], suppress_callback_exceptions=True)
app.title = "调拨单证据绑定分析看板"


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_filter_options():
    conn = get_db_connection()
    options = {}
    for col in ['source_warehouse', 'target_warehouse', 'carrier', 'evidence_type', 'handler']:
        rows = conn.execute(f'SELECT DISTINCT {col} FROM transfer_orders ORDER BY {col}').fetchall()
        options[col] = [row[col] for row in rows if row[col]]
    conn.close()
    return options


def query_data(source_wh=None, target_wh=None, carrier=None, evidence_type=None, handler=None, exclude_auditing=True):
    conn = get_db_connection()
    query = 'SELECT * FROM transfer_orders WHERE 1=1'
    params = []
    
    if source_wh:
        query += ' AND source_warehouse = ?'
        params.append(source_wh)
    if target_wh:
        query += ' AND target_warehouse = ?'
        params.append(target_wh)
    if carrier:
        query += ' AND carrier = ?'
        params.append(carrier)
    if evidence_type:
        query += ' AND evidence_type = ?'
        params.append(evidence_type)
    if handler:
        query += ' AND handler = ?'
        params.append(handler)
    if exclude_auditing:
        query += ' AND is_auditing = 0'
    
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    return df


def get_rework_reasons():
    conn = get_db_connection()
    df = pd.read_sql_query('''
        SELECT rework_reason, COUNT(*) as count 
        FROM rework_records 
        WHERE rework_reason IS NOT NULL 
        GROUP BY rework_reason 
        ORDER BY count DESC
    ''', conn)
    conn.close()
    return df


def get_order_detail(order_id):
    conn = get_db_connection()
    order = pd.read_sql_query('SELECT * FROM transfer_orders WHERE order_id = ?', conn, params=[order_id])
    evidence = pd.read_sql_query('SELECT * FROM evidence_records WHERE order_id = ?', conn, params=[order_id])
    reworks = pd.read_sql_query('SELECT * FROM rework_records WHERE order_id = ? ORDER BY rework_time DESC', conn, params=[order_id])
    conn.close()
    return order, evidence, reworks


filter_options = get_filter_options()

app.layout = dbc.Container([
    html.H1("调拨单证据绑定分析看板", className="text-center my-4"),
    
    dbc.Card([
        dbc.CardBody([
            html.H5("筛选条件", className="card-title mb-3"),
            dbc.Row([
                dbc.Col([
                    html.Label("来源仓"),
                    dcc.Dropdown(
                        id='filter-source-wh',
                        options=[{'label': '全部', 'value': ''}] + [{'label': x, 'value': x} for x in filter_options['source_warehouse']],
                        value='',
                        clearable=False
                    )
                ], width=2),
                dbc.Col([
                    html.Label("目的仓"),
                    dcc.Dropdown(
                        id='filter-target-wh',
                        options=[{'label': '全部', 'value': ''}] + [{'label': x, 'value': x} for x in filter_options['target_warehouse']],
                        value='',
                        clearable=False
                    )
                ], width=2),
                dbc.Col([
                    html.Label("承运人"),
                    dcc.Dropdown(
                        id='filter-carrier',
                        options=[{'label': '全部', 'value': ''}] + [{'label': x, 'value': x} for x in filter_options['carrier']],
                        value='',
                        clearable=False
                    )
                ], width=2),
                dbc.Col([
                    html.Label("证据类型"),
                    dcc.Dropdown(
                        id='filter-evidence-type',
                        options=[{'label': '全部', 'value': ''}] + [{'label': x, 'value': x} for x in filter_options['evidence_type']],
                        value='',
                        clearable=False
                    )
                ], width=2),
                dbc.Col([
                    html.Label("处理人"),
                    dcc.Dropdown(
                        id='filter-handler',
                        options=[{'label': '全部', 'value': ''}] + [{'label': x, 'value': x} for x in filter_options['handler']],
                        value='',
                        clearable=False
                    )
                ], width=2),
                dbc.Col([
                    html.Label("导出数据"),
                    dbc.ButtonGroup([
                        dbc.Button("导出 CSV", id="btn-export-csv", color="primary", className="me-1"),
                        dbc.Button("导出 PDF", id="btn-export-pdf", color="secondary"),
                    ], className="w-100"),
                    dcc.Download(id="download-data")
                ], width=2),
            ]),
            html.Div([
                dbc.Badge("审计中单据不计入返工率统计", color="warning", className="mt-2"),
            ], className="text-end")
        ])
    ], className="mb-4"),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("关键指标概览"),
                dbc.CardBody([
                    dbc.Row(id="kpi-cards")
                ])
            ])
        ], width=12)
    ], className="mb-4"),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("返工率趋势"),
                dbc.CardBody([
                    dcc.Graph(id="rework-trend-chart")
                ])
            ])
        ], width=6),
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("缺证原因分布"),
                dbc.CardBody([
                    dcc.Graph(id="rework-reason-chart")
                ])
            ])
        ], width=6),
    ], className="mb-4"),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("处理时长箱线图（小时）"),
                dbc.CardBody([
                    dcc.Graph(id="processing-time-chart")
                ])
            ])
        ], width=6),
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("异常单明细"),
                dbc.CardBody([
                    dash_table.DataTable(
                        id="abnormal-table",
                        columns=[
                            {"name": "单号", "id": "order_id"},
                            {"name": "来源仓", "id": "source_warehouse"},
                            {"name": "目的仓", "id": "target_warehouse"},
                            {"name": "承运人", "id": "carrier"},
                            {"name": "状态", "id": "status"},
                            {"name": "处理时长(h)", "id": "processing_hours"},
                        ],
                        page_size=10,
                        style_table={"overflowX": "auto"},
                        style_cell={"textAlign": "left", "padding": "8px"},
                        style_header={"backgroundColor": "rgb(230, 230, 230)", "fontWeight": "bold"},
                        style_data_conditional=[
                            {"if": {"filter_query": "{status} = '返工'"}, "backgroundColor": "#FFE0E0"},
                            {"if": {"filter_query": "{status} = '审计中'"}, "backgroundColor": "#FFF3CD"},
                        ],
                        row_selectable="single",
                        selected_rows=[],
                    )
                ])
            ])
        ], width=6),
    ], className="mb-4"),
    
    dbc.Modal([
        dbc.ModalHeader(dbc.ModalTitle("单据详情")),
        dbc.ModalBody(id="modal-body"),
        dbc.ModalFooter(
            dbc.Button("关闭", id="close-modal", className="ms-auto")
        ),
    ], id="detail-modal", size="lg", is_open=False),
    
    dcc.Store(id="filtered-data-store"),
    
], fluid=True)


@app.callback(
    Output("kpi-cards", "children"),
    Output("rework-trend-chart", "figure"),
    Output("rework-reason-chart", "figure"),
    Output("processing-time-chart", "figure"),
    Output("abnormal-table", "data"),
    Output("filtered-data-store", "data"),
    Input("filter-source-wh", "value"),
    Input("filter-target-wh", "value"),
    Input("filter-carrier", "value"),
    Input("filter-evidence-type", "value"),
    Input("filter-handler", "value"),
)
def update_dashboard(source_wh, target_wh, carrier, evidence_type, handler):
    df = query_data(source_wh, target_wh, carrier, evidence_type, handler, exclude_auditing=True)
    df_all = query_data(source_wh, target_wh, carrier, evidence_type, handler, exclude_auditing=False)
    
    total_orders = len(df)
    rework_count = df['is_rework'].sum()
    rework_rate = (rework_count / total_orders * 100) if total_orders > 0 else 0
    avg_processing = df['processing_hours'].mean() if df['processing_hours'].notna().any() else 0
    missing_attach = df['missing_attachment'].sum()
    
    kpi_cards = [
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H6("总单据数", className="card-subtitle text-muted"),
                    html.H3(f"{total_orders}", className="card-title mt-2")
                ])
            ], color="info", outline=True)
        ], width=2),
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H6("返工率", className="card-subtitle text-muted"),
                    html.H3(f"{rework_rate:.1f}%", className="card-title mt-2 text-danger")
                ])
            ], color="danger", outline=True)
        ], width=2),
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H6("返工单数", className="card-subtitle text-muted"),
                    html.H3(f"{rework_count}", className="card-title mt-2")
                ])
            ], color="warning", outline=True)
        ], width=2),
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H6("平均处理时长", className="card-subtitle text-muted"),
                    html.H3(f"{avg_processing:.1f}h", className="card-title mt-2")
                ])
            ], color="success", outline=True)
        ], width=2),
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H6("缺失附件数", className="card-subtitle text-muted"),
                    html.H3(f"{missing_attach}", className="card-title mt-2 text-warning")
                ])
            ], color="warning", outline=True)
        ], width=2),
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H6("人工补录数", className="card-subtitle text-muted"),
                    html.H3(f"{df['manual_entry'].sum()}", className="card-title mt-2")
                ])
            ], color="secondary", outline=True)
        ], width=2),
    ]
    
    df['create_month'] = pd.to_datetime(df['create_time']).dt.to_period('M').astype(str)
    trend_df = df.groupby('create_month').agg(
        total=('order_id', 'count'),
        rework=('is_rework', 'sum')
    ).reset_index()
    trend_df['rework_rate'] = (trend_df['rework'] / trend_df['total'] * 100).round(2)
    
    trend_fig = go.Figure()
    trend_fig.add_trace(go.Bar(
        x=trend_df['create_month'],
        y=trend_df['total'],
        name='总单数',
        marker_color='lightblue'
    ))
    trend_fig.add_trace(go.Scatter(
        x=trend_df['create_month'],
        y=trend_df['rework_rate'],
        name='返工率(%)',
        yaxis='y2',
        mode='lines+markers',
        line=dict(color='red', width=2)
    ))
    trend_fig.update_layout(
        barmode='group',
        yaxis=dict(title='单据数'),
        yaxis2=dict(title='返工率(%)', overlaying='y', side='right'),
        legend=dict(orientation='h', y=1.1),
        margin=dict(l=0, r=0, t=30, b=0)
    )
    
    reason_df = get_rework_reasons()
    reason_fig = px.pie(
        reason_df,
        values='count',
        names='rework_reason',
        hole=0.4,
        color_discrete_sequence=px.colors.qualitative.Set3
    )
    reason_fig.update_layout(margin=dict(l=0, r=0, t=30, b=0))
    
    box_df = df[df['processing_hours'].notna()].copy()
    if len(box_df) > 0:
        box_fig = px.box(
            box_df,
            x='carrier',
            y='processing_hours',
            color='evidence_type',
            points='outliers'
        )
        box_fig.update_layout(
            xaxis_title='承运人',
            yaxis_title='处理时长（小时）',
            margin=dict(l=0, r=0, t=30, b=0),
            legend=dict(orientation='h', y=1.1)
        )
    else:
        box_fig = go.Figure()
        box_fig.update_layout(title='暂无处理时长数据')
    
    abnormal_df = df_all[df_all['status'].isin(['返工', '审计中'])].copy()
    abnormal_df = abnormal_df.sort_values('create_time', ascending=False)
    abnormal_data = abnormal_df[[
        'order_id', 'source_warehouse', 'target_warehouse',
        'carrier', 'status', 'processing_hours'
    ]].to_dict('records')
    
    return kpi_cards, trend_fig, reason_fig, box_fig, abnormal_data, df_all.to_dict('records')


@app.callback(
    Output("detail-modal", "is_open"),
    Output("modal-body", "children"),
    Input("abnormal-table", "selected_rows"),
    Input("close-modal", "n_clicks"),
    State("abnormal-table", "data"),
    State("detail-modal", "is_open"),
    prevent_initial_call=True
)
def toggle_modal(selected_rows, close_click, table_data, is_open):
    ctx = dash.callback_context
    if not ctx.triggered:
        return is_open, dash.no_update
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    if trigger_id == "close-modal":
        return False, dash.no_update
    
    if selected_rows and len(selected_rows) > 0:
        row_idx = selected_rows[0]
        if row_idx < len(table_data):
            order_id = table_data[row_idx]['order_id']
            order, evidence, reworks = get_order_detail(order_id)
            
            if len(order) > 0:
                order_info = order.iloc[0]
                modal_content = [
                    html.H6("基本信息", className="mt-2"),
                    dbc.Table([
                        html.Tr([html.Td("单号:"), html.Td(order_info['order_id'])]),
                        html.Tr([html.Td("来源仓:"), html.Td(order_info['source_warehouse'])]),
                        html.Tr([html.Td("目的仓:"), html.Td(order_info['target_warehouse'])]),
                        html.Tr([html.Td("承运人:"), html.Td(order_info['carrier'])]),
                        html.Tr([html.Td("证据类型:"), html.Td(order_info['evidence_type'])]),
                        html.Tr([html.Td("处理人:"), html.Td(order_info['handler'])]),
                        html.Tr([html.Td("状态:"), html.Td(
                            dbc.Badge(order_info['status'], 
                                     color="danger" if order_info['status'] == '返工' 
                                     else "warning" if order_info['status'] == '审计中' else "success")
                        )]),
                        html.Tr([html.Td("创建时间:"), html.Td(order_info['create_time'])]),
                        html.Tr([html.Td("完成时间:"), html.Td(order_info['complete_time'] or '-')]),
                        html.Tr([html.Td("处理时长:"), html.Td(f"{order_info['processing_hours']:.1f}h" if pd.notna(order_info['processing_hours']) else '-')]),
                    ], bordered=True, size="sm"),
                    
                    html.H6("原始附件状态", className="mt-3"),
                    dbc.Table([
                        html.Thead([html.Tr([html.Th("证据名称"), html.Th("状态"), html.Th("上传时间")])]),
                        html.Tbody([
                            html.Tr([
                                html.Td(ev.get('evidence_name', '-')),
                                html.Td(dbc.Badge(ev['evidence_status'], 
                                            color="success" if ev['evidence_status'] == '已上传'
                                            else "danger" if ev['evidence_status'] in ['缺失', '无效']
                                            else "warning")),
                                html.Td(ev.get('upload_time', '-') or '-')
                            ]) for _, ev in evidence.iterrows()
                        ]) if len(evidence) > 0 else html.Tr([html.Td("无附件记录", colSpan=3)])
                    ], bordered=True, size="sm"),
                    
                    html.H6("最近一次人工备注", className="mt-3"),
                    dbc.Table([
                        html.Thead([html.Tr([html.Th("返工原因"), html.Th("处理人"), html.Th("时间"), html.Th("备注")])]),
                        html.Tbody([
                            html.Tr([
                                html.Td(rw.get('rework_reason', '-')),
                                html.Td(rw.get('handler', '-') or '-'),
                                html.Td(rw.get('rework_time', '-')),
                                html.Td(rw.get('remark', '-') or '-')
                            ]) for _, rw in reworks.iterrows()
                        ]) if len(reworks) > 0 else html.Tr([html.Td("无返工记录", colSpan=4)])
                    ], bordered=True, size="sm"),
                    
                    html.Div([
                        dbc.Badge("缺失附件" if order_info['missing_attachment'] else "附件完整", 
                                 color="danger" if order_info['missing_attachment'] else "success"),
                        dbc.Badge("人工补录" if order_info['manual_entry'] else "系统录入",
                                 color="warning" if order_info['manual_entry'] else "info",
                                 className="ms-2"),
                    ], className="mt-3")
                ]
                return True, modal_content
    
    return is_open, dash.no_update


@app.callback(
    Output("download-data", "data"),
    Input("btn-export-csv", "n_clicks"),
    Input("btn-export-pdf", "n_clicks"),
    State("filtered-data-store", "data"),
    State("filter-source-wh", "value"),
    State("filter-target-wh", "value"),
    State("filter-carrier", "value"),
    State("filter-evidence-type", "value"),
    State("filter-handler", "value"),
    prevent_initial_call=True
)
def export_data(csv_clicks, pdf_clicks, data, source_wh, target_wh, carrier, evidence_type, handler):
    ctx = dash.callback_context
    if not ctx.triggered:
        return dash.no_update
    
    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    if not data:
        return dash.no_update
    
    df = pd.DataFrame(data)
    exclude_auditing_note = "说明: 统计数据已剔除状态为'审计中'的单据"
    
    filters_applied = []
    if source_wh: filters_applied.append(f"来源仓={source_wh}")
    if target_wh: filters_applied.append(f"目的仓={target_wh}")
    if carrier: filters_applied.append(f"承运人={carrier}")
    if evidence_type: filters_applied.append(f"证据类型={evidence_type}")
    if handler: filters_applied.append(f"处理人={handler}")
    
    filter_note = "筛选条件: " + (", ".join(filters_applied) if filters_applied else "无")
    
    if trigger_id == "btn-export-csv":
        output = io.StringIO()
        output.write(f"# 导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        output.write(f"# {exclude_auditing_note}\n")
        output.write(f"# {filter_note}\n")
        output.write("#\n")
        df.to_csv(output, index=False, encoding='utf-8-sig')
        csv_content = output.getvalue()
        
        return dict(
            content=csv_content,
            filename=f"调拨单分析_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            type="text/csv",
            base64=False
        )
    
    elif trigger_id == "btn-export-pdf":
        try:
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4, landscape
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet
            
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
            elements = []
            styles = getSampleStyleSheet()
            
            elements.append(Paragraph("调拨单证据绑定分析报告", styles['Title']))
            elements.append(Spacer(1, 12))
            elements.append(Paragraph(f"导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            elements.append(Paragraph(exclude_auditing_note, styles['Normal']))
            elements.append(Paragraph(filter_note, styles['Normal']))
            elements.append(Spacer(1, 12))
            
            display_cols = ['order_id', 'source_warehouse', 'target_warehouse', 'carrier', 
                           'evidence_type', 'handler', 'status', 'processing_hours']
            table_data = [display_cols]
            for _, row in df.iterrows():
                table_data.append([str(row[c]) if pd.notna(row[c]) else '' for c in display_cols])
            
            t = Table(table_data[:51])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 7),
            ]))
            elements.append(t)
            
            if len(df) > 50:
                elements.append(Spacer(1, 12))
                elements.append(Paragraph(f"... 共 {len(df)} 条记录，显示前 50 条", styles['Normal']))
            
            doc.build(elements)
            pdf_content = buffer.getvalue()
            
            return dict(
                content=base64.b64encode(pdf_content).decode(),
                filename=f"调拨单分析_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                type="application/pdf",
                base64=True
            )
        except ImportError:
            return dash.no_update
    
    return dash.no_update


if __name__ == '__main__':
    print("Starting Dash application on http://127.0.0.1:8050")
    print("Press Ctrl+C to stop")
    app.run_server(debug=True, host='127.0.0.1', port=8050)
