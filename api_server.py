from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import json
from datetime import datetime
from io import BytesIO
import traceback

from config import Config
from database import init_db
from data_service import DataService
from report_exporter import ReportExporter

app = Flask(__name__)
CORS(app)

data_service = None
report_exporter = None
init_error = None

try:
    init_db()
    data_service = DataService()
    report_exporter = ReportExporter(data_service)
except Exception as e:
    init_error = str(e)
    print(f"ERROR: Failed to initialize API server: {e}")
    traceback.print_exc()


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


def api_error_response(message, status_code=500):
    return jsonify({
        "error": message,
        "database_mode": Config.DATABASE_MODE,
        "timestamp": datetime.now().isoformat()
    }), status_code


@app.route("/api/health", methods=["GET"])
def health_check():
    response = {
        "status": "ok" if data_service else "error",
        "database_mode": Config.DATABASE_MODE,
        "database_url": Config.DATABASE_URL,
        "timestamp": datetime.now().isoformat(),
    }

    if init_error:
        response["init_error"] = init_error
        response["status"] = "error"

    if data_service:
        try:
            issues = data_service.check_data_quality()
            dim_issues = data_service.get_dimension_issues()
            response["data_quality"] = {
                "issues_count": len(issues),
                "issues": issues,
                "dimension_issues": dim_issues,
            }
        except Exception as e:
            response["data_quality_check_error"] = str(e)

    return jsonify(response), 200 if data_service else 503


@app.route("/api/dimensions", methods=["GET"])
def get_dimensions():
    if not data_service:
        return api_error_response("Data service not initialized", 503)

    try:
        dims = data_service.get_dimension_options()
        issues = data_service.get_dimension_issues()
        return jsonify({
            "dimensions": dims,
            "issues": issues,
        })
    except Exception as e:
        return api_error_response(f"Failed to get dimensions: {str(e)}")


@app.route("/api/funnel", methods=["POST"])
def get_funnel():
    if not data_service:
        return api_error_response("Data service not initialized", 503)

    try:
        filters = parse_filters_from_request()
        data = request.get_json(silent=True) or {}
        group_by = data.get("group_by")
        df = data_service.get_funnel_data(filters, group_by)
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return api_error_response(f"Failed to get funnel data: {str(e)}")


@app.route("/api/stage-duration", methods=["POST"])
def get_stage_duration():
    if not data_service:
        return api_error_response("Data service not initialized", 503)

    try:
        filters = parse_filters_from_request()
        data = request.get_json(silent=True) or {}
        group_by = data.get("group_by")
        df = data_service.get_stage_duration_data(filters, group_by)
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return api_error_response(f"Failed to get stage duration data: {str(e)}")


@app.route("/api/channel-quality", methods=["POST"])
def get_channel_quality():
    if not data_service:
        return api_error_response("Data service not initialized", 503)

    try:
        filters = parse_filters_from_request()
        df = data_service.get_channel_quality_data(filters)
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return api_error_response(f"Failed to get channel quality data: {str(e)}")


@app.route("/api/interviewer-workload", methods=["POST"])
def get_interviewer_workload():
    if not data_service:
        return api_error_response("Data service not initialized", 503)

    try:
        filters = parse_filters_from_request()
        df = data_service.get_interviewer_workload(filters)
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return api_error_response(f"Failed to get interviewer workload data: {str(e)}")


@app.route("/api/feedback", methods=["POST"])
def get_feedback():
    if not data_service:
        return api_error_response("Data service not initialized", 503)

    try:
        filters = parse_filters_from_request()
        data = request.get_json(silent=True) or {}
        group_by = data.get("group_by")
        df = data_service.get_feedback_data(filters, group_by)
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return api_error_response(f"Failed to get feedback data: {str(e)}")


@app.route("/api/summary", methods=["POST"])
def get_summary():
    if not data_service:
        return api_error_response("Data service not initialized", 503)

    try:
        filters = parse_filters_from_request()
        stats = data_service.get_summary_stats(filters)
        return jsonify(stats)
    except Exception as e:
        return api_error_response(f"Failed to get summary stats: {str(e)}")


@app.route("/api/monthly-trend", methods=["POST"])
def get_monthly_trend():
    if not data_service:
        return api_error_response("Data service not initialized", 503)

    try:
        filters = parse_filters_from_request()
        df = data_service.get_monthly_trend_data(filters)
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return api_error_response(f"Failed to get monthly trend data: {str(e)}")


@app.route("/api/candidates", methods=["POST"])
def get_candidates():
    if not data_service:
        return api_error_response("Data service not initialized", 503)

    try:
        filters = parse_filters_from_request()
        data = request.get_json(silent=True) or {}
        stage = data.get("stage")
        df = data_service.get_candidate_details(filters, stage)
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        return api_error_response(f"Failed to get candidate details: {str(e)}")


@app.route("/api/data-quality", methods=["GET"])
def get_data_quality():
    if not data_service:
        return api_error_response("Data service not initialized", 503)

    try:
        issues = data_service.check_data_quality()
        return jsonify({"issues": issues, "count": len(issues)})
    except Exception as e:
        return api_error_response(f"Failed to check data quality: {str(e)}")


@app.route("/api/filters", methods=["GET"])
def get_saved_filters():
    if not data_service:
        return api_error_response("Data service not initialized", 503)

    try:
        filters = data_service.get_saved_filters()
        return jsonify(filters)
    except Exception as e:
        return api_error_response(f"Failed to get saved filters: {str(e)}")


@app.route("/api/filters", methods=["POST"])
def save_filter():
    if not data_service:
        return api_error_response("Data service not initialized", 503)

    try:
        data = request.get_json(silent=True) or {}
        name = data.get("name")
        filter_config = data.get("filter_config")
        created_by = data.get("created_by", "user")

        if not name or not filter_config:
            return jsonify({"error": "name and filter_config are required"}), 400

        filter_id = data_service.save_filter(name, json.dumps(filter_config), created_by)
        return jsonify({"id": filter_id, "name": name})
    except Exception as e:
        return api_error_response(f"Failed to save filter: {str(e)}")


@app.route("/api/filters/<int:filter_id>", methods=["DELETE"])
def delete_filter(filter_id):
    if not data_service:
        return api_error_response("Data service not initialized", 503)

    try:
        success = data_service.delete_filter(filter_id)
        if success:
            return jsonify({"status": "success"})
        return jsonify({"error": "Filter not found"}), 404
    except Exception as e:
        return api_error_response(f"Failed to delete filter: {str(e)}")


@app.route("/api/export", methods=["POST"])
def export_report():
    if not report_exporter:
        return api_error_response("Report service not initialized", 503)

    try:
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
    except Exception as e:
        return api_error_response(f"Failed to export report: {str(e)}")


if __name__ == "__main__":
    app.run(host=Config.HOST, port=Config.API_PORT, debug=Config.DEBUG)
