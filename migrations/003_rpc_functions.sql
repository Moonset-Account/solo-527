-- Migration: 003_rpc_functions.sql
-- 原子操作的 PostgreSQL RPC 函数

-- ============================================================
-- upsert_utilization_log: 原子地累加 utilization_logs.used_hours
-- 如果 (instrument_id, log_date) 存在则累加，不存在则插入
-- ============================================================
CREATE OR REPLACE FUNCTION upsert_utilization_log(
  p_instrument_id UUID,
  p_log_date DATE,
  p_used_hours NUMERIC
) RETURNS VOID AS $$
BEGIN
  INSERT INTO utilization_logs (instrument_id, log_date, total_hours, used_hours, disabled_hours)
  VALUES (p_instrument_id, p_log_date, 24, p_used_hours, 0)
  ON CONFLICT (instrument_id, log_date)
  DO UPDATE SET
    used_hours = utilization_logs.used_hours + EXCLUDED.used_hours;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION upsert_utilization_log(UUID, DATE, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION upsert_utilization_log(UUID, DATE, NUMERIC) TO authenticated;
