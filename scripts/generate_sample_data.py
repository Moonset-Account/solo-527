#!/usr/bin/env python3
"""
生成门诊爽约风险预测的示例样本集
包含：科室配置、时段配置、预约记录（含已标注的actual_status）
"""
import pandas as pd
import numpy as np
import os
import random
from datetime import datetime, timedelta

random.seed(42)
np.random.seed(42)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "app", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

DEPARTMENTS = [
    {"code": "NEU", "name": "神经内科", "base_rate": 0.18, "capacity_coef": 0.9},
    {"code": "CAR", "name": "心血管内科", "base_rate": 0.12, "capacity_coef": 1.0},
    {"code": "PED", "name": "儿科", "base_rate": 0.25, "capacity_coef": 1.3},
    {"code": "DER", "name": "皮肤科", "base_rate": 0.20, "capacity_coef": 0.8},
    {"code": "ORT", "name": "骨科", "base_rate": 0.15, "capacity_coef": 0.85},
    {"code": "OPH", "name": "眼科", "base_rate": 0.17, "capacity_coef": 0.8},
    {"code": "GYN", "name": "妇产科", "base_rate": 0.22, "capacity_coef": 1.1},
    {"code": "GEN", "name": "全科医学", "base_rate": 0.14, "capacity_coef": 1.0},
    {"code": "RES", "name": "呼吸内科", "base_rate": 0.16, "capacity_coef": 1.0},
    {"code": "GAS", "name": "消化内科", "base_rate": 0.13, "capacity_coef": 0.9},
    {"code": "END", "name": "内分泌科", "base_rate": 0.11, "capacity_coef": 0.95},
    {"code": "ONC", "name": "肿瘤科", "base_rate": 0.08, "capacity_coef": 1.2},
]

DOCTORS = {
    "NEU": ["张主任", "李副主任", "王医师", "赵医师", "刘医师"],
    "CAR": ["陈主任", "杨副主任", "黄医师", "周医师"],
    "PED": ["林主任", "吴医师", "郑医师", "孙医师", "马医师"],
    "DER": ["朱主任", "胡医师", "郭医师"],
    "ORT": ["何主任", "高副主任", "罗医师"],
    "OPH": ["梁主任", "宋医师", "谢医师"],
    "GYN": ["唐主任", "许副主任", "冯医师", "邓医师"],
    "GEN": ["韩主任", "曹医师", "彭医师"],
    "RES": ["曾主任", "萧医师", "田医师"],
    "GAS": ["董主任", "潘医师", "袁医师"],
    "END": ["蒋主任", "蔡医师"],
    "ONC": ["余主任", "杜副主任", "叶医师", "程医师"],
}

CHANNELS = [
    ("现场挂号", 0.15),
    ("电话预约", 0.20),
    ("APP预约", 0.30),
    ("微信预约", 0.25),
    ("官网预约", 0.07),
    ("第三方平台", 0.03),
]

APPT_TYPES = [
    ("普通门诊", 0.60),
    ("专家门诊", 0.25),
    ("特需门诊", 0.05),
    ("复诊", 0.10),
]

REMINDERS = [
    ("sms", 0.55),
    ("call", 0.10),
    ("wechat", 0.25),
    ("app_push", 0.08),
    ("none", 0.02),
]

WEATHERS = [
    ("晴", 0.45), ("多云", 0.20), ("阴", 0.10),
    ("小雨", 0.10), ("中雨", 0.07), ("大雨", 0.03),
    ("雪", 0.02), ("雾", 0.02), ("霾", 0.01),
]

GENDERS = [("男", 0.48), ("女", 0.52)]

def weighted_choice(choices):
    items, weights = zip(*choices)
    return random.choices(items, weights=weights, k=1)[0]

def generate_departments():
    rows = []
    for d in DEPARTMENTS:
        rows.append({
            "code": d["code"],
            "name": d["name"],
            "description": f"{d['name']}主治相关疾病，月均门诊量约{int(5000 * d['capacity_coef'])}人次",
            "default_no_show_rate": int(d["base_rate"] * 100),
        })
    df = pd.DataFrame(rows)
    path = os.path.join(OUTPUT_DIR, "sample_departments.csv")
    df.to_csv(path, index=False, encoding="utf-8-sig")
    print(f"✓ 生成科室配置: {len(df)}条 → {path}")
    return df

def generate_time_slots(dept_df):
    rows = []
    for _, dept in dept_df.iterrows():
        dept_info = next(d for d in DEPARTMENTS if d["code"] == dept["code"])
        capacity_base = int(25 * dept_info["capacity_coef"])
        for day in range(0, 7):
            weekday_factor = 1.0 if day < 5 else 0.7
            morning_cap = int(capacity_base * weekday_factor)
            afternoon_cap = int(capacity_base * 0.7 * weekday_factor)
            morning_total = morning_cap * 12
            morning_noshow = int(morning_total * dept_info["base_rate"] * (1 + (day >= 5) * 0.2))
            rows.append({
                "department_code": dept["code"],
                "day_of_week": day,
                "start_time": "08:00",
                "end_time": "12:00",
                "capacity": morning_cap,
                "historical_no_show_count": morning_noshow,
                "historical_total_count": morning_total,
            })
            afternoon_total = afternoon_cap * 12
            afternoon_noshow = int(afternoon_total * dept_info["base_rate"] * 1.1)
            rows.append({
                "department_code": dept["code"],
                "day_of_week": day,
                "start_time": "14:00",
                "end_time": "17:30",
                "capacity": afternoon_cap,
                "historical_no_show_count": afternoon_noshow,
                "historical_total_count": afternoon_total,
            })
    df = pd.DataFrame(rows)
    path = os.path.join(OUTPUT_DIR, "sample_time_slots.csv")
    df.to_csv(path, index=False, encoding="utf-8-sig")
    print(f"✓ 生成时段配置: {len(df)}条 → {path}")
    return df

def generate_appointments(count=2500, start_date=None):
    if start_date is None:
        start_date = datetime.now() - timedelta(days=90)

    rows = []
    noshow_total = 0
    attended_total = 0

    for i in range(count):
        appt_date = start_date + timedelta(
            days=np.random.randint(0, 90),
            hours=np.random.randint(0, 24),
        )
        appt_date = appt_date.replace(minute=0, second=0, microsecond=0)

        dept_info = random.choice(DEPARTMENTS)
        dept_code = dept_info["code"]
        doctor = random.choice(DOCTORS[dept_code])

        is_morning = random.random() < 0.6
        if is_morning:
            hour = np.random.randint(8, 12)
            minute = random.choice([0, 15, 30, 45])
        else:
            hour = np.random.randint(14, 18)
            minute = random.choice([0, 15, 30, 45])
        appt_time = f"{hour:02d}:{minute:02d}"

        age = int(np.clip(np.random.normal(42, 18), 1, 95))
        gender = weighted_choice(GENDERS)
        channel = weighted_choice(CHANNELS)
        appt_type = weighted_choice(APPT_TYPES)
        reminder = weighted_choice(REMINDERS)
        weather = weighted_choice(WEATHERS)
        days_in_advance = max(0, int(np.random.exponential(4)))
        is_revisit = appt_type == "复诊" or random.random() < 0.25

        hist_total = np.random.randint(0, 15) if random.random() < 0.6 else 0
        hist_noshow = int(hist_total * np.random.beta(1, 5)) if hist_total > 0 else 0

        is_holiday = (appt_date.weekday() >= 5) or random.random() < 0.03
        distance_km = round(np.random.exponential(5) + 0.5, 1)

        risk_score = dept_info["base_rate"]

        if appt_type == "专家门诊":
            risk_score *= 0.75
        elif appt_type == "特需门诊":
            risk_score *= 0.6
        if appt_type == "复诊":
            risk_score *= 0.8
        if channel in ["APP预约", "微信预约"]:
            risk_score *= 0.85
        elif channel == "现场挂号":
            risk_score *= 1.3
        if reminder == "call":
            risk_score *= 0.6
        elif reminder == "wechat":
            risk_score *= 0.75
        elif reminder == "sms":
            risk_score *= 0.9
        elif reminder == "none":
            risk_score *= 1.6
        if days_in_advance > 7:
            risk_score *= 1.3
        elif days_in_advance == 0:
            risk_score *= 0.7
        if hist_total > 3:
            hist_rate = hist_noshow / hist_total
            risk_score = risk_score * 0.5 + hist_rate * 0.5
        if age < 18:
            risk_score *= 1.2
        elif age > 65:
            risk_score *= 1.15
        if weather in ["大雨", "雪", "雾", "霾"]:
            risk_score *= 1.4
        elif weather in ["小雨", "中雨"]:
            risk_score *= 1.15
        if is_holiday:
            risk_score *= 1.2
        if distance_km > 15:
            risk_score *= 1.25
        elif distance_km < 2:
            risk_score *= 0.85
        if is_morning:
            risk_score *= 0.92
        if not is_revisit and hist_total == 0:
            risk_score *= 1.1

        risk_score = float(np.clip(risk_score, 0.02, 0.95))
        actual_show = random.random() > risk_score

        if actual_show:
            status = "attended"
            attended_total += 1
        else:
            status = "noshow"
            noshow_total += 1

        if i >= int(count * 0.75):
            status = "pending"

        rows.append({
            "appointment_no": f"A{appt_date.strftime('%Y%m%d')}{i+1:05d}",
            "patient_age": age,
            "patient_gender": gender,
            "department_code": dept_code,
            "doctor_name": doctor,
            "appointment_date": appt_date.strftime("%Y-%m-%d"),
            "appointment_time": appt_time,
            "appointment_type": appt_type,
            "is_revisit": int(is_revisit),
            "channel": channel,
            "reminder_method": reminder,
            "days_in_advance": days_in_advance,
            "historical_no_show_count": hist_noshow,
            "historical_total_count": hist_total,
            "distance_km": distance_km,
            "weather_condition": weather,
            "is_holiday": int(is_holiday),
            "actual_status": status,
            "remark": f"{'初诊' if not is_revisit else '复诊'}患者，通过{channel}预约，天气{weather}",
        })

    df = pd.DataFrame(rows)
    path = os.path.join(OUTPUT_DIR, "sample_appointments.csv")
    df.to_csv(path, index=False, encoding="utf-8-sig")

    actual_count = len(df[df["actual_status"] != "pending"])
    ns_rate = noshow_total / actual_count * 100 if actual_count > 0 else 0

    print(f"✓ 生成预约记录: {len(df)}条")
    print(f"  - 已标注(训练用): {actual_count}条")
    print(f"  - 待评分(未来): {len(df) - actual_count}条")
    print(f"  - 爽约率: {ns_rate:.2f}% (爽约{noshow_total}/已就诊{attended_total})")
    print(f"  - 文件: {path}")

    return df

def generate_new_patients(count=200):
    today = datetime.now() + timedelta(days=1)
    return generate_appointments(count=count, start_date=today)

if __name__ == "__main__":
    print("=" * 60)
    print("🏥 门诊爽约风险预测 - 示例数据集生成工具")
    print("=" * 60)
    dept_df = generate_departments()
    slot_df = generate_time_slots(dept_df)
    appt_df = generate_appointments(count=3000)
    new_df = generate_new_patients(count=300)
    print("=" * 60)
    print(f"✅ 所有示例数据已生成到: {OUTPUT_DIR}")
    print("=" * 60)
