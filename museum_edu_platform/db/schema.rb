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

ActiveRecord::Schema[8.0].define(version: 2026_06_05_220923) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "check_ins", force: :cascade do |t|
    t.bigint "registration_id", null: false
    t.bigint "student_id", null: false
    t.bigint "session_id", null: false
    t.datetime "checked_in_at"
    t.bigint "checked_in_by_id", null: false
    t.integer "status"
    t.string "check_in_method"
    t.text "notes"
    t.string "offline_uuid"
    t.datetime "synced_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["checked_in_by_id"], name: "index_check_ins_on_checked_in_by_id"
    t.index ["offline_uuid"], name: "index_check_ins_on_offline_uuid"
    t.index ["registration_id"], name: "index_check_ins_on_registration_id"
    t.index ["session_id"], name: "index_check_ins_on_session_id"
    t.index ["status"], name: "index_check_ins_on_status"
    t.index ["student_id"], name: "index_check_ins_on_student_id"
  end

  create_table "courses", force: :cascade do |t|
    t.string "title"
    t.string "slug"
    t.text "description"
    t.integer "age_min"
    t.integer "age_max"
    t.integer "duration_minutes"
    t.integer "capacity"
    t.integer "status"
    t.string "category"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_courses_on_slug"
    t.index ["status"], name: "index_courses_on_status"
  end

  create_table "equipment", force: :cascade do |t|
    t.string "name"
    t.string "category"
    t.integer "quantity"
    t.integer "status"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_equipment_on_name"
    t.index ["status"], name: "index_equipment_on_status"
  end

  create_table "feedbacks", force: :cascade do |t|
    t.bigint "session_id", null: false
    t.bigint "registration_id", null: false
    t.bigint "user_id", null: false
    t.integer "rating"
    t.text "content"
    t.integer "status"
    t.datetime "submitted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["registration_id"], name: "index_feedbacks_on_registration_id"
    t.index ["session_id"], name: "index_feedbacks_on_session_id"
    t.index ["status"], name: "index_feedbacks_on_status"
    t.index ["user_id"], name: "index_feedbacks_on_user_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title"
    t.text "content"
    t.string "notification_type"
    t.datetime "read_at"
    t.string "related_object_type"
    t.integer "related_object_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["notification_type"], name: "index_notifications_on_notification_type"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "registration_students", force: :cascade do |t|
    t.bigint "registration_id", null: false
    t.bigint "student_id", null: false
    t.integer "status"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["registration_id"], name: "index_registration_students_on_registration_id"
    t.index ["status"], name: "index_registration_students_on_status"
    t.index ["student_id"], name: "index_registration_students_on_student_id"
  end

  create_table "registrations", force: :cascade do |t|
    t.bigint "session_id", null: false
    t.bigint "user_id", null: false
    t.bigint "school_id", null: false
    t.integer "registration_type"
    t.integer "status"
    t.integer "student_count"
    t.string "contact_name"
    t.string "contact_phone"
    t.string "contact_email"
    t.text "notes"
    t.datetime "submitted_at"
    t.datetime "approved_at"
    t.datetime "rejected_at"
    t.text "rejection_reason"
    t.string "qr_token"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["qr_token"], name: "index_registrations_on_qr_token"
    t.index ["registration_type"], name: "index_registrations_on_registration_type"
    t.index ["school_id"], name: "index_registrations_on_school_id"
    t.index ["session_id"], name: "index_registrations_on_session_id"
    t.index ["status"], name: "index_registrations_on_status"
    t.index ["user_id"], name: "index_registrations_on_user_id"
  end

  create_table "schools", force: :cascade do |t|
    t.string "name"
    t.string "contact_person"
    t.string "phone"
    t.string "email"
    t.string "address"
    t.integer "status"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_schools_on_name"
    t.index ["status"], name: "index_schools_on_status"
  end

  create_table "session_equipments", force: :cascade do |t|
    t.bigint "session_id", null: false
    t.bigint "equipment_id", null: false
    t.integer "quantity_allocated"
    t.integer "status"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["equipment_id"], name: "index_session_equipments_on_equipment_id"
    t.index ["session_id"], name: "index_session_equipments_on_session_id"
    t.index ["status"], name: "index_session_equipments_on_status"
  end

  create_table "session_guides", force: :cascade do |t|
    t.bigint "session_id", null: false
    t.bigint "user_id", null: false
    t.string "role"
    t.integer "status"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["session_id"], name: "index_session_guides_on_session_id"
    t.index ["status"], name: "index_session_guides_on_status"
    t.index ["user_id"], name: "index_session_guides_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.datetime "start_at"
    t.datetime "end_at"
    t.string "location"
    t.integer "capacity"
    t.integer "registered_count"
    t.integer "status"
    t.text "notes"
    t.string "qr_code_token"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_sessions_on_course_id"
    t.index ["qr_code_token"], name: "index_sessions_on_qr_code_token"
    t.index ["status"], name: "index_sessions_on_status"
  end

  create_table "students", force: :cascade do |t|
    t.bigint "school_id", null: false
    t.string "name"
    t.integer "gender"
    t.integer "age_group"
    t.integer "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["school_id"], name: "index_students_on_school_id"
    t.index ["status"], name: "index_students_on_status"
  end

  create_table "users", force: :cascade do |t|
    t.string "name"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.integer "role"
    t.string "phone"
    t.integer "status"
    t.datetime "last_login_at"
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.integer "failed_attempts", default: 0, null: false
    t.string "unlock_token"
    t.datetime "locked_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
    t.index ["status"], name: "index_users_on_status"
    t.index ["unlock_token"], name: "index_users_on_unlock_token", unique: true
  end

  create_table "versions", force: :cascade do |t|
    t.string "whodunnit"
    t.datetime "created_at"
    t.bigint "item_id", null: false
    t.string "item_type", null: false
    t.string "event", null: false
    t.text "object"
    t.index ["item_type", "item_id"], name: "index_versions_on_item_type_and_item_id"
  end

  add_foreign_key "check_ins", "registrations"
  add_foreign_key "check_ins", "sessions"
  add_foreign_key "check_ins", "students"
  add_foreign_key "check_ins", "users", column: "checked_in_by_id"
  add_foreign_key "feedbacks", "registrations"
  add_foreign_key "feedbacks", "sessions"
  add_foreign_key "feedbacks", "users"
  add_foreign_key "notifications", "users"
  add_foreign_key "registration_students", "registrations"
  add_foreign_key "registration_students", "students"
  add_foreign_key "registrations", "schools"
  add_foreign_key "registrations", "sessions"
  add_foreign_key "registrations", "users"
  add_foreign_key "session_equipments", "equipment"
  add_foreign_key "session_equipments", "sessions"
  add_foreign_key "session_guides", "sessions"
  add_foreign_key "session_guides", "users"
  add_foreign_key "sessions", "courses"
  add_foreign_key "students", "schools"
end
