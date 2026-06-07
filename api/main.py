from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import sqlite3
import json
import csv
import io
from datetime import date, timedelta
import random

app = FastAPI(title="食堂菜品满意度分析API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "canteen.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS windows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS dishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        window_id INTEGER REFERENCES windows(id),
        cuisine_type TEXT NOT NULL,
        cost REAL NOT NULL,
        price REAL NOT NULL
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS daily_dish_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dish_id INTEGER REFERENCES dishes(id),
        stat_date TEXT NOT NULL,
        supply_batch TEXT,
        sales_count INTEGER DEFAULT 0,
        sample_count INTEGER DEFAULT 0,
        avg_score REAL,
        return_count INTEGER DEFAULT 0,
        UNIQUE(dish_id, stat_date)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS return_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dish_id INTEGER REFERENCES dishes(id),
        return_date TEXT NOT NULL,
        reason TEXT NOT NULL,
        window_id INTEGER REFERENCES windows(id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS supplier_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        window_id INTEGER REFERENCES windows(id),
        change_date TEXT NOT NULL,
        old_supplier TEXT,
        new_supplier TEXT
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS batch_recalls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT NOT NULL,
        ingredient_name TEXT NOT NULL,
        recall_date TEXT NOT NULL
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS batch_dish_relations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT REFERENCES batch_recalls(batch_id),
        dish_id INTEGER REFERENCES dishes(id)
    )''')

    c.execute("SELECT COUNT(*) as cnt FROM windows")
    if c.fetchone()["cnt"] == 0:
        seed_data(c)

    conn.commit()
    conn.close()

def seed_data(c):
    windows = [
        ("窗口A-川菜", "一层东区"),
        ("窗口B-粤菜", "一层西区"),
        ("窗口C-湘菜", "二层东区"),
        ("窗口D-面食", "二层西区"),
        ("窗口E-快餐", "三层东区"),
        ("窗口F-素食", "三层西区"),
    ]
    for w in windows:
        c.execute("INSERT INTO windows (name, location) VALUES (?, ?)", w)

    cuisines = ["川菜", "粤菜", "湘菜", "面食", "快餐", "素食"]
    dishes_data = [
        ("麻辣豆腐", 1, "川菜", 3.5, 8.0),
        ("回锅肉", 1, "川菜", 8.0, 15.0),
        ("水煮鱼", 1, "川菜", 12.0, 22.0),
        ("宫保鸡丁", 1, "川菜", 7.0, 14.0),
        ("白切鸡", 2, "粤菜", 10.0, 18.0),
        ("蒸排骨", 2, "粤菜", 9.0, 16.0),
        ("虾饺", 2, "粤菜", 8.0, 15.0),
        ("煲仔饭", 2, "粤菜", 6.0, 12.0),
        ("剁椒鱼头", 3, "湘菜", 11.0, 20.0),
        ("小炒肉", 3, "湘菜", 7.5, 14.0),
        ("口味虾", 3, "湘菜", 13.0, 24.0),
        ("辣椒炒肉", 3, "湘菜", 6.0, 12.0),
        ("牛肉面", 4, "面食", 5.0, 10.0),
        ("炸酱面", 4, "面食", 3.5, 8.0),
        ("馄饨", 4, "面食", 4.0, 9.0),
        ("刀削面", 4, "面食", 4.5, 9.0),
        ("红烧肉套餐", 5, "快餐", 8.5, 15.0),
        ("鸡排饭", 5, "快餐", 6.5, 12.0),
        ("鱼香肉丝饭", 5, "快餐", 6.0, 11.0),
        ("番茄炒蛋饭", 5, "快餐", 4.0, 9.0),
        ("清炒时蔬", 6, "素食", 2.5, 6.0),
        ("麻婆豆腐(素)", 6, "素食", 3.0, 7.0),
        ("凉拌黄瓜", 6, "素食", 1.5, 4.0),
        ("素三鲜饺", 6, "素食", 4.0, 9.0),
    ]
    for d in dishes_data:
        c.execute("INSERT INTO dishes (name, window_id, cuisine_type, cost, price) VALUES (?, ?, ?, ?, ?)", d)

    random.seed(42)
    base_date = date(2025, 1, 1)
    batches = [f"BATCH-{i:03d}" for i in range(1, 31)]
    for day_offset in range(90):
        d = base_date + timedelta(days=day_offset)
        date_str = d.isoformat()
        for dish_id in range(1, 25):
            sales = random.randint(30, 200)
            sample = random.randint(max(5, sales // 4), sales)
            score = round(random.uniform(2.5, 5.0), 2)
            returns = random.randint(0, max(1, sales // 10))
            batch = random.choice(batches)
            c.execute(
                "INSERT INTO daily_dish_stats (dish_id, stat_date, supply_batch, sales_count, sample_count, avg_score, return_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (dish_id, date_str, batch, sales, sample, score, returns),
            )

    return_reasons = [
        "口味不佳", "食材不新鲜", "分量不足", "温度不适", "有异物",
        "过敏原未标注", "送错菜品", "菜品与描述不符", "餐具不洁", "其他"
    ]
    for day_offset in range(90):
        d = base_date + timedelta(days=day_offset)
        date_str = d.isoformat()
        for _ in range(random.randint(5, 20)):
            dish_id = random.randint(1, 24)
            reason = random.choice(return_reasons)
            window_id = ((dish_id - 1) // 4) + 1
            c.execute(
                "INSERT INTO return_records (dish_id, return_date, reason, window_id) VALUES (?, ?, ?, ?)",
                (dish_id, date_str, reason, window_id),
            )

    supplier_changes_data = [
        (1, "2025-02-15", "四川粮油公司", "成都优质粮油"),
        (2, "2025-03-01", "广州食材供应", "番禺鲜味供应"),
        (3, "2025-01-20", "湖南食材站", "长沙优选供应"),
        (5, "2025-02-28", "大众快餐供应", "品质快餐供应链"),
    ]
    for sc in supplier_changes_data:
        c.execute("INSERT INTO supplier_changes (window_id, change_date, old_supplier, new_supplier) VALUES (?, ?, ?, ?)", sc)

    batch_recalls_data = [
        ("BATCH-005", "猪肉", "2025-02-10"),
        ("BATCH-012", "鸡蛋", "2025-03-05"),
        ("BATCH-018", "食用油", "2025-03-20"),
    ]
    for br in batch_recalls_data:
        c.execute("INSERT INTO batch_recalls (batch_id, ingredient_name, recall_date) VALUES (?, ?, ?)", br)

    batch_dish_map = {
        "BATCH-005": [2, 3, 4, 9, 10, 11, 17, 18],
        "BATCH-012": [4, 20],
        "BATCH-018": [1, 5, 7],
    }
    for batch_id, dish_ids in batch_dish_map.items():
        for did in dish_ids:
            c.execute("INSERT INTO batch_dish_relations (batch_id, dish_id) VALUES (?, ?)", (batch_id, did))


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/filters/options")
def get_filter_options():
    conn = get_db()
    c = conn.cursor()

    c.execute("SELECT id, name FROM windows ORDER BY id")
    windows = [{"id": str(r["id"]), "name": r["name"]} for r in c.fetchall()]

    c.execute("SELECT DISTINCT cuisine_type FROM dishes ORDER BY cuisine_type")
    cuisines = [r["cuisine_type"] for r in c.fetchall()]

    c.execute("SELECT DISTINCT supply_batch FROM daily_dish_stats ORDER BY supply_batch")
    batches = [r["supply_batch"] for r in c.fetchall()]

    c.execute("SELECT MIN(cost) as min_cost, MAX(cost) as max_cost FROM dishes")
    row = c.fetchone()
    cost_range = {"min": row["min_cost"], "max": row["max_cost"]}

    conn.close()
    return {"windows": windows, "cuisines": cuisines, "batches": batches, "cost_range": cost_range}


@app.get("/api/dishes/satisfaction")
def get_satisfaction(
    window_id: str = Query(None),
    cuisine_type: str = Query(None),
    time_period: str = Query(None),
    cost_min: float = Query(None),
    cost_max: float = Query(None),
    supply_batch: str = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None),
):
    conn = get_db()
    c = conn.cursor()

    conditions = []
    params = []

    if window_id:
        conditions.append("d.window_id = ?")
        params.append(int(window_id))
    if cuisine_type:
        conditions.append("d.cuisine_type = ?")
        params.append(cuisine_type)
    if cost_min is not None:
        conditions.append("d.cost >= ?")
        params.append(cost_min)
    if cost_max is not None:
        conditions.append("d.cost <= ?")
        params.append(cost_max)
    if supply_batch:
        conditions.append("dds.supply_batch = ?")
        params.append(supply_batch)
    if date_from:
        conditions.append("dds.stat_date >= ?")
        params.append(date_from)
    if date_to:
        conditions.append("dds.stat_date <= ?")
        params.append(date_to)

    if time_period:
        today = date.today()
        if time_period == "week":
            start = (today - timedelta(days=7)).isoformat()
        elif time_period == "month":
            start = (today - timedelta(days=30)).isoformat()
        elif time_period == "quarter":
            start = (today - timedelta(days=90)).isoformat()
        else:
            start = None
        if start:
            conditions.append("dds.stat_date >= ?")
            params.append(start)

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    query = f"""
    SELECT d.id as dish_id, d.name as dish_name, w.name as window_name,
           d.cuisine_type, d.cost, d.price,
           SUM(dds.sales_count) as total_sales,
           SUM(dds.sample_count) as sample_count,
           ROUND(AVG(dds.avg_score), 2) as avg_score,
           SUM(dds.return_count) as return_count,
           CASE WHEN SUM(dds.sales_count) > 0
                THEN ROUND(CAST(SUM(dds.return_count) AS FLOAT) / SUM(dds.sales_count) * 100, 2)
                ELSE 0 END as return_rate,
           ROUND((d.price - d.cost) / d.price * 100, 2) as profit_rate
    FROM dishes d
    JOIN windows w ON d.window_id = w.id
    JOIN daily_dish_stats dds ON d.id = dds.dish_id
    {where_clause}
    GROUP BY d.id
    ORDER BY avg_score ASC
    """
    c.execute(query, params)
    rows = c.fetchall()

    result = []
    for r in rows:
        dish_id = r["dish_id"]
        c.execute("SELECT COUNT(*) as cnt FROM supplier_changes sc JOIN dishes d ON d.window_id = sc.window_id WHERE d.id = ?", (dish_id,))
        supplier_changed = c.fetchone()["cnt"] > 0

        c.execute("SELECT COUNT(*) as cnt FROM batch_dish_relations WHERE dish_id = ?", (dish_id,))
        batch_recalled = c.fetchone()["cnt"] > 0

        result.append({
            "dish_id": str(dish_id),
            "dish_name": r["dish_name"],
            "window_name": r["window_name"],
            "cuisine_type": r["cuisine_type"],
            "avg_score": r["avg_score"],
            "total_sales": r["total_sales"],
            "sample_count": r["sample_count"],
            "return_count": r["return_count"],
            "return_rate": r["return_rate"],
            "cost": r["cost"],
            "profit_rate": r["profit_rate"],
            "supplier_changed": supplier_changed,
            "batch_recalled": batch_recalled,
        })

    conn.close()
    return result


@app.get("/api/returns/reasons")
def get_return_reasons(
    window_id: str = Query(None),
    cuisine_type: str = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None),
):
    conn = get_db()
    c = conn.cursor()

    conditions = []
    params = []

    if window_id:
        conditions.append("rr.window_id = ?")
        params.append(int(window_id))
    if date_from:
        conditions.append("rr.return_date >= ?")
        params.append(date_from)
    if date_to:
        conditions.append("rr.return_date <= ?")
        params.append(date_to)
    if cuisine_type:
        conditions.append("d.cuisine_type = ?")
        params.append(cuisine_type)

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    query = f"""
    SELECT rr.reason, COUNT(*) as count
    FROM return_records rr
    JOIN dishes d ON rr.dish_id = d.id
    {where_clause}
    GROUP BY rr.reason
    ORDER BY count DESC
    """
    c.execute(query, params)
    rows = c.fetchall()

    total = sum(r["count"] for r in rows)
    result = []
    for r in rows:
        result.append({
            "reason": r["reason"],
            "count": r["count"],
            "ratio": round(r["count"] / total * 100, 2) if total > 0 else 0,
        })

    conn.close()
    return result


@app.get("/api/returns/details")
def get_return_details(
    reason: str = Query(None),
    window_id: str = Query(None),
    date: str = Query(None),
):
    conn = get_db()
    c = conn.cursor()

    conditions = []
    params = []

    if reason:
        conditions.append("rr.reason = ?")
        params.append(reason)
    if window_id:
        conditions.append("rr.window_id = ?")
        params.append(int(window_id))
    if date:
        conditions.append("rr.return_date = ?")
        params.append(date)

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    query = f"""
    SELECT d.name as dish_name, w.name as window_name, rr.return_date as date, rr.reason, COUNT(*) as count
    FROM return_records rr
    JOIN dishes d ON rr.dish_id = d.id
    JOIN windows w ON rr.window_id = w.id
    {where_clause}
    GROUP BY d.name, w.name, rr.return_date, rr.reason
    ORDER BY count DESC
    LIMIT 50
    """
    c.execute(query, params)
    rows = c.fetchall()

    result = [{"dish_name": r["dish_name"], "window_name": r["window_name"], "date": r["date"], "reason": r["reason"], "count": r["count"]} for r in rows]

    conn.close()
    return result


@app.get("/api/costs/profits")
def get_cost_profits(
    window_id: str = Query(None),
    cuisine_type: str = Query(None),
    cost_min: float = Query(None),
    cost_max: float = Query(None),
):
    conn = get_db()
    c = conn.cursor()

    conditions = []
    params = []

    if window_id:
        conditions.append("d.window_id = ?")
        params.append(int(window_id))
    if cuisine_type:
        conditions.append("d.cuisine_type = ?")
        params.append(cuisine_type)
    if cost_min is not None:
        conditions.append("d.cost >= ?")
        params.append(cost_min)
    if cost_max is not None:
        conditions.append("d.cost <= ?")
        params.append(cost_max)

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    query = f"""
    SELECT d.id as dish_id, d.name as dish_name, d.cost,
           ROUND((d.price - d.cost) / d.price * 100, 2) as profit_rate,
           COALESCE(SUM(dds.sales_count), 0) as sales
    FROM dishes d
    LEFT JOIN daily_dish_stats dds ON d.id = dds.dish_id
    {where_clause}
    GROUP BY d.id
    ORDER BY d.cost ASC
    """
    c.execute(query, params)
    rows = c.fetchall()

    result = [{"dish_id": str(r["dish_id"]), "dish_name": r["dish_name"], "cost": r["cost"], "profit_rate": r["profit_rate"], "sales": r["sales"]} for r in rows]

    conn.close()
    return result


@app.get("/api/dishes/abnormal")
def get_abnormal_dishes(
    window_id: str = Query(None),
    cuisine_type: str = Query(None),
    supply_batch: str = Query(None),
):
    conn = get_db()
    c = conn.cursor()

    conditions = []
    params = []

    if window_id:
        conditions.append("d.window_id = ?")
        params.append(int(window_id))
    if cuisine_type:
        conditions.append("d.cuisine_type = ?")
        params.append(cuisine_type)
    if supply_batch:
        conditions.append("dds.supply_batch = ?")
        params.append(supply_batch)

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    query = f"""
    SELECT d.id as dish_id, d.name as dish_name, w.name as window_name,
           d.cuisine_type, d.cost,
           ROUND(AVG(dds.avg_score), 2) as avg_score,
           SUM(dds.sample_count) as sample_count,
           CASE WHEN SUM(dds.sales_count) > 0
                THEN ROUND(CAST(SUM(dds.return_count) AS FLOAT) / SUM(dds.sales_count) * 100, 2)
                ELSE 0 END as return_rate,
           ROUND((d.price - d.cost) / d.price * 100, 2) as profit_rate
    FROM dishes d
    JOIN windows w ON d.window_id = w.id
    JOIN daily_dish_stats dds ON d.id = dds.dish_id
    {where_clause}
    GROUP BY d.id
    HAVING AVG(dds.avg_score) < 3.5 OR (SUM(dds.sales_count) > 0 AND CAST(SUM(dds.return_count) AS FLOAT) / SUM(dds.sales_count) > 0.08) OR (d.price - d.cost) / d.price < 0.3
    ORDER BY avg_score ASC
    """
    c.execute(query, params)
    rows = c.fetchall()

    result = []
    for r in rows:
        dish_id = r["dish_id"]
        abnormal_types = []
        if r["avg_score"] < 3.5:
            abnormal_types.append("评分偏低")
        if r["return_rate"] > 8:
            abnormal_types.append("退餐率偏高")
        if r["profit_rate"] < 30:
            abnormal_types.append("毛利率偏低")

        c.execute("SELECT COUNT(*) as cnt FROM supplier_changes sc JOIN dishes d ON d.window_id = sc.window_id WHERE d.id = ?", (dish_id,))
        supplier_changed = c.fetchone()["cnt"] > 0

        c.execute("SELECT COUNT(*) as cnt FROM batch_dish_relations WHERE dish_id = ?", (dish_id,))
        batch_recalled = c.fetchone()["cnt"] > 0

        recall_batch_id = None
        supplier_change_date = None

        if batch_recalled:
            c.execute("SELECT batch_id FROM batch_dish_relations WHERE dish_id = ? LIMIT 1", (dish_id,))
            br = c.fetchone()
            if br:
                recall_batch_id = br["batch_id"]

        if supplier_changed:
            c.execute("SELECT change_date FROM supplier_changes sc JOIN dishes d ON d.window_id = sc.window_id WHERE d.id = ? LIMIT 1", (dish_id,))
            sc_row = c.fetchone()
            if sc_row:
                supplier_change_date = sc_row["change_date"]

        result.append({
            "dish_id": str(dish_id),
            "dish_name": r["dish_name"],
            "window_name": r["window_name"],
            "cuisine_type": r["cuisine_type"],
            "avg_score": r["avg_score"],
            "sample_count": r["sample_count"],
            "return_rate": r["return_rate"],
            "cost": r["cost"],
            "profit_rate": r["profit_rate"],
            "abnormal_type": abnormal_types,
            "supplier_changed": supplier_changed,
            "batch_recalled": batch_recalled,
            "recall_batch_id": recall_batch_id,
            "supplier_change_date": supplier_change_date,
        })

    conn.close()
    return result


@app.get("/api/supplier-changes")
def get_supplier_changes():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT sc.id, w.name as window_name, sc.window_id, sc.change_date, sc.old_supplier, sc.new_supplier
        FROM supplier_changes sc JOIN windows w ON sc.window_id = w.id
        ORDER BY sc.change_date DESC
    """)
    rows = c.fetchall()
    result = [{"id": str(r["id"]), "window_id": str(r["window_id"]), "window_name": r["window_name"], "change_date": r["change_date"], "old_supplier": r["old_supplier"], "new_supplier": r["new_supplier"]} for r in rows]
    conn.close()
    return result


@app.post("/api/supplier-changes")
def create_supplier_change(data: dict):
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO supplier_changes (window_id, change_date, old_supplier, new_supplier) VALUES (?, ?, ?, ?)",
        (data["window_id"], data["change_date"], data.get("old_supplier", ""), data.get("new_supplier", "")),
    )
    conn.commit()
    conn.close()
    return {"status": "ok"}


@app.get("/api/batch-recalls")
def get_batch_recalls():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, batch_id, ingredient_name, recall_date FROM batch_recalls ORDER BY recall_date DESC")
    rows = c.fetchall()
    result = []
    for r in rows:
        c.execute("SELECT d.id, d.name FROM batch_dish_relations bdr JOIN dishes d ON bdr.dish_id = d.id WHERE bdr.batch_id = ?", (r["batch_id"],))
        affected = [{"id": str(dr["id"]), "name": dr["name"]} for dr in c.fetchall()]
        result.append({
            "id": str(r["id"]),
            "batch_id": r["batch_id"],
            "ingredient_name": r["ingredient_name"],
            "recall_date": r["recall_date"],
            "affected_dishes": affected,
        })
    conn.close()
    return result


@app.post("/api/batch-recalls")
def create_batch_recall(data: dict):
    conn = get_db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO batch_recalls (batch_id, ingredient_name, recall_date) VALUES (?, ?, ?)",
        (data["batch_id"], data["ingredient_name"], data["recall_date"]),
    )
    for dish_id in data.get("affected_dish_ids", []):
        c.execute(
            "INSERT INTO batch_dish_relations (batch_id, dish_id) VALUES (?, ?)",
            (data["batch_id"], int(dish_id)),
        )
    conn.commit()
    conn.close()
    return {"status": "ok"}


@app.get("/api/dishes/trend")
def get_dish_trend(
    dish_id: int = Query(...),
    date_from: str = Query(None),
    date_to: str = Query(None),
):
    conn = get_db()
    c = conn.cursor()

    conditions = ["dds.dish_id = ?"]
    params = [dish_id]

    if date_from:
        conditions.append("dds.stat_date >= ?")
        params.append(date_from)
    if date_to:
        conditions.append("dds.stat_date <= ?")
        params.append(date_to)

    where_clause = "WHERE " + " AND ".join(conditions)

    c.execute(f"""
        SELECT dds.stat_date, dds.avg_score
        FROM daily_dish_stats dds
        {where_clause}
        ORDER BY dds.stat_date
    """, params)
    rows = c.fetchall()

    dates = [r["stat_date"] for r in rows]
    scores = [r["avg_score"] for r in rows]

    c.execute("SELECT window_id FROM dishes WHERE id = ?", (dish_id,))
    win_row = c.fetchone()
    supplier_change_dates = []
    if win_row:
        c.execute("SELECT change_date FROM supplier_changes WHERE window_id = ?", (win_row["window_id"],))
        supplier_change_dates = [r["change_date"] for r in c.fetchall()]

    c.execute("SELECT batch_id FROM batch_dish_relations WHERE dish_id = ?", (dish_id,))
    recall_batches = [r["batch_id"] for r in c.fetchall()]
    recall_dates = []
    for batch_id in recall_batches:
        c.execute("SELECT recall_date FROM batch_recalls WHERE batch_id = ?", (batch_id,))
        for r in c.fetchall():
            recall_dates.append(r["recall_date"])

    c.execute("SELECT name FROM dishes WHERE id = ?", (dish_id,))
    dish_name_row = c.fetchone()
    dish_name = dish_name_row["name"] if dish_name_row else "未知"

    conn.close()
    return {
        "dish_id": str(dish_id),
        "dish_name": dish_name,
        "dates": dates,
        "scores": scores,
        "supplier_change_dates": supplier_change_dates,
        "recall_dates": recall_dates,
    }


@app.get("/api/reports/export")
def export_report(
    format: str = Query("csv"),
    window_id: str = Query(None),
    cuisine_type: str = Query(None),
    time_period: str = Query(None),
    cost_min: float = Query(None),
    cost_max: float = Query(None),
    supply_batch: str = Query(None),
):
    data = get_satisfaction(
        window_id=window_id,
        cuisine_type=cuisine_type,
        time_period=time_period,
        cost_min=cost_min,
        cost_max=cost_max,
        supply_batch=supply_batch,
    )

    if format == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "dish_id", "dish_name", "window_name", "cuisine_type",
            "avg_score", "total_sales", "sample_count", "return_count",
            "return_rate", "cost", "profit_rate", "supplier_changed", "batch_recalled"
        ])
        writer.writeheader()
        writer.writerows(data)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=satisfaction_report.csv"},
        )
    else:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=[
            "dish_id", "dish_name", "window_name", "cuisine_type",
            "avg_score", "total_sales", "sample_count", "return_count",
            "return_rate", "cost", "profit_rate", "supplier_changed", "batch_recalled"
        ])
        writer.writeheader()
        writer.writerows(data)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=satisfaction_report.csv"},
        )
