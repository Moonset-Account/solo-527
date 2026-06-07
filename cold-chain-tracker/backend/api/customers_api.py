from datetime import datetime

from flask import Blueprint, request

from services.query import QueryService
from api.filter_helpers import parse_common_filters

customers_bp = Blueprint("customers", __name__)

query_service: QueryService = None


def init_customer_routes(qs: QueryService):
    global query_service
    query_service = qs


@customers_bp.route("/api/customers", methods=["GET"])
def get_customers():
    filters = parse_common_filters()
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", request.args.get("per_page", 100)))
    result = query_service.get_customers(filters=filters or None, page=page, page_size=page_size)
    return {
        "code": 200,
        "data": result["data"],
        "meta": {"total": result["total"], "page": result["page"], "page_size": result["page_size"]},
        "updated_at": datetime.now().isoformat(),
    }
