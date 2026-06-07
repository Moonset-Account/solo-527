-- TimescaleDB Schema for Training Load Visualization
-- Run after base tables are created by SQLAlchemy

-- Convert time-series tables to hypertables
SELECT create_hypertable('heart_rates', 'recorded_at', chunk_time_interval => INTERVAL '1 week');
SELECT create_hypertable('paces', 'recorded_at', chunk_time_interval => INTERVAL '1 week');

-- Indexes for common query patterns
CREATE INDEX idx_heart_rates_athlete_time ON heart_rates (athlete_id, recorded_at DESC);
CREATE INDEX idx_paces_athlete_time ON paces (athlete_id, recorded_at DESC);
CREATE INDEX idx_recovery_scores_athlete_date ON recovery_scores (athlete_id, score_date DESC);
CREATE INDEX idx_strength_tests_athlete_date ON strength_tests (athlete_id, test_date DESC);
CREATE INDEX idx_training_logs_athlete_session ON training_logs (athlete_id, session_id);
CREATE INDEX idx_injuries_athlete_date ON injuries (athlete_id, injury_date DESC);

-- Continuous aggregates for daily heart rate stats
CREATE MATERIALIZED VIEW hr_daily_stats
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', recorded_at) AS bucket,
    athlete_id,
    avg(hr_bpm) AS avg_hr,
    max(hr_bpm) AS max_hr,
    min(hr_bpm) AS min_hr,
    count(*) AS sample_count
FROM heart_rates
GROUP BY bucket, athlete_id;

-- Continuous aggregates for daily pace stats
CREATE MATERIALIZED VIEW pace_daily_stats
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', recorded_at) AS bucket,
    athlete_id,
    avg(pace_min_per_km) AS avg_pace,
    min(pace_min_per_km) AS best_pace,
    sum(distance_km) AS total_distance_km,
    count(*) AS sample_count
FROM paces
GROUP BY bucket, athlete_id;

-- Retention policy: keep raw data 2 years, aggregates forever
SELECT add_retention_policy('heart_rates', INTERVAL '2 years');
SELECT add_retention_policy('paces', INTERVAL '2 years');
