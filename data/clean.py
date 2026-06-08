import pandas as pd
import numpy as np
import os
import glob

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)))
CLEAN_DIR = os.path.join(DATA_DIR, "cleaned")
os.makedirs(CLEAN_DIR, exist_ok=True)


def load_csv(filename):
    path = os.path.join(DATA_DIR, filename)
    if os.path.exists(path):
        return pd.read_csv(path, encoding="utf-8-sig")
    return pd.DataFrame()


def clean_orders(df):
    if df.empty:
        return df
    df["order_time"] = pd.to_datetime(df["order_time"], errors="coerce")
    df = df.dropna(subset=["order_time"])
    df["quantity"] = df["quantity"].clip(lower=1).astype(int)
    df["is_cancelled"] = df["is_cancelled"].astype(bool)
    df.loc[~df["is_cancelled"], "cancel_reason"] = ""
    valid_meals = ["早餐", "午餐", "晚餐"]
    df = df[df["meal_period"].isin(valid_meals)]
    df = df.drop_duplicates(subset=["id"])
    return df


def clean_ratings(df):
    if df.empty:
        return df
    df["score"] = df["score"].clip(1, 5).astype(int)
    df["rated_at"] = pd.to_datetime(df["rated_at"], errors="coerce")
    df = df.dropna(subset=["rated_at"])
    df = df.drop_duplicates(subset=["id"])
    return df


def clean_dishes(df):
    if df.empty:
        return df
    df["cost_price"] = pd.to_numeric(df["cost_price"], errors="coerce")
    df["sell_price"] = pd.to_numeric(df["sell_price"], errors="coerce")
    df = df.dropna(subset=["cost_price", "sell_price"])
    df = df[df["sell_price"] > df["cost_price"]]
    df["is_active"] = df["is_active"].astype(bool)
    df = df.drop_duplicates(subset=["id"])
    return df


def clean_weather(df):
    if df.empty:
        return df
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])
    valid_weather = ["晴天", "多云", "阴天", "小雨", "中雨", "大雨", "雪"]
    df = df[df["weather_type"].isin(valid_weather)]
    df["temperature"] = pd.to_numeric(df["temperature"], errors="coerce")
    df["humidity"] = pd.to_numeric(df["humidity"], errors="coerce")
    df = df.drop_duplicates(subset=["date"])
    return df


def clean_windows(df):
    if df.empty:
        return df
    df = df.drop_duplicates(subset=["id"])
    return df


def run():
    print("Loading raw data...")
    orders = load_csv("orders.csv")
    ratings = load_csv("ratings.csv")
    dishes = load_csv("dishes.csv")
    weather = load_csv("weather.csv")
    windows = load_csv("windows.csv")

    print("Cleaning orders...")
    orders = clean_orders(orders)
    print("Cleaning ratings...")
    ratings = clean_ratings(ratings)
    print("Cleaning dishes...")
    dishes = clean_dishes(dishes)
    print("Cleaning weather...")
    weather = clean_weather(weather)
    print("Cleaning windows...")
    windows = clean_windows(windows)

    valid_dish_ids = set(dishes["id"].tolist())
    orders = orders[orders["dish_id"].isin(valid_dish_ids)]
    ratings = ratings[ratings["dish_id"].isin(valid_dish_ids)]

    valid_window_ids = set(windows["id"].tolist())
    orders = orders[orders["window_id"].isin(valid_window_ids)]
    dishes = dishes[dishes["window_id"].isin(valid_window_ids)]

    for name, df in [("orders", orders), ("ratings", ratings), ("dishes", dishes), ("weather", weather), ("windows", windows)]:
        out_path = os.path.join(CLEAN_DIR, f"{name}.csv")
        df.to_csv(out_path, index=False, encoding="utf-8-sig")
        print(f"Saved cleaned {name}: {len(df)} rows -> {out_path}")

    print("Data cleaning complete.")


if __name__ == "__main__":
    run()
