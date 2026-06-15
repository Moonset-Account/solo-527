CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE INDEX IF NOT EXISTS idx_bill_customer_id ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bill_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bill_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bill_tenant_id ON bills(tenant_id);

CREATE INDEX IF NOT EXISTS idx_collection_bill_id ON collection_records(bill_id);
CREATE INDEX IF NOT EXISTS idx_collection_rhythm_id ON collection_records(rhythm_id);
CREATE INDEX IF NOT EXISTS idx_collection_created_at ON collection_records(created_at);

CREATE INDEX IF NOT EXISTS idx_status_history_bill_id ON status_history(bill_id);
CREATE INDEX IF NOT EXISTS idx_status_history_from_status ON status_history(from_status);
CREATE INDEX IF NOT EXISTS idx_status_history_to_status ON status_history(to_status);

CREATE INDEX IF NOT EXISTS idx_cash_forecast_tenant_id ON cash_forecasts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_forecast_period ON cash_forecasts(forecast_period);

CREATE INDEX IF NOT EXISTS idx_invoice_bill_id ON invoices(bill_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoices(status);

CREATE INDEX IF NOT EXISTS idx_export_queue_status ON export_queues(status);
CREATE INDEX IF NOT EXISTS idx_export_queue_created_at ON export_queues(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_logs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_attachment_entity ON attachments(entity_type, entity_id);
