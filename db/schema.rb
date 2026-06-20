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

ActiveRecord::Schema[8.1].define(version: 2026_06_20_222434) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "audit_logs", force: :cascade do |t|
    t.string "action_type", null: false
    t.datetime "created_at", null: false
    t.string "field_name"
    t.text "new_value"
    t.text "old_value"
    t.string "remark"
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["action_type"], name: "index_audit_logs_on_action_type"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["ticket_id"], name: "index_audit_logs_on_ticket_id"
    t.index ["user_id"], name: "index_audit_logs_on_user_id"
  end

  create_table "departments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_departments_on_name", unique: true
  end

  create_table "review_conclusions", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.integer "efficiency_after", default: 50
    t.integer "efficiency_before", default: 50
    t.text "improvement"
    t.text "result"
    t.datetime "reviewed_at"
    t.bigint "reviewer_id", null: false
    t.text "root_cause"
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_review_conclusions_on_created_at"
    t.index ["reviewer_id"], name: "index_review_conclusions_on_reviewer_id"
    t.index ["ticket_id"], name: "index_review_conclusions_on_ticket_id"
  end

  create_table "tickets", force: :cascade do |t|
    t.bigint "assignee_id", null: false
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.datetime "deadline"
    t.bigint "department_id", null: false
    t.text "description"
    t.integer "priority", default: 1, null: false
    t.string "process_node", default: "需求提交"
    t.integer "status", default: 0, null: false
    t.bigint "submitter_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["assignee_id"], name: "index_tickets_on_assignee_id"
    t.index ["created_at"], name: "index_tickets_on_created_at"
    t.index ["department_id"], name: "index_tickets_on_department_id"
    t.index ["priority"], name: "index_tickets_on_priority"
    t.index ["process_node"], name: "index_tickets_on_process_node"
    t.index ["status"], name: "index_tickets_on_status"
    t.index ["submitter_id"], name: "index_tickets_on_submitter_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "department_id"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "role", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["department_id"], name: "index_users_on_department_id"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  create_table "versions", force: :cascade do |t|
    t.datetime "created_at"
    t.string "event", null: false
    t.bigint "item_id", null: false
    t.string "item_type", null: false
    t.text "object"
    t.string "whodunnit"
    t.index ["item_type", "item_id"], name: "index_versions_on_item_type_and_item_id"
  end

  add_foreign_key "audit_logs", "tickets"
  add_foreign_key "audit_logs", "users"
  add_foreign_key "review_conclusions", "tickets"
  add_foreign_key "review_conclusions", "users", column: "reviewer_id"
  add_foreign_key "tickets", "departments"
  add_foreign_key "tickets", "users", column: "assignee_id"
  add_foreign_key "tickets", "users", column: "submitter_id"
  add_foreign_key "users", "departments"
end
