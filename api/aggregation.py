import pandas as pd
import numpy as np
import os
import logging
from utils.helpers import bayesian_score

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "cleaned")

_data_cache = {}


def _load(name):
    if name in _data_cache:
        return _data_cache[name].copy()
    path = os.path.join(DATA_DIR, f"{name}.csv")
    if os.path.exists(path):
        df = pd.read_csv(path, encoding="utf-8-sig")
        _data_cache[name] = df
        return df.copy()
    return pd.DataFrame()


def _base_joins():
    orders = _load("orders")
    dishes = _load("dishes")
    ratings = _load("ratings")
    weather = _load("weather")
    windows = _load("windows")
    return orders, dishes, ratings, weather, windows


def _merge_order_dish(orders, dishes, windows):
    dish_cols = dishes.rename(columns={"id": "dish_id", "window_id": "window_id_dish"})
    merged = orders.merge(dish_cols, on="dish_id", how="left", suffixes=("", "_dish"))
    win_cols = windows.rename(columns={"id": "window_id", "name": "window_name"})
    merged = merged.merge(win_cols, on="window_id", how="left")
    return merged


def _apply_filters(df, filters):
    if not filters:
        return df
    if "window_id" in filters and filters["window_id"]:
        if "window_id" in df.columns:
            df = df[df["window_id"].isin(filters["window_id"])]
    if "cuisine_type" in filters and filters["cuisine_type"]:
        if "cuisine_type" in df.columns:
            df = df[df["cuisine_type"].isin(filters["cuisine_type"])]
    if "meal_period" in filters and filters["meal_period"]:
        if "meal_period" in df.columns:
            df = df[df["meal_period"].isin(filters["meal_period"])]
    if "month" in filters and filters["month"]:
        if "order_month" in df.columns:
            df = df[df["order_month"].isin(filters["month"])]
    if "cost_range" in filters and filters["cost_range"]:
        if "cost_price" in df.columns:
            mask = pd.Series(False, index=df.index)
            for r in filters["cost_range"]:
                mask |= (df["cost_price"] >= r["min"]) & (df["cost_price"] < r["max"])
            df = df[mask]
    return df


def _build_filter_sql(filters, mode="mv"):
    clauses = []
    params = {}
    if not filters:
        return "", params

    if mode == "mv":
        p_window = "window_id"
        p_cuisine = "cuisine_type"
        p_meal = "meal_period"
        p_month_date = "stat_date"
        p_cost = "cost_price"
    elif mode == "order_join":
        p_window = "d.window_id"
        p_cuisine = "d.cuisine_type"
        p_meal = "o.meal_period"
        p_month_date = "o.order_time"
        p_cost = "d.cost_price"
    else:
        p_window = "window_id"
        p_cuisine = "cuisine_type"
        p_meal = "meal_period"
        p_month_date = "stat_date"
        p_cost = "cost_price"

    if "window_id" in filters and filters["window_id"]:
        placeholders = ",".join(f":wid{i}" for i in range(len(filters["window_id"])))
        clauses.append(f"{p_window} IN ({placeholders})")
        for i, v in enumerate(filters["window_id"]):
            params[f"wid{i}"] = v
    if "cuisine_type" in filters and filters["cuisine_type"]:
        placeholders = ",".join(f":ct{i}" for i in range(len(filters["cuisine_type"])))
        clauses.append(f"{p_cuisine} IN ({placeholders})")
        for i, v in enumerate(filters["cuisine_type"]):
            params[f"ct{i}"] = v
    if "meal_period" in filters and filters["meal_period"]:
        placeholders = ",".join(f":mp{i}" for i in range(len(filters["meal_period"])))
        clauses.append(f"{p_meal} IN ({placeholders})")
        for i, v in enumerate(filters["meal_period"]):
            params[f"mp{i}"] = v
    if "month" in filters and filters["month"]:
        placeholders = ",".join(f":mo{i}" for i in range(len(filters["month"])))
        clauses.append(f"EXTRACT(MONTH FROM {p_month_date})::int IN ({placeholders})")
        for i, v in enumerate(filters["month"]):
            params[f"mo{i}"] = v
    if "cost_range" in filters and filters["cost_range"]:
        cost_clauses = []
        for i, r in enumerate(filters["cost_range"]):
            cost_clauses.append(f"({p_cost} >= :crmin{i} AND {p_cost} < :crmax{i})")
            params[f"crmin{i}"] = r["min"]
            params[f"crmax{i}"] = r["max"]
        clauses.append(f"({' OR '.join(cost_clauses)})")
    where = " AND ".join(clauses)
    return (f" WHERE {where}" if where else ""), params


def _db_anomaly_summary(filters=None):
    from db.connection import query_to_df
    where_sql, params = _build_filter_sql(filters, mode="mv")
    sql = f"""
        SELECT
            dish_id,
            dish_name,
            cuisine_type,
            window_id,
            cost_price,
            sell_price,
            SUM(order_count)::int AS order_count,
            SUM(cancel_count)::int AS cancel_count,
            SUM(total_quantity)::int AS total_quantity,
            CASE WHEN SUM(rating_count) > 0
                THEN SUM(avg_score * rating_count) / SUM(rating_count)
                ELSE 0
            END AS avg_score,
            SUM(rating_count)::int AS rating_count,
            CASE WHEN SUM(rating_count) > 0
                THEN (SUM(rating_count) * (SUM(avg_score * rating_count) / SUM(rating_count)) + 5 * 3.0) / (SUM(rating_count) + 5)
                ELSE 3.0
            END AS bayesian_score
        FROM mv_dish_daily_stats
        {where_sql}
        GROUP BY dish_id, dish_name, cuisine_type, window_id, cost_price, sell_price
    """
    return query_to_df(sql, params)


def _db_satisfaction_matrix(filters=None):
    from db.connection import query_to_df
    where_sql, params = _build_filter_sql(filters)
    sql = f"""
        SELECT
            dish_id,
            dish_name AS name,
            cuisine_type,
            window_id,
            cost_price,
            sell_price,
            SUM(order_count)::int AS order_count,
            SUM(cancel_count)::int AS cancel_count,
            CASE WHEN SUM(rating_count) > 0 THEN SUM(avg_score * rating_count) / SUM(rating_count) ELSE 0 END AS avg_score,
            SUM(rating_count)::int AS rating_count,
            CASE WHEN SUM(rating_count) > 0
                THEN (SUM(rating_count) * (SUM(avg_score * rating_count) / SUM(rating_count)) + 5 * 3.0) / (SUM(rating_count) + 5)
                ELSE 3.0
            END AS bayesian
        FROM mv_dish_daily_stats
        {where_sql}
        GROUP BY dish_id, dish_name, cuisine_type, window_id, cost_price, sell_price
        ORDER BY bayesian ASC
    """
    df = query_to_df(sql, params)
    if df.empty:
        return df
    from db.connection import get_engine
    if get_engine():
        win_df = query_to_df("SELECT id, name AS window_name FROM windows")
        if not win_df.empty:
            df = df.merge(win_df, left_on="window_id", right_on="id", how="left")
            if "id" in df.columns:
                df = df.drop(columns=["id"])
    df["sample_sufficient"] = df["rating_count"] >= 10
    return df


def _db_sales_trend(filters=None):
    from db.connection import query_to_df
    where_sql, params = _build_filter_sql(filters)
    sql = f"""
        SELECT
            stat_date AS date,
            SUM(order_count)::int AS order_count,
            SUM(order_count * sell_price)::numeric AS revenue
        FROM mv_dish_daily_stats
        {where_sql}
        GROUP BY stat_date
        ORDER BY stat_date
    """
    return query_to_df(sql, params)


def _db_cancel_reasons(filters=None):
    from db.connection import query_to_df
    where_sql, params = _build_filter_sql(filters, mode="order_join")
    sql = f"""
        SELECT o.cancel_reason, COUNT(*) AS count
        FROM orders o
        JOIN dishes d ON o.dish_id = d.id
        WHERE o.is_cancelled = TRUE
        {('AND ' + where_sql.replace(' WHERE ', '')) if where_sql else ''}
        GROUP BY o.cancel_reason
        ORDER BY count DESC
    """
    return query_to_df(sql, params)


def _db_cost_margin(filters=None):
    from db.connection import query_to_df
    where_sql, params = _build_filter_sql(filters)
    sql = f"""
        SELECT
            dish_id,
            dish_name,
            cuisine_type,
            cost_price,
            sell_price,
            SUM(order_count - cancel_count)::int AS effective_orders,
            SUM((order_count - cancel_count) * sell_price)::numeric AS total_revenue,
            SUM((order_count) * cost_price)::numeric AS total_cost,
            SUM((order_count - cancel_count) * sell_price)::numeric
                - SUM((order_count) * cost_price)::numeric AS total_profit
        FROM mv_dish_daily_stats
        {where_sql}
        GROUP BY dish_id, dish_name, cuisine_type, cost_price, sell_price
        ORDER BY total_profit DESC
    """
    df = query_to_df(sql, params)
    if not df.empty:
        df["margin_rate"] = (df["total_profit"] / df["total_revenue"].replace(0, np.nan) * 100).round(2)
        df = df.rename(columns={"dish_name": "dish_name"})
        from db.connection import get_engine
        if get_engine():
            win_df = query_to_df("SELECT id, name AS window_name FROM windows")
            if not win_df.empty:
                df = df.merge(win_df, left_on="dish_id", right_on="id", how="left")
                if "id" in df.columns:
                    df = df.drop(columns=["id"])
    return df


def _db_weather_correlation(filters=None):
    from db.connection import query_to_df
    where_sql, params = _build_filter_sql(filters, mode="order_join")
    sql = f"""
        SELECT
            w.weather_type,
            COUNT(o.id)::int AS avg_daily_orders,
            AVG(d.sell_price)::numeric AS avg_revenue
        FROM orders o
        JOIN dishes d ON o.dish_id = d.id
        JOIN weather w ON w.date = DATE(o.order_time)
        {('WHERE ' + where_sql.replace(' WHERE ', '')) if where_sql else ''}
        GROUP BY w.weather_type
        ORDER BY avg_daily_orders DESC
    """
    return query_to_df(sql, params)


def get_anomaly_summary(filters=None):
    from db.connection import is_db_available
    if is_db_available():
        db_df = _db_anomaly_summary(filters)
        if not db_df.empty:
            return _build_anomaly_from_db(db_df)

    orders, dishes, ratings, weather, windows = _base_joins()
    if orders.empty or dishes.empty:
        return {"anomalies": [], "stats": {}}

    orders["order_time"] = pd.to_datetime(orders["order_time"])
    orders["order_month"] = orders["order_time"].dt.month
    ratings["rated_at"] = pd.to_datetime(ratings["rated_at"])

    merged = _merge_order_dish(orders, dishes, windows)
    merged = _apply_filters(merged, filters)

    anomalies = []

    cancel_by_dish = merged.groupby("dish_id").agg(
        total=("id", "count"),
        cancelled=("is_cancelled", "sum"),
        dish_name=("name", "first"),
        window_name=("window_name", "first"),
    ).reset_index()
    cancel_by_dish["cancel_rate"] = cancel_by_dish["cancelled"] / cancel_by_dish["total"] * 100

    high_cancel = cancel_by_dish[(cancel_by_dish["cancel_rate"] > 12) & (cancel_by_dish["total"] >= 10)]
    for _, row in high_cancel.iterrows():
        anomalies.append({
            "type": "退餐率过高",
            "severity": "critical",
            "dish": row["dish_name"],
            "window": row["window_name"],
            "detail": f"退餐率 {row['cancel_rate']:.1f}%（阈值 12%）",
        })

    warn_cancel = cancel_by_dish[(cancel_by_dish["cancel_rate"] > 8) & (cancel_by_dish["cancel_rate"] <= 12) & (cancel_by_dish["total"] >= 10)]
    for _, row in warn_cancel.iterrows():
        anomalies.append({
            "type": "退餐率偏高",
            "severity": "warning",
            "dish": row["dish_name"],
            "window": row["window_name"],
            "detail": f"退餐率 {row['cancel_rate']:.1f}%（预警 8%）",
        })

    if "meal_period" not in (filters or {}):
        rating_agg = ratings.groupby("dish_id").agg(
            avg_score=("score", "mean"),
            rating_count=("id", "count"),
        ).reset_index()
    else:
        filtered_dish_ids = set(merged["dish_id"].unique())
        filt_ratings = ratings[ratings["dish_id"].isin(filtered_dish_ids)]
        rating_agg = filt_ratings.groupby("dish_id").agg(
            avg_score=("score", "mean"),
            rating_count=("id", "count"),
        ).reset_index()

    rating_agg["bayesian"] = rating_agg.apply(
        lambda r: bayesian_score(r["rating_count"], r["avg_score"]), axis=1
    )
    rating_with_dish = rating_agg.merge(
        dishes[["id", "name", "window_id"]], left_on="dish_id", right_on="id", how="left"
    )
    rating_with_dish = rating_with_dish.merge(
        windows[["id", "name"]], left_on="window_id", right_on="id", how="left", suffixes=("", "_win")
    )

    low_score = rating_with_dish[(rating_with_dish["bayesian"] < 2.5) & (rating_with_dish["rating_count"] >= 10)]
    for _, row in low_score.iterrows():
        anomalies.append({
            "type": "满意度偏低",
            "severity": "warning",
            "dish": row["name"],
            "window": row.get("name_win", ""),
            "detail": f"贝叶斯得分 {row['bayesian']:.2f}（评价 {row['rating_count']} 条）",
        })

    sales_daily = merged.groupby(merged["order_time"].dt.date).agg(total=("id", "count")).reset_index()
    sales_daily.columns = ["date", "total"]
    if len(sales_daily) > 7:
        sales_daily["ma7"] = sales_daily["total"].rolling(7, min_periods=1).mean()
        sales_daily["deviation"] = (sales_daily["total"] - sales_daily["ma7"]) / sales_daily["ma7"] * 100
        sharp_drop = sales_daily[sales_daily["deviation"] < -30]
        for _, row in sharp_drop.iterrows():
            anomalies.append({
                "type": "销量骤降",
                "severity": "warning",
                "dish": "全局",
                "window": "全局",
                "detail": f"{row['date']} 销量偏离7日均线 {row['deviation']:.1f}%",
            })

    total_orders = len(merged)
    total_cancelled = int(merged["is_cancelled"].sum())
    total_revenue = float((merged[~merged["is_cancelled"]]["sell_price"] * merged[~merged["is_cancelled"]]["quantity"]).sum())
    total_cost = float((merged["cost_price"] * merged["quantity"]).sum())

    return {
        "anomalies": anomalies,
        "stats": {
            "total_orders": total_orders,
            "total_cancelled": total_cancelled,
            "cancel_rate": round(total_cancelled / max(total_orders, 1) * 100, 2),
            "total_revenue": round(total_revenue, 2),
            "total_cost": round(total_cost, 2),
            "gross_margin_rate": round((total_revenue - total_cost) / max(total_revenue, 1) * 100, 2),
        },
    }


def _build_anomaly_from_db(db_df):
    anomalies = []
    win_map = {}
    from db.connection import get_engine
    if get_engine():
        from db.connection import query_to_df
        win_df = query_to_df("SELECT id, name FROM windows")
        if not win_df.empty:
            win_map = dict(zip(win_df["id"], win_df["name"]))

    for _, row in db_df.iterrows():
        total = int(row["order_count"]) if pd.notna(row["order_count"]) else 0
        cancelled = int(row["cancel_count"]) if pd.notna(row["cancel_count"]) else 0
        if total < 10:
            continue
        cancel_rate = cancelled / max(total, 1) * 100
        wname = win_map.get(row.get("window_id"), "")
        if cancel_rate > 12:
            anomalies.append({"type": "退餐率过高", "severity": "critical", "dish": row["dish_name"], "window": wname, "detail": f"退餐率 {cancel_rate:.1f}%（阈值 12%）"})
        elif cancel_rate > 8:
            anomalies.append({"type": "退餐率偏高", "severity": "warning", "dish": row["dish_name"], "window": wname, "detail": f"退餐率 {cancel_rate:.1f}%（预警 8%）"})

    for _, row in db_df.iterrows():
        rating_count = int(row["rating_count"]) if pd.notna(row["rating_count"]) else 0
        bayesian = float(row["bayesian_score"]) if pd.notna(row["bayesian_score"]) else 3.0
        if rating_count < 10:
            continue
        if bayesian < 2.5:
            wname = win_map.get(row.get("window_id"), "")
            anomalies.append({"type": "满意度偏低", "severity": "warning", "dish": row["dish_name"], "window": wname, "detail": f"贝叶斯得分 {bayesian:.2f}（评价 {rating_count} 条）"})

    total_orders = int(db_df["order_count"].sum())
    total_cancelled = int(db_df["cancel_count"].sum())
    total_revenue = float((db_df["sell_price"] * db_df["total_quantity"]).sum())
    total_cost = float((db_df["cost_price"] * db_df["total_quantity"]).sum())

    return {
        "anomalies": anomalies,
        "stats": {
            "total_orders": total_orders,
            "total_cancelled": total_cancelled,
            "cancel_rate": round(total_cancelled / max(total_orders, 1) * 100, 2),
            "total_revenue": round(total_revenue, 2),
            "total_cost": round(total_cost, 2),
            "gross_margin_rate": round((total_revenue - total_cost) / max(total_revenue, 1) * 100, 2),
        },
    }


def get_satisfaction_matrix(filters=None):
    from db.connection import is_db_available
    if is_db_available():
        db_df = _db_satisfaction_matrix(filters)
        if not db_df.empty:
            return db_df

    orders, dishes, ratings, weather, windows = _base_joins()
    if orders.empty or ratings.empty:
        return pd.DataFrame()

    orders["order_time"] = pd.to_datetime(orders["order_time"])
    orders["order_month"] = orders["order_time"].dt.month
    ratings["rated_at"] = pd.to_datetime(ratings["rated_at"])

    has_meal_filter = filters and "meal_period" in filters and filters["meal_period"]
    has_month_filter = filters and "month" in filters and filters["month"]

    if has_meal_filter or has_month_filter:
        filtered_orders = orders.copy()
        if has_meal_filter:
            filtered_orders = filtered_orders[filtered_orders["meal_period"].isin(filters["meal_period"])]
        if has_month_filter:
            filtered_orders = filtered_orders[filtered_orders["order_month"].isin(filters["month"])]

        filtered_merged = _merge_order_dish(filtered_orders, dishes, windows)

        remaining_filters = dict(filters) if filters else {}
        if "meal_period" in remaining_filters:
            del remaining_filters["meal_period"]
        if "month" in remaining_filters:
            del remaining_filters["month"]

        filtered_merged = _apply_filters(filtered_merged, remaining_filters if remaining_filters else None)

        order_agg = filtered_merged.groupby("dish_id").agg(
            order_count=("id", "count"),
            cancel_count=("is_cancelled", "sum"),
        ).reset_index()

        dish_ids_in_scope = set(filtered_merged["dish_id"].unique())
        filt_ratings = ratings[ratings["dish_id"].isin(dish_ids_in_scope)]
        rating_agg = filt_ratings.groupby("dish_id").agg(
            avg_score=("score", "mean"),
            rating_count=("id", "count"),
        ).reset_index()
        rating_agg["bayesian"] = rating_agg.apply(
            lambda r: bayesian_score(r["rating_count"], r["avg_score"]), axis=1
        )

        matrix = dishes[dishes["id"].isin(dish_ids_in_scope)].copy()
        matrix = matrix.merge(rating_agg, left_on="id", right_on="dish_id", how="left")
        matrix = matrix.merge(order_agg, left_on="id", right_on="dish_id", how="left", suffixes=("", "_ord"))
        win_cols = windows.rename(columns={"id": "window_id", "name": "window_name"})
        matrix = matrix.merge(win_cols, on="window_id", how="left")

        remaining2 = dict(filters) if filters else {}
        if "window_id" in remaining2:
            pass
        if "cuisine_type" in remaining2:
            pass
        if "cost_range" in remaining2:
            pass
        matrix = _apply_filters(matrix, {k: v for k, v in remaining2.items() if k in ("window_id", "cuisine_type", "cost_range")} if remaining2 else None)
    else:
        rating_agg = ratings.groupby("dish_id").agg(
            avg_score=("score", "mean"),
            rating_count=("id", "count"),
        ).reset_index()
        rating_agg["bayesian"] = rating_agg.apply(
            lambda r: bayesian_score(r["rating_count"], r["avg_score"]), axis=1
        )

        order_agg = orders.groupby("dish_id").agg(
            order_count=("id", "count"),
            cancel_count=("is_cancelled", "sum"),
        ).reset_index()

        matrix = dishes.merge(rating_agg, left_on="id", right_on="dish_id", how="left").merge(
            order_agg, left_on="id", right_on="dish_id", how="left", suffixes=("", "_ord")
        )
        win_cols = windows.rename(columns={"id": "window_id", "name": "window_name"})
        matrix = matrix.merge(win_cols, on="window_id", how="left")
        matrix = _apply_filters(matrix, filters)

    cols_to_keep = ["name", "cuisine_type", "window_name", "cost_price", "sell_price",
                     "avg_score", "rating_count", "bayesian", "order_count", "cancel_count"]
    available_cols = [c for c in cols_to_keep if c in matrix.columns]
    matrix = matrix[available_cols].copy()
    for col in ["avg_score", "bayesian"]:
        if col in matrix.columns:
            matrix[col] = matrix[col].fillna(0)
    for col in ["rating_count", "order_count", "cancel_count"]:
        if col in matrix.columns:
            matrix[col] = matrix[col].fillna(0).astype(int)
    matrix["sample_sufficient"] = matrix["rating_count"] >= 10

    return matrix


def get_sales_trend(filters=None):
    from db.connection import is_db_available
    if is_db_available():
        db_df = _db_sales_trend(filters)
        if not db_df.empty:
            return db_df

    orders, dishes, ratings, weather, windows = _base_joins()
    if orders.empty:
        return pd.DataFrame()

    orders["order_time"] = pd.to_datetime(orders["order_time"])
    orders["order_month"] = orders["order_time"].dt.month

    merged = _merge_order_dish(orders, dishes, windows)
    merged = _apply_filters(merged, filters)

    merged["date"] = merged["order_time"].dt.date
    trend = merged.groupby("date").agg(
        order_count=("id", "count"),
        revenue=("sell_price", lambda x: (x * merged.loc[x.index, "quantity"]).sum()),
    ).reset_index()

    return trend


def get_cancel_reasons(filters=None):
    from db.connection import is_db_available
    if is_db_available():
        db_df = _db_cancel_reasons(filters)
        if not db_df.empty:
            return db_df

    orders, dishes, ratings, weather, windows = _base_joins()
    if orders.empty:
        return pd.DataFrame()

    orders["order_time"] = pd.to_datetime(orders["order_time"])
    orders["order_month"] = orders["order_time"].dt.month
    cancelled = orders[orders["is_cancelled"]].copy()

    if cancelled.empty:
        return pd.DataFrame()

    cancelled = _merge_order_dish(cancelled, dishes, windows)
    cancelled = _apply_filters(cancelled, filters)

    reason_counts = cancelled.groupby("cancel_reason").size().reset_index(name="count")
    reason_counts = reason_counts.sort_values("count", ascending=False)
    return reason_counts


def get_cost_margin(filters=None):
    from db.connection import is_db_available
    if is_db_available():
        db_df = _db_cost_margin(filters)
        if not db_df.empty:
            return db_df

    orders, dishes, ratings, weather, windows = _base_joins()
    if orders.empty or dishes.empty:
        return pd.DataFrame()

    orders["order_time"] = pd.to_datetime(orders["order_time"])
    orders["order_month"] = orders["order_time"].dt.month

    merged = _merge_order_dish(orders, dishes, windows)
    merged = _apply_filters(merged, filters)

    effective = merged[~merged["is_cancelled"]].copy()
    effective["revenue"] = effective["sell_price"] * effective["quantity"]
    effective["cost"] = effective["cost_price"] * effective["quantity"]
    effective["profit"] = effective["revenue"] - effective["cost"]

    margin = effective.groupby("dish_id").agg(
        dish_name=("name", "first"),
        window_name=("window_name", "first"),
        cuisine_type=("cuisine_type", "first"),
        total_revenue=("revenue", "sum"),
        total_cost=("cost", "sum"),
        total_profit=("profit", "sum"),
        order_count=("id", "count"),
    ).reset_index()

    margin["margin_rate"] = (margin["total_profit"] / margin["total_revenue"].replace(0, np.nan) * 100).round(2)
    margin = margin.sort_values("total_profit", ascending=False)
    return margin


def get_weather_correlation(filters=None):
    from db.connection import is_db_available
    if is_db_available():
        db_df = _db_weather_correlation(filters)
        if not db_df.empty:
            return db_df

    orders, dishes, ratings, weather, windows = _base_joins()
    if orders.empty or weather.empty:
        return pd.DataFrame()

    orders["order_time"] = pd.to_datetime(orders["order_time"])
    orders["order_month"] = orders["order_time"].dt.month
    weather["date"] = pd.to_datetime(weather["date"])

    merged = _merge_order_dish(orders, dishes, windows)
    merged["date"] = merged["order_time"].dt.date
    weather["date_val"] = weather["date"].dt.date
    merged = merged.merge(
        weather[["date_val", "weather_type", "temperature"]],
        left_on="date", right_on="date_val", how="left"
    )

    merged = _apply_filters(merged, filters)

    corr = merged.groupby("weather_type").agg(
        avg_daily_orders=("id", "count"),
        avg_revenue=("sell_price", "mean"),
    ).reset_index()

    return corr
