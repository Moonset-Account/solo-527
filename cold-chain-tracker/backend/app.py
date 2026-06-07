import logging
from datetime import datetime

from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from models.clickhouse_models import ClickHouseModels
from services.cache import RedisCacheService
from services.query import QueryService
from services.etl_status import ETLStatusService

from api.dashboard import dashboard_bp, init_dashboard_routes
from api.vehicles import vehicles_bp, init_vehicle_routes
from api.routes_api import routes_bp, init_route_routes
from api.batches import batches_bp, init_batch_routes
from api.exceptions_api import exceptions_bp, init_exception_routes
from api.calibrations import calibrations_bp, init_calibration_routes
from api.temperature import temperature_bp, init_temperature_routes
from api.export_api import export_bp, init_export_routes
from api.etl_status_api import etl_status_bp, init_etl_status_routes
from api.customers_api import customers_bp, init_customer_routes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def create_app(config=None):
    app = Flask(__name__)
    config = config or Config()
    app.config.from_object(config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    clickhouse_models = ClickHouseModels(config)
    cache_service = RedisCacheService(config)
    query_service = QueryService(clickhouse_models, cache_service)
    etl_service = ETLStatusService(config, clickhouse_models)

    init_dashboard_routes(query_service)
    init_vehicle_routes(query_service)
    init_route_routes(query_service)
    init_batch_routes(query_service)
    init_exception_routes(query_service)
    init_calibration_routes(query_service)
    init_temperature_routes(query_service)
    init_export_routes(query_service)
    init_etl_status_routes(etl_service)
    init_customer_routes(query_service)

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(vehicles_bp)
    app.register_blueprint(routes_bp)
    app.register_blueprint(batches_bp)
    app.register_blueprint(exceptions_bp)
    app.register_blueprint(calibrations_bp)
    app.register_blueprint(temperature_bp)
    app.register_blueprint(export_bp)
    app.register_blueprint(etl_status_bp)
    app.register_blueprint(customers_bp)

    @app.route("/health", methods=["GET"])
    def health_check():
        return {
            "code": 200,
            "data": {
                "status": "healthy",
                "clickhouse": clickhouse_models.client is not None,
                "redis": cache_service._redis_client is not None,
                "mock_data_loaded": bool(clickhouse_models._mock_data),
            },
            "meta": {},
            "updated_at": datetime.now().isoformat(),
        }

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            "code": 404,
            "data": {"error": "资源未找到"},
            "meta": {},
            "updated_at": datetime.now().isoformat(),
        }), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({
            "code": 500,
            "data": {"error": "服务器内部错误"},
            "meta": {},
            "updated_at": datetime.now().isoformat(),
        }), 500

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({
            "code": 400,
            "data": {"error": "请求参数错误"},
            "meta": {},
            "updated_at": datetime.now().isoformat(),
        }), 400

    logger.info("Flask 应用创建完成")
    return app


if __name__ == "__main__":
    config = Config()
    app = create_app(config)
    app.run(host=config.FLASK_HOST, port=config.FLASK_PORT, debug=config.DEBUG)
