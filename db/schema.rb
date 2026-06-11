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

ActiveRecord::Schema[8.1].define(version: 2026_06_12_000013) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "appointment_service_items", force: :cascade do |t|
    t.bigint "appointment_id", null: false
    t.datetime "created_at", null: false
    t.decimal "discount", precision: 10, scale: 2, default: "0.0"
    t.text "notes"
    t.integer "quantity", default: 1
    t.bigint "service_item_id", null: false
    t.string "status", default: "pending"
    t.decimal "subtotal", precision: 10, scale: 2, null: false
    t.decimal "unit_price", precision: 10, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.index ["appointment_id", "service_item_id"], name: "idx_appt_svc_items_on_appt_and_svc"
    t.index ["appointment_id"], name: "index_appointment_service_items_on_appointment_id"
    t.index ["service_item_id"], name: "index_appointment_service_items_on_service_item_id"
  end

  create_table "appointments", force: :cascade do |t|
    t.datetime "appointment_date"
    t.string "appointment_no", null: false
    t.string "cancel_reason"
    t.datetime "cancelled_at"
    t.datetime "completed_at"
    t.datetime "confirmed_at"
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.bigint "doctor_id", null: false
    t.boolean "from_waiting_list", default: false
    t.text "notes"
    t.string "operator"
    t.decimal "paid_amount", precision: 10, scale: 2, default: "0.0"
    t.decimal "refunded_amount", precision: 10, scale: 2, default: "0.0"
    t.string "source", default: "direct"
    t.string "status", default: "pending"
    t.bigint "time_slot_id", null: false
    t.decimal "total_amount", precision: 10, scale: 2, default: "0.0"
    t.datetime "updated_at", null: false
    t.bigint "waiting_list_id"
    t.index ["appointment_no"], name: "index_appointments_on_appointment_no", unique: true
    t.index ["customer_id"], name: "index_appointments_on_customer_id"
    t.index ["doctor_id", "appointment_date"], name: "index_appointments_on_doctor_id_and_appointment_date"
    t.index ["doctor_id"], name: "index_appointments_on_doctor_id"
    t.index ["status"], name: "index_appointments_on_status"
    t.index ["time_slot_id"], name: "index_appointments_on_time_slot_id"
    t.index ["waiting_list_id"], name: "index_appointments_on_waiting_list_id"
  end

  create_table "batch_operation_items", force: :cascade do |t|
    t.bigint "batch_operation_log_id", null: false
    t.datetime "created_at", null: false
    t.text "error_message"
    t.jsonb "field_errors"
    t.jsonb "original_data"
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.boolean "success", default: false
    t.datetime "updated_at", null: false
    t.jsonb "updated_data"
    t.index ["batch_operation_log_id"], name: "index_batch_operation_items_on_batch_operation_log_id"
    t.index ["record_type", "record_id"], name: "index_batch_operation_items_on_record_type_and_record_id"
    t.index ["success"], name: "index_batch_operation_items_on_success"
  end

  create_table "batch_operation_logs", force: :cascade do |t|
    t.string "batch_no", null: false
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.integer "failed_count", default: 0
    t.jsonb "field_errors"
    t.text "notes"
    t.string "operation_type", null: false
    t.string "operator"
    t.text "scope_description"
    t.datetime "started_at"
    t.string "status", default: "pending"
    t.integer "success_count", default: 0
    t.integer "total_count", default: 0
    t.datetime "updated_at", null: false
    t.index ["batch_no"], name: "index_batch_operation_logs_on_batch_no", unique: true
    t.index ["operation_type"], name: "index_batch_operation_logs_on_operation_type"
    t.index ["status"], name: "index_batch_operation_logs_on_status"
  end

  create_table "customers", force: :cascade do |t|
    t.string "address"
    t.date "birthday"
    t.datetime "created_at", null: false
    t.string "gender"
    t.string "id_card"
    t.string "name", null: false
    t.integer "no_show_count", default: 0
    t.text "notes"
    t.string "phone", null: false
    t.datetime "updated_at", null: false
    t.boolean "vip", default: false
    t.index ["id_card"], name: "index_customers_on_id_card"
    t.index ["phone"], name: "index_customers_on_phone", unique: true
  end

  create_table "doctors", force: :cascade do |t|
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.integer "daily_max_patients", default: 20
    t.string "department"
    t.string "name", null: false
    t.text "notes"
    t.string "phone"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_doctors_on_active"
    t.index ["department"], name: "index_doctors_on_department"
  end

  create_table "refund_records", force: :cascade do |t|
    t.bigint "appointment_id", null: false
    t.bigint "appointment_service_item_id"
    t.datetime "created_at", null: false
    t.text "notes"
    t.string "operator"
    t.datetime "processed_at"
    t.decimal "refund_amount", precision: 10, scale: 2, null: false
    t.string "refund_method", default: "original"
    t.string "refund_no", null: false
    t.string "refund_reason", null: false
    t.string "status", default: "pending"
    t.string "transaction_id"
    t.datetime "updated_at", null: false
    t.index ["appointment_id"], name: "index_refund_records_on_appointment_id"
    t.index ["appointment_service_item_id"], name: "index_refund_records_on_appointment_service_item_id"
    t.index ["refund_no"], name: "index_refund_records_on_refund_no", unique: true
    t.index ["status"], name: "index_refund_records_on_status"
  end

  create_table "service_items", force: :cascade do |t|
    t.boolean "active", default: true
    t.string "category"
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "duration_minutes", default: 30
    t.string "name", null: false
    t.decimal "price", precision: 10, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_service_items_on_active"
    t.index ["category"], name: "index_service_items_on_category"
    t.index ["code"], name: "index_service_items_on_code", unique: true
  end

  create_table "time_slots", force: :cascade do |t|
    t.integer "booked_count", default: 0
    t.integer "capacity", default: 1
    t.datetime "created_at", null: false
    t.bigint "doctor_id", null: false
    t.datetime "end_time", null: false
    t.text "notes"
    t.datetime "start_time", null: false
    t.string "status", default: "available"
    t.datetime "updated_at", null: false
    t.integer "waiting_count", default: 0
    t.index ["doctor_id", "start_time"], name: "index_time_slots_on_doctor_id_and_start_time"
    t.index ["doctor_id"], name: "index_time_slots_on_doctor_id"
    t.index ["start_time"], name: "index_time_slots_on_start_time"
    t.index ["status"], name: "index_time_slots_on_status"
  end

  create_table "waiting_list_change_logs", force: :cascade do |t|
    t.bigint "appointment_id"
    t.text "change_details"
    t.string "change_type", null: false
    t.datetime "changed_at", null: false
    t.datetime "created_at", null: false
    t.integer "new_position"
    t.string "new_status"
    t.integer "old_position"
    t.string "old_status"
    t.string "operator"
    t.datetime "updated_at", null: false
    t.bigint "waiting_list_id", null: false
    t.index ["appointment_id"], name: "index_waiting_list_change_logs_on_appointment_id"
    t.index ["change_type"], name: "index_waiting_list_change_logs_on_change_type"
    t.index ["changed_at"], name: "index_waiting_list_change_logs_on_changed_at"
    t.index ["waiting_list_id"], name: "index_waiting_list_change_logs_on_waiting_list_id"
  end

  create_table "waiting_list_notifications", force: :cascade do |t|
    t.string "channel", default: "sms"
    t.text "content"
    t.datetime "created_at", null: false
    t.text "error_message"
    t.text "notes"
    t.string "notification_type", null: false
    t.string "operator"
    t.string "provider_reference"
    t.datetime "read_at"
    t.string "recipient"
    t.datetime "sent_at"
    t.string "status", default: "pending"
    t.datetime "updated_at", null: false
    t.bigint "waiting_list_id", null: false
    t.index ["notification_type"], name: "index_waiting_list_notifications_on_notification_type"
    t.index ["sent_at"], name: "index_waiting_list_notifications_on_sent_at"
    t.index ["status"], name: "index_waiting_list_notifications_on_status"
    t.index ["waiting_list_id", "notification_type"], name: "idx_wl_notifs_on_wl_id_and_type"
    t.index ["waiting_list_id"], name: "index_waiting_list_notifications_on_waiting_list_id"
  end

  create_table "waiting_list_rules", force: :cascade do |t|
    t.boolean "active", default: true
    t.boolean "auto_notify", default: true
    t.integer "confirmation_timeout_minutes", default: 15
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "effective_from"
    t.datetime "effective_to"
    t.integer "max_waiting_per_slot", default: 5
    t.string "name", null: false
    t.string "notify_channel", default: "sms"
    t.integer "priority"
    t.integer "release_minutes_before", default: 60
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_waiting_list_rules_on_active"
    t.index ["priority"], name: "index_waiting_list_rules_on_priority"
  end

  create_table "waiting_lists", force: :cascade do |t|
    t.datetime "confirmed_at"
    t.string "contact_phone"
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.bigint "doctor_id", null: false
    t.datetime "expires_at"
    t.datetime "joined_at", null: false
    t.text "notes"
    t.datetime "notified_at"
    t.integer "position", null: false
    t.bigint "service_item_id"
    t.string "source", default: "front_desk"
    t.string "status", default: "waiting"
    t.bigint "time_slot_id"
    t.string "tracking_code", null: false
    t.datetime "updated_at", null: false
    t.boolean "vip_priority", default: false
    t.bigint "waiting_list_rule_id"
    t.index ["customer_id"], name: "index_waiting_lists_on_customer_id"
    t.index ["doctor_id", "time_slot_id", "status"], name: "index_waiting_lists_on_doctor_id_and_time_slot_id_and_status"
    t.index ["doctor_id"], name: "index_waiting_lists_on_doctor_id"
    t.index ["expires_at"], name: "index_waiting_lists_on_expires_at"
    t.index ["joined_at"], name: "index_waiting_lists_on_joined_at"
    t.index ["service_item_id"], name: "index_waiting_lists_on_service_item_id"
    t.index ["status"], name: "index_waiting_lists_on_status"
    t.index ["time_slot_id"], name: "index_waiting_lists_on_time_slot_id"
    t.index ["tracking_code"], name: "index_waiting_lists_on_tracking_code", unique: true
    t.index ["waiting_list_rule_id"], name: "index_waiting_lists_on_waiting_list_rule_id"
  end

  add_foreign_key "appointment_service_items", "appointments"
  add_foreign_key "appointment_service_items", "service_items"
  add_foreign_key "appointments", "customers"
  add_foreign_key "appointments", "doctors"
  add_foreign_key "appointments", "time_slots"
  add_foreign_key "appointments", "waiting_lists"
  add_foreign_key "batch_operation_items", "batch_operation_logs"
  add_foreign_key "refund_records", "appointment_service_items"
  add_foreign_key "refund_records", "appointments"
  add_foreign_key "time_slots", "doctors"
  add_foreign_key "waiting_list_change_logs", "appointments"
  add_foreign_key "waiting_list_change_logs", "waiting_lists"
  add_foreign_key "waiting_list_notifications", "waiting_lists"
  add_foreign_key "waiting_lists", "customers"
  add_foreign_key "waiting_lists", "doctors"
  add_foreign_key "waiting_lists", "service_items"
  add_foreign_key "waiting_lists", "time_slots"
  add_foreign_key "waiting_lists", "waiting_list_rules"
end
