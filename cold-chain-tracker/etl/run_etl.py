import argparse
import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd
import yaml
from clickhouse_driver import Client

from clean import run_cleaning_pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("run_etl")


def load_config(config_path: str) -> dict:
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    logger.info("Loaded caliber config from %s", config_path)
    return config


def get_clickhouse_client() -> Client:
    host = os.getenv("CLICKHOUSE_HOST", "clickhouse")
    port = int(os.getenv("CLICKHOUSE_PORT", "9000"))
    user = os.getenv("CLICKHOUSE_USER", "default")
    password = os.getenv("CLICKHOUSE_PASSWORD", "")
    database = os.getenv("CLICKHOUSE_DATABASE", "cold_chain")

    client = Client(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        connect_timeout=10,
        send_receive_timeout=300,
    )
    return client


def fetch_source_data(client: Client, date_from: datetime, date_to: datetime) -> dict[str, pd.DataFrame]:
    logger.info("Fetching source data from %s to %s", date_from, date_to)
    data = {}

    temp_query = """
        SELECT box_id, probe_id, recorded_at, temperature
        FROM temperature_readings
        WHERE recorded_at >= %(date_from)s AND recorded_at < %(date_to)s
        ORDER BY box_id, probe_id, recorded_at
    """
    data["temp_readings"] = client.query_dataframe(
        temp_query, params={"date_from": date_from, "date_to": date_to}
    )
    logger.info("Fetched %d temperature readings", len(data["temp_readings"]))

    door_query = """
        SELECT box_id, event_type, recorded_at, latitude, longitude
        FROM door_events
        WHERE recorded_at >= %(date_from)s AND recorded_at < %(date_to)s
        ORDER BY box_id, recorded_at
    """
    data["door_events"] = client.query_dataframe(
        door_query, params={"date_from": date_from, "date_to": date_to}
    )
    logger.info("Fetched %d door events", len(data["door_events"]))

    cal_query = """
        SELECT probe_id, deviation, calibrated_at
        FROM probe_calibrations
        WHERE calibrated_at >= %(cal_from)s
    """
    cal_from = date_from - timedelta(days=90)
    data["calibrations"] = client.query_dataframe(
        cal_query, params={"cal_from": cal_from}
    )
    logger.info("Fetched %d calibration records", len(data["calibrations"]))

    batch_query = """
        SELECT box_id, temp_min, temp_max
        FROM batch_temp_ranges
        WHERE active = 1
    """
    data["batch_ranges"] = client.query_dataframe(batch_query)
    logger.info("Fetched %d batch temp ranges", len(data["batch_ranges"]))

    transit_query = """
        SELECT DISTINCT box_id, status
        FROM shipment_status
        WHERE status = 'in_transit'
    """
    data["transit_status"] = client.query_dataframe(transit_query)
    logger.info("Fetched %d in-transit shipments", len(data["transit_status"]))

    planned_query = """
        SELECT box_id, planned_arrival_at
        FROM shipment_plans
        WHERE planned_arrival_at >= %(date_from)s AND planned_arrival_at < %(date_to)s
    """
    data["planned_arrivals"] = client.query_dataframe(
        planned_query, params={"date_from": date_from, "date_to": date_to}
    )
    logger.info("Fetched %d planned arrivals", len(data["planned_arrivals"]))

    actual_query = """
        SELECT box_id, actual_arrival_at
        FROM shipment_actuals
        WHERE actual_arrival_at >= %(date_from)s AND actual_arrival_at < %(date_to)s
    """
    data["actual_arrivals"] = client.query_dataframe(
        actual_query, params={"date_from": date_from, "date_to": date_to}
    )
    logger.info("Fetched %d actual arrivals", len(data["actual_arrivals"]))

    return data


def write_results(client: Client, results: dict[str, pd.DataFrame]) -> None:
    if "temperature_readings" in results and not results["temperature_readings"].empty:
        df = results["temperature_readings"]
        cols = [c for c in ["box_id", "probe_id", "recorded_at", "temperature",
                             "temperature_original", "is_interpolated", "is_anomaly_gap", "flag"]
                if c in df.columns]
        client.insert_dataframe(
            "INSERT INTO cleaned_temperature_readings VALUES",
            df[cols].to_dict("list"),
        )
        logger.info("Wrote %d cleaned temperature readings", len(df))

    if "door_events" in results and not results["door_events"].empty:
        df = results["door_events"]
        cols = [c for c in ["box_id", "event_type", "recorded_at", "latitude", "longitude",
                             "is_paired", "pair_id", "duration_seconds", "flag"]
                if c in df.columns]
        client.insert_dataframe(
            "INSERT INTO cleaned_door_events VALUES",
            df[cols].to_dict("list"),
        )
        logger.info("Wrote %d cleaned door events", len(df))

    if "exceptions" in results and not results["exceptions"].empty:
        df = results["exceptions"]
        exception_cols = ["box_id", "exception_type", "severity", "recorded_at"]
        available_cols = [c for c in exception_cols if c in df.columns]
        if available_cols:
            client.insert_dataframe(
                "INSERT INTO exceptions VALUES",
                df[available_cols].to_dict("list"),
            )
            logger.info("Wrote %d exceptions", len(df))


def update_etl_status(client: Client, run_id: str, status: str, stats: dict, dry_run: bool) -> None:
    if dry_run:
        logger.info("[DRY RUN] Would update etl_status: run_id=%s, status=%s", run_id, status)
        return

    now = datetime.now()
    client.execute(
        """
        INSERT INTO etl_status (run_id, status, started_at, finished_at,
                                 temp_readings_count, door_events_count,
                                 exceptions_count, error_message)
        VALUES
        """,
        [{
            "run_id": run_id,
            "status": status,
            "started_at": stats.get("started_at", now),
            "finished_at": now,
            "temp_readings_count": stats.get("temp_readings_count", 0),
            "door_events_count": stats.get("door_events_count", 0),
            "exceptions_count": stats.get("exceptions_count", 0),
            "error_message": stats.get("error_message", ""),
        }],
    )
    logger.info("Updated etl_status: run_id=%s, status=%s", run_id, status)


def parse_date_range(date_range: str) -> tuple[datetime, datetime]:
    if date_range == "yesterday":
        yesterday = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
        return yesterday, yesterday + timedelta(days=1)
    if date_range == "today":
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        return today, datetime.now()
    if "|" in date_range:
        parts = date_range.split("|")
        return pd.to_datetime(parts[0]), pd.to_datetime(parts[1])
    raise ValueError(f"Invalid date range format: {date_range}. Use 'today', 'yesterday', or 'YYYY-MM-DD|YYYY-MM-DD'")


def main():
    parser = argparse.ArgumentParser(description="Cold Chain ETL Runner")
    parser.add_argument(
        "--config", "-c",
        default=str(Path(__file__).parent / "caliber_config.yaml"),
        help="Path to caliber config YAML",
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Run without writing to ClickHouse",
    )
    parser.add_argument(
        "--date-range", "-d",
        default="yesterday",
        help="Date range: 'today', 'yesterday', or 'YYYY-MM-DD|YYYY-MM-DD'",
    )
    args = parser.parse_args()

    run_id = datetime.now().strftime("etl_%Y%m%d_%H%M%S")
    stats = {"started_at": datetime.now()}

    logger.info("=" * 60)
    logger.info("ETL Run: %s | dry_run=%s | date_range=%s", run_id, args.dry_run, args.date_range)
    logger.info("=" * 60)

    try:
        config = load_config(args.config)
        date_from, date_to = parse_date_range(args.date_range)
        logger.info("Processing date range: %s to %s", date_from, date_to)

        client = get_clickhouse_client()
        client.execute("SELECT 1")
        logger.info("ClickHouse connection established")

        source_data = fetch_source_data(client, date_from, date_to)

        results = run_cleaning_pipeline(
            temp_readings=source_data["temp_readings"],
            door_events=source_data["door_events"],
            calibrations=source_data["calibrations"],
            batch_ranges=source_data["batch_ranges"],
            transit_status=source_data["transit_status"],
            planned_arrivals=source_data["planned_arrivals"],
            actual_arrivals=source_data["actual_arrivals"],
            config=config,
        )

        stats["temp_readings_count"] = len(results.get("temperature_readings", pd.DataFrame()))
        stats["door_events_count"] = len(results.get("door_events", pd.DataFrame()))
        stats["exceptions_count"] = len(results.get("exceptions", pd.DataFrame()))

        if args.dry_run:
            logger.info("[DRY RUN] Skipping write to ClickHouse")
            logger.info("[DRY RUN] Stats: temp_readings=%d, door_events=%d, exceptions=%d",
                        stats["temp_readings_count"], stats["door_events_count"],
                        stats["exceptions_count"])
        else:
            write_results(client, results)

        update_etl_status(client, run_id, "success", stats, args.dry_run)
        logger.info("ETL run %s completed successfully", run_id)

    except Exception:
        logger.exception("ETL run %s failed", run_id)
        stats["error_message"] = str(sys.exc_info()[1])
        try:
            update_etl_status(client, run_id, "failed", stats, args.dry_run)
        except Exception:
            logger.exception("Failed to update etl_status for run %s", run_id)
        sys.exit(1)


if __name__ == "__main__":
    main()
