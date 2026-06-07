from flask import request, jsonify
from datetime import datetime
import json
import pandas as pd

from services.aggregation import (
    get_kpi_summary, get_trend_data, get_pareto_analysis,
    get_line_comparison, get_maintenance_efficiency, get_spare_part_correlation,
    aggregate_downtime_by_dimension
)
from services.data_service import get_dimension_options, get_date_range


def register_api_routes(server):
    
    @server.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        })
    
    @server.route('/api/dimensions/<dimension>', methods=['GET'])
    def get_dimension_values(dimension):
        options = get_dimension_options(dimension)
        return jsonify({
            "dimension": dimension,
            "options": options,
            "count": len(options)
        })
    
    @server.route('/api/date-range', methods=['GET'])
    def get_date_range_api():
        date_range = get_date_range()
        return jsonify({
            "min_date": date_range["min_date"].isoformat() if hasattr(date_range["min_date"], 'isoformat') else str(date_range["min_date"]),
            "max_date": date_range["max_date"].isoformat() if hasattr(date_range["max_date"], 'isoformat') else str(date_range["max_date"])
        })
    
    @server.route('/api/aggregation/downtime', methods=['GET', 'POST'])
    def aggregation_downtime():
        if request.method == 'POST':
            params = request.get_json() or {}
        else:
            params = request.args.to_dict()
        
        dimensions = params.get('dimensions', params.get('dimension', []))
        if isinstance(dimensions, str):
            if ',' in dimensions:
                dimensions = [d.strip() for d in dimensions.split(',')]
            else:
                dimensions = [dimensions]
        
        if not dimensions:
            dimensions = ['fault_type']
        
        filters = _build_filters_from_params(params)
        result_df = aggregate_downtime_by_dimension(dimensions, filters)
        
        data = []
        if not result_df.empty:
            data = result_df.to_dict('records')
            for item in data:
                for key, value in item.items():
                    if hasattr(value, 'isoformat'):
                        item[key] = value.isoformat()
                    elif isinstance(value, float) and pd.isna(value):
                        item[key] = None
        
        return jsonify({
            "data": data,
            "metadata": {
                "dimensions": dimensions,
                "filters": _sanitize_filters(filters),
                "record_count": len(data),
                "caliber_note": "停机时长单位为分钟，计划检修与突发停机已分离统计",
                "update_time": datetime.now().isoformat()
            }
        })
    
    @server.route('/api/kpi/summary', methods=['GET', 'POST'])
    def kpi_summary():
        if request.method == 'POST':
            params = request.get_json() or {}
        else:
            params = request.args.to_dict()
        
        filters = _build_filters_from_params(params)
        kpi_data = get_kpi_summary(filters)
        
        return jsonify({
            "data": kpi_data,
            "metadata": {
                "filters": _sanitize_filters(filters),
                "caliber_notes": {
                    "total_duration": "总停机时长，包含计划检修和突发故障",
                    "unplanned_ratio": "突发故障时长/总停机时长",
                    "mttr": "平均修复时间，从报修到完成的平均分钟数",
                    "availability": "设备可用率，按计划运行时间计算"
                }
            }
        })
    
    @server.route('/api/trend/daily', methods=['GET', 'POST'])
    def trend_daily():
        if request.method == 'POST':
            params = request.get_json() or {}
        else:
            params = request.args.to_dict()
        
        filters = _build_filters_from_params(params)
        trend_df = get_trend_data(filters)
        
        data = []
        if not trend_df.empty:
            trend_df['date'] = trend_df['date'].astype(str)
            data = trend_df.to_dict('records')
        
        return jsonify({
            "data": data,
            "metadata": {
                "filters": _sanitize_filters(filters),
                "granularity": "daily",
                "breakdown_separated": True
            }
        })
    
    @server.route('/api/pareto/fault-types', methods=['GET', 'POST'])
    def pareto_fault_types():
        if request.method == 'POST':
            params = request.get_json() or {}
        else:
            params = request.args.to_dict()
        
        filters = _build_filters_from_params(params)
        pareto_data = get_pareto_analysis(filters)
        
        return jsonify({
            "data": pareto_data,
            "metadata": {
                "filters": _sanitize_filters(filters),
                "pareto_threshold": 80,
                "caliber_note": "累计占比80%以内的故障类型为关键改善项"
            }
        })
    
    @server.route('/api/lines/comparison', methods=['GET', 'POST'])
    def lines_comparison():
        if request.method == 'POST':
            params = request.get_json() or {}
        else:
            params = request.args.to_dict()
        
        filters = _build_filters_from_params(params)
        line_data = get_line_comparison(filters)
        
        return jsonify({
            "data": line_data,
            "metadata": {
                "filters": _sanitize_filters(filters),
                "breakdown_separated": True
            }
        })
    
    @server.route('/api/maintenance/efficiency', methods=['GET', 'POST'])
    def maintenance_efficiency():
        if request.method == 'POST':
            params = request.get_json() or {}
        else:
            params = request.args.to_dict()
        
        filters = _build_filters_from_params(params)
        eff_data = get_maintenance_efficiency(filters)
        
        return jsonify({
            "data": eff_data,
            "metadata": {
                "filters": _sanitize_filters(filters),
                "mttr_unit": "minutes",
                "mtbf_unit": "hours"
            }
        })
    
    @server.route('/api/spare-parts/correlation', methods=['GET', 'POST'])
    def spare_parts_correlation():
        if request.method == 'POST':
            params = request.get_json() or {}
        else:
            params = request.args.to_dict()
        
        filters = _build_filters_from_params(params)
        corr_data = get_spare_part_correlation(filters)
        
        return jsonify({
            "data": corr_data,
            "metadata": {
                "filters": _sanitize_filters(filters),
                "correlation_method": "lift + support + confidence"
            }
        })
    
    @server.route('/api/export/report', methods=['POST'])
    def export_report():
        params = request.get_json() or {}
        filters = _build_filters_from_params(params)
        
        from components.export import generate_excel_report
        from services.aggregation import (
            get_kpi_summary, get_pareto_analysis, get_line_comparison,
            get_maintenance_efficiency, get_spare_part_correlation
        )
        
        kpi_data = get_kpi_summary(filters)
        pareto_data = get_pareto_analysis(filters)
        line_data = get_line_comparison(filters)
        eff_data = get_maintenance_efficiency(filters)
        corr_data = get_spare_part_correlation(filters)
        
        excel_data = generate_excel_report(
            _sanitize_filters(filters),
            kpi_data,
            pareto_data,
            line_data,
            eff_data,
            corr_data,
        )
        
        return {
            "filename": f"设备停机分析报告_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx",
            "filters_used": _sanitize_filters(filters),
            "data": excel_data
        }


def _build_filters_from_params(params):
    filters = {}
    
    if params.get('start_date'):
        filters['start_date'] = params['start_date']
    if params.get('end_date'):
        filters['end_date'] = params['end_date']
    
    for param_name, key in [
        ('line_ids', 'line_ids'),
        ('equipment_ids', 'equipment_ids'),
        ('shift_ids', 'shift_ids'),
        ('fault_codes', 'fault_codes'),
        ('repair_persons', 'repair_persons'),
        ('part_names', 'part_names'),
    ]:
        value = params.get(param_name)
        if value:
            if isinstance(value, str):
                if ',' in value:
                    items = [v.strip() for v in value.split(',')]
                else:
                    try:
                        items = json.loads(value)
                        if not isinstance(items, list):
                            items = [items]
                    except (json.JSONDecodeError, TypeError):
                        items = [value]
            elif isinstance(value, list):
                items = value
            else:
                items = [value]
            
            if key in ['line_ids', 'equipment_ids', 'shift_ids']:
                try:
                    items = [int(item) if str(item).isdigit() else item for item in items]
                except (ValueError, TypeError):
                    pass
            
            filters[key] = items
    
    if params.get('breakdown_type'):
        filters['breakdown_type'] = params['breakdown_type']
    
    return filters


def _sanitize_filters(filters):
    clean = {}
    for key, value in filters.items():
        if value is not None:
            clean[key] = value
    return clean
