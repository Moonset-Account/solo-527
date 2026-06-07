from datetime import datetime

from flask import Blueprint, request

from services.query import QueryService

batches_bp = Blueprint("batches", __name__)

query_service: QueryService = None


def init_batch_routes(qs: QueryService):
    global query_service
    query_service = qs


@batches_bp.route("/api/batches", methods=["GET"])
def get_batches():
    filters = {}
    product_name = request.args.get("product_name")
    route_id = request.args.get("route_id")
    temp_min = request.args.get("temp_min")
    temp_max = request.args.get("temp_max")
    if product_name:
        filters["product_name"] = product_name
    if route_id:
        filters["route_id"] = route_id
    if temp_min:
        filters["temp_min"] = float(temp_min)
    if temp_max:
        filters["temp_max"] = float(temp_max)
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", request.args.get("per_page", 50)))
    result = query_service.get_batches(filters=filters or None, page=page, page_size=page_size)
    return {
        "code": 200,
        "data": result["data"],
        "meta": {"total": result["total"], "page": result["page"], "page_size": result["page_size"]},
        "updated_at": datetime.now().isoformat(),
    }


@batches_bp.route("/api/batches/<batch_id>", methods=["GET"])
def get_batch_detail(batch_id):
    result = query_service.get_batch_detail(batch_id)
    if result is None:
        return {"code": 404, "data": None, "meta": {}, "updated_at": datetime.now().isoformat()}, 404
    return {
        "code": 200,
        "data": result,
        "meta": {"total": 1, "page": 1, "page_size": 1},
        "updated_at": datetime.now().isoformat(),
    }
