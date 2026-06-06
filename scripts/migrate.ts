import { pool } from "../server/db.js";

export async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running migrations...");

    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        real_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL CHECK (role IN ('engineer', 'supervisor', 'warehouse', 'finance')),
        region VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS spare_parts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        part_code VARCHAR(50) UNIQUE NOT NULL,
        part_name VARCHAR(200) NOT NULL,
        category VARCHAR(100),
        specification TEXT,
        unit VARCHAR(20) DEFAULT '个',
        price DECIMAL(12,2) NOT NULL DEFAULT 0,
        deposit_ratio DECIMAL(5,2) NOT NULL DEFAULT 1.0,
        photo_url TEXT,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        part_id UUID NOT NULL REFERENCES spare_parts(id),
        batch_no VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        available_quantity INTEGER NOT NULL DEFAULT 0,
        locked_quantity INTEGER NOT NULL DEFAULT 0,
        location VARCHAR(100),
        expire_date DATE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(part_id, batch_no)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS borrow_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_no VARCHAR(50) UNIQUE NOT NULL,
        applicant_id UUID NOT NULL REFERENCES users(id),
        supervisor_id UUID REFERENCES users(id),
        part_id UUID NOT NULL REFERENCES spare_parts(id),
        inventory_id UUID REFERENCES inventory(id),
        batch_no VARCHAR(50),
        quantity INTEGER NOT NULL DEFAULT 1,
        expected_return_date DATE NOT NULL,
        actual_return_date DATE,
        work_order_no VARCHAR(100),
        customer_machine_no VARCHAR(100),
        customer_name VARCHAR(200),
        borrow_reason TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
          'pending', 'approved', 'rejected', 'picked', 
          'extended', 'returned', 'damaged', 'lost'
        )),
        deposit_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        deposit_status VARCHAR(20) NOT NULL DEFAULT 'unfrozen' CHECK (deposit_status IN (
          'unfrozen', 'frozen', 'deducted', 'refunded'
        )),
        damage_amount DECIMAL(12,2) DEFAULT 0,
        rejection_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS return_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        borrow_order_id UUID NOT NULL REFERENCES borrow_orders(id),
        returned_quantity INTEGER NOT NULL,
        damaged_quantity INTEGER DEFAULT 0,
        lost_quantity INTEGER DEFAULT 0,
        inspection_result TEXT,
        inspector_id UUID REFERENCES users(id),
        warehouse_operator_id UUID REFERENCES users(id),
        photos TEXT[],
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS extension_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        borrow_order_id UUID NOT NULL REFERENCES borrow_orders(id),
        original_return_date DATE NOT NULL,
        new_return_date DATE NOT NULL,
        reason TEXT NOT NULL,
        approver_id UUID REFERENCES users(id),
        approved BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS deposit_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        borrow_order_id UUID NOT NULL REFERENCES borrow_orders(id),
        transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
          'freeze', 'unfreeze', 'deduct', 'refund'
        )),
        amount DECIMAL(12,2) NOT NULL,
        operator_id UUID REFERENCES users(id),
        remark TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(50) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id UUID,
        old_value JSONB,
        new_value JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        type VARCHAR(30) NOT NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        related_order_id UUID REFERENCES borrow_orders(id),
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(20) NOT NULL,
        recipient VARCHAR(200) NOT NULL,
        subject VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 3,
        last_error TEXT,
        last_attempt_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_borrow_orders_status ON borrow_orders(status);
      CREATE INDEX IF NOT EXISTS idx_borrow_orders_applicant ON borrow_orders(applicant_id);
      CREATE INDEX IF NOT EXISTS idx_borrow_orders_expected_return ON borrow_orders(expected_return_date);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
    `);

    await client.query("COMMIT");
    console.log("Migrations completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
