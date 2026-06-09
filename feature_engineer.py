import numpy as np
import pandas as pd
from scipy import stats, fft
from typing import List, Dict, Tuple, Optional
from datetime import datetime
from config import Config
from database import Database, FeatureRecord
import json
import hashlib


class FeatureExtractor:
    SENSOR_COLUMNS = ["temperature", "vibration", "current", "rpm"]
    SHIFT_MAPPING = {"早班": 0, "中班": 1, "晚班": 2}

    def __init__(self, window_size: int = None, step_size: int = None):
        self.window_size = window_size or Config.WINDOW_SIZE
        self.step_size = step_size or Config.SLIDING_STEP

    def _compute_time_domain_features(self, values: np.ndarray, prefix: str) -> Dict:
        if len(values) == 0 or np.all(np.isnan(values)):
            return {f"{prefix}_{k}": 0.0 for k in [
                "mean", "std", "min", "max", "median", "skew", "kurtosis",
                "rms", "peak_to_peak", "crest_factor", "variance",
                "p25", "p75", "iqr", "zero_crossing_rate"
            ]}
        values = np.array(values, dtype=float)
        values_clean = values[~np.isnan(values)]

        mean_val = np.mean(values_clean)
        std_val = np.std(values_clean)
        rms_val = np.sqrt(np.mean(values_clean ** 2)) if len(values_clean) > 0 else 0
        max_val = np.max(values_clean)
        min_val = np.min(values_clean)
        crest = (max_val / rms_val) if rms_val > 0 else 0

        zero_crossings = np.sum(np.diff(np.sign(values_clean - mean_val)) != 0) / max(len(values_clean) - 1, 1)

        return {
            f"{prefix}_mean": float(mean_val),
            f"{prefix}_std": float(std_val),
            f"{prefix}_min": float(min_val),
            f"{prefix}_max": float(max_val),
            f"{prefix}_median": float(np.median(values_clean)),
            f"{prefix}_skew": float(stats.skew(values_clean)) if len(values_clean) > 2 else 0.0,
            f"{prefix}_kurtosis": float(stats.kurtosis(values_clean)) if len(values_clean) > 3 else 0.0,
            f"{prefix}_rms": float(rms_val),
            f"{prefix}_peak_to_peak": float(max_val - min_val),
            f"{prefix}_crest_factor": float(crest),
            f"{prefix}_variance": float(np.var(values_clean)),
            f"{prefix}_p25": float(np.percentile(values_clean, 25)),
            f"{prefix}_p75": float(np.percentile(values_clean, 75)),
            f"{prefix}_iqr": float(np.percentile(values_clean, 75) - np.percentile(values_clean, 25)),
            f"{prefix}_zero_crossing_rate": float(zero_crossings),
        }

    def _compute_frequency_domain_features(self, values: np.ndarray, prefix: str, sample_rate: float = 1.0) -> Dict:
        if len(values) < 4 or np.all(np.isnan(values)):
            return {f"{prefix}_freq_{k}": 0.0 for k in [
                "dominant_freq", "dominant_power", "spectral_centroid",
                "spectral_bandwidth", "total_power", "freq_mean", "freq_std"
            ]}

        values = np.array(values, dtype=float)
        values_clean = values[~np.isnan(values)]
        values_centered = values_clean - np.mean(values_clean)

        try:
            n = len(values_centered)
            fft_vals = fft.fft(values_centered)
            freqs = fft.fftfreq(n, d=1.0 / sample_rate)
            power_spectrum = np.abs(fft_vals) ** 2

            positive_mask = freqs >= 0
            freqs_pos = freqs[positive_mask]
            power_pos = power_spectrum[positive_mask]

            if len(freqs_pos) == 0:
                return {f"{prefix}_freq_{k}": 0.0 for k in [
                    "dominant_freq", "dominant_power", "spectral_centroid",
                    "spectral_bandwidth", "total_power", "freq_mean", "freq_std"
                ]}

            dominant_idx = np.argmax(power_pos)
            total_power = np.sum(power_pos)

            if total_power > 0:
                spectral_centroid = np.sum(freqs_pos * power_pos) / total_power
                spectral_bandwidth = np.sqrt(np.sum(((freqs_pos - spectral_centroid) ** 2) * power_pos) / total_power)
                freq_mean = np.sum(freqs_pos * power_pos) / total_power
                freq_std = np.sqrt(np.sum(((freqs_pos - freq_mean) ** 2) * power_pos) / total_power)
            else:
                spectral_centroid = spectral_bandwidth = freq_mean = freq_std = 0

            return {
                f"{prefix}_freq_dominant_freq": float(freqs_pos[dominant_idx]),
                f"{prefix}_freq_dominant_power": float(power_pos[dominant_idx]),
                f"{prefix}_freq_spectral_centroid": float(spectral_centroid),
                f"{prefix}_freq_spectral_bandwidth": float(spectral_bandwidth),
                f"{prefix}_freq_total_power": float(total_power),
                f"{prefix}_freq_freq_mean": float(freq_mean),
                f"{prefix}_freq_freq_std": float(freq_std),
            }
        except Exception:
            return {f"{prefix}_freq_{k}": 0.0 for k in [
                "dominant_freq", "dominant_power", "spectral_centroid",
                "spectral_bandwidth", "total_power", "freq_mean", "freq_std"
            ]}

    def _compute_cross_features(self, row_df: pd.DataFrame) -> Dict:
        features = {}
        cols = self.SENSOR_COLUMNS
        for i in range(len(cols)):
            for j in range(i + 1, len(cols)):
                col_i, col_j = cols[i], cols[j]
                vals_i = row_df[col_i].values
                vals_j = row_df[col_j].values

                valid_mask = ~np.isnan(vals_i) & ~np.isnan(vals_j)
                if np.sum(valid_mask) > 2:
                    corr = np.corrcoef(vals_i[valid_mask], vals_j[valid_mask])[0, 1]
                    if np.isnan(corr):
                        corr = 0.0
                else:
                    corr = 0.0

                features[f"corr_{col_i}_{col_j}"] = float(corr)

                ratio_mean = (np.nanmean(vals_i) / np.nanmean(vals_j)) if np.nanmean(vals_j) != 0 else 0
                features[f"ratio_mean_{col_i}_{col_j}"] = float(ratio_mean if not np.isnan(ratio_mean) else 0)

        return features

    def _encode_shift(self, shift_series: pd.Series) -> Dict:
        mode_shift = shift_series.mode().iloc[0] if len(shift_series) > 0 else "早班"
        shift_code = self.SHIFT_MAPPING.get(mode_shift, 0)
        return {
            "shift_code": float(shift_code),
            "shift_morning": float(shift_code == 0),
            "shift_afternoon": float(shift_code == 1),
            "shift_night": float(shift_code == 2),
        }

    def _compute_trend_features(self, values: np.ndarray, prefix: str) -> Dict:
        if len(values) < 3 or np.all(np.isnan(values)):
            return {
                f"{prefix}_trend_slope": 0.0,
                f"{prefix}_trend_roc": 0.0,
                f"{prefix}_trend_accel": 0.0,
            }

        values = np.array(values, dtype=float)
        values_clean = values[~np.isnan(values)]
        n = len(values_clean)

        if n < 3:
            return {
                f"{prefix}_trend_slope": 0.0,
                f"{prefix}_trend_roc": 0.0,
                f"{prefix}_trend_accel": 0.0,
            }

        x = np.arange(n)
        try:
            slope, _ = np.polyfit(x, values_clean, 1)
            if len(values_clean) >= 3:
                coeffs = np.polyfit(x, values_clean, 2)
                accel = 2 * coeffs[0]
            else:
                accel = 0.0

            mean_val = np.mean(values_clean)
            if mean_val != 0 and n > 1:
                roc = (values_clean[-1] - values_clean[0]) / (mean_val * n)
            else:
                roc = 0.0
        except Exception:
            slope = 0.0
            roc = 0.0
            accel = 0.0

        return {
            f"{prefix}_trend_slope": float(slope),
            f"{prefix}_trend_roc": float(roc),
            f"{prefix}_trend_accel": float(accel),
        }

    def extract_window_features(self, window_df: pd.DataFrame) -> Dict:
        features = {}

        for col in self.SENSOR_COLUMNS:
            values = window_df[col].values
            features.update(self._compute_time_domain_features(values, col))
            features.update(self._compute_frequency_domain_features(values, col))
            features.update(self._compute_trend_features(values, col))

        features.update(self._compute_cross_features(window_df))

        if "shift" in window_df.columns:
            features.update(self._encode_shift(window_df["shift"]))
        else:
            features.update({
                "shift_code": 0.0,
                "shift_morning": 1.0,
                "shift_afternoon": 0.0,
                "shift_night": 0.0,
            })

        return features

    def generate_sliding_windows(
        self,
        df: pd.DataFrame,
        exclude_downtime: bool = True,
        generate_labels: bool = True
    ) -> Tuple[List[Dict], List[Optional[str]], List[Tuple[datetime, datetime, str]]]:
        if df.empty:
            return [], [], []

        result_features = []
        result_labels = []
        window_infos = []

        for equipment_id, eq_df in df.groupby("equipment_id"):
            eq_df = eq_df.sort_values("timestamp").reset_index(drop=True)

            if exclude_downtime:
                eq_df_active = eq_df[eq_df["is_downtime"] == False].copy()
            else:
                eq_df_active = eq_df.copy()

            n = len(eq_df_active)
            for start_idx in range(0, max(n - self.window_size + 1, 1), self.step_size):
                end_idx = min(start_idx + self.window_size, n)
                window_df = eq_df_active.iloc[start_idx:end_idx]

                if len(window_df) < self.window_size // 2:
                    continue

                window_start = window_df["timestamp"].iloc[0]
                window_end = window_df["timestamp"].iloc[-1]

                features = self.extract_window_features(window_df)
                result_features.append(features)

                if generate_labels and "raw_label" in window_df.columns:
                    labels = window_df["raw_label"].dropna()
                    if len(labels) > 0:
                        label_mode = labels.mode()
                        if len(label_mode) > 0:
                            label = label_mode.iloc[0]
                            if label in ["轴承磨损", "传感器漂移"]:
                                pass
                        else:
                            label = "正常"
                    else:
                        label = "正常"
                    result_labels.append(label)
                else:
                    result_labels.append(None)

                window_infos.append((window_start, window_end, equipment_id))

        return result_features, result_labels, window_infos

    def extract_and_save_features(
        self,
        df: pd.DataFrame,
        data_version: str = None,
        exclude_downtime: bool = True
    ) -> pd.DataFrame:
        features_list, labels_list, window_infos = self.generate_sliding_windows(
            df, exclude_downtime=exclude_downtime, generate_labels=True
        )

        if not features_list:
            return pd.DataFrame()

        features_df = pd.DataFrame(features_list)
        features_df["label"] = labels_list
        features_df["equipment_id"] = [info[2] for info in window_infos]
        features_df["window_start"] = [info[0] for info in window_infos]
        features_df["window_end"] = [info[1] for info in window_infos]

        if data_version is None:
            data_hash = hashlib.md5(str(datetime.now()).encode()).hexdigest()[:12]
            data_version = f"dv_{data_hash}"

        session = Database.get_session()
        try:
            records = []
            for i in range(len(features_list)):
                records.append(FeatureRecord(
                    equipment_id=window_infos[i][2],
                    window_start=window_infos[i][0],
                    window_end=window_infos[i][1],
                    features=json.dumps(features_list[i]),
                    data_version=data_version,
                    is_used_for_training=False
                ))
            for i in range(0, len(records), 2000):
                batch = records[i:i + 2000]
                session.add_all(batch)
                session.commit()
            print(f"Saved {len(records)} feature records")
        finally:
            session.close()

        features_df["data_version"] = data_version
        return features_df

    def get_feature_names(self) -> List[str]:
        sample_data = {
            "temperature": np.random.randn(100),
            "vibration": np.random.randn(100),
            "current": np.random.randn(100),
            "rpm": np.random.randn(100),
            "shift": pd.Series(["早班"] * 100)
        }
        sample_df = pd.DataFrame(sample_data)
        features = self.extract_window_features(sample_df)
        return list(features.keys())
