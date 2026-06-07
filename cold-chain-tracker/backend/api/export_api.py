import io
import csv
from datetime import datetime

from flask import Blueprint, request, send_file

from services.query import QueryService

export_bp = Blueprint("export", __name__)

query_service: QueryService = None


def init_export_routes(qs: QueryService):
    global query_service
    query_service = qs


_EXPORT_METHODS = {
    "overview": lambda qs, f: qs.get_overview_stats(),
    "vehicles": lambda qs, f: qs.get_vehicles(filters=f, page=1, page_size=9999),
    "routes": lambda qs, f: qs.get_routes(filters=f, page=1, page_size=9999),
    "batches": lambda qs, f: qs.get_batches(filters=f, page=1, page_size=9999),
    "exceptions": lambda qs, f: qs.get_exceptions(filters=f, page=1, page_size=9999),
    "calibrations": lambda qs, f: qs.get_calibrations(filters=f, page=1, page_size=9999),
    "temperature_curve": lambda qs, f: qs.get_temperature_curve(filters=f, page=1, page_size=9999),
    "trends": lambda qs, f: qs.get_trend_data(),
}


def _flatten_for_csv(data):
    if isinstance(data, dict):
        if "data" in data and isinstance(data["data"], list):
            return data["data"]
        return [data]
    if isinstance(data, list):
        return data
    return [data]


@export_bp.route("/api/export", methods=["POST"])
def export_data():
    body = request.get_json(silent=True) or {}
    export_format = body.get("format", "csv").lower()
    data_type = body.get("data_type", "overview")
    filters = body.get("filters")

    if data_type not in _EXPORT_METHODS:
        return {
            "code": 400,
            "data": {"error": f"不支持的数据类型: {data_type}，可选: {list(_EXPORT_METHODS.keys())}"},
            "meta": {},
            "updated_at": datetime.now().isoformat(),
        }, 400

    result = _EXPORT_METHODS[data_type](query_service, filters)

    if export_format == "csv":
        rows = _flatten_for_csv(result)
        if not rows:
            return {
                "code": 200,
                "data": {"message": "无数据可导出"},
                "meta": {},
                "updated_at": datetime.now().isoformat(),
            }
        output = io.StringIO()
        if isinstance(rows[0], dict):
            writer = csv.DictWriter(output, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)
        mem = io.BytesIO()
        mem.write(output.getvalue().encode("utf-8-sig"))
        mem.seek(0)
        filename = f"{data_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return send_file(mem, mimetype="text/csv", as_attachment=True, download_name=filename)

    if export_format == "pdf":
        try:
            rows = _flatten_for_csv(result)
            output = io.StringIO()
            if rows and isinstance(rows[0], dict):
                writer = csv.DictWriter(output, fieldnames=rows[0].keys())
                writer.writeheader()
                writer.writerows(rows)
            pdf_content = (
                "Cold Chain Report\n"
                f"Data Type: {data_type}\n"
                f"Generated: {datetime.now().isoformat()}\n"
                f"Total Records: {len(rows)}\n\n"
                f"Data Preview (CSV):\n{output.getvalue()[:5000]}\n"
            )
            mem = io.BytesIO()
            mem.write(pdf_content.encode("utf-8"))
            mem.seek(0)
            filename = f"{data_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            return send_file(mem, mimetype="text/plain", as_attachment=True, download_name=filename)
        except Exception as e:
            return {
                "code": 500,
                "data": {"error": f"PDF 生成失败: {str(e)}"},
                "meta": {},
                "updated_at": datetime.now().isoformat(),
            }, 500

    if export_format == "png":
        return {
            "code": 400,
            "data": {"error": "PNG 导出需要前端图表库支持，请在前端导出"},
            "meta": {},
            "updated_at": datetime.now().isoformat(),
        }, 400

    return {
        "code": 400,
        "data": {"error": f"不支持的导出格式: {export_format}，可选: csv, pdf, png"},
        "meta": {},
        "updated_at": datetime.now().isoformat(),
    }, 400
