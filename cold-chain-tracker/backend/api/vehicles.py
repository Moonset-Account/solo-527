from datetime import datetime

from flask import Blueprint, request

from services.query import QueryService
from api.filter_helpers import parse_common_filters

vehicles_bp = Blueprint("vehicles", __name__)

query_service: QueryService = None


def init_vehicle_routes(qs: QueryService):
    global query_service
    query_service = qs


@vehicles_bp.route("/api/vehicles", methods=["GET"])
def get_vehicles():
    filters = parse_common_filters()
    status = request.args.get("status")
    vehicle_type = request.args.get("vehicle_type")
    if status:
        filters["status"] = status
    if vehicle_type:
        filters["vehicle_type"] = vehicle_type
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", request.args.get("per_page", 50)))
    result = query_service.get_vehicles(filters=filters or None, page=page, page_size=page_size)
    return {
        "code": 200,
        "data": result["data"],
        "meta": {"total": result["total"], "page": result["page"], "page_size": result["page_size"]},
        "updated_at": datetime.now().isoformat(),
    }


@vehicles_bp.route("/api/vehicles/<vehicle_id>", methods=["GET"])
def get_vehicle_detail(vehicle_id):
    result = query_service.get_vehicle_detail(vehicle_id)
    if result is None:
        return {"code": 404, "data": None, "meta": {}, "updated_at": datetime.now().isoformat()}, 404
    return {
        "code": 200,
        "data": result,
        "meta": {"total": 1, "page": 1, "page_size": 1},
        "updated_at": datetime.now().isoformat(),
    }
