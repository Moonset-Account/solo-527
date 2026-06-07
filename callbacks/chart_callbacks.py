from datetime import datetime
from dash import callback, Input, Output, State, ctx, dash, no_update
from dash import html, dcc
import dash_bootstrap_components as dbc
import pandas as pd

from services.aggregation import (
    get_kpi_summary, get_trend_data, get_pareto_analysis,
    get_line_comparison, get_maintenance_efficiency, get_spare_part_correlation,
    aggregate_downtime_by_dimension
)
from services.data_service import get_date_range
from components.kpi_cards import create_kpi_row
from components.charts import (
    create_trend_chart, create_pareto_chart, create_line_comparison_chart,
    create_heatmap_chart, create_maintenance_distribution, create_repair_person_chart,
    create_spare_parts_heatmap, create_cost_analysis_chart
)
from components.export import generate_excel_report
from utils.helpers import format_duration


DRILLDOWN_STORE = "drilldown-state"
FILTER_STORE = "filter-state"


def build_filters_from_state(filter_state, drilldown_state=None):
    filters = {}
    if filter_state:
        if filter_state.get("start_date"):
            filters["start_date"] = filter_state["start_date"]
        if filter_state.get("end_date"):
            filters["end_date"] = filter_state["end_date"]
        if filter_state.get("line_ids"):
            filters["line_ids"] = filter_state["line_ids"]
        if filter_state.get("equipment_ids"):
            filters["equipment_ids"] = filter_state["equipment_ids"]
        if filter_state.get("shift_ids"):
            filters["shift_ids"] = filter_state["shift_ids"]
        if filter_state.get("fault_codes"):
            filters["fault_codes"] = filter_state["fault_codes"]
        if filter_state.get("repair_persons"):
            filters["repair_persons"] = filter_state["repair_persons"]
        if filter_state.get("breakdown_type"):
            filters["breakdown_type"] = filter_state["breakdown_type"]
    
    if drilldown_state:
        for key, value in drilldown_state.items():
            if value and key not in filters:
                if key == "drilldown_fault_code":
                    filters["fault_codes"] = [value] if isinstance(value, str) else value
                elif key == "drilldown_line_id":
                    filters["line_ids"] = [value] if not isinstance(value, list) else value
                elif key == "drilldown_equipment_id":
                    filters["equipment_ids"] = [value] if not isinstance(value, list) else value
                elif key == "drilldown_shift_id":
                    filters["shift_ids"] = [value] if not isinstance(value, list) else value
                elif key == "drilldown_person":
                    filters["repair_persons"] = [value] if isinstance(value, str) else value
    
    return filters


def get_current_caliber_description(filter_state, drilldown_state=None):
    parts = []
    
    if filter_state:
        if filter_state.get("start_date") and filter_state.get("end_date"):
            parts.append(f"时间: {filter_state['start_date']} ~ {filter_state['end_date']}")
        if filter_state.get("line_ids"):
            parts.append(f"产线: {len(filter_state['line_ids'])}个")
        if filter_state.get("equipment_ids"):
            parts.append(f"设备: {len(filter_state['equipment_ids'])}台")
        if filter_state.get("shift_ids"):
            parts.append(f"班次: {len(filter_state['shift_ids'])}个")
        if filter_state.get("fault_codes"):
            parts.append(f"故障: {len(filter_state['fault_codes'])}类")
        if filter_state.get("repair_persons"):
            parts.append(f"维修人: {len(filter_state['repair_persons'])}人")
        bt = filter_state.get("breakdown_type", "all")
        bt_label = {"all": "全部停机", "planned": "仅计划检修", "unplanned": "仅突发故障"}.get(bt, bt)
        parts.append(f"类型: {bt_label}")
    
    if drilldown_state:
        for key, value in drilldown_state.items():
            if value:
                if key == "drilldown_fault_code":
                    parts.append(f"下钻→故障:{value}")
                elif key == "drilldown_line_id":
                    from database.sample_data import PRODUCTION_LINES
                    line_name = next((pl["line_name"] for pl in PRODUCTION_LINES if pl["line_id"] == value), str(value))
                    parts.append(f"下钻→产线:{line_name}")
                elif key == "drilldown_person":
                    parts.append(f"下钻→维修人:{value}")
                elif key == "drilldown_part_name":
                    parts.append(f"下钻→备件:{value}")
    
    return " | ".join(parts) if parts else "全部数据"


def create_breadcrumbs(filter_state, drilldown_state=None):
    caliber = get_current_caliber_description(filter_state, drilldown_state)
    
    drilldown_items = []
    has_drilldown = False
    
    if drilldown_state:
        for key, value in drilldown_state.items():
            if value:
                has_drilldown = True
                if key == "drilldown_fault_code":
                    drilldown_items.append(
                        dbc.Badge([
                            f"故障: {value}",
                            html.Button("×", className="btn-close ms-2", size="sm", 
                                       id="clear-drilldown-fault", n_clicks=0)
                        ], color="info", className="me-2")
                    )
                elif key == "drilldown_line_id":
                    from database.sample_data import PRODUCTION_LINES
                    line_name = next((pl["line_name"] for pl in PRODUCTION_LINES if pl["line_id"] == value), str(value))
                    drilldown_items.append(
                        dbc.Badge([
                            f"产线: {line_name}",
                            html.Button("×", className="btn-close ms-2", size="sm",
                                       id="clear-drilldown-line", n_clicks=0)
                        ], color="info", className="me-2")
                    )
                elif key == "drilldown_person":
                    drilldown_items.append(
                        dbc.Badge([
                            f"维修人: {value}",
                            html.Button("×", className="btn-close ms-2", size="sm",
                                       id="clear-drilldown-person", n_clicks=0)
                        ], color="info", className="me-2")
                    )
                elif key == "drilldown_part_name":
                    drilldown_items.append(
                        dbc.Badge([
                            f"备件: {value}",
                            html.Button("×", className="btn-close ms-2", size="sm",
                                       id="clear-drilldown-part", n_clicks=0)
                        ], color="info", className="me-2")
                    )
    
    if has_drilldown:
        drilldown_items.append(
            dbc.Button("清除全部下钻", size="sm", color="link", id="clear-all-drilldown", n_clicks=0, className="p-0")
        )
    
    return html.Div([
        html.Div([
            html.I(className="bi bi-info-circle me-1"),
            html.Small(f"当前口径: {caliber}", className="text-muted"),
        ], className="mb-2"),
        html.Div(drilldown_items, className="mb-3") if drilldown_items else None,
    ])


def register_callbacks(app):
    
    @app.callback(
        Output(FILTER_STORE, "data"),
        [
            Input("date-range", "start_date"),
            Input("date-range", "end_date"),
            Input("line-filter", "value"),
            Input("equipment-filter", "value"),
            Input("shift-filter", "value"),
            Input("fault-filter", "value"),
            Input("person-filter", "value"),
            Input("breakdown-type-filter", "value"),
        ],
        State(FILTER_STORE, "data"),
        prevent_initial_call=False,
    )
    def update_filter_state(start_date, end_date, line_ids, equipment_ids, shift_ids, 
                            fault_codes, repair_persons, breakdown_type, current_state):
        new_state = current_state or {}
        new_state.update({
            "start_date": start_date,
            "end_date": end_date,
            "line_ids": line_ids,
            "equipment_ids": equipment_ids,
            "shift_ids": shift_ids,
            "fault_codes": fault_codes,
            "repair_persons": repair_persons,
            "breakdown_type": breakdown_type or "all",
        })
        return new_state
    
    @app.callback(
        [
            Output("date-range", "start_date"),
            Output("date-range", "end_date"),
            Output("line-filter", "value"),
            Output("equipment-filter", "value"),
            Output("shift-filter", "value"),
            Output("fault-filter", "value"),
            Output("person-filter", "value"),
            Output("breakdown-type-filter", "value"),
            Output(DRILLDOWN_STORE, "data"),
        ],
        Input("reset-filters-btn", "n_clicks"),
        prevent_initial_call=True,
    )
    def reset_filters(n_clicks):
        if not n_clicks:
            raise dash.exceptions.PreventUpdate
        
        date_range = get_date_range()
        return [
            date_range["min_date"],
            date_range["max_date"],
            None,
            None,
            None,
            None,
            None,
            "all",
            {},
        ]
    
    @app.callback(
        [
            Output("kpi-cards-container", "children"),
            Output("data-update-time", "children"),
            Output("current-caliber", "children"),
        ],
        [Input(FILTER_STORE, "data"), Input(DRILLDOWN_STORE, "data")],
        prevent_initial_call=False,
    )
    def update_kpi_cards(filter_state, drilldown_state):
        filters = build_filters_from_state(filter_state, drilldown_state)
        kpi_data = get_kpi_summary(filters)
        update_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        caliber = get_current_caliber_description(filter_state, drilldown_state)
        
        caliber_badge = html.Div([
            html.I(className="bi bi-info-circle me-1"),
            html.Small(f"当前口径: {caliber}", className="text-muted"),
        ], className="text-end")
        
        return create_kpi_row(kpi_data), update_time, caliber_badge
    
    @app.callback(
        Output("trend-chart", "figure"),
        [Input(FILTER_STORE, "data"), Input(DRILLDOWN_STORE, "data")],
        prevent_initial_call=False,
    )
    def update_trend_chart(filter_state, drilldown_state):
        filters = build_filters_from_state(filter_state, drilldown_state)
        trend_df = get_trend_data(filters)
        return create_trend_chart(trend_df)
    
    @app.callback(
        [
            Output("top-faults-list", "children"),
            Output("top-lines-list", "children"),
        ],
        [Input(FILTER_STORE, "data"), Input(DRILLDOWN_STORE, "data")],
        prevent_initial_call=False,
    )
    def update_overview_lists(filter_state, drilldown_state):
        filters = build_filters_from_state(filter_state, drilldown_state)
        
        pareto_data = get_pareto_analysis(filters)
        fault_items = pareto_data.get("items", [])[:5]
        
        fault_list = []
        for i, item in enumerate(fault_items, 1):
            fault_list.append(
                dbc.ListGroupItem([
                    html.Div([
                        html.Span(f"#{i}", className="badge bg-primary me-2"),
                        html.Strong(item["fault_name"]),
                        html.Span(
                            f" {format_duration(item['duration'])}",
                            className="float-end text-muted",
                        ),
                    ]),
                    html.Div([
                        html.Small(item["description"], className="text-muted"),
                    ], className="mt-1"),
                ], className="mb-2", id={"type": "fault-item", "index": item["fault_code"]})
            )
        
        if not fault_list:
            fault_list = dbc.Alert("暂无故障数据", color="info")
        
        line_data = get_line_comparison(filters)
        line_items = sorted(
            line_data.get("lines", []),
            key=lambda x: x["unplanned_duration"],
            reverse=True
        )[:5]
        
        line_list = []
        for i, item in enumerate(line_items, 1):
            color_class = "text-danger" if i <= 2 else "text-warning" if i <= 3 else ""
            line_list.append(
                dbc.ListGroupItem([
                    html.Div([
                        html.Span(f"#{i}", className=f"badge me-2 {'bg-danger' if i <= 2 else 'bg-warning' if i <= 3 else 'bg-secondary'}"),
                        html.Strong(item["line_name"], className=color_class),
                        html.Span(
                            f" 突发: {format_duration(item['unplanned_duration'])}",
                            className="float-end text-muted",
                        ),
                    ]),
                    html.Div([
                        dbc.Progress(
                            value=item.get("unplanned_ratio", 0),
                            color="warning" if item.get("unplanned_ratio", 0) > 60 else "info",
                            style={"height": "6px"},
                        ),
                        html.Small(
                            f"突发占比: {item.get('unplanned_ratio', 0)}%",
                            className="text-muted",
                        ),
                    ], className="mt-1"),
                ], className="mb-2")
            )
        
        if not line_list:
            line_list = dbc.Alert("暂无产线数据", color="info")
        
        return dbc.ListGroup(fault_list, flush=True), dbc.ListGroup(line_list, flush=True)
    
    @app.callback(
        [
            Output("pareto-chart", "figure"),
            Output("pareto-detail-container", "children"),
            Output("suggestions-container", "children"),
        ],
        [Input(FILTER_STORE, "data"), Input(DRILLDOWN_STORE, "data")],
        prevent_initial_call=False,
    )
    def update_pareto_page(filter_state, drilldown_state):
        filters = build_filters_from_state(filter_state, drilldown_state)
        pareto_data = get_pareto_analysis(filters)
        
        fig = create_pareto_chart(pareto_data)
        fig.update_layout(clickmode='event+select')
        
        items = pareto_data.get("items", [])
        detail_rows = []
        for item in items[:8]:
            detail_rows.append(
                html.Tr([
                    html.Td(item["fault_name"]),
                    html.Td(format_duration(item["duration"])),
                    html.Td(item["count"]),
                    html.Td(f"{item['percentage']}%"),
                    html.Td(f"{item['cumulative_percentage']}%"),
                    html.Td(html.Small(item["description"], className="text-muted")),
                ], id={"type": "pareto-row", "index": item["fault_code"]})
            )
        
        if detail_rows:
            detail_table = dbc.Table([
                html.Thead(html.Tr([
                    html.Th("故障类型"), html.Th("停机时长"), html.Th("次数"),
                    html.Th("占比"), html.Th("累积占比"), html.Th("说明"),
                ])),
                html.Tbody(detail_rows),
            ], bordered=True, hover=True, size="sm")
        else:
            detail_table = dbc.Alert("暂无数据", color="info")
        
        top_items = pareto_data.get("top_items", [])
        suggestion_cards = []
        for item in items:
            if item["fault_name"] in top_items:
                suggestion_cards.append(
                    dbc.Card([
                        dbc.CardBody([
                            html.H6([
                                html.Span("⚠️ ", className="text-warning"),
                                item["fault_name"],
                            ], className="fw-bold text-primary"),
                            html.P(html.Small(item["description"]), className="text-muted mb-2"),
                            html.P([
                                html.Strong("建议："),
                                html.Small(item["suggestion"]),
                            ], className="mb-0"),
                        ]),
                    ], className="mb-2 border-start-warning")
                )
        
        if not suggestion_cards:
            suggestion_cards = dbc.Alert("暂无改善建议", color="info")
        
        return fig, detail_table, suggestion_cards
    
    @app.callback(
        Output(DRILLDOWN_STORE, "data", allow_duplicate=True),
        Input("pareto-chart", "clickData"),
        State(DRILLDOWN_STORE, "data"),
        prevent_initial_call=True,
    )
    def pareto_click_drilldown(click_data, current_drilldown):
        if not click_data or not click_data.get("points"):
            raise dash.exceptions.PreventUpdate
        
        point = click_data["points"][0]
        fault_name = point.get("x")
        
        from database.sample_data import FAULT_TYPES
        fault_code = None
        for ft in FAULT_TYPES:
            if ft["fault_name"] == fault_name:
                fault_code = ft["fault_code"]
                break
        
        if not fault_code:
            raise dash.exceptions.PreventUpdate
        
        new_drilldown = current_drilldown or {}
        new_drilldown["drilldown_fault_code"] = fault_code
        
        return new_drilldown
    
    @app.callback(
        [
            Output("line-compare-chart", "figure"),
            Output("heatmap-chart", "figure"),
            Output("line-summary-cards", "children"),
        ],
        [Input(FILTER_STORE, "data"), Input(DRILLDOWN_STORE, "data")],
        prevent_initial_call=False,
    )
    def update_line_compare_page(filter_state, drilldown_state):
        filters = build_filters_from_state(filter_state, drilldown_state)
        line_data = get_line_comparison(filters)
        
        compare_fig = create_line_comparison_chart(line_data)
        compare_fig.update_layout(clickmode='event+select')
        
        heatmap_fig = create_heatmap_chart(line_data.get("heatmap_data", []))
        
        lines = line_data.get("lines", [])
        if lines:
            total_unplanned = sum(l["unplanned_duration"] for l in lines)
            total_planned = sum(l["planned_duration"] for l in lines)
            
            summary = [
                dbc.ListGroupItem([
                    html.H6("总工单数", className="fw-bold text-primary mb-1"),
                    html.H4(sum(l["count"] for l in lines)),
                ]),
                dbc.ListGroupItem([
                    html.H6("突发停机总时长", className="fw-bold text-warning mb-1"),
                    html.H4(format_duration(total_unplanned)),
                ]),
                dbc.ListGroupItem([
                    html.H6("计划检修总时长", className="fw-bold text-success mb-1"),
                    html.H4(format_duration(total_planned)),
                ]),
            ]
        else:
            summary = [dbc.Alert("暂无数据", color="info")]
        
        return compare_fig, heatmap_fig, dbc.ListGroup(summary, flush=True)
    
    @app.callback(
        Output(DRILLDOWN_STORE, "data", allow_duplicate=True),
        Input("line-compare-chart", "clickData"),
        State(DRILLDOWN_STORE, "data"),
        prevent_initial_call=True,
    )
    def line_compare_click_drilldown(click_data, current_drilldown):
        if not click_data or not click_data.get("points"):
            raise dash.exceptions.PreventUpdate
        
        point = click_data["points"][0]
        line_name = point.get("x")
        
        from database.sample_data import PRODUCTION_LINES
        line_id = None
        for pl in PRODUCTION_LINES:
            if pl["line_name"] == line_name:
                line_id = pl["line_id"]
                break
        
        if not line_id:
            raise dash.exceptions.PreventUpdate
        
        new_drilldown = current_drilldown or {}
        new_drilldown["drilldown_line_id"] = line_id
        
        return new_drilldown
    
    @app.callback(
        [
            Output("mttr-value", "children"),
            Output("mtbf-value", "children"),
            Output("total-orders", "children"),
            Output("avg-labor-cost", "children"),
            Output("maint-dist-chart", "figure"),
            Output("person-chart", "figure"),
        ],
        [Input(FILTER_STORE, "data"), Input(DRILLDOWN_STORE, "data")],
        prevent_initial_call=False,
    )
    def update_maintenance_page(filter_state, drilldown_state):
        filters = build_filters_from_state(filter_state, drilldown_state)
        eff_data = get_maintenance_efficiency(filters)
        
        mttr = eff_data.get("mttr", 0)
        mtbf = eff_data.get("mtbf", 0)
        persons = eff_data.get("by_person", [])
        total_orders = sum(p["completed_count"] for p in persons) if persons else 0
        avg_cost = sum(p["avg_cost"] for p in persons) / len(persons) if persons else 0
        
        dist_fig = create_maintenance_distribution(eff_data)
        person_fig = create_repair_person_chart(eff_data)
        person_fig.update_layout(clickmode='event+select')
        
        return mttr, mtbf, total_orders, f"{avg_cost:.0f}", dist_fig, person_fig
    
    @app.callback(
        Output(DRILLDOWN_STORE, "data", allow_duplicate=True),
        Input("person-chart", "clickData"),
        State(DRILLDOWN_STORE, "data"),
        prevent_initial_call=True,
    )
    def person_click_drilldown(click_data, current_drilldown):
        if not click_data or not click_data.get("points"):
            raise dash.exceptions.PreventUpdate
        
        point = click_data["points"][0]
        person_name = point.get("x")
        
        if not person_name:
            raise dash.exceptions.PreventUpdate
        
        new_drilldown = current_drilldown or {}
        new_drilldown["drilldown_person"] = person_name
        
        return new_drilldown
    
    @app.callback(
        Output(DRILLDOWN_STORE, "data", allow_duplicate=True),
        Input("cost-chart", "clickData"),
        State(DRILLDOWN_STORE, "data"),
        prevent_initial_call=True,
    )
    def spare_part_click_drilldown(click_data, current_drilldown):
        if not click_data or not click_data.get("points"):
            raise dash.exceptions.PreventUpdate
        
        point = click_data["points"][0]
        part_name = point.get("x")
        
        if not part_name:
            raise dash.exceptions.PreventUpdate
        
        new_drilldown = current_drilldown or {}
        new_drilldown["drilldown_part_name"] = part_name
        
        return new_drilldown
    
    @app.callback(
        Output(DRILLDOWN_STORE, "data", allow_duplicate=True),
        [
            Input("clear-drilldown-fault", "n_clicks"),
            Input("clear-drilldown-line", "n_clicks"),
            Input("clear-drilldown-person", "n_clicks"),
            Input("clear-drilldown-part", "n_clicks"),
            Input("clear-all-drilldown", "n_clicks"),
        ],
        State(DRILLDOWN_STORE, "data"),
        prevent_initial_call=True,
    )
    def clear_drilldown(clear_fault, clear_line, clear_person, clear_part, clear_all, current_drilldown):
        if not ctx.triggered_id:
            raise dash.exceptions.PreventUpdate
        
        new_drilldown = current_drilldown or {}
        
        if ctx.triggered_id == "clear-drilldown-fault":
            new_drilldown.pop("drilldown_fault_code", None)
        elif ctx.triggered_id == "clear-drilldown-line":
            new_drilldown.pop("drilldown_line_id", None)
        elif ctx.triggered_id == "clear-drilldown-person":
            new_drilldown.pop("drilldown_person", None)
        elif ctx.triggered_id == "clear-drilldown-part":
            new_drilldown.pop("drilldown_part_name", None)
        elif ctx.triggered_id == "clear-all-drilldown":
            new_drilldown = {}
        
        return new_drilldown
    
    @app.callback(
        [
            Output("parts-heatmap", "figure"),
            Output("cost-chart", "figure"),
            Output("top-correlations-list", "children"),
        ],
        [Input(FILTER_STORE, "data"), Input(DRILLDOWN_STORE, "data")],
        prevent_initial_call=False,
    )
    def update_spare_parts_page(filter_state, drilldown_state):
        filters = build_filters_from_state(filter_state, drilldown_state)
        corr_data = get_spare_part_correlation(filters)
        
        heatmap_fig = create_spare_parts_heatmap(corr_data)
        cost_fig = create_cost_analysis_chart(corr_data)
        
        top_corr = corr_data.get("top_correlations", [])
        corr_items = []
        for i, item in enumerate(top_corr, 1):
            corr_items.append(
                dbc.ListGroupItem([
                    html.Div([
                        html.Span(f"#{i}", className="badge bg-primary me-2"),
                        html.Strong(f"{item['fault_name']} → {item['part_name']}"),
                        dbc.Badge(
                            f"关联度: {item['correlation_score']}",
                            color="success" if item["correlation_score"] >= 0.6 else "warning",
                            className="float-end",
                        ),
                    ]),
                    html.Div([
                        html.Small(
                            f"使用次数: {item['usage_count']}次 | 成本: {item['total_cost']:.0f}元",
                            className="text-muted",
                        ),
                    ], className="mt-1"),
                ], className="mb-2")
            )
        
        if not corr_items:
            corr_items = dbc.Alert("暂无关联数据", color="info")
        
        return heatmap_fig, cost_fig, dbc.ListGroup(corr_items, flush=True)
    
    @app.callback(
        Output("download-report", "data"),
        Input("export-btn", "n_clicks"),
        [State(FILTER_STORE, "data"), State(DRILLDOWN_STORE, "data")],
        prevent_initial_call=True,
    )
    def export_report(n_clicks, filter_state, drilldown_state):
        if not n_clicks:
            raise dash.exceptions.PreventUpdate
        
        filters = build_filters_from_state(filter_state, drilldown_state)
        
        kpi_data = get_kpi_summary(filters)
        pareto_data = get_pareto_analysis(filters)
        line_data = get_line_comparison(filters)
        eff_data = get_maintenance_efficiency(filters)
        corr_data = get_spare_part_correlation(filters)
        
        export_filter_state = {
            **(filter_state or {}),
            "drilldown": drilldown_state,
            "caliber": get_current_caliber_description(filter_state, drilldown_state),
        }
        
        excel_data = generate_excel_report(
            export_filter_state,
            kpi_data,
            pareto_data,
            line_data,
            eff_data,
            corr_data,
        )
        
        filename = f"设备停机分析报告_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return dcc.send_bytes(excel_data, filename=filename)
