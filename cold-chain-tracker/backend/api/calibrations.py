from datetime import datetime

from flask import Blueprint, request

from services.query import QueryService

calibrations_bp = Blueprint("calibrations", __name__)

query_service: QueryService = None


def init_calibration_routes(qs: QueryService):
    global query_service
    query_service = qs


@calibrations_bp.route("/api/calibrations", methods=["GET"])
def get_calibrations():
    filters = {}
    status = request.args.get("status")
    probe_id = request.args.get("probe_id")
    box_id = request.args.get("box_id")
    if status:
        filters["status"] = status
    if probe_id:
        filters["probe_id"] = probe_id
    if box_id:
        filters["box_id"] = box_id
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", request.args.get("per_page", 50)))
    result = query_service.get_calibrations(filters=filters or None, page=page, page_size=page_size)
    return {
        "code": 200,
        "data": result["data"],
        "meta": {"total": result["total"], "page": result["page"], "page_size": result["page_size"]},
        "updated_at": datetime.now().isoformat(),
    }
