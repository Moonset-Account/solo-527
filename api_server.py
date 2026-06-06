from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import json
from datetime import datetime
from io import BytesIO

from config import Config
from database import init_db
from data_service import DataService
from report_exporter import ReportExporter

app = Flask(__name__)
CORS(app)

init_db()
data_service = DataService()
report_exporter = ReportExporter(data_service)


def parse_filters_from_request():
    filters = {}
    data = request.get_json(silent=True) or {}

    if data.get("positions"):
        filters["positions"] = data["positions"]
    if data.get("departments"):
        filters["departments"] = data["departments"]
    if data.get("recruiters"):
        filters["recruiters"] = data["recruiters"]
    if data.get("channels"):
        filters["channels"] = data["channels"]
    if data.get("stages"):
        filters["stages"] = data["stages"]
    if data.get("date_range"):
        filters["date_range"] = tuple(data["date_range"])

    return filters


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "database_mode": Config.DATABASE_MODE})


@app.route("/api/dimensions", methods=["GET"])
def get_dimensions():
    dims = data_service.get_dimension_options()
    return jsonify(dims)


@app.route("/api/funnel", methods=["POST"])
def get_funnel():
    filters = parse_filters_from_request()
    group_by = request.get_json(silent=True).get("group_by") if request.get_json(silent=True) else None
    df = data_service.get_funnel_data(filters, group_by)
    return jsonify(df.to_dict(orient="records"))


@app.route("/api/stage-duration", methods=["POST"])
def get_stage_duration():
    filters = parse_filters_from_request()
    group_by = request.get_json(silent=True).get("group_by") if request.get_json(silent=True) else None
    df = data_service.get_stage_duration_data(filters, group_by)
    return jsonify(df.to_dict(orient="records"))


@app.route("/api/channel-quality", methods=["POST"])
def get_channel_quality():
    filters = parse_filters_from_request()
    df = data_service.get_channel_quality_data(filters)
    return jsonify(df.to_dict(orient="records"))


@app.route("/api/interviewer-workload", methods=["POST"])
def get_interviewer_workload():
    filters = parse_filters_from_request()
    df = data_service.get_interviewer_workload(filters)
    return jsonify(df.to_dict(orient="records"))


@app.route("/api/feedback", methods=["POST"])
def get_feedback():
    filters = parse_filters_from_request()
    group_by = request.get_json(silent=True).get("group_by") if request.get_json(silent=True) else None
    df = data_service.get_feedback_data(filters, group_by)
    return jsonify(df.to_dict(orient="records"))


@app.route("/api/summary", methods=["POST"])
def get_summary():
    filters = parse_filters_from_request()
    stats = data_service.get_summary_stats(filters)
    return jsonify(stats)


@app.route("/api/monthly-trend", methods=["POST"])
def get_monthly_trend():
    filters = parse_filters_from_request()
    df = data_service.get_monthly_trend_data(filters)
    return jsonify(df.to_dict(orient="records"))


@app.route("/api/candidates", methods=["POST"])
def get_candidates():
    filters = parse_filters_from_request()
    data = request.get_json(silent=True) or {}
    stage = data.get("stage")
    df = data_service.get_candidate_details(filters, stage)
    return jsonify(df.to_dict(orient="records"))


@app.route("/api/data-quality", methods=["GET"])
def get_data_quality():
    issues = data_service.check_data_quality()
    return jsonify({"issues": issues, "count": len(issues)})


@app.route("/api/filters", methods=["GET"])
def get_saved_filters():
    filters = data_service.get_saved_filters()
    return jsonify(filters)


@app.route("/api/filters", methods=["POST"])
def save_filter():
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    filter_config = data.get("filter_config")
    created_by = data.get("created_by", "user")

    if not name or not filter_config:
        return jsonify({"error": "name and filter_config are required"}), 400

    filter_id = data_service.save_filter(name, json.dumps(filter_config), created_by)
    return jsonify({"id": filter_id, "name": name})


@app.route("/api/filters/<int:filter_id>", methods=["DELETE"])
def delete_filter(filter_id):
    success = data_service.delete_filter(filter_id)
    if success:
        return jsonify({"status": "success"})
    return jsonify({"error": "Filter not found"}), 404


@app.route("/api/export", methods=["POST"])
def export_report():
    filters = parse_filters_from_request()
    excel_data = report_exporter.export_to_excel(filters)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"招聘效率报告_{timestamp}.xlsx"

    return send_file(
        BytesIO(excel_data.getvalue()),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=filename,
    )


if __name__ == "__main__":
    app.run(host=Config.HOST, port=Config.API_PORT, debug=Config.DEBUG)
