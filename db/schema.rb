# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_11_000015) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "attendance_alerts", force: :cascade do |t|
    t.integer "actual_count", default: 0, null: false
    t.text "close_note"
    t.datetime "closed_at"
    t.datetime "created_at", null: false
    t.bigint "event_id", null: false
    t.integer "expected_count", default: 0, null: false
    t.integer "gap_count", default: 0, null: false
    t.bigint "schedule_id", null: false
    t.string "status", default: "open", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_attendance_alerts_on_event_id"
    t.index ["schedule_id"], name: "index_attendance_alerts_on_schedule_id"
    t.index ["status"], name: "index_attendance_alerts_on_status"
  end

  create_table "attendances", force: :cascade do |t|
    t.boolean "attended", default: false, null: false
    t.datetime "checked_in_at"
    t.string "checked_in_by"
    t.datetime "created_at", null: false
    t.bigint "registration_id", null: false
    t.datetime "updated_at", null: false
    t.index ["registration_id"], name: "index_attendances_on_registration_id"
  end

  create_table "audit_logs", force: :cascade do |t|
    t.string "action", null: false
    t.string "anomaly_type"
    t.bigint "auditable_id"
    t.string "auditable_type"
    t.bigint "batch_operation_id"
    t.jsonb "change_details", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["anomaly_type"], name: "index_audit_logs_on_anomaly_type"
    t.index ["auditable_type", "auditable_id"], name: "index_audit_logs_on_auditable_type_and_auditable_id"
    t.index ["batch_operation_id"], name: "index_audit_logs_on_batch_operation_id"
    t.index ["user_id"], name: "index_audit_logs_on_user_id"
  end

  create_table "batch_operations", force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.integer "failure_count", default: 0, null: false
    t.string "operation_type", null: false
    t.datetime "started_at"
    t.string "status", default: "pending", null: false
    t.integer "success_count", default: 0, null: false
    t.jsonb "target_ids", default: [], null: false
    t.string "target_type", null: false
    t.integer "total_count", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["status"], name: "index_batch_operations_on_status"
    t.index ["user_id"], name: "index_batch_operations_on_user_id"
  end

  create_table "events", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.text "description"
    t.datetime "ends_at"
    t.datetime "starts_at"
    t.string "status", default: "draft", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "venue"
    t.index ["created_by_id"], name: "index_events_on_created_by_id"
    t.index ["status"], name: "index_events_on_status"
  end

  create_table "inventories", force: :cascade do |t|
    t.integer "available", default: 0, null: false
    t.datetime "created_at", null: false
    t.integer "reserved", default: 0, null: false
    t.integer "sold", default: 0, null: false
    t.bigint "ticket_type_id", null: false
    t.integer "total", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["ticket_type_id"], name: "index_inventories_on_ticket_type_id"
  end

  create_table "orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "order_no", null: false
    t.datetime "paid_at"
    t.string "status", default: "pending", null: false
    t.decimal "total_amount", precision: 10, scale: 2, default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["order_no"], name: "index_orders_on_order_no", unique: true
    t.index ["status"], name: "index_orders_on_status"
    t.index ["user_id"], name: "index_orders_on_user_id"
  end

  create_table "refunds", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2, default: "0.0", null: false
    t.datetime "created_at", null: false
    t.bigint "order_id", null: false
    t.text "reason"
    t.datetime "reviewed_at"
    t.bigint "reviewed_by_id"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["order_id"], name: "index_refunds_on_order_id"
    t.index ["reviewed_by_id"], name: "index_refunds_on_reviewed_by_id"
    t.index ["status"], name: "index_refunds_on_status"
    t.index ["user_id"], name: "index_refunds_on_user_id"
  end

  create_table "registrations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "event_id", null: false
    t.text "note"
    t.datetime "reviewed_at"
    t.bigint "schedule_id", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["event_id", "user_id"], name: "index_registrations_on_event_id_and_user_id"
    t.index ["event_id"], name: "index_registrations_on_event_id"
    t.index ["schedule_id"], name: "index_registrations_on_schedule_id"
    t.index ["status"], name: "index_registrations_on_status"
    t.index ["user_id"], name: "index_registrations_on_user_id"
  end

  create_table "revenue_anomalies", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2, default: "0.0", null: false
    t.string "anomaly_type", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "detected_at"
    t.bigint "event_id", null: false
    t.bigint "order_id", null: false
    t.datetime "resolved_at"
    t.bigint "resolved_by_id"
    t.string "status", default: "open", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["anomaly_type"], name: "index_revenue_anomalies_on_anomaly_type"
    t.index ["event_id"], name: "index_revenue_anomalies_on_event_id"
    t.index ["order_id"], name: "index_revenue_anomalies_on_order_id"
    t.index ["resolved_by_id"], name: "index_revenue_anomalies_on_resolved_by_id"
    t.index ["status"], name: "index_revenue_anomalies_on_status"
    t.index ["user_id"], name: "index_revenue_anomalies_on_user_id"
  end

  create_table "saved_filters", force: :cascade do |t|
    t.jsonb "conditions", default: {}, null: false
    t.datetime "created_at", null: false
    t.string "filterable_type", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "filterable_type"], name: "index_saved_filters_on_user_id_and_filterable_type"
    t.index ["user_id"], name: "index_saved_filters_on_user_id"
  end

  create_table "schedules", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "ends_at"
    t.bigint "event_id", null: false
    t.string "name", null: false
    t.integer "sort_order", default: 0, null: false
    t.datetime "starts_at"
    t.datetime "updated_at", null: false
    t.string "venue"
    t.index ["event_id", "sort_order"], name: "index_schedules_on_event_id_and_sort_order"
    t.index ["event_id"], name: "index_schedules_on_event_id"
  end

  create_table "ticket_types", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.bigint "event_id", null: false
    t.string "name", null: false
    t.decimal "price", precision: 10, scale: 2, default: "0.0", null: false
    t.integer "purchase_limit", default: 10, null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_ticket_types_on_event_id"
    t.index ["status"], name: "index_ticket_types_on_status"
  end

  create_table "tickets", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "holder_name"
    t.bigint "order_id", null: false
    t.string "status", default: "active", null: false
    t.string "ticket_no", null: false
    t.bigint "ticket_type_id", null: false
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_tickets_on_order_id"
    t.index ["status"], name: "index_tickets_on_status"
    t.index ["ticket_no"], name: "index_tickets_on_ticket_no", unique: true
    t.index ["ticket_type_id"], name: "index_tickets_on_ticket_type_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.string "role", default: "organizer", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "attendance_alerts", "events"
  add_foreign_key "attendance_alerts", "schedules"
  add_foreign_key "attendances", "registrations"
  add_foreign_key "audit_logs", "batch_operations"
  add_foreign_key "audit_logs", "users"
  add_foreign_key "batch_operations", "users"
  add_foreign_key "events", "users", column: "created_by_id"
  add_foreign_key "inventories", "ticket_types"
  add_foreign_key "orders", "users"
  add_foreign_key "refunds", "orders"
  add_foreign_key "refunds", "users"
  add_foreign_key "refunds", "users", column: "reviewed_by_id"
  add_foreign_key "registrations", "events"
  add_foreign_key "registrations", "schedules"
  add_foreign_key "registrations", "users"
  add_foreign_key "revenue_anomalies", "events"
  add_foreign_key "revenue_anomalies", "orders"
  add_foreign_key "revenue_anomalies", "users"
  add_foreign_key "revenue_anomalies", "users", column: "resolved_by_id"
  add_foreign_key "saved_filters", "users"
  add_foreign_key "schedules", "events"
  add_foreign_key "ticket_types", "events"
  add_foreign_key "tickets", "orders"
  add_foreign_key "tickets", "ticket_types"
end
