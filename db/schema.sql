CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS windows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    location VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS dishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cuisine_type VARCHAR(20) NOT NULL,
    window_id INTEGER REFERENCES windows(id),
    cost_price NUMERIC(8,2) NOT NULL,
    sell_price NUMERIC(8,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    dish_id INTEGER REFERENCES dishes(id),
    window_id INTEGER REFERENCES windows(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    meal_period VARCHAR(10) NOT NULL,
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancel_reason VARCHAR(50),
    order_time TIMESTAMPTZ NOT NULL
);

SELECT create_hypertable('orders', 'order_time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    dish_id INTEGER REFERENCES dishes(id),
    score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment TEXT,
    rated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT create_hypertable('ratings', 'rated_at', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS weather (
    date DATE PRIMARY KEY,
    weather_type VARCHAR(20) NOT NULL,
    temperature NUMERIC(5,1),
    humidity NUMERIC(5,1)
);

CREATE INDEX idx_orders_dish_id ON orders (dish_id);
CREATE INDEX idx_orders_window_id ON orders (window_id);
CREATE INDEX idx_orders_meal_period ON orders (meal_period);
CREATE INDEX idx_ratings_dish_id ON ratings (dish_id);
CREATE INDEX idx_ratings_score ON ratings (score);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dish_daily_stats AS
SELECT
    d.id AS dish_id,
    d.name AS dish_name,
    d.cuisine_type,
    d.window_id,
    d.cost_price,
    d.sell_price,
    DATE(o.order_time) AS stat_date,
    o.meal_period,
    COUNT(*) AS order_count,
    SUM(CASE WHEN o.is_cancelled THEN 1 ELSE 0 END) AS cancel_count,
    SUM(o.quantity) AS total_quantity,
    COALESCE(AVG(r.score), 0) AS avg_score,
    COUNT(r.id) AS rating_count
FROM dishes d
JOIN orders o ON o.dish_id = d.id
LEFT JOIN ratings r ON r.dish_id = d.id AND DATE(r.rated_at) = DATE(o.order_time)
GROUP BY d.id, d.name, d.cuisine_type, d.window_id, d.cost_price, d.sell_price, DATE(o.order_time), o.meal_period;

CREATE INDEX IF NOT EXISTS idx_mv_dish_daily_dish ON mv_dish_daily_stats (dish_id);
CREATE INDEX IF NOT EXISTS idx_mv_dish_daily_date ON mv_dish_daily_stats (stat_date);
