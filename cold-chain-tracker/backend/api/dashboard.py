from datetime import datetime

from flask import Blueprint, request

from services.query import QueryService
from api.filter_helpers import parse_common_filters

dashboard_bp = Blueprint("dashboard", __name__)

query_service: QueryService = None


def init_dashboard_routes(qs: QueryService):
    global query_service
    query_service = qs


@dashboard_bp.route("/api/overview", methods=["GET"])
def get_overview():
    filters = parse_common_filters()
    stats = query_service.get_overview_stats(filters=filters or None)
    return {
        "code": 200,
        "data": stats,
        "meta": {"total": len(stats), "page": 1, "page_size": 1},
        "updated_at": datetime.now().isoformat(),
    }


@dashboard_bp.route("/api/trends", methods=["GET"])
def get_trends():
    filters = parse_common_filters()
    granularity = request.args.get("granularity", "day")
    data = query_service.get_trend_data(granularity=granularity, filters=filters or None)
    return {
        "code": 200,
        "data": data,
        "meta": {"total": len(data), "page": 1, "page_size": len(data)},
        "updated_at": datetime.now().isoformat(),
    }
