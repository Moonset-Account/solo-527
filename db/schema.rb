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

ActiveRecord::Schema[8.1].define(version: 2026_06_12_000012) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "audit_logs", force: :cascade do |t|
    t.string "action_type"
    t.datetime "created_at", null: false
    t.text "details"
    t.integer "entity_id"
    t.string "entity_type"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["action_type"], name: "index_audit_logs_on_action_type"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["entity_type", "entity_id"], name: "index_audit_logs_on_entity_type_and_entity_id"
    t.index ["user_id"], name: "index_audit_logs_on_user_id"
  end

  create_table "audits", force: :cascade do |t|
    t.string "action"
    t.bigint "auditable_id"
    t.string "auditable_type"
    t.text "audited_changes"
    t.string "comment"
    t.datetime "created_at"
    t.string "remote_address"
    t.string "request_uuid"
    t.bigint "user_id"
    t.string "user_type"
    t.string "username"
    t.integer "version", default: 0
    t.index ["auditable_type", "auditable_id", "version"], name: "auditable_index"
    t.index ["created_at"], name: "index_audits_on_created_at"
    t.index ["request_uuid"], name: "index_audits_on_request_uuid"
    t.index ["user_id", "user_type"], name: "user_index"
  end

  create_table "equipment", force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.string "equipment_type"
    t.date "last_maintenance_date"
    t.string "location"
    t.string "name"
    t.date "purchase_date"
    t.decimal "standard_output_per_hour", precision: 10, scale: 2, default: "50.0"
    t.integer "status", default: 0
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_equipment_on_code", unique: true
    t.index ["status"], name: "index_equipment_on_status"
  end

  create_table "failed_batches", force: :cascade do |t|
    t.string "batch_no"
    t.datetime "created_at", null: false
    t.text "error_message"
    t.text "payload"
    t.bigint "process_step_id"
    t.datetime "resolved_at"
    t.bigint "resolved_by_id"
    t.integer "retry_count", default: 0
    t.integer "status", default: 0
    t.datetime "updated_at", null: false
    t.bigint "work_order_id", null: false
    t.index ["batch_no"], name: "index_failed_batches_on_batch_no"
    t.index ["process_step_id"], name: "index_failed_batches_on_process_step_id"
    t.index ["resolved_by_id"], name: "index_failed_batches_on_resolved_by_id"
    t.index ["status"], name: "index_failed_batches_on_status"
    t.index ["work_order_id"], name: "index_failed_batches_on_work_order_id"
  end

  create_table "molds", force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.integer "current_shots", default: 0
    t.date "maintenance_date"
    t.string "material"
    t.integer "max_shots"
    t.string "name"
    t.integer "status", default: 0
    t.integer "total_shots", default: 0
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_molds_on_code", unique: true
    t.index ["status"], name: "index_molds_on_status"
  end

  create_table "process_efficiencies", force: :cascade do |t|
    t.decimal "actual_output_per_hour", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.decimal "duration_hours", precision: 10, scale: 2
    t.decimal "efficiency_rate", precision: 5, scale: 2
    t.bigint "equipment_id"
    t.bigint "mold_id"
    t.bigint "process_step_id", null: false
    t.decimal "standard_output_per_hour", precision: 10, scale: 2
    t.bigint "team_id"
    t.datetime "updated_at", null: false
    t.index ["efficiency_rate"], name: "index_process_efficiencies_on_efficiency_rate"
    t.index ["equipment_id"], name: "index_process_efficiencies_on_equipment_id"
    t.index ["mold_id"], name: "index_process_efficiencies_on_mold_id"
    t.index ["process_step_id"], name: "index_process_efficiencies_on_process_step_id"
    t.index ["team_id"], name: "index_process_efficiencies_on_team_id"
  end

  create_table "process_steps", force: :cascade do |t|
    t.integer "actual_quantity", default: 0
    t.bigint "assigned_equipment_id"
    t.bigint "assigned_team_id"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.integer "defect_quantity", default: 0
    t.bigint "mold_id"
    t.string "name"
    t.datetime "paused_at"
    t.integer "sequence"
    t.datetime "started_at"
    t.integer "status", default: 0
    t.datetime "updated_at", null: false
    t.bigint "work_order_id", null: false
    t.index ["assigned_equipment_id"], name: "index_process_steps_on_assigned_equipment_id"
    t.index ["assigned_team_id"], name: "index_process_steps_on_assigned_team_id"
    t.index ["mold_id"], name: "index_process_steps_on_mold_id"
    t.index ["sequence"], name: "index_process_steps_on_sequence"
    t.index ["status"], name: "index_process_steps_on_status"
    t.index ["work_order_id", "sequence"], name: "index_process_steps_on_work_order_id_and_sequence"
    t.index ["work_order_id"], name: "index_process_steps_on_work_order_id"
  end

  create_table "quality_inspections", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "defect_quantity", default: 0
    t.string "defect_type"
    t.datetime "inspection_time"
    t.bigint "inspector_id", null: false
    t.text "notes"
    t.bigint "process_step_id", null: false
    t.integer "result", default: 0
    t.datetime "updated_at", null: false
    t.index ["inspection_time"], name: "index_quality_inspections_on_inspection_time"
    t.index ["inspector_id"], name: "index_quality_inspections_on_inspector_id"
    t.index ["process_step_id"], name: "index_quality_inspections_on_process_step_id"
    t.index ["result"], name: "index_quality_inspections_on_result"
  end

  create_table "teams", force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.string "leader_name"
    t.integer "member_count"
    t.string "name"
    t.integer "shift", default: 0
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_teams_on_code", unique: true
    t.index ["shift"], name: "index_teams_on_shift"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name"
    t.string "phone"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "role", default: 0
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  create_table "work_orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "customer"
    t.text "notes"
    t.string "order_no", null: false
    t.date "planned_end_date"
    t.date "planned_start_date"
    t.integer "priority", default: 0
    t.string "product_name"
    t.integer "quantity"
    t.integer "status", default: 0
    t.datetime "updated_at", null: false
    t.index ["order_no"], name: "index_work_orders_on_order_no", unique: true
    t.index ["priority"], name: "index_work_orders_on_priority"
    t.index ["status"], name: "index_work_orders_on_status"
  end

  add_foreign_key "audit_logs", "users"
  add_foreign_key "failed_batches", "process_steps"
  add_foreign_key "failed_batches", "users", column: "resolved_by_id"
  add_foreign_key "failed_batches", "work_orders"
  add_foreign_key "process_efficiencies", "equipment"
  add_foreign_key "process_efficiencies", "molds"
  add_foreign_key "process_efficiencies", "process_steps"
  add_foreign_key "process_efficiencies", "teams"
  add_foreign_key "process_steps", "equipment", column: "assigned_equipment_id"
  add_foreign_key "process_steps", "molds"
  add_foreign_key "process_steps", "teams", column: "assigned_team_id"
  add_foreign_key "process_steps", "work_orders"
  add_foreign_key "quality_inspections", "process_steps"
  add_foreign_key "quality_inspections", "users", column: "inspector_id"
end
