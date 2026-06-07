import logging

logger = logging.getLogger(__name__)


class QueryService:
    def __init__(self, clickhouse_models, cache_service):
        self.models = clickhouse_models
        self.cache = cache_service

    def get_overview_stats(self, date_range=None):
        cache_key = self.cache.generate_cache_key("overview", {"date_range": str(date_range)})
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        result = self.models.get_overview_stats(date_range)
        self.cache.set(cache_key, result, ttl=60)
        return result

    def get_trend_data(self, granularity="day", date_range=None, filters=None):
        cache_key = self.cache.generate_cache_key("trends", {
            "granularity": granularity,
            "date_range": str(date_range),
            "filters": str(filters),
        })
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        result = self.models.get_trend_data(granularity, date_range, filters)
        self.cache.set(cache_key, result)
        return result

    def get_vehicles(self, filters=None, page=1, page_size=50):
        cache_key = self.cache.generate_cache_key("vehicles", {
            "filters": str(filters), "page": page, "page_size": page_size,
        })
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        data, total = self.models.get_vehicles(filters, page, page_size)
        result = {"data": data, "total": total, "page": page, "page_size": page_size}
        self.cache.set(cache_key, result)
        return result

    def get_vehicle_detail(self, vehicle_id):
        cache_key = self.cache.generate_cache_key("vehicle_detail", {"vehicle_id": vehicle_id})
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        result = self.models.get_vehicle_detail(vehicle_id)
        self.cache.set(cache_key, result)
        return result

    def get_routes(self, filters=None, page=1, page_size=50):
        cache_key = self.cache.generate_cache_key("routes", {
            "filters": str(filters), "page": page, "page_size": page_size,
        })
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        data, total = self.models.get_routes(filters, page, page_size)
        result = {"data": data, "total": total, "page": page, "page_size": page_size}
        self.cache.set(cache_key, result)
        return result

    def get_route_detail(self, route_id):
        cache_key = self.cache.generate_cache_key("route_detail", {"route_id": route_id})
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        result = self.models.get_route_detail(route_id)
        self.cache.set(cache_key, result)
        return result

    def get_route_playback(self, route_id):
        cache_key = self.cache.generate_cache_key("route_playback", {"route_id": route_id})
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        result = self.models.get_route_playback(route_id)
        self.cache.set(cache_key, result)
        return result

    def get_batches(self, filters=None, page=1, page_size=50):
        cache_key = self.cache.generate_cache_key("batches", {
            "filters": str(filters), "page": page, "page_size": page_size,
        })
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        data, total = self.models.get_batches(filters, page, page_size)
        result = {"data": data, "total": total, "page": page, "page_size": page_size}
        self.cache.set(cache_key, result)
        return result

    def get_batch_detail(self, batch_id):
        cache_key = self.cache.generate_cache_key("batch_detail", {"batch_id": batch_id})
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        result = self.models.get_batch_detail(batch_id)
        self.cache.set(cache_key, result)
        return result

    def get_exceptions(self, filters=None, page=1, page_size=50):
        cache_key = self.cache.generate_cache_key("exceptions", {
            "filters": str(filters), "page": page, "page_size": page_size,
        })
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        data, total = self.models.get_exceptions(filters, page, page_size)
        result = {"data": data, "total": total, "page": page, "page_size": page_size}
        self.cache.set(cache_key, result)
        return result

    def get_exception_detail(self, exception_id):
        cache_key = self.cache.generate_cache_key("exception_detail", {"exception_id": exception_id})
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        result = self.models.get_exception_detail(exception_id)
        self.cache.set(cache_key, result)
        return result

    def get_calibrations(self, filters=None, page=1, page_size=50):
        cache_key = self.cache.generate_cache_key("calibrations", {
            "filters": str(filters), "page": page, "page_size": page_size,
        })
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        data, total = self.models.get_calibrations(filters, page, page_size)
        result = {"data": data, "total": total, "page": page, "page_size": page_size}
        self.cache.set(cache_key, result)
        return result

    def get_temperature_curve(self, filters=None, page=1, page_size=200):
        cache_key = self.cache.generate_cache_key("temperature_curve", {
            "filters": str(filters), "page": page, "page_size": page_size,
        })
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        data, total = self.models.get_temperature_curve(filters, page, page_size)
        result = {"data": data, "total": total, "page": page, "page_size": page_size}
        self.cache.set(cache_key, result)
        return result

    def get_exception_duration(self, filters=None):
        cache_key = self.cache.generate_cache_key("exception_duration", {"filters": str(filters)})
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        result = self.models.get_exception_duration(filters)
        self.cache.set(cache_key, result)
        return result

    def get_route_door_events(self, route_id):
        cache_key = self.cache.generate_cache_key("route_door_events", {"route_id": route_id})
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        result = self.models.get_route_door_events(route_id)
        self.cache.set(cache_key, result)
        return result

    def get_responsibility_segments(self, route_id=None):
        cache_key = self.cache.generate_cache_key("responsibility_segments", {"route_id": route_id})
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        result = self.models.get_responsibility_segments(route_id)
        self.cache.set(cache_key, result)
        return result

    def get_etl_status(self):
        cache_key = self.cache.generate_cache_key("etl_status")
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        result = self.models.get_etl_status()
        self.cache.set(cache_key, result, ttl=30)
        return result

    def get_customers(self, filters=None, page=1, page_size=100):
        cache_key = self.cache.generate_cache_key("customers", {
            "filters": str(filters), "page": page, "page_size": page_size,
        })
        result = self.cache.get(cache_key)
        if result is not None:
            return result
        data, total = self.models.get_customers(filters, page, page_size)
        result = {"data": data, "total": total, "page": page, "page_size": page_size}
        self.cache.set(cache_key, result)
        return result
