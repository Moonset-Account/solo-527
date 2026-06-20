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

ActiveRecord::Schema[8.1].define(version: 2024_01_01_000014) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "batch_jobs", force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.text "error_message"
    t.integer "failure_count", default: 0
    t.text "failure_details"
    t.string "job_type", null: false
    t.jsonb "payload", default: {}
    t.jsonb "result_data", default: {}
    t.string "sidekiq_jid"
    t.datetime "started_at"
    t.string "status", default: "pending", null: false
    t.integer "success_count", default: 0
    t.integer "total_count", default: 0
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["created_at"], name: "index_batch_jobs_on_created_at"
    t.index ["job_type"], name: "index_batch_jobs_on_job_type"
    t.index ["sidekiq_jid"], name: "index_batch_jobs_on_sidekiq_jid"
    t.index ["status"], name: "index_batch_jobs_on_status"
    t.index ["user_id"], name: "index_batch_jobs_on_user_id"
  end

  create_table "check_ins", force: :cascade do |t|
    t.string "check_in_method"
    t.datetime "checked_in_at"
    t.bigint "checkinable_id", null: false
    t.string "checkinable_type", null: false
    t.datetime "created_at", null: false
    t.bigint "operator_id"
    t.text "remark"
    t.string "source"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["checked_in_at"], name: "index_check_ins_on_checked_in_at"
    t.index ["checkinable_type", "checkinable_id"], name: "index_check_ins_on_checkinable"
    t.index ["checkinable_type", "checkinable_id"], name: "index_check_ins_on_checkinable_type_and_checkinable_id"
    t.index ["operator_id"], name: "index_check_ins_on_operator_id"
    t.index ["status"], name: "index_check_ins_on_status"
    t.index ["user_id"], name: "index_check_ins_on_user_id"
  end

  create_table "course_enrollments", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.datetime "enrolled_at"
    t.string "payment_status", default: "unpaid"
    t.decimal "price", precision: 10, scale: 2
    t.text "remark"
    t.string "source"
    t.bigint "source_payment_id"
    t.string "source_payment_type"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["course_id"], name: "index_course_enrollments_on_course_id"
    t.index ["created_at"], name: "index_course_enrollments_on_created_at"
    t.index ["payment_status"], name: "index_course_enrollments_on_payment_status"
    t.index ["source_payment_type", "source_payment_id"], name: "index_course_enrollments_on_source_payment"
    t.index ["status"], name: "index_course_enrollments_on_status"
    t.index ["user_id", "course_id"], name: "index_course_enrollments_on_user_id_and_course_id"
    t.index ["user_id"], name: "index_course_enrollments_on_user_id"
  end

  create_table "courses", force: :cascade do |t|
    t.integer "capacity", default: 0, null: false
    t.string "coach"
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "end_date"
    t.integer "enrolled_count", default: 0, null: false
    t.string "level"
    t.string "name", null: false
    t.decimal "price", precision: 10, scale: 2, default: "0.0"
    t.string "schedule_info"
    t.datetime "start_date"
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.bigint "venue_id"
    t.index ["level"], name: "index_courses_on_level"
    t.index ["start_date"], name: "index_courses_on_start_date"
    t.index ["status"], name: "index_courses_on_status"
    t.index ["venue_id"], name: "index_courses_on_venue_id"
  end

  create_table "event_registrations", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.bigint "event_id", null: false
    t.string "payment_status", default: "unpaid"
    t.datetime "registered_at"
    t.decimal "registration_fee", precision: 10, scale: 2
    t.text "remark"
    t.string "source"
    t.string "status", default: "pending", null: false
    t.string "team_name"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["event_id"], name: "index_event_registrations_on_event_id"
    t.index ["payment_status"], name: "index_event_registrations_on_payment_status"
    t.index ["status"], name: "index_event_registrations_on_status"
    t.index ["user_id", "event_id"], name: "index_event_registrations_on_user_id_and_event_id", unique: true
    t.index ["user_id"], name: "index_event_registrations_on_user_id"
  end

  create_table "events", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "end_date"
    t.string "event_type"
    t.integer "max_participants"
    t.string "name", null: false
    t.text "prizes"
    t.datetime "registration_end"
    t.decimal "registration_fee", precision: 10, scale: 2, default: "0.0"
    t.datetime "registration_start"
    t.text "rules"
    t.datetime "start_date"
    t.string "status", default: "draft", null: false
    t.datetime "updated_at", null: false
    t.bigint "venue_id"
    t.index ["event_type"], name: "index_events_on_event_type"
    t.index ["start_date"], name: "index_events_on_start_date"
    t.index ["status"], name: "index_events_on_status"
    t.index ["venue_id"], name: "index_events_on_venue_id"
  end

  create_table "leave_requests", force: :cascade do |t|
    t.text "approve_note"
    t.datetime "approved_at"
    t.bigint "approved_by_id"
    t.bigint "course_enrollment_id", null: false
    t.datetime "created_at", null: false
    t.date "leave_date", null: false
    t.string "reason"
    t.text "remark"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["approved_by_id"], name: "index_leave_requests_on_approved_by_id"
    t.index ["course_enrollment_id"], name: "index_leave_requests_on_course_enrollment_id"
    t.index ["leave_date"], name: "index_leave_requests_on_leave_date"
    t.index ["status"], name: "index_leave_requests_on_status"
    t.index ["user_id", "leave_date"], name: "index_leave_requests_on_user_id_and_leave_date"
    t.index ["user_id"], name: "index_leave_requests_on_user_id"
  end

  create_table "payments", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "failed_at"
    t.text "failure_reason"
    t.datetime "paid_at"
    t.bigint "payable_id", null: false
    t.string "payable_type", null: false
    t.string "payment_method"
    t.text "remark"
    t.integer "retry_count", default: 0
    t.string "source"
    t.string "status", default: "pending", null: false
    t.string "transaction_id"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["payable_type", "payable_id"], name: "index_payments_on_payable"
    t.index ["payable_type", "payable_id"], name: "index_payments_on_payable_type_and_payable_id"
    t.index ["status"], name: "index_payments_on_status"
    t.index ["transaction_id"], name: "index_payments_on_transaction_id"
    t.index ["user_id"], name: "index_payments_on_user_id"
  end

  create_table "results", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "event_registration_id", null: false
    t.bigint "operator_id"
    t.integer "rank"
    t.text "remark"
    t.bigint "schedule_id"
    t.decimal "score", precision: 10, scale: 2
    t.string "status", default: "pending"
    t.string "time_result"
    t.datetime "updated_at", null: false
    t.index ["event_registration_id"], name: "index_results_on_event_registration_id"
    t.index ["operator_id"], name: "index_results_on_operator_id"
    t.index ["rank"], name: "index_results_on_rank"
    t.index ["schedule_id"], name: "index_results_on_schedule_id"
    t.index ["status"], name: "index_results_on_status"
  end

  create_table "schedules", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "end_time"
    t.bigint "event_id", null: false
    t.integer "max_participants"
    t.text "result_note"
    t.integer "round"
    t.datetime "start_time", null: false
    t.string "status", default: "scheduled"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "venue_id"
    t.index ["event_id"], name: "index_schedules_on_event_id"
    t.index ["start_time"], name: "index_schedules_on_start_time"
    t.index ["status"], name: "index_schedules_on_status"
    t.index ["venue_id"], name: "index_schedules_on_venue_id"
  end

  create_table "users", force: :cascade do |t|
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name", null: false
    t.string "phone"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "role", default: "member", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["name"], name: "index_users_on_name"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  create_table "venue_bookings", force: :cascade do |t|
    t.bigint "bookable_id"
    t.string "bookable_type"
    t.datetime "created_at", null: false
    t.datetime "end_time", null: false
    t.string "purpose"
    t.text "remark"
    t.string "source"
    t.datetime "start_time", null: false
    t.string "status", default: "confirmed", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "venue_id", null: false
    t.index ["bookable_type", "bookable_id"], name: "index_venue_bookings_on_bookable"
    t.index ["bookable_type", "bookable_id"], name: "index_venue_bookings_on_bookable_type_and_bookable_id"
    t.index ["status"], name: "index_venue_bookings_on_status"
    t.index ["user_id"], name: "index_venue_bookings_on_user_id"
    t.index ["venue_id", "start_time"], name: "index_venue_bookings_on_venue_id_and_start_time"
    t.index ["venue_id"], name: "index_venue_bookings_on_venue_id"
  end

  create_table "venues", force: :cascade do |t|
    t.integer "capacity"
    t.datetime "created_at", null: false
    t.text "description"
    t.text "facilities"
    t.string "location"
    t.string "name", null: false
    t.string "status", default: "active"
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_venues_on_name"
    t.index ["status"], name: "index_venues_on_status"
  end

  create_table "versions", force: :cascade do |t|
    t.datetime "created_at"
    t.string "event", null: false
    t.bigint "item_id", null: false
    t.string "item_type", null: false
    t.text "object"
    t.text "object_changes"
    t.string "transaction_id"
    t.string "whodunnit"
    t.index ["item_type", "item_id"], name: "index_versions_on_item_type_and_item_id"
    t.index ["transaction_id"], name: "index_versions_on_transaction_id"
  end

  add_foreign_key "batch_jobs", "users"
  add_foreign_key "check_ins", "users"
  add_foreign_key "check_ins", "users", column: "operator_id"
  add_foreign_key "course_enrollments", "courses"
  add_foreign_key "course_enrollments", "users"
  add_foreign_key "event_registrations", "events"
  add_foreign_key "event_registrations", "users"
  add_foreign_key "leave_requests", "course_enrollments"
  add_foreign_key "leave_requests", "users"
  add_foreign_key "leave_requests", "users", column: "approved_by_id"
  add_foreign_key "payments", "users"
  add_foreign_key "results", "event_registrations"
  add_foreign_key "results", "schedules"
  add_foreign_key "results", "users", column: "operator_id"
  add_foreign_key "schedules", "events"
  add_foreign_key "schedules", "venues"
  add_foreign_key "venue_bookings", "users"
  add_foreign_key "venue_bookings", "venues"
end
