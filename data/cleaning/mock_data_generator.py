import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
import random
import hashlib

from data.metrics.definitions import RISK_TAGS, QUEUE_TYPES, SHIFTS, SOURCES

REVIEWERS = [
    {"id": f"r{i:03d}", "name": f"审核员{i:02d}", "team": random.choice(["一组", "二组", "三组"])}
    for i in range(1, 21)
]


def generate_review_logs(hours: int = 48, count_per_hour: int = 500) -> pd.DataFrame:
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=hours)
    
    records = []
    total_records = hours * count_per_hour
    
    for i in range(total_records):
        enqueue_time = start_time + timedelta(
            seconds=random.randint(0, int((end_time - start_time).total_seconds()))
        )
        
        source = random.choice(SOURCES)
        queue_type = random.choices(
            QUEUE_TYPES,
            weights=[0.45, 0.25, 0.15, 0.1, 0.05],
            k=1
        )[0]
        
        tag_weights = [0.18, 0.15, 0.1, 0.2, 0.17, 0.08, 0.07, 0.05]
        num_tags = random.choices([1, 2, 3], weights=[0.6, 0.3, 0.1], k=1)[0]
        selected_tags = random.choices(RISK_TAGS, weights=tag_weights, k=num_tags)
        machine_risk_tags = [t["name"] for t in selected_tags]
        
        machine_decision_time = enqueue_time + timedelta(seconds=random.randint(10, 120))
        
        if queue_type.startswith("人审") or queue_type == "申诉复核":
            wait_seconds = random.randint(60, 7200)
            reviewer_start_time = machine_decision_time + timedelta(seconds=wait_seconds)
            
            avg_duration = 45 if "高优" in queue_type else 90 if "普通" in queue_type else 150
            review_duration = max(15, int(random.gauss(avg_duration, avg_duration * 0.3)))
            reviewer_end_time = reviewer_start_time + timedelta(seconds=review_duration)
            
            reviewer = random.choice(REVIEWERS)
            reviewer_id = reviewer["id"]
            reviewer_decision = random.choices(
                ["通过", "下架", "修改后通过"],
                weights=[0.55, 0.35, 0.1],
                k=1
            )[0]
            
            if reviewer_decision == "通过":
                final_tags = []
            elif reviewer_decision == "修改后通过":
                final_tags = random.sample(machine_risk_tags, k=max(1, len(machine_risk_tags) - 1))
            else:
                final_tags = machine_risk_tags.copy()
            
            hour = reviewer_start_time.hour
            if 8 <= hour < 16:
                shift = "早班"
            elif 16 <= hour < 24:
                shift = "午班"
            else:
                shift = "夜班"
        else:
            reviewer_start_time = None
            reviewer_end_time = None
            reviewer_id = None
            reviewer_decision = None
            final_tags = machine_risk_tags if queue_type == "机器初筛" else []
            shift = None
        
        records.append({
            "video_id": int(hashlib.md5(f"video_{i}_{enqueue_time.timestamp()}".encode()).hexdigest()[:12], 16),
            "source": source,
            "queue_type": queue_type,
            "enqueue_time": enqueue_time,
            "machine_decision_time": machine_decision_time,
            "machine_risk_tags": machine_risk_tags,
            "reviewer_start_time": reviewer_start_time,
            "reviewer_end_time": reviewer_end_time,
            "reviewer_id": reviewer_id,
            "reviewer_decision": reviewer_decision,
            "final_risk_tags": final_tags,
            "shift": shift,
        })
    
    df = pd.DataFrame(records)
    return df.sort_values("enqueue_time").reset_index(drop=True)


def generate_appeal_logs(review_logs: pd.DataFrame) -> pd.DataFrame:
    appealed = review_logs[
        (review_logs["reviewer_decision"].isin(["下架", "修改后通过"]))
        & (review_logs["reviewer_end_time"].notna())
    ].sample(frac=0.15, random_state=42)
    
    appeal_records = []
    for _, row in appealed.iterrows():
        appeal_time = row["reviewer_end_time"] + timedelta(hours=random.randint(1, 72))
        appeal_result = random.choices(
            ["success", "failed"],
            weights=[0.35, 0.65],
            k=1
        )[0]
        
        appeal_decision_time = appeal_time + timedelta(
            seconds=random.randint(1800, 14400)
        )
        
        appeal_records.append({
            "appeal_id": int(hashlib.md5(f"appeal_{row['video_id']}".encode()).hexdigest()[:12], 16),
            "video_id": row["video_id"],
            "appeal_time": appeal_time,
            "appeal_reason": random.choice([
                "内容误判",
                "已删除违规内容",
                "版权申诉",
                "账号被盗用",
                "其他"
            ]),
            "appeal_decision_time": appeal_decision_time,
            "appeal_result": appeal_result,
            "appeal_reviewer": random.choice([r["name"] for r in REVIEWERS]),
            "original_risk_tags": row["machine_risk_tags"],
        })
    
    return pd.DataFrame(appeal_records).sort_values("appeal_time").reset_index(drop=True)


class MockDataStore:
    _instance = None
    _review_logs: pd.DataFrame = None
    _appeal_logs: pd.DataFrame = None
    _last_generated: datetime = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.refresh()
        return cls._instance
    
    def refresh(self):
        self._review_logs = generate_review_logs(hours=72, count_per_hour=400)
        self._appeal_logs = generate_appeal_logs(self._review_logs)
        self._last_generated = datetime.now()
    
    def get_review_logs(self) -> pd.DataFrame:
        if datetime.now() - self._last_generated > timedelta(minutes=30):
            self.refresh()
        return self._review_logs.copy()
    
    def get_appeal_logs(self) -> pd.DataFrame:
        if datetime.now() - self._last_generated > timedelta(minutes=30):
            self.refresh()
        return self._appeal_logs.copy()
    
    def get_reviewers(self) -> List[Dict[str, str]]:
        return REVIEWERS


data_store = MockDataStore()
