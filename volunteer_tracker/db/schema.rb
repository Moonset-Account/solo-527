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

ActiveRecord::Schema[8.1].define(version: 2026_06_20_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "donations", force: :cascade do |t|
    t.decimal "amount"
    t.datetime "created_at", null: false
    t.string "donation_type"
    t.string "donor_contact"
    t.string "donor_name"
    t.bigint "material_id"
    t.integer "quantity"
    t.text "remark"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["material_id"], name: "index_donations_on_material_id"
    t.index ["status"], name: "index_donations_on_status"
  end

  create_table "material_transactions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "material_id", null: false
    t.bigint "operator_id"
    t.integer "quantity"
    t.string "recipient"
    t.text "remark"
    t.string "transaction_type"
    t.datetime "updated_at", null: false
    t.index ["material_id"], name: "index_material_transactions_on_material_id"
    t.index ["operator_id"], name: "index_material_transactions_on_operator_id"
  end

  create_table "materials", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.string "name"
    t.integer "quantity"
    t.integer "threshold"
    t.string "unit"
    t.datetime "updated_at", null: false
  end

  create_table "overdue_reviews", force: :cascade do |t|
    t.text "conclusion"
    t.datetime "created_at", null: false
    t.text "impact_scope"
    t.string "responsible_person"
    t.date "review_date"
    t.bigint "reviewer_id"
    t.datetime "updated_at", null: false
    t.bigint "visit_record_id", null: false
    t.index ["reviewer_id"], name: "index_overdue_reviews_on_reviewer_id"
    t.index ["visit_record_id"], name: "index_overdue_reviews_on_visit_record_id"
  end

  create_table "shift_enrollments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "shift_id", null: false
    t.string "status"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["shift_id"], name: "index_shift_enrollments_on_shift_id"
    t.index ["status"], name: "index_shift_enrollments_on_status"
    t.index ["user_id"], name: "index_shift_enrollments_on_user_id"
  end

  create_table "shifts", force: :cascade do |t|
    t.integer "capacity"
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "end_time"
    t.datetime "start_time"
    t.string "status"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_shifts_on_status"
  end

  create_table "tracking_reminders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "message"
    t.date "reminder_date"
    t.string "reminder_type"
    t.string "status"
    t.integer "trackable_id"
    t.string "trackable_type"
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_tracking_reminders_on_status"
    t.index ["trackable_type", "trackable_id"], name: "index_tracking_reminders_on_trackable_type_and_trackable_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name", default: "", null: false
    t.string "phone"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "role", default: "volunteer", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "visit_records", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "next_action"
    t.text "purpose"
    t.text "result"
    t.string "status"
    t.string "target_address"
    t.string "target_contact"
    t.string "target_name"
    t.datetime "updated_at", null: false
    t.date "visit_date"
    t.bigint "volunteer_id", null: false
    t.index ["status"], name: "index_visit_records_on_status"
    t.index ["volunteer_id"], name: "index_visit_records_on_volunteer_id"
  end

  create_table "volunteer_service_assignments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "role"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "volunteer_service_id", null: false
    t.index ["user_id"], name: "index_volunteer_service_assignments_on_user_id"
    t.index ["volunteer_service_id"], name: "index_volunteer_service_assignments_on_volunteer_service_id"
  end

  create_table "volunteer_services", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.text "description"
    t.date "end_date"
    t.date "start_date"
    t.string "status"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_volunteer_services_on_status"
  end

  add_foreign_key "donations", "materials"
  add_foreign_key "material_transactions", "materials"
  add_foreign_key "material_transactions", "users", column: "operator_id"
  add_foreign_key "overdue_reviews", "users", column: "reviewer_id"
  add_foreign_key "overdue_reviews", "visit_records"
  add_foreign_key "shift_enrollments", "shifts"
  add_foreign_key "shift_enrollments", "users"
  add_foreign_key "visit_records", "users", column: "volunteer_id"
  add_foreign_key "volunteer_service_assignments", "users"
  add_foreign_key "volunteer_service_assignments", "volunteer_services"
end
