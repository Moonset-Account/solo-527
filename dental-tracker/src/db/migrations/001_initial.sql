BEGIN;

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS operators (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS autoclaves (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  model VARCHAR(100),
  max_capacity INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS instrument_packs (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50),
  status VARCHAR(30) DEFAULT 'new',
  is_frozen BOOLEAN DEFAULT FALSE,
  current_department_id INTEGER REFERENCES departments(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sterilization_batches (
  id SERIAL PRIMARY KEY,
  batch_code VARCHAR(50) UNIQUE NOT NULL,
  autoclave_id INTEGER REFERENCES autoclaves(id),
  operator_id INTEGER REFERENCES operators(id),
  status VARCHAR(30) DEFAULT 'pending',
  temperature NUMERIC(5,1),
  pressure NUMERIC(6,2),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  is_abnormal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS batch_packs (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES sterilization_batches(id) ON DELETE CASCADE,
  pack_id INTEGER REFERENCES instrument_packs(id) ON DELETE CASCADE,
  UNIQUE (batch_id, pack_id)
);

CREATE TABLE IF NOT EXISTS sterilization_cards (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES sterilization_batches(id),
  pack_id INTEGER REFERENCES instrument_packs(id),
  card_code VARCHAR(50) UNIQUE NOT NULL,
  color_change VARCHAR(50),
  is_passed BOOLEAN,
  checked_at TIMESTAMP,
  checked_by INTEGER REFERENCES operators(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pack_logs (
  id SERIAL PRIMARY KEY,
  pack_id INTEGER REFERENCES instrument_packs(id),
  action VARCHAR(50) NOT NULL,
  from_status VARCHAR(30),
  to_status VARCHAR(30),
  operator_id INTEGER REFERENCES operators(id),
  batch_id INTEGER REFERENCES sterilization_batches(id),
  department_id INTEGER REFERENCES departments(id),
  remark TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recall_records (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES sterilization_batches(id),
  operator_id INTEGER REFERENCES operators(id),
  reason TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  target_role_id INTEGER REFERENCES roles(id),
  target_operator_id INTEGER REFERENCES operators(id),
  is_sent BOOLEAN DEFAULT FALSE,
  send_attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
