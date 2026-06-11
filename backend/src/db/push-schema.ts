import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

const ddl = `
CREATE TYPE role AS ENUM ('audience', 'admin', 'box_office');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'verified', 'cancelled', 'refunded');
CREATE TYPE ticket_status AS ENUM ('available', 'held', 'sold', 'refunded', 'scanned');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE refund_status AS ENUM ('pending', 'reviewing', 'approved', 'rejected', 'completed', 'abnormal');
CREATE TYPE seat_zone_type AS ENUM ('vip', 'premium', 'standard', 'economy', 'standing');
CREATE TYPE notification_type AS ENUM ('refund_abnormal', 'inventory_warning', 'verification_alert', 'order_anomaly');
CREATE TYPE notification_status AS ENUM ('unread', 'read', 'resolved');
CREATE TYPE gender AS ENUM ('male', 'female', 'other');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role role DEFAULT 'audience' NOT NULL,
  avatar TEXT,
  real_name VARCHAR(100),
  id_card_number VARCHAR(30),
  gender gender,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS concerts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  artist VARCHAR(200) NOT NULL,
  description TEXT,
  poster_url TEXT,
  genre VARCHAR(100),
  organizer VARCHAR(200),
  status VARCHAR(50) DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  capacity INTEGER NOT NULL,
  seating_chart JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS shows (
  id SERIAL PRIMARY KEY,
  concert_id INTEGER REFERENCES concerts(id) NOT NULL,
  venue_id INTEGER REFERENCES venues(id) NOT NULL,
  show_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  doors_open_time TIME,
  sales_start_at TIMESTAMP NOT NULL,
  sales_end_at TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'upcoming' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS seat_zones (
  id SERIAL PRIMARY KEY,
  show_id INTEGER REFERENCES shows(id) NOT NULL,
  name VARCHAR(100) NOT NULL,
  zone_type seat_zone_type DEFAULT 'standard' NOT NULL,
  color VARCHAR(20),
  base_price NUMERIC(10, 2) NOT NULL,
  rows INTEGER NOT NULL,
  seats_per_row INTEGER NOT NULL,
  total_seats INTEGER NOT NULL,
  sold_seats INTEGER DEFAULT 0 NOT NULL,
  available_seats INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS seats (
  id SERIAL PRIMARY KEY,
  show_id INTEGER REFERENCES shows(id) NOT NULL,
  zone_id INTEGER REFERENCES seat_zones(id) NOT NULL,
  row_number INTEGER NOT NULL,
  seat_number INTEGER NOT NULL,
  seat_label VARCHAR(20) NOT NULL,
  status ticket_status DEFAULT 'available' NOT NULL,
  lock_expires_at TIMESTAMP,
  price NUMERIC(10, 2) NOT NULL,
  order_item_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_types (
  id SERIAL PRIMARY KEY,
  show_id INTEGER REFERENCES shows(id) NOT NULL,
  zone_id INTEGER REFERENCES seat_zones(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  original_stock INTEGER DEFAULT 0 NOT NULL,
  remaining_stock INTEGER DEFAULT 0 NOT NULL,
  held_stock INTEGER DEFAULT 0 NOT NULL,
  sold_count INTEGER DEFAULT 0 NOT NULL,
  refunded_count INTEGER DEFAULT 0 NOT NULL,
  max_per_order INTEGER DEFAULT 4 NOT NULL,
  require_real_name BOOLEAN DEFAULT true NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  sales_start_at TIMESTAMP,
  sales_end_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  show_id INTEGER REFERENCES shows(id) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) DEFAULT '0',
  pay_amount NUMERIC(12, 2) NOT NULL,
  ticket_count INTEGER NOT NULL,
  status order_status DEFAULT 'pending' NOT NULL,
  payment_method VARCHAR(50),
  paid_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancelled_reason TEXT,
  verification_status verification_status DEFAULT 'pending' NOT NULL,
  verification_note TEXT,
  verified_at TIMESTAMP,
  verified_by INTEGER REFERENCES users(id),
  remark TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) NOT NULL,
  ticket_type_id INTEGER REFERENCES ticket_types(id),
  seat_id INTEGER REFERENCES seats(id),
  ticket_holder_name VARCHAR(100),
  ticket_holder_id_card VARCHAR(30),
  ticket_holder_phone VARCHAR(20),
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  ticket_no VARCHAR(50) UNIQUE,
  ticket_status ticket_status DEFAULT 'sold' NOT NULL,
  scanned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS verifications (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) NOT NULL,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  real_name VARCHAR(100) NOT NULL,
  id_card_number VARCHAR(30) NOT NULL,
  gender gender,
  phone VARCHAR(20),
  id_card_front TEXT,
  id_card_back TEXT,
  id_card_holding TEXT,
  status verification_status DEFAULT 'pending' NOT NULL,
  reason TEXT,
  submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_note TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS refunds (
  id SERIAL PRIMARY KEY,
  refund_no VARCHAR(50) UNIQUE NOT NULL,
  order_id INTEGER REFERENCES orders(id) NOT NULL,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  order_item_id INTEGER REFERENCES order_items(id),
  refund_amount NUMERIC(12, 2) NOT NULL,
  service_fee NUMERIC(10, 2) DEFAULT '0',
  actual_refund_amount NUMERIC(12, 2) NOT NULL,
  refund_reason TEXT NOT NULL,
  refund_type VARCHAR(50) DEFAULT 'partial' NOT NULL,
  status refund_status DEFAULT 'pending' NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_note TEXT,
  approved_at TIMESTAMP,
  processed_at TIMESTAMP,
  completed_at TIMESTAMP,
  is_abnormal BOOLEAN DEFAULT false NOT NULL,
  abnormal_reason TEXT,
  payment_refund_id VARCHAR(100),
  bank_card VARCHAR(50),
  account_holder VARCHAR(100),
  bank_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  field VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  changed_by INTEGER REFERENCES users(id),
  changed_by_name VARCHAR(100),
  change_note TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  file_url TEXT NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_by_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS attendances (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER REFERENCES order_items(id) NOT NULL,
  seat_id INTEGER REFERENCES seats(id),
  user_id INTEGER REFERENCES users(id),
  show_id INTEGER REFERENCES shows(id) NOT NULL,
  scan_code VARCHAR(100),
  scan_type VARCHAR(50) DEFAULT 'entry' NOT NULL,
  scanned_by INTEGER REFERENCES users(id),
  scanned_at TIMESTAMP DEFAULT NOW() NOT NULL,
  has_attended BOOLEAN DEFAULT true NOT NULL,
  feedback_score INTEGER,
  feedback_comment TEXT,
  feedback_submitted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  status notification_status DEFAULT 'unread' NOT NULL,
  priority INTEGER DEFAULT 1,
  triggered_at TIMESTAMP DEFAULT NOW() NOT NULL,
  read_by INTEGER REFERENCES users(id),
  read_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolution_note TEXT
);

CREATE TABLE IF NOT EXISTS participation_stats (
  id SERIAL PRIMARY KEY,
  show_id INTEGER REFERENCES shows(id) NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  total_tickets INTEGER DEFAULT 0 NOT NULL,
  sold_tickets INTEGER DEFAULT 0 NOT NULL,
  scanned_tickets INTEGER DEFAULT 0 NOT NULL,
  refunded_tickets INTEGER DEFAULT 0 NOT NULL,
  attendance_rate NUMERIC(5, 2),
  revenue NUMERIC(14, 2) DEFAULT '0' NOT NULL,
  refund_amount NUMERIC(14, 2) DEFAULT '0' NOT NULL,
  net_revenue NUMERIC(14, 2) DEFAULT '0' NOT NULL,
  last_synced_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
`;

async function main() {
  try {
    await sql.unsafe(ddl);
    console.log('All tables created successfully!');
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log('Types/tables already exist, skipping...');
    } else {
      console.error('Error:', err.message);
    }
  }
  await sql.end();
}

main();
