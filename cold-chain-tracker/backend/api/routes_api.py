from datetime import datetime

from flask import Blueprint, request

from services.query import QueryService

routes_bp = Blueprint("routes", __name__)

query_service: QueryService = None


def init_route_routes(qs: QueryService):
    global query_service
    query_service = qs


@routes_bp.route("/api/routes", methods=["GET"])
def get_routes():
    filters = {}
    status = request.args.get("status")
    vehicle_id = request.args.get("vehicle_id")
    origin = request.args.get("origin")
    destination = request.args.get("destination")
    date_start = request.args.get("date_start")
    date_end = request.args.get("date_end")
    if status:
        filters["status"] = status
    if vehicle_id:
        filters["vehicle_id"] = vehicle_id
    if origin:
        filters["origin"] = origin
    if destination:
        filters["destination"] = destination
    if date_start:
        filters["date_start"] = date_start
    if date_end:
        filters["date_end"] = date_end
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", request.args.get("per_page", 50)))
    result = query_service.get_routes(filters=filters or None, page=page, page_size=page_size)
    return {
        "code": 200,
        "data": result["data"],
        "meta": {"total": result["total"], "page": result["page"], "page_size": result["page_size"]},
        "updated_at": datetime.now().isoformat(),
    }


@routes_bp.route("/api/routes/<route_id>", methods=["GET"])
def get_route_detail(route_id):
    result = query_service.get_route_detail(route_id)
    if result is None:
        return {"code": 404, "data": None, "meta": {}, "updated_at": datetime.now().isoformat()}, 404
    return {
        "code": 200,
        "data": result,
        "meta": {"total": 1, "page": 1, "page_size": 1},
        "updated_at": datetime.now().isoformat(),
    }


@routes_bp.route("/api/routes/<route_id>/playback", methods=["GET"])
def get_route_playback(route_id):
    result = query_service.get_route_playback(route_id)
    if result is None:
        return {"code": 404, "data": None, "meta": {}, "updated_at": datetime.now().isoformat()}, 404
    return {
        "code": 200,
        "data": result,
        "meta": {"total": len(result.get("playback_points", [])), "page": 1, "page_size": 500},
        "updated_at": datetime.now().isoformat(),
    }


@routes_bp.route("/api/routes/<route_id>/door-events", methods=["GET"])
def get_route_door_events(route_id):
    result = query_service.get_route_door_events(route_id)
    return {
        "code": 200,
        "data": result,
        "meta": {"total": len(result), "page": 1, "page_size": len(result)},
        "updated_at": datetime.now().isoformat(),
    }

@routes_bp.route("/api/routes/<route_id>/responsibility", methods=["GET"])
def get_route_responsibility(route_id):
    result = query_service.get_responsibility_segments(route_id=route_id)
    return {
        "code": 200,
        "data": result,
        "meta": {"total": len(result), "page": 1, "page_size": len(result)},
        "updated_at": datetime.now().isoformat(),
    }
