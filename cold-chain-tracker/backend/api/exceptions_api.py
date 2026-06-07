from datetime import datetime

from flask import Blueprint, request

from services.query import QueryService

exceptions_bp = Blueprint("exceptions", __name__)

query_service: QueryService = None


def init_exception_routes(qs: QueryService):
    global query_service
    query_service = qs


@exceptions_bp.route("/api/exceptions", methods=["GET"])
def get_exceptions():
    filters = {}
    exception_type = request.args.get("exception_type")
    severity = request.args.get("severity")
    vehicle_id = request.args.get("vehicle_id")
    date_start = request.args.get("date_start")
    date_end = request.args.get("date_end")
    if exception_type:
        filters["exception_type"] = exception_type
    if severity:
        filters["severity"] = severity
    if vehicle_id:
        filters["vehicle_id"] = vehicle_id
    if date_start:
        filters["date_start"] = date_start
    if date_end:
        filters["date_end"] = date_end
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", request.args.get("per_page", 50)))
    result = query_service.get_exceptions(filters=filters or None, page=page, page_size=page_size)
    return {
        "code": 200,
        "data": result["data"],
        "meta": {"total": result["total"], "page": result["page"], "page_size": result["page_size"]},
        "updated_at": datetime.now().isoformat(),
    }


@exceptions_bp.route("/api/exceptions/duration", methods=["GET"])
def get_exception_duration():
    filters = {}
    exception_type = request.args.get("exception_type")
    severity = request.args.get("severity")
    vehicle_id = request.args.get("vehicle_id")
    date_start = request.args.get("date_start")
    date_end = request.args.get("date_end")
    if exception_type:
        filters["exception_type"] = exception_type
    if severity:
        filters["severity"] = severity
    if vehicle_id:
        filters["vehicle_id"] = vehicle_id
    if date_start:
        filters["date_start"] = date_start
    if date_end:
        filters["date_end"] = date_end
    result = query_service.get_exception_duration(filters=filters or None)
    return {
        "code": 200,
        "data": result,
        "meta": {"total": len(result), "page": 1, "page_size": len(result)},
        "updated_at": datetime.now().isoformat(),
    }

@exceptions_bp.route("/api/exceptions/responsibility", methods=["GET"])
def get_exception_responsibility():
    route_id = request.args.get("route_id")
    result = query_service.get_responsibility_segments(route_id=route_id)
    return {
        "code": 200,
        "data": result,
        "meta": {"total": len(result), "page": 1, "page_size": len(result)},
        "updated_at": datetime.now().isoformat(),
    }


@exceptions_bp.route("/api/exceptions/<exception_id>", methods=["GET"])
def get_exception_detail(exception_id):
    result = query_service.get_exception_detail(exception_id)
    if result is None:
        return {"code": 404, "data": None, "meta": {}, "updated_at": datetime.now().isoformat()}, 404
    return {
        "code": 200,
        "data": result,
        "meta": {"total": 1, "page": 1, "page_size": 1},
        "updated_at": datetime.now().isoformat(),
    }
