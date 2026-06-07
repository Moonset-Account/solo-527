import sys
import os
import random
import hashlib
from datetime import datetime, timedelta, date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.db.database import init_db, SessionLocal
from backend.models.schema import (
    User, Athlete, TrainingPlan, TrainingSession, TrainingExercise,
    TrainingLog, HeartRate, Pace, StrengthTest, RecoveryScore, Injury,
)


def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()


TEAMS = ["U21梯队", "一线队"]
POSITIONS = ["前锋", "中场", "后卫", "守门员"]
ATHLETE_NAMES = [
    ("张伟", "一线队", "前锋"),
    ("李强", "一线队", "中场"),
    ("王磊", "一线队", "后卫"),
    ("刘洋", "一线队", "守门员"),
    ("陈明", "U21梯队", "前锋"),
    ("赵鹏", "U21梯队", "中场"),
    ("周杰", "U21梯队", "后卫"),
    ("吴昊", "U21梯队", "守门员"),
]

EXERCISES = [
    ("深蹲", "力量", 4, 6, 120.0, None, 180, 8),
    ("硬拉", "力量", 4, 5, 140.0, None, 180, 8),
    ("卧推", "力量", 4, 8, 80.0, None, 120, 7),
    ("高翻", "爆发力", 5, 3, 70.0, None, 180, 9),
    ("冲刺跑", "速度", None, None, None, 15.0, 120, 9),
    ("间歇跑", "耐力", None, None, None, 30.0, 60, 8),
    ("折返跑", "敏捷", None, None, None, 20.0, 90, 7),
    ("核心稳定", "核心", 3, 12, None, 15.0, 60, 6),
    ("跳箱", "增强式", 4, 8, None, 10.0, 120, 8),
    ("变速跑", "耐力", None, None, None, 25.0, 60, 7),
]

STRENGTH_EXERCISES = ["深蹲", "硬拉", "卧推", "高翻", "引体向上"]

INJURY_TYPES = ["肌肉拉伤", "关节扭伤", "肌腱炎", "韧带损伤"]
BODY_PARTS = ["大腿后侧", "膝关节", "踝关节", "腰部", "肩部", "腹股沟"]


def rand_date(start, end):
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def seed():
    init_db()
    session = SessionLocal()

    try:
        coach = User(username="coach_wang", password_hash=hash_pw("coach123"), role="coach")
        session.add(coach)
        session.flush()

        athletes = []
        for name, team, pos in ATHLETE_NAMES:
            ath = Athlete(
                name=name, team=team, position=pos,
                age=random.randint(18, 32),
                weight_kg=round(random.uniform(65, 95), 1),
                height_cm=round(random.uniform(170, 195), 1),
            )
            session.add(ath)
            session.flush()
            athletes.append(ath)

            u = User(
                username=name, password_hash=hash_pw("ath123"),
                role="athlete", athlete_id=ath.id,
            )
            session.add(u)

        session.flush()

        plan_start = date(2026, 1, 6)
        plan_end = date(2026, 3, 28)
        plan = TrainingPlan(
            name="冬训周期化计划", team="一线队", phase="准备期",
            start_date=plan_start, end_date=plan_end,
            description="12周渐进式负荷冬训计划",
        )
        session.add(plan)
        session.flush()

        plan2 = TrainingPlan(
            name="U21冬训周期化计划", team="U21梯队", phase="准备期",
            start_date=plan_start, end_date=plan_end,
            description="U21梯队12周冬训计划",
        )
        session.add(plan2)
        session.flush()

        sessions = []
        current = plan_start
        session_idx = 0
        while current <= plan_end:
            if current.weekday() < 5:
                for p in [plan, plan2]:
                    stype = random.choice(["力量", "速度", "耐力", "综合"])
                    intensity = random.randint(2, 5)
                    ts = TrainingSession(
                        plan_id=p.id, session_date=current,
                        session_type=stype, intensity_zone=intensity,
                    )
                    session.add(ts)
                    session.flush()
                    sessions.append(ts)

                    chosen = random.sample(EXERCISES, random.randint(4, 6))
                    for i, (ename, ecat, sets, reps, load, dur, rest, rpe) in enumerate(chosen):
                        te = TrainingExercise(
                            session_id=ts.id, exercise_name=ename,
                            exercise_category=ecat, sets=sets, reps=reps,
                            load_kg=load, duration_min=dur, rest_sec=rest,
                            rpe=rpe, order_index=i + 1,
                        )
                        session.add(te)
                        session.flush()

                        for ath in athletes:
                            if ath.team == p.name.split("冬训")[0].replace("U21", "U21梯队") if "U21" in p.name else "一线队":
                                pass
                            if (p == plan and ath.team == "一线队") or (p == plan2 and ath.team == "U21梯队"):
                                tl = TrainingLog(
                                    athlete_id=ath.id, session_id=ts.id,
                                    exercise_id=te.id,
                                    actual_sets=sets,
                                    actual_reps=reps + random.randint(-1, 1) if reps else None,
                                    actual_load_kg=load + random.uniform(-5, 5) if load else None,
                                    actual_duration_min=dur + random.uniform(-2, 2) if dur else None,
                                    actual_rpe=rpe + random.randint(-1, 1),
                                    completed=random.random() > 0.05,
                                    notes=random.choice(["", "", "", "感觉良好", "略感疲劳", "动作质量高"]),
                                )
                                session.add(tl)

            current += timedelta(days=1)

        session.flush()

        for ath in athletes:
            d = plan_start
            while d <= plan_end:
                for _ in range(random.randint(1, 3)):
                    t = datetime.combine(d, datetime.min.time()) + timedelta(
                        hours=random.randint(6, 18), minutes=random.randint(0, 59)
                    )
                    zone = random.choices([1, 2, 3, 4, 5], weights=[10, 25, 30, 25, 10])[0]
                    hr = random.randint(55 + zone * 20, 70 + zone * 25)
                    is_anom = random.random() < 0.03
                    if is_anom:
                        hr = random.choice([random.randint(180, 210), random.randint(30, 50)])
                    hr_rec = HeartRate(
                        athlete_id=ath.id, recorded_at=t, hr_bpm=hr,
                        hr_zone=zone, activity=random.choice(["训练", "热身", "间歇", "恢复跑"]),
                        is_anomaly=is_anom,
                        notes="异常心率" if is_anom else "",
                    )
                    session.add(hr_rec)

                if random.random() < 0.7:
                    t = datetime.combine(d, datetime.min.time()) + timedelta(
                        hours=random.randint(7, 17)
                    )
                    base_pace = random.uniform(4.0, 6.5)
                    is_anom = random.random() < 0.03
                    if is_anom:
                        base_pace = random.uniform(7.5, 10.0)
                    p_rec = Pace(
                        athlete_id=ath.id, recorded_at=t,
                        pace_min_per_km=round(base_pace, 2),
                        distance_km=round(random.uniform(2, 12), 1),
                        duration_min=round(base_pace * random.uniform(2, 12), 1),
                        activity=random.choice(["长跑", "间歇", "变速跑", "恢复跑"]),
                        is_anomaly=is_anom,
                        notes="配速异常" if is_anom else "",
                    )
                    session.add(p_rec)

                d += timedelta(days=1)

        session.flush()

        for ath in athletes:
            test_dates = [plan_start + timedelta(weeks=i * 2) for i in range(6)]
            for td in test_dates:
                for ex in STRENGTH_EXERCISES:
                    base = random.uniform(40, 150)
                    is_anom = random.random() < 0.03
                    if is_anom:
                        base *= random.uniform(0.5, 0.7)
                    st = StrengthTest(
                        athlete_id=ath.id, test_date=td,
                        exercise_name=ex,
                        one_rm_kg=round(base, 1),
                        max_reps=random.randint(1, 6),
                        max_reps_load_kg=round(base * random.uniform(0.7, 0.9), 1),
                        velocity_ms=round(random.uniform(0.4, 1.8), 2),
                        power_w=round(base * random.uniform(5, 15), 1),
                        is_anomaly=is_anom,
                        notes="力量下降明显" if is_anom else "",
                    )
                    session.add(st)

        session.flush()

        for ath in athletes:
            d = plan_start
            while d <= plan_end:
                overall = random.uniform(40, 100)
                is_anom = random.random() < 0.05
                if is_anom:
                    overall = random.uniform(20, 40)
                rs = RecoveryScore(
                    athlete_id=ath.id, score_date=d,
                    overall_score=round(overall, 1),
                    sleep_score=round(random.uniform(30, 100), 1),
                    fatigue_score=round(random.uniform(20, 100), 1),
                    stress_score=round(random.uniform(10, 90), 1),
                    soreness_score=round(random.uniform(10, 90), 1),
                    hrv_ms=round(random.uniform(40, 120), 1),
                    is_anomaly=is_anom,
                    notes="恢复不足" if is_anom else "",
                )
                session.add(rs)
                d += timedelta(days=1)

        session.flush()

        for ath in athletes:
            for _ in range(random.randint(1, 3)):
                inj = Injury(
                    athlete_id=ath.id,
                    injury_date=rand_date(plan_start, plan_end),
                    body_part=random.choice(BODY_PARTS),
                    injury_type=random.choice(INJURY_TYPES),
                    severity=random.choice(["mild", "moderate", "severe"]),
                    status=random.choice(["active", "recovering", "resolved"]),
                    coach_notes="教练组私密备注：需要关注此伤情发展",
                    athlete_notes="运动员个人感受描述",
                    return_date=rand_date(plan_start + timedelta(days=14), plan_end),
                )
                session.add(inj)

        session.commit()
        print("Seed data created successfully!")
        print(f"  Athletes: {len(athletes)}")
        print(f"  Training sessions: {len(sessions)}")
        print(f"  Users: coach_wang / coach123, athlete names / ath123")

    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()


if __name__ == "__main__":
    seed()
