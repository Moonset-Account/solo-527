import os
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ETLStatusService:
    TABLE_NAMES = [
        "vehicles", "routes", "batches", "temperature_boxes",
        "temperature_readings", "door_events", "exceptions",
        "probe_calibrations", "customers", "deliveries",
    ]

    def __init__(self, config, clickhouse_models):
        self.config = config
        self.models = clickhouse_models

    def get_last_run(self, etl_name):
        status_list = self.models.get_etl_status()
        for s in status_list:
            if s.get("etl_name") == etl_name:
                return s
        return None

    def get_all_status(self):
        return self.models.get_etl_status()

    def get_data_freshness(self):
        mock_dir = self.config.MOCK_DATA_DIR
        freshness = {}
        for table in self.TABLE_NAMES:
            filepath = os.path.join(mock_dir, f"{table}.json")
            if os.path.exists(filepath):
                mtime = os.path.getmtime(filepath)
                freshness[table] = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")
            else:
                freshness[table] = None
        return freshness
