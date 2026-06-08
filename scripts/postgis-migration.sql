CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS workshops (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  geom GEOMETRY(POINT, 4326) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  current_load INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS workshop_distances (
  id SERIAL PRIMARY KEY,
  from_workshop_id VARCHAR(32) NOT NULL REFERENCES workshops(id),
  to_workshop_id VARCHAR(32) NOT NULL REFERENCES workshops(id),
  distance_km DECIMAL(8,2) NOT NULL,
  wait_time_hours DECIMAL(6,1) NOT NULL,
  route_geom GEOMETRY(LINESTRING, 4326),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_workshop_id, to_workshop_id)
);

CREATE TABLE IF NOT EXISTS material_shortages (
  id SERIAL PRIMARY KEY,
  work_order_id VARCHAR(32) NOT NULL,
  material_code VARCHAR(32) NOT NULL,
  material_name VARCHAR(128) NOT NULL,
  short_qty INTEGER NOT NULL DEFAULT 0,
  eta DATE NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rush_orders (
  id VARCHAR(64) PRIMARY KEY,
  work_order_id VARCHAR(32) NOT NULL,
  inserted_at TIMESTAMPTZ NOT NULL,
  approved_by VARCHAR(64) NOT NULL,
  approval_note TEXT NOT NULL,
  impact_scope TEXT[] NOT NULL DEFAULT '{}',
  priority_boost INTEGER NOT NULL DEFAULT 0,
  original_delivery_date DATE NOT NULL,
  new_delivery_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS priority_adjustments (
  id VARCHAR(64) PRIMARY KEY,
  work_order_id VARCHAR(32) NOT NULL,
  adjusted_at TIMESTAMPTZ NOT NULL,
  adjusted_by VARCHAR(64) NOT NULL,
  old_priority INTEGER NOT NULL,
  new_priority INTEGER NOT NULL,
  reason TEXT NOT NULL,
  affected_downstream_steps TEXT[] NOT NULL DEFAULT '{}',
  before_delay_risk INTEGER NOT NULL DEFAULT 0,
  after_delay_risk INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS work_orders (
  id VARCHAR(32) PRIMARY KEY,
  order_no VARCHAR(32) NOT NULL UNIQUE,
  customer VARCHAR(128) NOT NULL,
  product VARCHAR(256) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  delivery_date DATE NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5,
  status VARCHAR(16) NOT NULL DEFAULT 'planned',
  total_delay_hours INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cross_shop_transfers (
  id VARCHAR(64) PRIMARY KEY,
  work_order_id VARCHAR(32) NOT NULL,
  from_workshop_id VARCHAR(32) NOT NULL REFERENCES workshops(id),
  to_workshop_id VARCHAR(32) NOT NULL REFERENCES workshops(id),
  distance_km DECIMAL(8,2),
  wait_time_hours DECIMAL(6,1),
  process_step_id VARCHAR(64)
);

CREATE OR REPLACE FUNCTION refresh_workshop_distances()
RETURNS VOID AS $$
BEGIN
  DELETE FROM workshop_distances;
  INSERT INTO workshop_distances (from_workshop_id, to_workshop_id, distance_km, wait_time_hours, route_geom)
  SELECT
    w1.id,
    w2.id,
    (ST_Distance(w1.geom::geography, w2.geom::geography) / 1000)::DECIMAL(8,2),
    LEAST(99.9, GREATEST(0.1,
      (1.5 + (ST_Distance(w1.geom::geography, w2.geom::geography) / 1000) / 8 +
       CASE WHEN w1.current_load::FLOAT / NULLIF(w1.capacity, 0) > 0.85
            THEN (w1.current_load::FLOAT / NULLIF(w1.capacity, 0) - 0.85) * 40 * 0.08
            ELSE 0 END
      )::DECIMAL(6,1)
    )),
    ST_MakeLine(w1.geom, w2.geom)
  FROM workshops w1, workshops w2
  WHERE w1.id != w2.id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_transfer_distances()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE cross_shop_transfers
  SET distance_km = wd.distance_km,
      wait_time_hours = wd.wait_time_hours
  FROM workshop_distances wd
  WHERE wd.from_workshop_id = NEW.from_workshop_id
    AND wd.to_workshop_id = NEW.to_workshop_id
    AND cross_shop_transfers.id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_transfer_dist ON cross_shop_transfers;
CREATE TRIGGER trg_sync_transfer_dist
  AFTER INSERT ON cross_shop_transfers
  FOR EACH ROW EXECUTE FUNCTION sync_transfer_distances();

DROP TRIGGER IF EXISTS trg_refresh_distances ON workshops;
CREATE TRIGGER trg_refresh_distances
  AFTER INSERT OR UPDATE OF geom, current_load, capacity ON workshops
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_workshop_distances();

INSERT INTO workshops (id, name, geom, capacity, current_load) VALUES
  ('ws-1', '冲压车间', ST_SetSRID(ST_MakePoint(121.4737, 31.2304), 4326), 480, 420),
  ('ws-2', '焊接车间', ST_SetSRID(ST_MakePoint(121.4837, 31.2354), 4326), 360, 340),
  ('ws-3', '涂装车间', ST_SetSRID(ST_MakePoint(121.4637, 31.2254), 4326), 320, 290),
  ('ws-4', '总装车间', ST_SetSRID(ST_MakePoint(121.4787, 31.2184), 4326), 400, 380),
  ('ws-5', '检测车间', ST_SetSRID(ST_MakePoint(121.4587, 31.2404), 4326), 240, 180)
ON CONFLICT (id) DO NOTHING;

SELECT refresh_workshop_distances();

INSERT INTO work_orders (id, order_no, customer, product, quantity, delivery_date, priority, status, total_delay_hours) VALUES
  ('WO-20260601', 'ORD-240601', '上汽集团', 'SUV前围板总成', 5000, '2026-06-20', 1, 'delayed', 36),
  ('WO-20260602', 'ORD-240602', '比亚迪', '电池托盘焊接件', 8000, '2026-06-22', 2, 'in_progress', 12),
  ('WO-20260603', 'ORD-240603', '蔚来汽车', '车身侧围冲压件', 3000, '2026-06-18', 1, 'delayed', 48),
  ('WO-20260604', 'ORD-240604', '吉利汽车', '底盘横梁总成', 6000, '2026-06-25', 3, 'planned', 0),
  ('WO-20260605', 'ORD-240605', '长城汽车', '车门内板冲压件', 4000, '2026-06-19', 2, 'delayed', 24),
  ('WO-20260606', 'ORD-240606', '上汽集团', '后地板焊接总成', 5500, '2026-06-21', 2, 'in_progress', 8),
  ('WO-20260607', 'ORD-240607', '小鹏汽车', '前舱盖冲压件', 2500, '2026-06-23', 4, 'planned', 0),
  ('WO-20260608', 'ORD-240608', '理想汽车', 'B柱加强板焊接', 7000, '2026-06-17', 1, 'delayed', 56),
  ('WO-20260609', 'ORD-240609', '比亚迪', '前端框架总成', 4500, '2026-06-24', 3, 'in_progress', 4),
  ('WO-20260610', 'ORD-240610', '蔚来汽车', '顶盖横梁冲压', 3500, '2026-06-26', 5, 'planned', 0),
  ('WO-20260611', 'ORD-240611', '吉利汽车', '后排座椅横梁', 9000, '2026-06-16', 1, 'delayed', 40),
  ('WO-20260612', 'ORD-240612', '长安汽车', '翼子板冲压件', 6000, '2026-06-28', 4, 'planned', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO material_shortages (work_order_id, material_code, material_name, short_qty, eta, severity) VALUES
  ('WO-20260601', 'M-1001', '高强度钢板', 200, '2026-06-12', 'critical'),
  ('WO-20260601', 'M-1002', '铝合金型材', 50, '2026-06-10', 'warning'),
  ('WO-20260603', 'M-2001', '电子控制单元', 15, '2026-06-15', 'critical'),
  ('WO-20260603', 'M-2002', '液压管路', 80, '2026-06-11', 'warning'),
  ('WO-20260605', 'M-1003', '密封胶条', 300, '2026-06-09', 'normal'),
  ('WO-20260608', 'M-1001', '高强度钢板', 120, '2026-06-14', 'critical'),
  ('WO-20260611', 'M-2001', '电子控制单元', 25, '2026-06-16', 'critical')
ON CONFLICT DO NOTHING;

INSERT INTO rush_orders (id, work_order_id, inserted_at, approved_by, approval_note, impact_scope, priority_boost, original_delivery_date, new_delivery_date) VALUES
  ('rush-WO-20260601', 'WO-20260601', '2026-06-07T14:30:00+08', '张总监',
   '客户为VIP-A级，交期不可更改，优先排产。需协调冲压和焊接车间加班产能。',
   ARRAY['冲压车间-班次B', '焊接车间-班次A', '涂装车间-全线'], 3,
   '2026-06-25', '2026-06-18'),
  ('rush-WO-20260603', 'WO-20260603', '2026-06-06T09:15:00+08', '王副总监',
   '蔚来紧急提车需求，原计划涂装后总装需压缩3天，调配夜班产能。',
   ARRAY['涂装车间-全线', '总装车间-班次B'], 2,
   '2026-06-22', '2026-06-18'),
  ('rush-WO-20260608', 'WO-20260608', '2026-06-05T16:45:00+08', '张总监',
   '理想汽车产线停线风险，需在48h内交付首批，优先安排冲压和焊接。',
   ARRAY['冲压车间-班次A', '焊接车间-班次A', '检测车间-加急通道'], 3,
   '2026-06-24', '2026-06-17'),
  ('rush-WO-20260611', 'WO-20260611', '2026-06-06T11:00:00+08', '李经理',
   '吉利库存告急，已无安全库存，需提前一周交付。',
   ARRAY['冲压车间-班次B', '焊接车间-全线'], 2,
   '2026-06-23', '2026-06-16')
ON CONFLICT (id) DO NOTHING;

INSERT INTO priority_adjustments (id, work_order_id, adjusted_at, adjusted_by, old_priority, new_priority, reason, affected_downstream_steps, before_delay_risk, after_delay_risk) VALUES
  ('adj-WO-20260601', 'WO-20260601', '2026-06-07T10:15:00+08', '李计划员', 5, 1,
   '客户升级投诉，需提前交付以维护合作关系',
   ARRAY['WO-20260601-step-3', 'WO-20260601-step-4', 'WO-20260601-step-5'], 78, 32),
  ('adj-WO-20260603', 'WO-20260603', '2026-06-06T08:30:00+08', '李计划员', 4, 1,
   '蔚来提车需求紧急，原排产顺序延后将造成产线停等',
   ARRAY['WO-20260603-step-2', 'WO-20260603-step-3', 'WO-20260603-step-4'], 85, 40),
  ('adj-WO-20260605', 'WO-20260605', '2026-06-07T09:00:00+08', '王计划员', 3, 2,
   '长城汽车缺料问题已部分解决，重新提升优先级',
   ARRAY['WO-20260605-step-3', 'WO-20260605-step-4'], 55, 38),
  ('adj-WO-20260608', 'WO-20260608', '2026-06-05T14:00:00+08', '李计划员', 5, 1,
   '理想汽车产线停线风险，最高优先级排产',
   ARRAY['WO-20260608-step-2', 'WO-20260608-step-3', 'WO-20260608-step-4', 'WO-20260608-step-5'], 92, 45),
  ('adj-WO-20260611', 'WO-20260611', '2026-06-06T10:30:00+08', '王计划员', 4, 1,
   '吉利库存告急，安全库存已耗尽',
   ARRAY['WO-20260611-step-3', 'WO-20260611-step-4', 'WO-20260611-step-5'], 72, 35)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cross_shop_transfers (id, work_order_id, from_workshop_id, to_workshop_id, process_step_id)
VALUES
  ('xfr-WO-20260601', 'WO-20260601', 'ws-1', 'ws-2', 'WO-20260601-step-2'),
  ('xfr-WO-20260603', 'WO-20260603', 'ws-1', 'ws-3', 'WO-20260603-step-3'),
  ('xfr-WO-20260605', 'WO-20260605', 'ws-2', 'ws-4', 'WO-20260605-step-4'),
  ('xfr-WO-20260606', 'WO-20260606', 'ws-3', 'ws-4', 'WO-20260606-step-3'),
  ('xfr-WO-20260608', 'WO-20260608', 'ws-1', 'ws-2', 'WO-20260608-step-2'),
  ('xfr-WO-20260611', 'WO-20260611', 'ws-5', 'ws-3', 'WO-20260611-step-5')
ON CONFLICT (id) DO NOTHING;
