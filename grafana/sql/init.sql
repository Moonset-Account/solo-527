CREATE TABLE IF NOT EXISTS downtime_fact (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  production_line TEXT NOT NULL,
  shift TEXT NOT NULL,
  fault_type TEXT NOT NULL,
  downtime_type TEXT NOT NULL CHECK (downtime_type IN ('planned', 'unplanned')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  maintenance_person TEXT NOT NULL,
  maintenance_duration INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS spare_part_consumption (
  id TEXT PRIMARY KEY,
  downtime_id TEXT NOT NULL REFERENCES downtime_fact(id),
  part_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(10,2) NOT NULL,
  consumed_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_downtime_start_time ON downtime_fact(start_time);
CREATE INDEX IF NOT EXISTS idx_downtime_production_line ON downtime_fact(production_line);
CREATE INDEX IF NOT EXISTS idx_downtime_fault_type ON downtime_fact(fault_type);
CREATE INDEX IF NOT EXISTS idx_downtime_type ON downtime_fact(downtime_type);
CREATE INDEX IF NOT EXISTS idx_downtime_equipment ON downtime_fact(equipment_id);
CREATE INDEX IF NOT EXISTS idx_downtime_shift ON downtime_fact(shift);
CREATE INDEX IF NOT EXISTS idx_downtime_person ON downtime_fact(maintenance_person);
CREATE INDEX IF NOT EXISTS idx_spare_downtime_id ON spare_part_consumption(downtime_id);
