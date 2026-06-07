import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import dash
from dash import dcc, html, Input, Output, State, callback_context
import dash_bootstrap_components as dbc
from datetime import datetime, timedelta
import urllib.parse as urlparse
from urllib.parse import parse_qs
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _init_database_on_startup():
    try:
        from data.db.models import db_manager
        from data.metrics.definitions import REVIEWERS

        if db_manager.is_connected:
            logger.info("🔧 应用启动：检查数据库...")
            from data.db.init_db import init_database, get_db_stats
            init_database(force=False)
            stats = get_db_stats()
            if stats.get("review_logs_count", 0) == 0:
                logger.info("📥 数据库为空，正在导入模拟数据...")
                from data.db.init_db import import_mock_data
                import_mock_data(hours=72, count_per_hour=400)
                stats = get_db_stats()
            logger.info(f"📊 数据库就绪: {stats}")
        else:
            logger.info("ℹ️  数据库未连接，使用内存模拟数据")
    except Exception as e:
        logger.warning(f"⚠️  数据库初始化失败: {e}")


_init_database_on_startup()

from app.layouts.summary_cards import summary_cards_layout, create_summary_card
from app.layouts.filters import filters_layout
from app.layouts.backlog_chart import create_backlog_chart_layout, render_backlog_chart
from app.layouts.funnel_chart import create_funnel_chart_layout, render_funnel_chart
from app.layouts.workload_chart import create_workload_chart_layout, render_workload_chart
from app.layouts.appeal_chart import create_appeal_chart_layout, render_appeal_chart

from data.api.routes.queries import (
    get_backlog_trend, get_funnel_data, get_workload_data,
    get_appeal_reversal_data, get_summary_data
)
from data.export.tasks import export_manager

app = dash.Dash(
    __name__,
    suppress_callback_exceptions=True,
    title="内容安全审核积压看板",
    update_title="加载中...",
    meta_tags=[{"name": "viewport", "content": "width=device-width, initial-scale=1"}],
)
server = app.server


app.layout = html.Div(
    className="dashboard-container",
    children=[
        dcc.Location(id="url", refresh=False),
        dcc.Store(id="filter-store", data={}),
        dcc.Interval(id="interval-refresh", interval=60000, n_intervals=0),
        
        html.Div(
            className="dashboard-header",
            children=[
                html.Div([
                    html.H1(className="dashboard-title", children="🛡️ 内容安全审核积压看板"),
                    html.P(className="dashboard-subtitle", children="实时监控 · 多维分析 · 智能告警"),
                ]),
                html.Div(
                    id="last-update-time",
                    style={"color": "#64748b", "fontSize": "12px", "fontFamily": "JetBrains Mono, monospace"}
                ),
            ]
        ),
        
        summary_cards_layout(),
        filters_layout(),
        
        html.Div(
            className="charts-grid",
            children=[
                create_backlog_chart_layout(),
                create_funnel_chart_layout(),
            ]
        ),
        
        html.Div(
            className="charts-grid",
            children=[
                create_workload_chart_layout(),
                create_appeal_chart_layout(),
            ]
        ),
        
        html.Div(id="hidden-export-trigger", style={"display": "none"}),
    ]
)


def parse_url_params(href):
    if not href or "?" not in href:
        return {}
    params = parse_qs(urlparse.urlparse(href).query)
    result = {}
    for k, v in params.items():
        if len(v) == 1:
            try:
                result[k] = json.loads(v[0])
            except (json.JSONDecodeError, TypeError):
                result[k] = v[0]
        else:
            result[k] = v
    return result


def get_filter_values(risk_tags, queue_types, reviewers, shifts, sources, granularity):
    time_end = datetime.now()
    time_start = time_end - timedelta(hours=24)
    
    return {
        "risk_tags": risk_tags or [],
        "queue_types": queue_types or [],
        "reviewers": reviewers or [],
        "shifts": shifts or [],
        "sources": sources or [],
        "time_start": time_start.isoformat(),
        "time_end": time_end.isoformat(),
        "granularity": granularity or "1h",
    }


@app.callback(
    [Output("filter-risk-tags", "value"),
     Output("filter-queue-types", "value"),
     Output("filter-reviewers", "value"),
     Output("filter-shifts", "value"),
     Output("filter-sources", "value"),
     Output("filter-granularity", "value")],
    [Input("url", "href")]
)
def load_filters_from_url(href):
    params = parse_url_params(href)
    if not params:
        raise dash.exceptions.PreventUpdate
    
    return (
        params.get("risk_tags"),
        params.get("queue_types"),
        params.get("reviewers"),
        params.get("shifts"),
        params.get("sources"),
        params.get("granularity", "1h"),
    )


@app.callback(
    Output("url", "search"),
    [Input("filter-risk-tags", "value"),
     Input("filter-queue-types", "value"),
     Input("filter-reviewers", "value"),
     Input("filter-shifts", "value"),
     Input("filter-sources", "value"),
     Input("filter-granularity", "value")]
)
def update_url_params(risk_tags, queue_types, reviewers, shifts, sources, granularity):
    ctx = callback_context
    if not ctx.triggered:
        raise dash.exceptions.PreventUpdate
    
    params = {}
    if risk_tags:
        params["risk_tags"] = json.dumps(risk_tags)
    if queue_types:
        params["queue_types"] = json.dumps(queue_types)
    if reviewers:
        params["reviewers"] = json.dumps(reviewers)
    if shifts:
        params["shifts"] = json.dumps(shifts)
    if sources:
        params["sources"] = json.dumps(sources)
    if granularity and granularity != "1h":
        params["granularity"] = granularity
    
    if params:
        return "?" + urlparse.urlencode(params)
    return ""


@app.callback(
    Output("filter-breadcrumbs", "children"),
    [Input("filter-risk-tags", "value"),
     Input("filter-queue-types", "value"),
     Input("filter-reviewers", "value"),
     Input("filter-shifts", "value"),
     Input("filter-sources", "value")]
)
def update_breadcrumbs(risk_tags, queue_types, reviewers, shifts, sources):
    tags = []
    
    def make_tag(label, values, value_map=None):
        if values and len(values) > 0:
            if value_map:
                display_values = [value_map.get(v, v) for v in values]
            else:
                display_values = values
            return html.Span(
                className="filter-tag",
                children=[
                    f"{label}: {', '.join(display_values[:2])}{'...' if len(display_values) > 2 else ''}",
                ]
            )
        return None
    
    from data.metrics.definitions import REVIEWERS
    reviewer_map = {r["id"]: r["name"] for r in REVIEWERS}
    
    for t in [
        make_tag("风险标签", risk_tags),
        make_tag("队列", queue_types),
        make_tag("审核员", reviewers, reviewer_map),
        make_tag("班次", shifts),
        make_tag("来源", sources),
    ]:
        if t:
            tags.append(t)
    
    if not tags:
        return html.Span(style={"color": "#64748b", "fontSize": "12px"}, children="当前: 全局视图，无筛选")
    
    return [html.Span(style={"color": "#64748b", "fontSize": "12px", "marginRight": "8px"}, children="已选:")] + tags


@app.callback(
    [Output("alert-cards-container", "children"),
     Output("last-update-time", "children")],
    [Input("interval-refresh", "n_intervals"),
     Input("filter-risk-tags", "value"),
     Input("filter-queue-types", "value"),
     Input("filter-shifts", "value"),
     Input("filter-sources", "value")]
)
def update_summary_cards(n, risk_tags, queue_types, shifts, sources):
    time_end = datetime.now()
    time_start = time_end - timedelta(hours=24)
    
    summary = get_summary_data(time_start, time_end)
    
    cards = []
    
    has_high_alert = any(a["severity"] == "high" for a in summary["alerts"])
    
    alert_icon = "🚨" if has_high_alert else "⚠️" if summary["alerts"] else "✅"
    alert_severity = "high" if has_high_alert else "medium" if summary["alerts"] else "normal"
    alert_msg = f"{len(summary['alerts'])} 条待处理告警" if summary["alerts"] else "系统运行正常"
    
    cards.append(create_summary_card(
        title="系统状态",
        value=len(summary["alerts"]),
        unit="条告警",
        message=alert_msg,
        icon=alert_icon,
        severity=alert_severity,
    ))
    
    cards.append(create_summary_card(
        title="当前积压总量",
        value=summary["total_backlog"],
        unit="条",
        message="待人审视频数",
        icon="📦",
        severity="info",
    ))
    
    sla_color = "high" if summary["sla_breach_rate"] > 15 else "medium" if summary["sla_breach_rate"] > 8 else "normal"
    cards.append(create_summary_card(
        title="SLA违规率",
        value=summary["sla_breach_rate"],
        unit="%",
        message=f"超过SLA阈值的视频占比",
        icon="⏰",
        severity=sla_color,
    ))
    
    appeal_color = "medium" if summary["appeal_reversal_rate"] > 40 else "normal"
    cards.append(create_summary_card(
        title="申诉逆转率",
        value=summary["appeal_reversal_rate"],
        unit="%",
        message="申诉成功占比（按原始标签）",
        icon="⚖️",
        severity=appeal_color,
    ))
    
    update_time = f"最后更新: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    return cards, update_time


@app.callback(
    Output("backlog-chart", "figure"),
    [Input("interval-refresh", "n_intervals"),
     Input("filter-risk-tags", "value"),
     Input("filter-queue-types", "value"),
     Input("filter-reviewers", "value"),
     Input("filter-shifts", "value"),
     Input("filter-sources", "value"),
     Input("filter-granularity", "value")]
)
def update_backlog_chart(n, risk_tags, queue_types, reviewers, shifts, sources, granularity):
    time_end = datetime.now()
    time_start = time_end - timedelta(hours=24)
    
    df = get_backlog_trend(
        time_start=time_start,
        time_end=time_end,
        granularity=granularity or "1h",
        risk_tags=risk_tags,
        queue_types=queue_types,
        reviewers=reviewers,
        shifts=shifts,
        sources=sources,
    )
    
    return render_backlog_chart(df)


@app.callback(
    Output("funnel-chart", "figure"),
    [Input("interval-refresh", "n_intervals"),
     Input("filter-risk-tags", "value"),
     Input("filter-queue-types", "value"),
     Input("filter-reviewers", "value"),
     Input("filter-shifts", "value"),
     Input("filter-sources", "value")]
)
def update_funnel_chart(n, risk_tags, queue_types, reviewers, shifts, sources):
    time_end = datetime.now()
    time_start = time_end - timedelta(hours=24)
    
    df = get_funnel_data(
        time_start=time_start,
        time_end=time_end,
        risk_tags=risk_tags,
        queue_types=queue_types,
        reviewers=reviewers,
        shifts=shifts,
        sources=sources,
    )
    
    return render_funnel_chart(df)


@app.callback(
    Output("workload-chart", "figure"),
    [Input("interval-refresh", "n_intervals"),
     Input("filter-risk-tags", "value"),
     Input("filter-queue-types", "value"),
     Input("filter-reviewers", "value"),
     Input("filter-shifts", "value"),
     Input("filter-sources", "value")]
)
def update_workload_chart(n, risk_tags, queue_types, reviewers, shifts, sources):
    time_end = datetime.now()
    time_start = time_end - timedelta(hours=24)
    
    df = get_workload_data(
        time_start=time_start,
        time_end=time_end,
        risk_tags=risk_tags,
        queue_types=queue_types,
        reviewers=reviewers,
        shifts=shifts,
        sources=sources,
    )
    
    return render_workload_chart(df)


@app.callback(
    Output("appeal-chart", "figure"),
    [Input("interval-refresh", "n_intervals"),
     Input("filter-risk-tags", "value"),
     Input("filter-queue-types", "value"),
     Input("filter-reviewers", "value"),
     Input("filter-shifts", "value"),
     Input("filter-sources", "value")]
)
def update_appeal_chart(n, risk_tags, queue_types, reviewers, shifts, sources):
    time_end = datetime.now()
    time_start = time_end - timedelta(hours=72)
    
    df = get_appeal_reversal_data(
        time_start=time_start,
        time_end=time_end,
        risk_tags=risk_tags,
        queue_types=queue_types,
        reviewers=reviewers,
        shifts=shifts,
        sources=sources,
    )
    
    return render_appeal_chart(df)


@app.callback(
    [Output("export-status", "children"),
     Output("export-poll-interval", "disabled"),
     Output("export-poll-interval", "max_intervals"),
     Output("current-export-task-id", "data")],
    [Input("btn-export", "n_clicks")],
    [State("filter-risk-tags", "value"),
     State("filter-queue-types", "value"),
     State("filter-reviewers", "value"),
     State("filter-shifts", "value"),
     State("filter-sources", "value"),
     State("filter-granularity", "value")]
)
def handle_export(n_clicks, risk_tags, queue_types, reviewers, shifts, sources, granularity):
    if not n_clicks or n_clicks == 0:
        raise dash.exceptions.PreventUpdate

    time_end = datetime.now()
    time_start = time_end - timedelta(hours=24)

    filters = {
        "risk_tags": risk_tags,
        "queue_types": queue_types,
        "reviewers": reviewers,
        "shifts": shifts,
        "sources": sources,
        "time_start": time_start.isoformat(),
        "time_end": time_end.isoformat(),
        "granularity": granularity,
    }

    task_id = export_manager.submit_task(filters, "review_logs", "xlsx")

    status_ui = html.Div([
        html.Div([
            html.Span("📦 导出处理中...", style={"fontWeight": "bold", "color": "#3b82f6", "marginRight": "12px"}),
            html.Span(f"任务ID: {task_id[:8]}", style={"color": "#64748b", "fontFamily": "JetBrains Mono, monospace"}),
        ], style={"display": "flex", "alignItems": "center", "marginBottom": "8px"}),
        html.Div(
            id="export-progress-bar",
            style={
                "height": "8px",
                "background": "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                "width": "20%",
                "borderRadius": "4px",
                "transition": "width 0.5s ease",
            }
        ),
        html.Span(id="export-progress-text", children="20% 准备数据...", style={"color": "#64748b", "fontSize": "12px", "marginTop": "4px", "display": "block"}),
    ])

    return status_ui, False, 30, task_id


@app.callback(
    [Output("export-progress-bar", "style"),
     Output("export-progress-text", "children"),
     Output("export-poll-interval", "disabled", allow_duplicate=True)],
    [Input("export-poll-interval", "n_intervals")],
    [State("current-export-task-id", "data")],
    prevent_initial_call=True
)
def poll_export_status(n_intervals, task_id):
    if not task_id:
        return {}, "", True

    status = export_manager.get_status(task_id)
    if not status:
        return {"width": "100%", "background": "#ef4444"}, "❌ 任务不存在", True

    progress = status.progress
    width = f"{min(progress, 100)}%"

    if status.status == "completed":
        bg = "linear-gradient(90deg, #10b981, #059669)"
        text = f"✅ 导出完成！文件: {os.path.basename(status.file_path)}"
        return {"width": width, "background": bg, "height": "8px", "borderRadius": "4px", "transition": "width 0.5s ease"}, text, True
    elif status.status == "failed":
        bg = "linear-gradient(90deg, #ef4444, #dc2626)"
        text = f"❌ 导出失败: {status.error_message}"
        return {"width": "100%", "background": bg, "height": "8px", "borderRadius": "4px", "transition": "width 0.5s ease"}, text, True
    elif status.status == "processing":
        bg = "linear-gradient(90deg, #3b82f6, #8b5cf6)"
        stage_text = "查询数据..." if progress < 40 else "生成文件..." if progress < 70 else "写入中..."
        text = f"{progress}% {stage_text}"
        return {"width": width, "background": bg, "height": "8px", "borderRadius": "4px", "transition": "width 0.5s ease"}, text, False
    else:
        bg = "linear-gradient(90deg, #f59e0b, #d97706)"
        return {"width": width, "background": bg, "height": "8px", "borderRadius": "4px", "transition": "width 0.5s ease"}, f"{progress}% 排队中...", False


if __name__ == "__main__":
    print("🚀 启动内容安全审核积压看板...")
    print(f"📊 访问地址: http://localhost:8050")
    app.run_server(
        debug=False,
        host="0.0.0.0",
        port=8050,
    )
