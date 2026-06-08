import random
import csv
import os
from datetime import datetime, timedelta
import numpy as np

random.seed(42)
np.random.seed(42)

WINDOW_NAMES = ["川味窗口", "粤菜窗口", "面食窗口", "快餐窗口", "特色小炒", "清真窗口"]
CUISINE_TYPES = ["川菜", "粤菜", "面食", "快餐", "小炒", "清真"]
MEAL_PERIODS = ["早餐", "午餐", "晚餐"]
CANCEL_REASONS = ["口味不佳", "分量不足", "食材不新鲜", "等待时间过长", "价格偏高", "其他"]
WEATHER_TYPES = ["晴天", "多云", "阴天", "小雨", "中雨", "大雨", "雪"]

DISH_TEMPLATES = {
    "川菜": [
        ("麻婆豆腐", 3.5, 8), ("宫保鸡丁", 5.0, 12), ("水煮鱼", 8.0, 18),
        ("回锅肉", 6.0, 14), ("鱼香肉丝", 5.5, 13), ("辣子鸡", 6.5, 15),
        ("夫妻肺片", 7.0, 16), ("毛血旺", 9.0, 20), ("东坡肘子", 10.0, 22),
        ("酸菜鱼", 8.5, 19),
    ],
    "粤菜": [
        ("白切鸡", 8.0, 18), ("蒸排骨", 5.5, 13), ("虾饺", 6.0, 14),
        ("煲仔饭", 4.5, 12), ("肠粉", 3.0, 8), ("叉烧饭", 6.5, 15),
        ("皮蛋瘦肉粥", 2.5, 6), ("双皮奶", 3.0, 8),
    ],
    "面食": [
        ("兰州拉面", 3.5, 10), ("刀削面", 3.0, 9), ("炸酱面", 3.5, 10),
        ("牛肉面", 5.0, 12), ("担担面", 4.0, 11), ("热干面", 3.0, 9),
        ("馄饨", 4.0, 10), ("水饺", 4.5, 11),
    ],
    "快餐": [
        ("红烧肉饭", 6.0, 14), ("鸡腿饭", 5.5, 13), ("番茄炒蛋饭", 3.5, 10),
        ("土豆牛肉饭", 6.5, 15), ("木须肉饭", 4.5, 12), ("咖喱鸡饭", 5.0, 13),
        ("青椒肉丝饭", 4.0, 11),
    ],
    "小炒": [
        ("干锅花菜", 4.0, 11), ("铁板牛肉", 9.0, 20), ("干煸四季豆", 3.5, 10),
        ("蒜蓉西兰花", 3.0, 9), ("糖醋里脊", 6.0, 14), ("香辣虾", 10.0, 22),
        ("地三鲜", 3.5, 10),
    ],
    "清真": [
        ("大盘鸡", 8.0, 18), ("羊肉串", 5.0, 12), ("手抓饭", 5.5, 13),
        ("烤馕", 1.5, 5), ("牛肉拉面", 4.0, 11), ("羊杂汤", 6.0, 14),
    ],
}

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)


def generate_windows():
    rows = []
    for i, name in enumerate(WINDOW_NAMES):
        rows.append({"id": i + 1, "name": name, "location": f"A区{i+1}号"})
    return rows


def generate_dishes(windows):
    rows = []
    did = 1
    for w in windows:
        cuisine = CUISINE_TYPES[w["id"] - 1]
        for name, cost, sell in DISH_TEMPLATES[cuisine]:
            rows.append({
                "id": did,
                "name": name,
                "cuisine_type": cuisine,
                "window_id": w["id"],
                "cost_price": cost,
                "sell_price": sell,
                "is_active": True,
            })
            did += 1
    return rows


def generate_weather(start_date, end_date):
    rows = []
    d = start_date
    while d <= end_date:
        wt = random.choices(WEATHER_TYPES, weights=[30, 25, 15, 12, 8, 5, 5])[0]
        temp = round(random.uniform(-5, 38), 1)
        humidity = round(random.uniform(20, 95), 1)
        rows.append({"date": d.isoformat(), "weather_type": wt, "temperature": temp, "humidity": humidity})
        d += timedelta(days=1)
    return rows


def generate_orders(dishes, start_date, end_date):
    rows = []
    oid = 1
    d = start_date
    while d <= end_date:
        for meal in MEAL_PERIODS:
            base_multiplier = {"早餐": 0.6, "午餐": 1.0, "晚餐": 0.8}[meal]
            for dish in dishes:
                if meal == "早餐" and dish["cuisine_type"] not in ("面食", "快餐", "粤菜"):
                    continue
                popularity = np.random.poisson(lam=8 * base_multiplier)
                for _ in range(popularity):
                    cancel_chance = random.random()
                    is_cancelled = cancel_chance < 0.06
                    cancel_reason = random.choice(CANCEL_REASONS) if is_cancelled else ""
                    hour_range = {"早餐": (6, 9), "午餐": (11, 14), "晚餐": (17, 20)}[meal]
                    order_hour = random.randint(hour_range[0], hour_range[1])
                    order_min = random.randint(0, 59)
                    order_time = d.replace(hour=order_hour, minute=order_min)
                    rows.append({
                        "id": oid,
                        "dish_id": dish["id"],
                        "window_id": dish["window_id"],
                        "quantity": random.randint(1, 2),
                        "meal_period": meal,
                        "is_cancelled": is_cancelled,
                        "cancel_reason": cancel_reason,
                        "order_time": order_time.isoformat(),
                    })
                    oid += 1
        d += timedelta(days=1)
    return rows


def generate_ratings(dishes, start_date, end_date):
    rows = []
    rid = 1
    for dish in dishes:
        num_ratings = max(1, int(np.random.poisson(lam=15)))
        for _ in range(num_ratings):
            d = start_date + timedelta(days=random.randint(0, (end_date - start_date).days))
            base_score = np.random.normal(loc=3.5, scale=0.8)
            score = max(1, min(5, round(base_score)))
            rows.append({
                "id": rid,
                "dish_id": dish["id"],
                "score": score,
                "comment": "",
                "rated_at": d.isoformat(),
            })
            rid += 1
    return rows


def write_csv(rows, filename):
    if not rows:
        return
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"Written {len(rows)} rows to {path}")


def main():
    start = datetime(2025, 1, 1)
    end = datetime(2025, 12, 31)

    windows = generate_windows()
    dishes = generate_dishes(windows)

    print("Generating weather data...")
    weather = generate_weather(start, end)
    write_csv(weather, "weather.csv")

    print("Generating order data (this may take a while)...")
    orders = generate_orders(dishes, start, end)
    write_csv(orders, "orders.csv")

    print("Generating rating data...")
    ratings = generate_ratings(dishes, start, end)
    write_csv(ratings, "ratings.csv")

    write_csv(windows, "windows.csv")
    write_csv(dishes, "dishes.csv")

    print(f"Seed data generation complete. Files in {DATA_DIR}")


if __name__ == "__main__":
    main()
