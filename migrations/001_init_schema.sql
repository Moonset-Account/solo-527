CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('operation', 'frontdesk', 'auditor', 'admin')),
    department VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('男', '女', '其他')),
    patient_no VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_patient_no ON patients(patient_no);

CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    chief_complaint TEXT NOT NULL,
    diagnosis TEXT,
    prescription TEXT,
    visit_date DATE NOT NULL,
    department VARCHAR(100) NOT NULL,
    total_fee DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'exception')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_records_patient ON medical_records(patient_id);
CREATE INDEX idx_records_visit_date ON medical_records(visit_date);
CREATE INDEX idx_records_department ON medical_records(department);

CREATE TABLE follow_up_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    planned_follow_up_date DATE NOT NULL,
    follow_up_type VARCHAR(50) NOT NULL CHECK (follow_up_type IN ('电话', '微信', '到店', '短信')),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE charge_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    item_category VARCHAR(50) NOT NULL CHECK (item_category IN ('诊费', '中药', '理疗', '检查', '其他')),
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id),
    planned_date DATE NOT NULL,
    actual_date DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
    quality_score INT CHECK (quality_score BETWEEN 0 AND 100),
    follow_up_method VARCHAR(50) CHECK (follow_up_method IN ('电话', '微信', '到店', '短信')),
    result_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tasks_planned_date ON follow_up_tasks(planned_date);
CREATE INDEX idx_tasks_status ON follow_up_tasks(status);
CREATE INDEX idx_tasks_assigned_to ON follow_up_tasks(assigned_to);

CREATE TABLE filter_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL CHECK (module IN ('medical_records', 'follow_up_tasks', 'patient_statistics', 'follow_up_export')),
    filter_conditions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_filter_rules_user_module ON filter_rules(user_id, module);

CREATE TABLE permission_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    handled_by UUID REFERENCES users(id),
    exception_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'closed')),
    handling_conclusion TEXT,
    handled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_exceptions_status ON permission_exceptions(status);
CREATE INDEX idx_exceptions_severity ON permission_exceptions(severity);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    doctor_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'booked' CHECK (status IN ('booked', 'attended', 'cancelled', 'no_show')),
    is_no_show BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

CREATE TABLE appointment_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_date DATE NOT NULL,
    department VARCHAR(100) NOT NULL,
    total_slots INT NOT NULL DEFAULT 0,
    booked_slots INT NOT NULL DEFAULT 0,
    attended_slots INT NOT NULL DEFAULT 0,
    utilization_rate DECIMAL(5, 4) NOT NULL DEFAULT 0,
    exception_impact JSONB DEFAULT '{}',
    generated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_reports_date_dept ON appointment_reports(report_date, department);

CREATE OR REPLACE FUNCTION sync_exception_to_report()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'resolved' AND NEW.handled_at IS NOT NULL THEN
        INSERT INTO appointment_reports (report_date, department, total_slots, booked_slots, attended_slots, utilization_rate, exception_impact)
        VALUES (
            DATE(NEW.handled_at),
            (SELECT department FROM medical_records WHERE id = NEW.record_id LIMIT 1),
            0, 0, 0, 0,
            jsonb_build_object(
                'exception_id', NEW.id,
                'record_id', NEW.record_id,
                'conclusion', NEW.handling_conclusion,
                'severity', NEW.severity,
                'synced_at', NOW()
            )
        )
        ON CONFLICT (report_date, department) DO UPDATE
        SET exception_impact = appointment_reports.exception_impact || EXCLUDED.exception_impact;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_exception_report
AFTER UPDATE ON permission_exceptions
FOR EACH ROW
EXECUTE FUNCTION sync_exception_to_report();
