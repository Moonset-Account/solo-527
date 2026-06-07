from datetime import datetime, time, timedelta
from typing import Tuple, Optional
import pandas as pd


class TimeSlicer:
    CLASS_SCHEDULE = {
        'morning': [
            (time(8, 0), time(8, 45)),
            (time(8, 55), time(9, 40)),
            (time(10, 0), time(10, 45)),
            (time(10, 55), time(11, 40)),
        ],
        'afternoon': [
            (time(14, 0), time(14, 45)),
            (time(14, 55), time(15, 40)),
            (time(16, 0), time(16, 45)),
            (time(16, 55), time(17, 40)),
        ],
        'evening': [
            (time(19, 0), time(19, 45)),
            (time(19, 55), time(20, 40)),
        ]
    }

    MEAL_SLOTS = [
        {'name': 'breakfast', 'start': time(6, 30), 'end': time(9, 30)},
        {'name': 'lunch', 'start': time(11, 0), 'end': time(13, 30)},
        {'name': 'dinner', 'start': time(17, 0), 'end': time(19, 30)},
        {'name': 'night_snack', 'start': time(20, 30), 'end': time(22, 30)},
    ]

    BIG_BREAK_TIMES = [
        (time(9, 40), time(10, 0)),
        (time(11, 40), time(14, 0)),
        (time(15, 40), time(16, 0)),
        (time(17, 40), time(19, 0)),
    ]

    @classmethod
    def get_time_slot(cls, dt: datetime) -> str:
        t = dt.time()
        for slot in cls.MEAL_SLOTS:
            if slot['start'] <= t <= slot['end']:
                return slot['name']
        return 'other'

    @classmethod
    def is_big_break(cls, dt: datetime) -> bool:
        t = dt.time()
        for start, end in cls.BIG_BREAK_TIMES:
            if start <= t <= end:
                return True
        return False

    @classmethod
    def is_in_class(cls, dt: datetime) -> bool:
        t = dt.time()
        for period in [*cls.CLASS_SCHEDULE['morning'],
                       *cls.CLASS_SCHEDULE['afternoon'],
                       *cls.CLASS_SCHEDULE['evening']]:
            if period[0] <= t <= period[1]:
                return True
        return False

    @classmethod
    def get_class_period(cls, dt: datetime) -> Optional[str]:
        t = dt.time()
        for i, period in enumerate(cls.CLASS_SCHEDULE['morning']):
            if period[0] <= t <= period[1]:
                return f'morning_{i + 1}'
        for i, period in enumerate(cls.CLASS_SCHEDULE['afternoon']):
            if period[0] <= t <= period[1]:
                return f'afternoon_{i + 1}'
        for i, period in enumerate(cls.CLASS_SCHEDULE['evening']):
            if period[0] <= t <= period[1]:
                return f'evening_{i + 1}'
        return None

    @classmethod
    def get_time_bucket(cls, dt: datetime, bucket_minutes: int = 5) -> datetime:
        minutes = (dt.minute // bucket_minutes) * bucket_minutes
        return dt.replace(minute=minutes, second=0, microsecond=0)

    @classmethod
    def generate_time_slots(cls, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        dates = pd.date_range(start=start_date.date(), end=end_date.date(), freq='D')
        slots = []
        for date in dates:
            for slot in cls.MEAL_SLOTS:
                start_dt = datetime.combine(date.date(), slot['start'])
                end_dt = datetime.combine(date.date(), slot['end'])
                slots.append({
                    'date': date.date(),
                    'slot_name': slot['name'],
                    'start_time': start_dt,
                    'end_time': end_dt
                })
        return pd.DataFrame(slots)

    @classmethod
    def get_floor_group_key(cls, floor: int, time_slot: str) -> str:
        return f"floor_{floor}_{time_slot}"
