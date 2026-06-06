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

ActiveRecord::Schema[8.0].define(version: 2024_01_01_000014) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "approvals", force: :cascade do |t|
    t.bigint "pass_id", null: false
    t.bigint "approver_id"
    t.integer "approval_level", default: 1, null: false
    t.string "status", default: "pending", null: false
    t.text "comment"
    t.datetime "approved_at"
    t.datetime "rejected_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["approver_id"], name: "index_approvals_on_approver_id"
    t.index ["pass_id"], name: "index_approvals_on_pass_id"
  end

  create_table "credentials", force: :cascade do |t|
    t.bigint "person_id", null: false
    t.string "credential_type", null: false
    t.string "credential_number", null: false
    t.string "issuing_authority"
    t.date "issue_date"
    t.date "expiry_date"
    t.string "credential_level"
    t.boolean "verified", default: false
    t.datetime "verified_at"
    t.bigint "verifier_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["credential_type", "credential_number"], name: "index_credentials_on_credential_type_and_credential_number", unique: true
    t.index ["person_id"], name: "index_credentials_on_person_id"
    t.index ["verifier_id"], name: "index_credentials_on_verifier_id"
  end

  create_table "error_logs", force: :cascade do |t|
    t.string "level", default: "error", null: false
    t.string "controller"
    t.string "action"
    t.string "error_class"
    t.string "message"
    t.text "backtrace"
    t.text "request_info"
    t.bigint "user_id"
    t.string "session_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_error_logs_on_created_at"
    t.index ["level"], name: "index_error_logs_on_level"
    t.index ["user_id"], name: "index_error_logs_on_user_id"
  end

  create_table "gate_logs", force: :cascade do |t|
    t.bigint "pass_id"
    t.bigint "person_id"
    t.bigint "vehicle_id"
    t.string "gate_name", null: false
    t.string "action", null: false
    t.datetime "logged_at", null: false
    t.bigint "operator_id"
    t.string "result", null: false
    t.text "remark"
    t.string "temperature"
    t.string "id_card_verified"
    t.string "photo_match_result"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["logged_at"], name: "index_gate_logs_on_logged_at"
    t.index ["operator_id"], name: "index_gate_logs_on_operator_id"
    t.index ["pass_id"], name: "index_gate_logs_on_pass_id"
    t.index ["person_id"], name: "index_gate_logs_on_person_id"
    t.index ["vehicle_id"], name: "index_gate_logs_on_vehicle_id"
  end

  create_table "import_export_jobs", force: :cascade do |t|
    t.string "job_type", null: false
    t.string "status", default: "pending", null: false
    t.bigint "creator_id"
    t.string "file_name"
    t.string "file_url"
    t.text "params"
    t.integer "total_count", default: 0
    t.integer "processed_count", default: 0
    t.integer "success_count", default: 0
    t.integer "failed_count", default: 0
    t.text "error_messages"
    t.datetime "started_at"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["creator_id"], name: "index_import_export_jobs_on_creator_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "recipient_id"
    t.string "title", null: false
    t.text "content"
    t.string "notification_type", null: false
    t.string "notifiable_type"
    t.bigint "notifiable_id"
    t.boolean "read", default: false
    t.datetime "read_at"
    t.string "priority", default: "normal"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable"
    t.index ["recipient_id", "read"], name: "index_notifications_on_recipient_id_and_read"
    t.index ["recipient_id"], name: "index_notifications_on_recipient_id"
  end

  create_table "pass_work_zones", force: :cascade do |t|
    t.bigint "pass_id", null: false
    t.bigint "work_zone_id", null: false
    t.string "access_level", default: "read"
    t.datetime "granted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pass_id", "work_zone_id"], name: "index_pass_work_zones_on_pass_id_and_work_zone_id", unique: true
    t.index ["pass_id"], name: "index_pass_work_zones_on_pass_id"
    t.index ["work_zone_id"], name: "index_pass_work_zones_on_work_zone_id"
  end

  create_table "passes", force: :cascade do |t|
    t.string "pass_number", null: false
    t.bigint "person_id", null: false
    t.bigint "vehicle_id"
    t.string "pass_type", default: "temporary", null: false
    t.string "purpose"
    t.bigint "work_zone_id"
    t.datetime "valid_from", null: false
    t.datetime "valid_until", null: false
    t.string "status", default: "pending", null: false
    t.boolean "is_frozen", default: false
    t.datetime "frozen_at"
    t.string "freeze_reason"
    t.text "remark"
    t.bigint "creator_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["creator_id"], name: "index_passes_on_creator_id"
    t.index ["pass_number"], name: "index_passes_on_pass_number", unique: true
    t.index ["person_id"], name: "index_passes_on_person_id"
    t.index ["status"], name: "index_passes_on_status"
    t.index ["valid_until"], name: "index_passes_on_valid_until"
    t.index ["vehicle_id"], name: "index_passes_on_vehicle_id"
    t.index ["work_zone_id"], name: "index_passes_on_work_zone_id"
  end

  create_table "people", force: :cascade do |t|
    t.string "name", null: false
    t.string "id_card", null: false
    t.string "gender"
    t.date "birth_date"
    t.string "phone"
    t.string "address"
    t.string "company"
    t.string "person_type", default: "visitor", null: false
    t.string "photo_url"
    t.text "remark"
    t.boolean "blacklisted", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["id_card"], name: "index_people_on_id_card", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "username", null: false
    t.string "email"
    t.string "password_digest", null: false
    t.string "role", default: "guard", null: false
    t.string "real_name"
    t.string "phone"
    t.string "department"
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  create_table "vehicles", force: :cascade do |t|
    t.string "plate_number", null: false
    t.string "vehicle_type"
    t.string "color"
    t.string "brand_model"
    t.string "owner_type"
    t.bigint "owner_id"
    t.string "insurance_number"
    t.date "insurance_expiry"
    t.string "license_number"
    t.date "license_expiry"
    t.boolean "blacklisted", default: false
    t.text "remark"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["owner_type", "owner_id"], name: "index_vehicles_on_owner"
    t.index ["plate_number"], name: "index_vehicles_on_plate_number", unique: true
  end

  create_table "violations", force: :cascade do |t|
    t.bigint "person_id"
    t.bigint "vehicle_id"
    t.bigint "pass_id"
    t.bigint "work_zone_id"
    t.string "violation_type", null: false
    t.string "description"
    t.datetime "violated_at", null: false
    t.string "location"
    t.bigint "reporter_id"
    t.string "severity", default: "minor"
    t.string "status", default: "reported"
    t.text "handling_notes"
    t.boolean "result_in_freeze", default: false
    t.integer "freeze_days"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pass_id"], name: "index_violations_on_pass_id"
    t.index ["person_id"], name: "index_violations_on_person_id"
    t.index ["reporter_id"], name: "index_violations_on_reporter_id"
    t.index ["vehicle_id"], name: "index_violations_on_vehicle_id"
    t.index ["work_zone_id"], name: "index_violations_on_work_zone_id"
  end

  create_table "work_zones", force: :cascade do |t|
    t.string "name", null: false
    t.string "code", null: false
    t.string "zone_type", default: "normal", null: false
    t.string "location"
    t.text "description"
    t.boolean "requires_second_approval", default: false
    t.integer "max_capacity"
    t.string "status", default: "active"
    t.string "time_restrictions"
    t.text "safety_requirements"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_work_zones_on_code", unique: true
  end

  add_foreign_key "approvals", "passes"
  add_foreign_key "approvals", "users", column: "approver_id"
  add_foreign_key "credentials", "people"
  add_foreign_key "credentials", "users", column: "verifier_id"
  add_foreign_key "error_logs", "users"
  add_foreign_key "gate_logs", "passes"
  add_foreign_key "gate_logs", "people"
  add_foreign_key "gate_logs", "users", column: "operator_id"
  add_foreign_key "gate_logs", "vehicles"
  add_foreign_key "import_export_jobs", "users", column: "creator_id"
  add_foreign_key "notifications", "users", column: "recipient_id"
  add_foreign_key "pass_work_zones", "passes"
  add_foreign_key "pass_work_zones", "work_zones"
  add_foreign_key "passes", "people"
  add_foreign_key "passes", "users", column: "creator_id"
  add_foreign_key "passes", "vehicles"
  add_foreign_key "passes", "work_zones"
  add_foreign_key "violations", "passes"
  add_foreign_key "violations", "people"
  add_foreign_key "violations", "users", column: "reporter_id"
  add_foreign_key "violations", "vehicles"
  add_foreign_key "violations", "work_zones"
end
