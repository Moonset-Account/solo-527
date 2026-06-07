import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class ReadingFlag(str, Enum):
    VALID = "valid"
    INVALID_RANGE = "invalid_range"
    SPIKE = "spike"
    ANOMALY_GAP = "anomaly_gap"
    CALIBRATION_DRIFT = "calibration_drift"
    DUPLICATE = "duplicate"
    UNPAIRED_DOOR = "unpaired_door"
    INVALID_LOCATION = "invalid_location"


class ExceptionSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TemperatureReadingCleaner:
    def __init__(self, config: dict[str, Any]):
        self.valid_range = tuple(config["temperature"]["valid_range"])
        self.spike_threshold = config["temperature"]["spike_threshold"]
        self.spike_window_seconds = config["temperature"]["spike_window_seconds"]
        self.gap_threshold_seconds = config["temperature"]["gap_threshold_seconds"]
        self.interpolation_method = config["temperature"]["interpolation_method"]

    def remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        subset = ["box_id", "probe_id", "recorded_at"]
        before = len(df)
        df = df.drop_duplicates(subset=subset, keep="last")
        removed = before - len(df)
        if removed > 0:
            logger.info("Removed %d duplicate temperature readings", removed)
        return df

    def fill_gaps(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        df = df.sort_values(["box_id", "probe_id", "recorded_at"]).reset_index(drop=True)
        if "is_anomaly_gap" not in df.columns:
            df["is_anomaly_gap"] = False

        new_rows = []
        for (box_id, probe_id), group in df.groupby(["box_id", "probe_id"]):
            group = group.sort_values("recorded_at").reset_index(drop=True)
            gap_mask = group["recorded_at"].diff().dt.total_seconds() > self.gap_threshold_seconds
            df.loc[gap_mask[gap_mask].index, "is_anomaly_gap"] = True

            recorded_at = pd.to_datetime(group["recorded_at"])
            full_range = pd.date_range(
                start=recorded_at.min(),
                end=recorded_at.max(),
                freq=f"{self.gap_threshold_seconds}s",
            )
            missing_times = full_range.difference(recorded_at)
            if missing_times.empty:
                continue

            existing = group.set_index("recorded_at")[["temperature"]].sort_index()
            interpolated = existing.reindex(
                existing.index.union(missing_times)
            )
            interpolated["temperature"] = interpolated["temperature"].interpolate(
                method=self.interpolation_method
            )

            for ts in missing_times:
                if ts in interpolated.index and not np.isnan(interpolated.loc[ts, "temperature"]):
                    gap_before = (ts - recorded_at).total_seconds()
                    gap_after = (recorded_at - ts).total_seconds()
                    min_gap = min(gap_before[gap_before > 0].min() if (gap_before > 0).any() else float("inf"),
                                  gap_after[gap_after > 0].min() if (gap_after > 0).any() else float("inf"))
                    new_rows.append({
                        "box_id": box_id,
                        "probe_id": probe_id,
                        "recorded_at": ts,
                        "temperature": float(interpolated.loc[ts, "temperature"]),
                        "is_interpolated": True,
                        "is_anomaly_gap": min_gap > self.gap_threshold_seconds,
                    })

        if new_rows:
            new_df = pd.DataFrame(new_rows)
            if "is_interpolated" not in df.columns:
                df["is_interpolated"] = False
            df = pd.concat([df, new_df], ignore_index=True)
            df = df.sort_values(["box_id", "probe_id", "recorded_at"]).reset_index(drop=True)
            logger.info("Interpolated %d missing readings", len(new_rows))
        return df

    def apply_calibration_correction(self, df: pd.DataFrame, calibrations: pd.DataFrame) -> pd.DataFrame:
        if df.empty or calibrations.empty:
            return df
        merged = df.merge(
            calibrations[["probe_id", "deviation"]],
            on="probe_id",
            how="left",
        )
        merged["deviation"] = merged["deviation"].fillna(0.0)
        merged["temperature_original"] = merged["temperature"]
        merged["temperature"] = merged["temperature"] - merged["deviation"]
        corrected = (merged["deviation"] != 0.0).sum()
        if corrected > 0:
            logger.info("Applied calibration correction to %d readings", corrected)
        merged = merged.drop(columns=["deviation"])
        return merged

    def validate_range(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        if "flag" not in df.columns:
            df["flag"] = ReadingFlag.VALID
        low, high = self.valid_range
        out_of_range = (df["temperature"] < low) | (df["temperature"] > high)
        df.loc[out_of_range, "flag"] = ReadingFlag.INVALID_RANGE
        flagged = out_of_range.sum()
        if flagged > 0:
            logger.warning("Flagged %d readings outside valid range [%s, %s]", flagged, low, high)
        return df

    def detect_spike(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        df = df.sort_values(["box_id", "probe_id", "recorded_at"]).reset_index(drop=True)
        if "flag" not in df.columns:
            df["flag"] = ReadingFlag.VALID

        for (box_id, probe_id), group in df.groupby(["box_id", "probe_id"]):
            idx = group.index
            temps = group["temperature"].values
            times = pd.to_datetime(group["recorded_at"]).values
            for i in range(1, len(temps)):
                dt_seconds = (times[i] - times[i - 1]) / np.timedelta64(1, "s")
                if 0 < dt_seconds <= self.spike_window_seconds:
                    delta = abs(temps[i] - temps[i - 1])
                    if delta > self.spike_threshold:
                        df.loc[idx[i], "flag"] = ReadingFlag.SPIKE
        spike_count = (df["flag"] == ReadingFlag.SPIKE).sum()
        if spike_count > 0:
            logger.warning("Detected %d temperature spikes", spike_count)
        return df


class DoorEventCleaner:
    CHINA_LAT_RANGE = (18.0, 54.0)
    CHINA_LON_RANGE = (73.0, 135.0)

    def __init__(self, config: dict[str, Any]):
        self.max_duration_seconds = config["door"]["max_duration_seconds"]
        self.unauthorized_during_transit = config["door"]["unauthorized_during_transit"]

    def match_pairs(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        df = df.sort_values(["box_id", "recorded_at"]).reset_index(drop=True)
        if "is_paired" not in df.columns:
            df["is_paired"] = False
        if "pair_id" not in df.columns:
            df["pair_id"] = None
        if "flag" not in df.columns:
            df["flag"] = ReadingFlag.VALID

        pair_counter = 0
        open_stack: dict[str, int] = {}

        for idx, row in df.iterrows():
            key = row["box_id"]
            if row["event_type"] == "open":
                open_stack[key] = idx
            elif row["event_type"] == "close":
                if key in open_stack:
                    open_idx = open_stack.pop(key)
                    pair_counter += 1
                    pair_id = f"pair_{pair_counter}"
                    df.loc[open_idx, "is_paired"] = True
                    df.loc[open_idx, "pair_id"] = pair_id
                    df.loc[idx, "is_paired"] = True
                    df.loc[idx, "pair_id"] = pair_id
                else:
                    df.loc[idx, "flag"] = ReadingFlag.UNPAIRED_DOOR

        for key, open_idx in open_stack.items():
            df.loc[open_idx, "flag"] = ReadingFlag.UNPAIRED_DOOR

        unpaired = (df["flag"] == ReadingFlag.UNPAIRED_DOOR).sum()
        if unpaired > 0:
            logger.warning("Found %d unpaired door events", unpaired)
        return df

    def validate_location(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        if "flag" not in df.columns:
            df["flag"] = ReadingFlag.VALID

        lat_valid = df["latitude"].between(*self.CHINA_LAT_RANGE)
        lon_valid = df["longitude"].between(*self.CHINA_LON_RANGE)
        invalid = ~(lat_valid & lon_valid)
        df.loc[invalid, "flag"] = ReadingFlag.INVALID_LOCATION
        flagged = invalid.sum()
        if flagged > 0:
            logger.warning("Flagged %d door events with invalid GPS coordinates", flagged)
        return df

    def calculate_duration(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df
        if "duration_seconds" not in df.columns:
            df["duration_seconds"] = None

        paired = df[df["is_paired"] == True].copy()
        for pair_id in paired["pair_id"].dropna().unique():
            pair_events = df[df["pair_id"] == pair_id]
            if len(pair_events) != 2:
                continue
            open_event = pair_events[pair_events["event_type"] == "open"].iloc[0]
            close_event = pair_events[pair_events["event_type"] == "close"].iloc[0]
            duration = (pd.to_datetime(close_event["recorded_at"]) -
                        pd.to_datetime(open_event["recorded_at"])).total_seconds()
            df.loc[pair_events.index, "duration_seconds"] = duration
            if duration > self.max_duration_seconds:
                logger.warning(
                    "Door pair %s exceeded max duration: %.0fs > %ds",
                    pair_id, duration, self.max_duration_seconds,
                )
        return df


class ExceptionDetector:
    def __init__(self, config: dict[str, Any]):
        self.temp_config = config["temperature"]
        self.door_config = config["door"]
        self.arrival_config = config["arrival"]
        self.calibration_config = config["calibration"]
        self.severity_rules = config["exception"]["severity_rules"]

    def detect_temp_exceeded(
        self,
        readings: pd.DataFrame,
        batch_ranges: pd.DataFrame,
    ) -> pd.DataFrame:
        if readings.empty or batch_ranges.empty:
            return pd.DataFrame()

        merged = readings.merge(batch_ranges[["box_id", "temp_min", "temp_max"]], on="box_id", how="left")
        exceeded = merged[
            (merged["temperature"] < merged["temp_min"]) |
            (merged["temperature"] > merged["temp_max"])
        ].copy()

        if exceeded.empty:
            return pd.DataFrame()

        exceeded["exception_type"] = "temp_exceeded"
        exceeded["deviation"] = exceeded.apply(
            lambda r: max(0, r["temperature"] - r["temp_max"], r["temp_min"] - r["temperature"]),
            axis=1,
        )
        exceeded["severity"] = exceeded.apply(
            lambda r: self._classify_temp_severity(r), axis=1,
        )
        logger.info("Detected %d temperature exceeded exceptions", len(exceeded))
        return exceeded

    def detect_unauthorized_door(
        self,
        door_events: pd.DataFrame,
        transit_status: pd.DataFrame,
    ) -> pd.DataFrame:
        if door_events.empty:
            return pd.DataFrame()

        if not self.door_config.get("unauthorized_during_transit", True):
            return pd.DataFrame()

        in_transit = transit_status[transit_status["status"] == "in_transit"] if not transit_status.empty else transit_status
        if in_transit.empty:
            return pd.DataFrame()

        transit_boxes = set(in_transit["box_id"])
        unauthorized = door_events[
            (door_events["box_id"].isin(transit_boxes)) &
            (door_events["event_type"] == "open")
        ].copy()

        if unauthorized.empty:
            return pd.DataFrame()

        unauthorized["exception_type"] = "unauthorized_door"
        unauthorized["severity"] = unauthorized.apply(
            lambda r: self._classify_door_severity(r), axis=1,
        )
        logger.info("Detected %d unauthorized door exceptions", len(unauthorized))
        return unauthorized

    def detect_delayed_arrival(
        self,
        actual_arrivals: pd.DataFrame,
        planned_arrivals: pd.DataFrame,
    ) -> pd.DataFrame:
        if actual_arrivals.empty or planned_arrivals.empty:
            return pd.DataFrame()

        merged = actual_arrivals.merge(
            planned_arrivals[["box_id", "planned_arrival_at"]],
            on="box_id",
            how="left",
        )
        merged["delay_minutes"] = (
            pd.to_datetime(merged["actual_arrival_at"]) -
            pd.to_datetime(merged["planned_arrival_at"])
        ).dt.total_seconds() / 60.0

        delay_threshold = self.arrival_config["delay_threshold_minutes"]
        severe_threshold = self.arrival_config["severe_delay_threshold_minutes"]
        delayed = merged[merged["delay_minutes"] > delay_threshold].copy()

        if delayed.empty:
            return pd.DataFrame()

        delayed["exception_type"] = "delayed_arrival"
        delayed["severity"] = delayed["delay_minutes"].apply(
            lambda m: ExceptionSeverity.CRITICAL if m >= severe_threshold else ExceptionSeverity.HIGH
        )
        logger.info("Detected %d delayed arrival exceptions", len(delayed))
        return delayed

    def detect_calibration_drift(self, calibrations: pd.DataFrame) -> pd.DataFrame:
        if calibrations.empty:
            return pd.DataFrame()

        threshold = self.calibration_config["deviation_threshold_celsius"]
        validity_days = self.calibration_config["validity_days"]

        drifted = calibrations[
            (calibrations["deviation"].abs() > threshold)
        ].copy()

        if "calibrated_at" in calibrations.columns:
            expired = calibrations[
                (pd.to_datetime(calibrations["calibrated_at"]) <
                 datetime.now() - timedelta(days=validity_days))
            ]
            drifted = pd.concat([drifted, expired]).drop_duplicates()

        if drifted.empty:
            return pd.DataFrame()

        drifted["exception_type"] = "calibration_drift"
        drifted["severity"] = drifted["deviation"].abs().apply(
            lambda d: ExceptionSeverity.CRITICAL if d > threshold * 3
            else ExceptionSeverity.HIGH if d > threshold * 2
            else ExceptionSeverity.MEDIUM
        )
        logger.info("Detected %d calibration drift exceptions", len(drifted))
        return drifted

    def _classify_temp_severity(self, row: pd.Series) -> str:
        rules = self.severity_rules.get("temp_exceeded", {})
        deviation = row.get("deviation", 0)
        duration_min = row.get("duration_minutes", 0)

        if deviation >= 10 and duration_min >= 60:
            return ExceptionSeverity.CRITICAL
        if duration_min < 60 or deviation < 10:
            if deviation < 5 and duration_min >= 30:
                return ExceptionSeverity.MEDIUM
            if deviation >= 5 or duration_min >= 30:
                return ExceptionSeverity.HIGH
            if duration_min < 10 and deviation < 2:
                return ExceptionSeverity.LOW
            return ExceptionSeverity.MEDIUM
        return ExceptionSeverity.MEDIUM

    def _classify_door_severity(self, row: pd.Series) -> str:
        rules = self.severity_rules.get("unauthorized_door", {})
        duration = row.get("duration_seconds", 0) or 0

        if duration >= 900:
            return ExceptionSeverity.CRITICAL
        if duration >= 300:
            return ExceptionSeverity.HIGH
        if duration >= 60:
            return ExceptionSeverity.MEDIUM
        return ExceptionSeverity.LOW


def run_cleaning_pipeline(
    temp_readings: pd.DataFrame,
    door_events: pd.DataFrame,
    calibrations: pd.DataFrame,
    batch_ranges: pd.DataFrame,
    transit_status: pd.DataFrame,
    planned_arrivals: pd.DataFrame,
    actual_arrivals: pd.DataFrame,
    config: dict[str, Any],
) -> dict[str, pd.DataFrame]:
    logger.info("Starting ETL cleaning pipeline")
    results = {}

    temp_cleaner = TemperatureReadingCleaner(config)
    door_cleaner = DoorEventCleaner(config)

    logger.info("[1/5] Removing duplicates from temperature readings...")
    temp_readings = temp_cleaner.remove_duplicates(temp_readings)

    logger.info("[2/5] Filling gaps in temperature readings...")
    temp_readings = temp_cleaner.fill_gaps(temp_readings)

    logger.info("[3/5] Applying calibration correction...")
    temp_readings = temp_cleaner.apply_calibration_correction(temp_readings, calibrations)

    logger.info("[4/5] Validating temperature range and detecting spikes...")
    temp_readings = temp_cleaner.validate_range(temp_readings)
    temp_readings = temp_cleaner.detect_spike(temp_readings)

    logger.info("[5/5] Cleaning door events...")
    door_events = door_cleaner.match_pairs(door_events)
    door_events = door_cleaner.validate_location(door_events)
    door_events = door_cleaner.calculate_duration(door_events)

    results["temperature_readings"] = temp_readings
    results["door_events"] = door_events

    logger.info("Starting exception detection...")
    detector = ExceptionDetector(config)

    temp_exceptions = detector.detect_temp_exceeded(temp_readings, batch_ranges)
    door_exceptions = detector.detect_unauthorized_door(door_events, transit_status)
    delay_exceptions = detector.detect_delayed_arrival(actual_arrivals, planned_arrivals)
    drift_exceptions = detector.detect_calibration_drift(calibrations)

    all_exceptions = pd.concat(
        [temp_exceptions, door_exceptions, delay_exceptions, drift_exceptions],
        ignore_index=True,
    )
    results["exceptions"] = all_exceptions

    logger.info(
        "ETL pipeline complete: %d temp readings, %d door events, %d exceptions",
        len(temp_readings), len(door_events), len(all_exceptions),
    )
    return results
