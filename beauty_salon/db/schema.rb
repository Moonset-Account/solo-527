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

ActiveRecord::Schema[8.1].define(version: 2026_06_17_063647) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "api_failure_logs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "endpoint"
    t.integer "max_retries", default: 3
    t.string "method"
    t.text "notes"
    t.text "request_body"
    t.text "response_body"
    t.integer "response_code"
    t.boolean "retried", default: false
    t.integer "retry_count", default: 0
    t.integer "status", default: 0
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_api_failure_logs_on_status"
  end

  create_table "appointments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.text "notes"
    t.datetime "scheduled_at"
    t.integer "status", default: 0
    t.bigint "technician_id", null: false
    t.bigint "treatment_card_item_id"
    t.bigint "treatment_id", null: false
    t.datetime "updated_at", null: false
    t.index ["customer_id"], name: "index_appointments_on_customer_id"
    t.index ["scheduled_at"], name: "index_appointments_on_scheduled_at"
    t.index ["technician_id"], name: "index_appointments_on_technician_id"
    t.index ["treatment_card_item_id"], name: "index_appointments_on_treatment_card_item_id"
    t.index ["treatment_id"], name: "index_appointments_on_treatment_id"
  end

  create_table "audit_logs", force: :cascade do |t|
    t.string "action"
    t.integer "auditable_id"
    t.string "auditable_type"
    t.jsonb "changes_data"
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "operator_id"
    t.string "operator_type"
    t.datetime "updated_at", null: false
    t.index ["auditable_type", "auditable_id"], name: "index_audit_logs_on_auditable_type_and_auditable_id"
    t.index ["operator_type", "operator_id"], name: "index_audit_logs_on_operator_type_and_operator_id"
  end

  create_table "check_ins", force: :cascade do |t|
    t.bigint "appointment_id"
    t.datetime "checked_in_at"
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.integer "status", default: 0
    t.bigint "technician_id", null: false
    t.bigint "treatment_card_item_id"
    t.bigint "treatment_id", null: false
    t.datetime "updated_at", null: false
    t.index ["appointment_id"], name: "index_check_ins_on_appointment_id"
    t.index ["checked_in_at"], name: "index_check_ins_on_checked_in_at"
    t.index ["customer_id"], name: "index_check_ins_on_customer_id"
    t.index ["technician_id"], name: "index_check_ins_on_technician_id"
    t.index ["treatment_card_item_id"], name: "index_check_ins_on_treatment_card_item_id"
    t.index ["treatment_id"], name: "index_check_ins_on_treatment_id"
  end

  create_table "consumable_rules", force: :cascade do |t|
    t.boolean "active", default: true
    t.integer "check_interval"
    t.datetime "created_at", null: false
    t.string "name"
    t.decimal "threshold_percentage"
    t.integer "threshold_sessions"
    t.bigint "treatment_id", null: false
    t.datetime "updated_at", null: false
    t.index ["treatment_id"], name: "index_consumable_rules_on_treatment_id"
  end

  create_table "customers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.text "notes"
    t.string "phone"
    t.datetime "updated_at", null: false
    t.index ["phone"], name: "index_customers_on_phone"
  end

  create_table "notifications", force: :cascade do |t|
    t.text "body"
    t.string "category"
    t.datetime "created_at", null: false
    t.boolean "read", default: false
    t.integer "recipient_id"
    t.string "recipient_type"
    t.string "title"
    t.datetime "updated_at", null: false
    t.boolean "urgent"
    t.index ["read"], name: "index_notifications_on_read"
    t.index ["recipient_type", "recipient_id"], name: "index_notifications_on_recipient_type_and_recipient_id"
  end

  create_table "price_histories", force: :cascade do |t|
    t.datetime "changed_at"
    t.integer "changed_by_id"
    t.string "changed_by_type"
    t.datetime "created_at", null: false
    t.decimal "new_price", precision: 10, scale: 2
    t.decimal "old_price", precision: 10, scale: 2
    t.bigint "treatment_id", null: false
    t.datetime "updated_at", null: false
    t.index ["treatment_id"], name: "index_price_histories_on_treatment_id"
  end

  create_table "schedules", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.time "end_time"
    t.time "start_time"
    t.integer "status", default: 0
    t.bigint "technician_id", null: false
    t.datetime "updated_at", null: false
    t.date "work_date"
    t.index ["technician_id", "work_date"], name: "index_schedules_on_technician_id_and_work_date"
    t.index ["technician_id"], name: "index_schedules_on_technician_id"
  end

  create_table "technicians", force: :cascade do |t|
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.string "name"
    t.string "phone"
    t.string "specialty"
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_technicians_on_name"
  end

  create_table "todo_items", force: :cascade do |t|
    t.integer "assignee_id"
    t.string "assignee_type"
    t.text "body"
    t.string "category"
    t.datetime "created_at", null: false
    t.datetime "due_at"
    t.integer "source_id"
    t.string "source_type"
    t.integer "status", default: 0
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["assignee_type", "assignee_id"], name: "index_todo_items_on_assignee_type_and_assignee_id"
    t.index ["status"], name: "index_todo_items_on_status"
  end

  create_table "treatment_card_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "remaining_sessions"
    t.integer "total_sessions"
    t.bigint "treatment_card_id", null: false
    t.bigint "treatment_id", null: false
    t.datetime "updated_at", null: false
    t.index ["treatment_card_id"], name: "index_treatment_card_items_on_treatment_card_id"
    t.index ["treatment_id"], name: "index_treatment_card_items_on_treatment_id"
  end

  create_table "treatment_cards", force: :cascade do |t|
    t.string "card_number"
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.datetime "expired_at"
    t.datetime "purchased_at"
    t.decimal "remaining_amount", precision: 10, scale: 2
    t.integer "status", default: 0
    t.decimal "total_amount", precision: 10, scale: 2
    t.datetime "updated_at", null: false
    t.index ["card_number"], name: "index_treatment_cards_on_card_number"
    t.index ["customer_id"], name: "index_treatment_cards_on_customer_id"
  end

  create_table "treatments", force: :cascade do |t|
    t.boolean "active", default: true
    t.string "category"
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "duration"
    t.string "name"
    t.decimal "price", precision: 10, scale: 2
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_treatments_on_category"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "appointments", "customers"
  add_foreign_key "appointments", "technicians"
  add_foreign_key "appointments", "treatment_card_items"
  add_foreign_key "appointments", "treatments"
  add_foreign_key "check_ins", "appointments"
  add_foreign_key "check_ins", "customers"
  add_foreign_key "check_ins", "technicians"
  add_foreign_key "check_ins", "treatment_card_items"
  add_foreign_key "check_ins", "treatments"
  add_foreign_key "consumable_rules", "treatments"
  add_foreign_key "price_histories", "treatments"
  add_foreign_key "schedules", "technicians"
  add_foreign_key "treatment_card_items", "treatment_cards"
  add_foreign_key "treatment_card_items", "treatments"
  add_foreign_key "treatment_cards", "customers"
end
