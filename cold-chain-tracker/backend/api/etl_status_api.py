from datetime import datetime

from flask import Blueprint

from services.etl_status import ETLStatusService

etl_status_bp = Blueprint("etl_status", __name__)

etl_service: ETLStatusService = None


def init_etl_status_routes(es: ETLStatusService):
    global etl_service
    etl_service = es


@etl_status_bp.route("/api/etl/status", methods=["GET"])
def get_etl_status():
    all_status = etl_service.get_all_status()
    freshness = etl_service.get_data_freshness()
    return {
        "code": 200,
        "data": {
            "etl_runs": all_status,
            "data_freshness": freshness,
        },
        "meta": {"total": len(all_status), "page": 1, "page_size": 50},
        "updated_at": datetime.now().isoformat(),
    }
