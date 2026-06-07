import json
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ClickHouseModels:
    def __init__(self, config):
        self.config = config
        self.client = None
        self._mock_data = {}
        self._init_clickhouse()
        self._load_mock_data()

    def _init_clickhouse(self):
        try:
            from clickhouse_driver import Client
            self.client = Client(
                host=self.config.CLICKHOUSE_HOST,
                port=self.config.CLICKHOUSE_PORT,
                user=self.config.CLICKHOUSE_USER,
                password=self.config.CLICKHOUSE_PASSWORD,
                database=self.config.CLICKHOUSE_DB,
            )
            self.client.execute("SELECT 1")
            logger.info("ClickHouse 连接成功")
        except Exception as e:
            logger.warning(f"ClickHouse 不可用，使用 JSON 模拟数据: {e}")
            self.client = None

    def _load_mock_data(self):
        mock_dir = self.config.MOCK_DATA_DIR
        if not os.path.exists(mock_dir):
            logger.warning(f"模拟数据目录不存在: {mock_dir}")
            return
        table_files = [
            "vehicles", "routes", "batches", "temperature_boxes",
            "temperature_readings", "door_events", "exceptions",
            "probe_calibrations", "customers", "deliveries", "etl_status",
        ]
        for table in table_files:
            filepath = os.path.join(mock_dir, f"{table}.json")
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    self._mock_data[table] = json.load(f)
                logger.info(f"已加载模拟数据: {table} ({len(self._mock_data[table])} 条)")
            else:
                self._mock_data[table] = []
                logger.warning(f"模拟数据文件不存在: {filepath}")

    def execute_query(self, sql, params=None):
        if self.client is None:
            logger.debug(f"ClickHouse 不可用，无法执行: {sql}")
            return []
        try:
            result = self.client.execute(sql, params or {})
            return result
        except Exception as e:
            logger.error(f"查询执行失败: {e}")
            return []

    def _paginated(self, data, page=1, page_size=50):
        total = len(data)
        start = (page - 1) * page_size
        end = start + page_size
        return data[start:end], total

    def _filter_by_date_range(self, data, date_range, field="started_at"):
        if not date_range:
            return data
        start, end = date_range
        filtered = []
        for row in data:
            val = row.get(field, "")
            if val and start <= val <= end:
                filtered.append(row)
        return filtered

    def get_overview_stats(self, date_range=None):
        if self.client:
            try:
                stats = {}
                result = self.client.execute("SELECT count() FROM vehicles")
                stats["total_vehicles"] = result[0][0]
                result = self.client.execute("SELECT count() FROM routes WHERE status = '运输中'")
                stats["active_routes"] = result[0][0]
                result = self.client.execute("SELECT count() FROM exceptions WHERE resolution IS NULL OR resolution = '待处理'")
                stats["pending_exceptions"] = result[0][0]
                result = self.client.execute(
                    "SELECT count(), countIf(temperature >= required_temp_min AND temperature <= required_temp_max) "
                    "FROM temperature_boxes tb JOIN batches b ON tb.batch_id = b.batch_id"
                )
                if result:
                    total, compliant = result[0]
                    stats["temp_compliance_rate"] = round(compliant / max(total, 1) * 100, 1)
                else:
                    stats["temp_compliance_rate"] = 0.0
                stats["total_routes"] = self.client.execute("SELECT count() FROM routes")[0][0]
                stats["total_exceptions"] = self.client.execute("SELECT count() FROM exceptions")[0][0]
                return stats
            except Exception:
                pass

        vehicles = self._mock_data.get("vehicles", [])
        routes = self._mock_data.get("routes", [])
        exceptions = self._mock_data.get("exceptions", [])
        boxes = self._mock_data.get("temperature_boxes", [])
        batches_data = {b["batch_id"]: b for b in self._mock_data.get("batches", [])}

        active_routes = [r for r in routes if r["status"] == "运输中"]
        pending_exc = [e for e in exceptions if not e.get("resolution") or e.get("resolution") == "待处理"]
        compliant = 0
        for box in boxes:
            batch = batches_data.get(box["batch_id"])
            if batch and batch["required_temp_min"] <= box["current_temp"] <= batch["required_temp_max"]:
                compliant += 1

        return {
            "total_vehicles": len(vehicles),
            "active_routes": len(active_routes),
            "pending_exceptions": len(pending_exc),
            "temp_compliance_rate": round(compliant / max(len(boxes), 1) * 100, 1),
            "total_routes": len(routes),
            "total_exceptions": len(exceptions),
        }

    def get_trend_data(self, granularity="day", date_range=None, filters=None):
        readings = self._mock_data.get("temperature_readings", [])
        if date_range:
            readings = self._filter_by_date_range(readings, date_range, "recorded_at")

        grouped = {}
        for r in readings:
            dt = r["recorded_at"][:10] if granularity == "day" else r["recorded_at"][:7]
            if dt not in grouped:
                grouped[dt] = {"temps": [], "count": 0}
            grouped[dt]["temps"].append(r["temperature"])
            grouped[dt]["count"] += 1

        result = []
        for key in sorted(grouped.keys()):
            temps = grouped[key]["temps"]
            result.append({
                "period": key,
                "avg_temp": round(sum(temps) / len(temps), 2),
                "min_temp": round(min(temps), 2),
                "max_temp": round(max(temps), 2),
                "reading_count": len(temps),
            })
        return result

    def get_vehicles(self, filters=None, page=1, page_size=50):
        data = self._mock_data.get("vehicles", [])
        if filters:
            if filters.get("status"):
                data = [v for v in data if v["status"] == filters["status"]]
            if filters.get("vehicle_type"):
                data = [v for v in data if v["vehicle_type"] == filters["vehicle_type"]]
        paginated, total = self._paginated(data, page, page_size)
        return paginated, total

    def get_vehicle_detail(self, vehicle_id):
        vehicles = self._mock_data.get("vehicles", [])
        vehicle = next((v for v in vehicles if v["vehicle_id"] == vehicle_id), None)
        if not vehicle:
            return None
        routes = [r for r in self._mock_data.get("routes", []) if r["vehicle_id"] == vehicle_id]
        boxes = [b for b in self._mock_data.get("temperature_boxes", []) if b["vehicle_id"] == vehicle_id]
        exc = [e for e in self._mock_data.get("exceptions", []) if e["vehicle_id"] == vehicle_id]
        vehicle["routes"] = routes
        vehicle["boxes"] = boxes
        vehicle["recent_exceptions"] = exc[:10]
        return vehicle

    def get_routes(self, filters=None, page=1, page_size=50):
        data = self._mock_data.get("routes", [])
        if filters:
            if filters.get("status"):
                data = [r for r in data if r["status"] == filters["status"]]
            if filters.get("vehicle_id"):
                data = [r for r in data if r["vehicle_id"] == filters["vehicle_id"]]
            if filters.get("origin"):
                data = [r for r in data if r["origin"] == filters["origin"]]
            if filters.get("destination"):
                data = [r for r in data if r["destination"] == filters["destination"]]
            if filters.get("date_start"):
                data = [r for r in data if r["planned_departure"] >= filters["date_start"]]
            if filters.get("date_end"):
                data = [r for r in data if r["planned_departure"] <= filters["date_end"]]
        paginated, total = self._paginated(data, page, page_size)
        return paginated, total

    def get_route_detail(self, route_id):
        routes = self._mock_data.get("routes", [])
        route = next((r for r in routes if r["route_id"] == route_id), None)
        if not route:
            return None
        batches = [b for b in self._mock_data.get("batches", []) if b["route_id"] == route_id]
        deliveries = [d for d in self._mock_data.get("deliveries", []) if d["route_id"] == route_id]
        exceptions = [e for e in self._mock_data.get("exceptions", []) if e["route_id"] == route_id]
        route["batches"] = batches
        route["deliveries"] = deliveries
        route["exceptions"] = exceptions
        return route

    def get_route_playback(self, route_id):
        route = self.get_route_detail(route_id)
        if not route:
            return None
        vehicle_id = route["vehicle_id"]
        door_events = [
            e for e in self._mock_data.get("door_events", [])
            if e["vehicle_id"] == vehicle_id
        ]
        boxes = [b for b in self._mock_data.get("temperature_boxes", []) if b["vehicle_id"] == vehicle_id]
        box_ids = [b["box_id"] for b in boxes]
        readings = [
            r for r in self._mock_data.get("temperature_readings", [])
            if r["box_id"] in box_ids
        ]
        readings.sort(key=lambda x: x["recorded_at"])
        points = []
        for i, reading in enumerate(readings[:500]):
            event = door_events[i] if i < len(door_events) else None
            point = {
                "timestamp": reading["recorded_at"],
                "temperature": reading["temperature"],
                "box_id": reading["box_id"],
                "probe_id": reading["probe_id"],
                "location_lat": event["location_lat"] if event else round(30.0 + i * 0.01, 6),
                "location_lng": event["location_lng"] if event else round(120.0 + i * 0.01, 6),
                "door_event": event["event_type"] if event else None,
            }
            points.append(point)
        return {"route": route, "playback_points": points}

    def get_batches(self, filters=None, page=1, page_size=50):
        data = self._mock_data.get("batches", [])
        if filters:
            if filters.get("product_name"):
                data = [b for b in data if filters["product_name"] in b["product_name"]]
            if filters.get("route_id"):
                data = [b for b in data if b["route_id"] == filters["route_id"]]
            if filters.get("temp_min"):
                data = [b for b in data if b["required_temp_min"] >= filters["temp_min"]]
            if filters.get("temp_max"):
                data = [b for b in data if b["required_temp_max"] <= filters["temp_max"]]
        paginated, total = self._paginated(data, page, page_size)
        return paginated, total

    def get_batch_detail(self, batch_id):
        batches = self._mock_data.get("batches", [])
        batch = next((b for b in batches if b["batch_id"] == batch_id), None)
        if not batch:
            return None
        boxes = [b for b in self._mock_data.get("temperature_boxes", []) if b["batch_id"] == batch_id]
        box_ids = [b["box_id"] for b in boxes]
        readings = [
            r for r in self._mock_data.get("temperature_readings", [])
            if r["box_id"] in box_ids
        ][:200]
        exceptions = [e for e in self._mock_data.get("exceptions", []) if e["batch_id"] == batch_id]
        deliveries = [d for d in self._mock_data.get("deliveries", []) if d["batch_id"] == batch_id]
        batch["boxes"] = boxes
        batch["recent_readings"] = readings
        batch["exceptions"] = exceptions
        batch["deliveries"] = deliveries
        return batch

    def get_exceptions(self, filters=None, page=1, page_size=50):
        data = self._mock_data.get("exceptions", [])
        if filters:
            if filters.get("exception_type"):
                data = [e for e in data if e["exception_type"] == filters["exception_type"]]
            if filters.get("severity"):
                data = [e for e in data if e["severity"] == filters["severity"]]
            if filters.get("vehicle_id"):
                data = [e for e in data if e["vehicle_id"] == filters["vehicle_id"]]
            if filters.get("date_start"):
                data = [e for e in data if e["started_at"] >= filters["date_start"]]
            if filters.get("date_end"):
                data = [e for e in data if e["started_at"] <= filters["date_end"]]
        data.sort(key=lambda x: x["started_at"], reverse=True)
        paginated, total = self._paginated(data, page, page_size)
        return paginated, total

    def get_exception_detail(self, exception_id):
        exceptions = self._mock_data.get("exceptions", [])
        exc = next((e for e in exceptions if e["exception_id"] == exception_id), None)
        if not exc:
            return None
        original_ids = []
        try:
            original_ids = json.loads(exc.get("original_record_ids", "[]"))
        except (json.JSONDecodeError, TypeError):
            pass
        linked_readings = [
            r for r in self._mock_data.get("temperature_readings", [])
            if r["reading_id"] in original_ids
        ]
        linked_door_events = [
            d for d in self._mock_data.get("door_events", [])
            if d["event_id"] in original_ids
        ]
        exc["linked_temperature_readings"] = linked_readings
        exc["linked_door_events"] = linked_door_events
        return exc

    def get_calibrations(self, filters=None, page=1, page_size=50):
        data = self._mock_data.get("probe_calibrations", [])
        if filters:
            if filters.get("status"):
                data = [c for c in data if c["status"] == filters["status"]]
            if filters.get("probe_id"):
                data = [c for c in data if c["probe_id"] == filters["probe_id"]]
            if filters.get("box_id"):
                data = [c for c in data if c["box_id"] == filters["box_id"]]
        paginated, total = self._paginated(data, page, page_size)
        return paginated, total

    def get_temperature_curve(self, filters=None, page=1, page_size=200):
        data = self._mock_data.get("temperature_readings", [])
        if filters:
            if filters.get("vehicle_id"):
                boxes = self._mock_data.get("temperature_boxes", [])
                vehicle_box_ids = {b["box_id"] for b in boxes if b.get("vehicle_id") == filters["vehicle_id"]}
                data = [r for r in data if r["box_id"] in vehicle_box_ids]
            if filters.get("batch_id"):
                boxes = self._mock_data.get("temperature_boxes", [])
                batch_box_ids = {b["box_id"] for b in boxes if b.get("batch_id") == filters["batch_id"]}
                data = [r for r in data if r["box_id"] in batch_box_ids]
            if filters.get("route_id"):
                boxes = self._mock_data.get("temperature_boxes", [])
                batches_data = {b["batch_id"]: b for b in self._mock_data.get("batches", [])}
                route_box_ids = set()
                for box in boxes:
                    batch = batches_data.get(box.get("batch_id"))
                    if batch and batch.get("route_id") == filters["route_id"]:
                        route_box_ids.add(box["box_id"])
                data = [r for r in data if r["box_id"] in route_box_ids]
            if filters.get("box_id"):
                data = [r for r in data if r["box_id"] == filters["box_id"]]
            if filters.get("probe_id"):
                data = [r for r in data if r["probe_id"] == filters["probe_id"]]
            if filters.get("date_start"):
                data = [r for r in data if r["recorded_at"] >= filters["date_start"]]
            if filters.get("date_end"):
                data = [r for r in data if r["recorded_at"] <= filters["date_end"]]
        data.sort(key=lambda x: x["recorded_at"])
        paginated, total = self._paginated(data, page, page_size)
        return paginated, total

    def get_exception_duration(self, filters=None):
        exceptions = self._filter_by_date_range(
            self._mock_data.get("exceptions", []),
            (filters.get("date_start"), filters.get("date_end")) if filters and filters.get("date_start") else None
        )
        if filters:
            if filters.get("exception_type"):
                exceptions = [e for e in exceptions if e["exception_type"] == filters["exception_type"]]
            if filters.get("severity"):
                exceptions = [e for e in exceptions if e["severity"] == filters["severity"]]
            if filters.get("vehicle_id"):
                exceptions = [e for e in exceptions if e["vehicle_id"] == filters["vehicle_id"]]

        duration_by_type = {}
        for exc in exceptions:
            etype = exc["exception_type"]
            if etype not in duration_by_type:
                duration_by_type[etype] = {"exception_type": etype, "total_duration": 0, "count": 0, "severity_breakdown": {}}
            duration_by_type[etype]["total_duration"] += exc.get("duration_minutes", 0)
            duration_by_type[etype]["count"] += 1
            sev = exc.get("severity", "low")
            duration_by_type[etype]["severity_breakdown"][sev] = duration_by_type[etype]["severity_breakdown"].get(sev, 0) + exc.get("duration_minutes", 0)
            duration_by_type[etype]["vehicle_id"] = exc.get("vehicle_id")
            duration_by_type[etype]["vehicle_plate"] = exc.get("vehicle_id")
        return list(duration_by_type.values())

    def get_route_door_events(self, route_id):
        route = self.get_route_detail(route_id)
        if not route:
            return []
        vehicle_id = route["vehicle_id"]
        events = [e for e in self._mock_data.get("door_events", []) if e["vehicle_id"] == vehicle_id]
        for e in events:
            e["timestamp"] = e.get("occurred_at", "")
            e["door_open_time"] = e.get("occurred_at", "")
            e["door_duration"] = e.get("duration_seconds", 0)
            e["latitude"] = e.get("location_lat", 0)
            e["longitude"] = e.get("location_lng", 0)
        return events

    def get_responsibility_segments(self, route_id=None):
        exceptions = self._mock_data.get("exceptions", [])
        if route_id:
            exceptions = [e for e in exceptions if e["route_id"] == route_id]

        import random
        segments = []
        for exc in exceptions[:20]:
            start = exc.get("started_at", "")
            end = exc.get("ended_at", "")
            seg_types = ["driver", "warehouse", "transfer"]
            chosen = random.choice(seg_types)
            seg_data = {"start_time": start, "end_time": end}
            segments.append({
                "exception_id": exc["exception_id"],
                "id": exc["exception_id"],
                "start_time": start,
                "end_time": end,
                "segments": {chosen: seg_data}
            })
        return segments

    def get_etl_status(self):
        return self._mock_data.get("etl_status", [])
