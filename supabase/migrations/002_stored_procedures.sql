-- 存储过程：创建订单及关联项目
CREATE OR REPLACE FUNCTION create_booking_with_items(
  p_client_id UUID,
  p_studio_id UUID DEFAULT NULL,
  p_package_id UUID DEFAULT NULL,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_total_amount DECIMAL(10, 2) DEFAULT 0,
  p_deposit_amount DECIMAL(10, 2) DEFAULT 0,
  p_photographer_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID,
  p_equipment_items JSONB DEFAULT '[]'::JSONB,
  p_assistant_items JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_booking_no TEXT;
BEGIN
  v_booking_no := 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  INSERT INTO bookings (
    booking_no, client_id, studio_id, package_id, status, contract_status,
    payment_status, start_time, end_time, total_amount, deposit_amount,
    paid_amount, photographer_id, notes, created_by
  ) VALUES (
    v_booking_no, p_client_id, p_studio_id, p_package_id, 'draft', 'draft',
    'unpaid', p_start_time, p_end_time, p_total_amount, p_deposit_amount,
    0, p_photographer_id, p_notes, p_created_by
  ) RETURNING id INTO v_booking_id;

  IF p_equipment_items IS NOT NULL AND jsonb_array_length(p_equipment_items) > 0 THEN
    INSERT INTO booking_equipment (booking_id, equipment_id, quantity, unit_price)
    SELECT 
      v_booking_id,
      (item->>'equipment_id')::UUID,
      (item->>'quantity')::INTEGER,
      (item->>'unit_price')::DECIMAL(10, 2)
    FROM jsonb_array_elements(p_equipment_items) AS item;
  END IF;

  IF p_assistant_items IS NOT NULL AND jsonb_array_length(p_assistant_items) > 0 THEN
    INSERT INTO booking_assistants (booking_id, assistant_id, hours, unit_price)
    SELECT 
      v_booking_id,
      (item->>'assistant_id')::UUID,
      (item->>'hours')::DECIMAL,
      (item->>'unit_price')::DECIMAL(10, 2)
    FROM jsonb_array_elements(p_assistant_items) AS item;
  END IF;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 存储过程：检查棚位冲突
CREATE OR REPLACE FUNCTION check_studio_availability(
  p_studio_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM bookings
  WHERE studio_id = p_studio_id
    AND status IN ('confirmed', 'pending', 'in_progress')
    AND start_time < p_end_time
    AND end_time > p_start_time
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id);

  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 存储过程：检查器材冲突
CREATE OR REPLACE FUNCTION check_equipment_availability(
  p_equipment_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM booking_equipment be
  JOIN bookings b ON be.equipment_id = p_equipment_id
  WHERE b.status IN ('confirmed', 'pending', 'in_progress')
    AND b.start_time < p_end_time
    AND b.end_time > p_start_time
    AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id);

  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 存储过程：更新订单状态及发送通知
CREATE OR REPLACE FUNCTION update_booking_status(
  p_booking_id UUID,
  p_new_status booking_status,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_old_status booking_status;
  v_client_id UUID;
  v_booking_no TEXT;
BEGIN
  SELECT status, client_id, booking_no INTO v_old_status, v_client_id, v_booking_no
  FROM bookings WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '订单不存在';
  END IF;

  UPDATE bookings
  SET status = p_new_status,
      notes = CASE WHEN p_notes IS NOT NULL THEN COALESCE(notes, '') || E'\n' || p_notes ELSE notes END
  WHERE id = p_booking_id;

  IF p_new_status = 'confirmed' AND v_old_status != 'confirmed' THEN
    INSERT INTO notifications (type, recipient, subject, content, booking_id)
    VALUES 
      ('in_app', v_client_id::TEXT, '订单已确认', '您的订单 ' || v_booking_no || ' 已确认', p_booking_id);
  END IF;

  IF p_new_status = 'cancelled' AND v_old_status != 'cancelled' THEN
    UPDATE booking_equipment
    SET return_time = NOW()
    WHERE booking_id = p_booking_id;

    INSERT INTO notifications (type, recipient, subject, content, booking_id)
    VALUES 
      ('in_app', v_client_id::TEXT, '订单已取消', '您的订单 ' || v_booking_no || ' 已取消', p_booking_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 存储过程：获取指定月份的档期统计
CREATE OR REPLACE FUNCTION get_monthly_booking_stats(
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  date DATE,
  total_bookings INTEGER,
  confirmed_bookings INTEGER,
  total_revenue DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(generate_series(
      MAKE_DATE(p_year, p_month, 1),
      (MAKE_DATE(p_year, p_month, 1) + INTERVAL '1 month - 1 day')::DATE,
      '1 day'::INTERVAL
    )) AS date,
    COUNT(b.id)::INTEGER AS total_bookings,
    COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END)::INTEGER AS confirmed_bookings,
    COALESCE(SUM(CASE WHEN b.payment_status IN ('paid', 'partial_paid', 'deposit_paid') THEN b.paid_amount ELSE 0 END), 0) AS total_revenue
  FROM generate_series(
    MAKE_DATE(p_year, p_month, 1),
    (MAKE_DATE(p_year, p_month, 1) + INTERVAL '1 month - 1 day')::DATE,
    '1 day'::INTERVAL
  ) AS d(date)
  LEFT JOIN bookings b ON DATE(b.start_time) = d.date
  GROUP BY d.date
  ORDER BY d.date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 触发器：更新订单支付状态
CREATE OR REPLACE FUNCTION update_booking_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(10, 2);
  v_total_amount DECIMAL(10, 2);
  v_deposit_amount DECIMAL(10, 2);
  v_new_status payment_status;
BEGIN
  SELECT COALESCE(SUM(amount), 0), total_amount, deposit_amount
  INTO v_total_paid, v_total_amount, v_deposit_amount
  FROM payments p
  JOIN bookings b ON b.id = p.booking_id
  WHERE p.booking_id = NEW.booking_id
  GROUP BY b.total_amount, b.deposit_amount;

  IF v_total_paid >= v_total_amount THEN
    v_new_status := 'paid';
  ELSIF v_total_paid >= v_deposit_amount THEN
    v_new_status := 'deposit_paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partial_paid';
  ELSE
    v_new_status := 'unpaid';
  END IF;

  UPDATE bookings
  SET paid_amount = v_total_paid,
      payment_status = v_new_status
  WHERE id = NEW.booking_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_payments_update_booking_status
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_booking_payment_status();
