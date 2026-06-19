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

ActiveRecord::Schema[8.1].define(version: 2024_01_01_000010) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "claims", force: :cascade do |t|
    t.decimal "amount"
    t.string "claim_no", null: false
    t.string "claim_type"
    t.datetime "created_at", null: false
    t.text "description"
    t.bigint "driver_id"
    t.string "evidence_url"
    t.text "handle_result"
    t.datetime "handled_at"
    t.bigint "handler_id"
    t.datetime "reported_at"
    t.bigint "reported_by"
    t.bigint "settlement_id"
    t.string "status", default: "pending"
    t.datetime "updated_at", null: false
    t.bigint "vehicle_id"
    t.index ["claim_no"], name: "index_claims_on_claim_no", unique: true
    t.index ["driver_id"], name: "index_claims_on_driver_id"
    t.index ["handler_id"], name: "index_claims_on_handler_id"
    t.index ["reported_by"], name: "index_claims_on_reported_by"
    t.index ["settlement_id"], name: "index_claims_on_settlement_id"
    t.index ["vehicle_id"], name: "index_claims_on_vehicle_id"
  end

  create_table "driver_assignments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "new_driver_id"
    t.bigint "old_driver_id"
    t.integer "processing_duration_seconds"
    t.string "reason"
    t.datetime "reassigned_at"
    t.bigint "reassigned_by"
    t.text "remark"
    t.datetime "updated_at", null: false
    t.bigint "vehicle_id"
    t.index ["new_driver_id"], name: "index_driver_assignments_on_new_driver_id"
    t.index ["old_driver_id"], name: "index_driver_assignments_on_old_driver_id"
    t.index ["reassigned_by"], name: "index_driver_assignments_on_reassigned_by"
    t.index ["vehicle_id"], name: "index_driver_assignments_on_vehicle_id"
  end

  create_table "location_records", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.decimal "heading"
    t.decimal "latitude"
    t.decimal "longitude"
    t.datetime "recorded_at"
    t.decimal "speed"
    t.datetime "updated_at", null: false
    t.bigint "vehicle_id"
    t.index ["vehicle_id", "recorded_at"], name: "index_location_records_on_vehicle_id_and_recorded_at"
  end

  create_table "operation_logs", force: :cascade do |t|
    t.string "action"
    t.datetime "created_at", null: false
    t.text "details"
    t.string "ip_address"
    t.bigint "target_id"
    t.string "target_type"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.bigint "user_id"
    t.index ["created_at"], name: "index_operation_logs_on_created_at"
    t.index ["target_type", "target_id"], name: "index_operation_logs_on_target_type_and_target_id"
    t.index ["user_id"], name: "index_operation_logs_on_user_id"
  end

  create_table "settlements", force: :cascade do |t|
    t.decimal "base_fee"
    t.decimal "bonus_amount"
    t.bigint "captain_id"
    t.datetime "created_at", null: false
    t.decimal "deduction_amount"
    t.bigint "driver_id"
    t.date "end_date"
    t.text "remark"
    t.string "settlement_no", null: false
    t.date "start_date"
    t.string "status", default: "draft"
    t.decimal "total_amount"
    t.decimal "total_hours"
    t.decimal "total_mileage"
    t.datetime "updated_at", null: false
    t.bigint "vehicle_id"
    t.index ["captain_id"], name: "index_settlements_on_captain_id"
    t.index ["driver_id"], name: "index_settlements_on_driver_id"
    t.index ["settlement_no"], name: "index_settlements_on_settlement_no", unique: true
    t.index ["vehicle_id"], name: "index_settlements_on_vehicle_id"
  end

  create_table "temperature_alerts", force: :cascade do |t|
    t.string "alert_type"
    t.datetime "created_at", null: false
    t.integer "duration_seconds"
    t.datetime "end_time"
    t.text "resolution_note"
    t.datetime "resolved_at"
    t.bigint "resolved_by"
    t.datetime "start_time"
    t.string "status", default: "active"
    t.decimal "temperature"
    t.decimal "threshold"
    t.datetime "updated_at", null: false
    t.bigint "vehicle_id"
    t.index ["resolved_by"], name: "index_temperature_alerts_on_resolved_by"
    t.index ["status"], name: "index_temperature_alerts_on_status"
    t.index ["vehicle_id"], name: "index_temperature_alerts_on_vehicle_id"
  end

  create_table "temperature_records", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "recorded_at"
    t.decimal "temperature"
    t.datetime "updated_at", null: false
    t.bigint "vehicle_id"
    t.index ["vehicle_id", "recorded_at"], name: "index_temperature_records_on_vehicle_id_and_recorded_at"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "confirmation_sent_at"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "created_at", null: false
    t.datetime "current_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.integer "failed_attempts", default: 0, null: false
    t.datetime "last_sign_in_at"
    t.string "last_sign_in_ip"
    t.datetime "locked_at"
    t.string "name"
    t.string "phone"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "role", default: "driver"
    t.integer "sign_in_count", default: 0, null: false
    t.string "status", default: "active"
    t.string "unconfirmed_email"
    t.string "unlock_token"
    t.datetime "updated_at", null: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["unlock_token"], name: "index_users_on_unlock_token", unique: true
  end

  create_table "vehicles", force: :cascade do |t|
    t.decimal "capacity"
    t.datetime "created_at", null: false
    t.bigint "current_driver_id"
    t.datetime "last_location_at"
    t.decimal "last_location_lat"
    t.decimal "last_location_lng"
    t.decimal "last_temperature"
    t.datetime "last_temperature_at"
    t.decimal "max_temperature"
    t.decimal "min_temperature"
    t.string "model"
    t.string "plate_number", null: false
    t.string "status", default: "active"
    t.datetime "updated_at", null: false
    t.string "vehicle_type"
    t.index ["current_driver_id"], name: "index_vehicles_on_current_driver_id"
    t.index ["plate_number"], name: "index_vehicles_on_plate_number", unique: true
  end
end
