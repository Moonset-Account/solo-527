from datetime import datetime

from flask import Blueprint, request

from services.query import QueryService

temperature_bp = Blueprint("temperature", __name__)

query_service: QueryService = None


def init_temperature_routes(qs: QueryService):
    global query_service
    query_service = qs


@temperature_bp.route("/api/temperature-curve", methods=["GET"])
def get_temperature_curve():
    filters = {}
    box_id = request.args.get("box_id")
    probe_id = request.args.get("probe_id")
    date_start = request.args.get("date_start")
    date_end = request.args.get("date_end")
    vehicle_id = request.args.get("vehicle_id")
    route_id = request.args.get("route_id")
    batch_id = request.args.get("batch_id")
    if box_id:
        filters["box_id"] = box_id
    if probe_id:
        filters["probe_id"] = probe_id
    if date_start:
        filters["date_start"] = date_start
    if date_end:
        filters["date_end"] = date_end
    if vehicle_id:
        filters["vehicle_id"] = vehicle_id
    if route_id:
        filters["route_id"] = route_id
    if batch_id:
        filters["batch_id"] = batch_id
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", request.args.get("per_page", 200)))
    result = query_service.get_temperature_curve(filters=filters or None, page=page, page_size=page_size)
    return {
        "code": 200,
        "data": result["data"],
        "meta": {"total": result["total"], "page": result["page"], "page_size": result["page_size"]},
        "updated_at": datetime.now().isoformat(),
    }
