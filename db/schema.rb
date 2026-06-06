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

ActiveRecord::Schema[8.0].define(version: 2026_06_06_131000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "booking_students", force: :cascade do |t|
    t.bigint "booking_id", null: false
    t.bigint "student_id", null: false
    t.boolean "attended", default: false
    t.datetime "checked_in_at"
    t.bigint "checked_in_by"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["attended"], name: "index_booking_students_on_attended"
    t.index ["booking_id", "student_id"], name: "index_booking_students_on_booking_id_and_student_id", unique: true
    t.index ["booking_id"], name: "index_booking_students_on_booking_id"
    t.index ["student_id"], name: "index_booking_students_on_student_id"
  end

  create_table "bookings", force: :cascade do |t|
    t.bigint "course_session_id", null: false
    t.bigint "school_id"
    t.bigint "created_by"
    t.integer "booking_type", default: 0, null: false
    t.string "contact_name"
    t.string "contact_phone"
    t.string "contact_email"
    t.integer "student_count", default: 0, null: false
    t.integer "teacher_count", default: 0
    t.text "special_requirements"
    t.integer "status", default: 0, null: false
    t.datetime "cancelled_at"
    t.bigint "cancelled_by"
    t.text "cancel_reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["booking_type"], name: "index_bookings_on_booking_type"
    t.index ["course_session_id"], name: "index_bookings_on_course_session_id"
    t.index ["school_id"], name: "index_bookings_on_school_id"
    t.index ["status"], name: "index_bookings_on_status"
  end

  create_table "course_sessions", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.datetime "start_time", null: false
    t.datetime "end_time", null: false
    t.string "location"
    t.integer "max_participants", default: 30, null: false
    t.integer "status", default: 0, null: false
    t.text "notes"
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_id", "start_time"], name: "index_course_sessions_on_course_id_and_start_time"
    t.index ["deleted_at"], name: "index_course_sessions_on_deleted_at"
    t.index ["start_time"], name: "index_course_sessions_on_start_time"
    t.index ["status"], name: "index_course_sessions_on_status"
  end

  create_table "courses", force: :cascade do |t|
    t.string "title", null: false
    t.text "description"
    t.integer "age_min", default: 6, null: false
    t.integer "age_max", default: 18, null: false
    t.integer "duration_minutes", default: 90, null: false
    t.integer "max_participants", default: 30, null: false
    t.integer "status", default: 0, null: false
    t.bigint "created_by_id"
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_courses_on_created_by_id"
    t.index ["deleted_at"], name: "index_courses_on_deleted_at"
    t.index ["status"], name: "index_courses_on_status"
  end

  create_table "feedbacks", force: :cascade do |t|
    t.bigint "course_session_id", null: false
    t.bigint "booking_id"
    t.bigint "author_id"
    t.integer "rating"
    t.text "content"
    t.text "improvement_suggestions"
    t.boolean "would_recommend", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_feedbacks_on_author_id"
    t.index ["booking_id"], name: "index_feedbacks_on_booking_id"
    t.index ["course_session_id"], name: "index_feedbacks_on_course_session_id"
    t.index ["rating"], name: "index_feedbacks_on_rating"
  end

  create_table "guide_assignments", force: :cascade do |t|
    t.bigint "guide_id", null: false
    t.bigint "course_session_id", null: false
    t.bigint "assigned_by"
    t.string "role"
    t.text "notes"
    t.integer "status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_session_id"], name: "index_guide_assignments_on_course_session_id"
    t.index ["guide_id", "course_session_id"], name: "index_guide_assignments_on_guide_id_and_course_session_id", unique: true
    t.index ["guide_id"], name: "index_guide_assignments_on_guide_id"
    t.index ["status"], name: "index_guide_assignments_on_status"
  end

  create_table "guides", force: :cascade do |t|
    t.string "name", null: false
    t.string "phone", null: false
    t.string "email"
    t.string "employee_id"
    t.text "specialties"
    t.integer "status", default: 0, null: false
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_guides_on_deleted_at"
    t.index ["employee_id"], name: "index_guides_on_employee_id", unique: true
    t.index ["status"], name: "index_guides_on_status"
  end

  create_table "schools", force: :cascade do |t|
    t.string "name", null: false
    t.string "contact_person"
    t.string "phone"
    t.string "email"
    t.string "address"
    t.integer "status", default: 0, null: false
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_schools_on_deleted_at"
    t.index ["name"], name: "index_schools_on_name"
    t.index ["status"], name: "index_schools_on_status"
  end

  create_table "students", force: :cascade do |t|
    t.string "name", null: false
    t.integer "age", null: false
    t.string "grade"
    t.bigint "school_id"
    t.string "id_card_last_four"
    t.string "emergency_contact_name"
    t.string "emergency_contact_phone"
    t.text "health_notes"
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_students_on_deleted_at"
    t.index ["school_id"], name: "index_students_on_school_id"
  end

  create_table "teaching_aid_allocations", force: :cascade do |t|
    t.bigint "teaching_aid_id", null: false
    t.bigint "course_session_id", null: false
    t.integer "quantity", default: 1, null: false
    t.bigint "allocated_by"
    t.datetime "returned_at"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["course_session_id"], name: "index_teaching_aid_allocations_on_course_session_id"
    t.index ["returned_at"], name: "index_teaching_aid_allocations_on_returned_at"
    t.index ["teaching_aid_id", "course_session_id"], name: "idx_on_teaching_aid_id_course_session_id_6129728bab"
    t.index ["teaching_aid_id"], name: "index_teaching_aid_allocations_on_teaching_aid_id"
  end

  create_table "teaching_aids", force: :cascade do |t|
    t.string "name", null: false
    t.string "category"
    t.integer "total_quantity", default: 0, null: false
    t.integer "available_quantity", default: 0, null: false
    t.text "description"
    t.string "location"
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_teaching_aids_on_category"
    t.index ["deleted_at"], name: "index_teaching_aids_on_deleted_at"
  end

  create_table "exports", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "export_type", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.string "filename"
    t.string "file_path"
    t.bigint "file_size"
    t.jsonb "filters", default: {}, null: false
    t.text "error_message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["export_type"], name: "index_exports_on_export_type"
    t.index ["status"], name: "index_exports_on_status"
    t.index ["user_id"], name: "index_exports_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.integer "role", default: 0, null: false
    t.string "phone"
    t.integer "status", default: 0, null: false
    t.bigint "school_id"
    t.datetime "deleted_at"
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["deleted_at"], name: "index_users_on_deleted_at"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
    t.index ["school_id"], name: "index_users_on_school_id"
    t.index ["status"], name: "index_users_on_status"
  end

  add_foreign_key "courses", "users", column: "created_by_id"
end
