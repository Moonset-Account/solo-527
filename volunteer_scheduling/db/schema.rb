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

ActiveRecord::Schema[8.0].define(version: 2024_01_01_000018) do
  create_table "activities", force: :cascade do |t|
    t.string "title", null: false
    t.text "description"
    t.integer "project_manager_id", null: false
    t.datetime "start_time", null: false
    t.datetime "end_time", null: false
    t.integer "status", default: 0
    t.string "category"
    t.integer "volunteers_needed", default: 1
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_manager_id"], name: "index_activities_on_project_manager_id"
  end

  create_table "admin_confirmations", force: :cascade do |t|
    t.string "confirmable_type", null: false
    t.integer "confirmable_id", null: false
    t.integer "admin_id", null: false
    t.text "confirmation_notes"
    t.datetime "confirmed_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["admin_id"], name: "index_admin_confirmations_on_admin_id"
    t.index ["confirmable_type", "confirmable_id"], name: "index_admin_confirmations_on_confirmable"
  end

  create_table "assignment_changes", force: :cascade do |t|
    t.integer "assignment_id", null: false
    t.integer "changed_by_id", null: false
    t.integer "old_volunteer_profile_id"
    t.integer "new_volunteer_profile_id"
    t.text "original_match_reason"
    t.text "change_reason"
    t.datetime "changed_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["assignment_id"], name: "index_assignment_changes_on_assignment_id"
    t.index ["changed_by_id"], name: "index_assignment_changes_on_changed_by_id"
    t.index ["new_volunteer_profile_id"], name: "index_assignment_changes_on_new_volunteer_profile_id"
    t.index ["old_volunteer_profile_id"], name: "index_assignment_changes_on_old_volunteer_profile_id"
  end

  create_table "assignments", force: :cascade do |t|
    t.integer "volunteer_profile_id", null: false
    t.integer "location_id", null: false
    t.integer "activity_id", null: false
    t.integer "status", default: 0
    t.text "match_reason"
    t.datetime "accepted_at"
    t.datetime "declined_at"
    t.text "decline_reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["activity_id"], name: "index_assignments_on_activity_id"
    t.index ["location_id"], name: "index_assignments_on_location_id"
    t.index ["volunteer_profile_id", "activity_id"], name: "index_assignments_on_volunteer_profile_id_and_activity_id", unique: true
    t.index ["volunteer_profile_id"], name: "index_assignments_on_volunteer_profile_id"
  end

  create_table "availabilities", force: :cascade do |t|
    t.integer "volunteer_profile_id", null: false
    t.integer "day_of_week", null: false
    t.time "start_time", null: false
    t.time "end_time", null: false
    t.boolean "recurring", default: true
    t.date "specific_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["volunteer_profile_id"], name: "index_availabilities_on_volunteer_profile_id"
  end

  create_table "check_in_reviews", force: :cascade do |t|
    t.integer "check_in_id", null: false
    t.integer "reviewer_id", null: false
    t.integer "decision", null: false
    t.text "review_notes"
    t.datetime "reviewed_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["check_in_id"], name: "index_check_in_reviews_on_check_in_id"
    t.index ["reviewer_id"], name: "index_check_in_reviews_on_reviewer_id"
  end

  create_table "check_ins", force: :cascade do |t|
    t.integer "assignment_id", null: false
    t.datetime "checked_in_at"
    t.datetime "checked_out_at"
    t.float "service_hours", default: 0.0
    t.integer "status", default: 0
    t.boolean "is_late", default: false
    t.boolean "is_early_leave", default: false
    t.string "check_in_method"
    t.float "check_in_latitude"
    t.float "check_in_longitude"
    t.text "notes"
    t.boolean "needs_review", default: false
    t.text "review_reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_proxy_suspected", default: false
    t.index ["assignment_id"], name: "index_check_ins_on_assignment_id"
  end

  create_table "emergency_contacts", force: :cascade do |t|
    t.integer "volunteer_profile_id", null: false
    t.string "name", null: false
    t.string "relationship", null: false
    t.string "phone", null: false
    t.string "email"
    t.boolean "is_primary", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["volunteer_profile_id"], name: "index_emergency_contacts_on_volunteer_profile_id"
  end

  create_table "guardians", force: :cascade do |t|
    t.integer "volunteer_profile_id", null: false
    t.string "name", null: false
    t.string "relationship", null: false
    t.string "phone", null: false
    t.string "email"
    t.string "id_card_number"
    t.boolean "consent_given", default: false
    t.datetime "consent_given_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["volunteer_profile_id"], name: "index_guardians_on_volunteer_profile_id"
  end

  create_table "location_skills", force: :cascade do |t|
    t.integer "location_id", null: false
    t.integer "skill_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["location_id", "skill_id"], name: "index_location_skills_on_location_id_and_skill_id", unique: true
    t.index ["location_id"], name: "index_location_skills_on_location_id"
    t.index ["skill_id"], name: "index_location_skills_on_skill_id"
  end

  create_table "locations", force: :cascade do |t|
    t.integer "activity_id", null: false
    t.string "name", null: false
    t.text "address", null: false
    t.float "latitude"
    t.float "longitude"
    t.integer "volunteers_needed", default: 1
    t.text "instructions"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["activity_id"], name: "index_locations_on_activity_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.integer "recipient_id", null: false
    t.string "title", null: false
    t.text "body"
    t.string "notification_type", null: false
    t.string "notifiable_type"
    t.integer "notifiable_id"
    t.boolean "read", default: false
    t.datetime "read_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable"
    t.index ["recipient_id"], name: "index_notifications_on_recipient_id"
  end

  create_table "service_certificates", force: :cascade do |t|
    t.integer "volunteer_profile_id", null: false
    t.string "certificate_number", null: false
    t.datetime "issued_at", null: false
    t.float "total_hours", null: false
    t.date "start_date", null: false
    t.date "end_date", null: false
    t.integer "status", default: 0
    t.integer "issued_by_id"
    t.string "qr_code_token"
    t.boolean "downloaded", default: false
    t.datetime "downloaded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["certificate_number"], name: "index_service_certificates_on_certificate_number", unique: true
    t.index ["issued_by_id"], name: "index_service_certificates_on_issued_by_id"
    t.index ["qr_code_token"], name: "index_service_certificates_on_qr_code_token", unique: true
    t.index ["volunteer_profile_id", "start_date", "end_date"], name: "index_certs_on_volunteer_and_date_range", unique: true
    t.index ["volunteer_profile_id"], name: "index_service_certificates_on_volunteer_profile_id"
  end

  create_table "skills", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "category"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_skills_on_name", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "role", default: 0, null: false
    t.string "name"
    t.string "phone"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "volunteer_profiles", force: :cascade do |t|
    t.integer "user_id", null: false
    t.date "birth_date"
    t.string "gender"
    t.text "address"
    t.float "latitude"
    t.float "longitude"
    t.integer "total_service_hours", default: 0
    t.boolean "is_minor", default: false
    t.text "bio"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_volunteer_profiles_on_user_id"
  end

  create_table "volunteer_skills", force: :cascade do |t|
    t.integer "volunteer_profile_id", null: false
    t.integer "skill_id", null: false
    t.integer "proficiency", default: 1
    t.text "certificate_details"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["skill_id"], name: "index_volunteer_skills_on_skill_id"
    t.index ["volunteer_profile_id", "skill_id"], name: "index_volunteer_skills_on_volunteer_profile_id_and_skill_id", unique: true
    t.index ["volunteer_profile_id"], name: "index_volunteer_skills_on_volunteer_profile_id"
  end

  add_foreign_key "activities", "users", column: "project_manager_id"
  add_foreign_key "admin_confirmations", "users", column: "admin_id"
  add_foreign_key "assignment_changes", "assignments"
  add_foreign_key "assignment_changes", "users", column: "changed_by_id"
  add_foreign_key "assignment_changes", "volunteer_profiles", column: "new_volunteer_profile_id"
  add_foreign_key "assignment_changes", "volunteer_profiles", column: "old_volunteer_profile_id"
  add_foreign_key "assignments", "activities"
  add_foreign_key "assignments", "locations"
  add_foreign_key "assignments", "volunteer_profiles"
  add_foreign_key "availabilities", "volunteer_profiles"
  add_foreign_key "check_in_reviews", "check_ins"
  add_foreign_key "check_in_reviews", "users", column: "reviewer_id"
  add_foreign_key "check_ins", "assignments"
  add_foreign_key "emergency_contacts", "volunteer_profiles"
  add_foreign_key "guardians", "volunteer_profiles"
  add_foreign_key "location_skills", "locations"
  add_foreign_key "location_skills", "skills"
  add_foreign_key "locations", "activities"
  add_foreign_key "notifications", "users", column: "recipient_id"
  add_foreign_key "service_certificates", "users", column: "issued_by_id"
  add_foreign_key "service_certificates", "volunteer_profiles"
  add_foreign_key "volunteer_profiles", "users"
  add_foreign_key "volunteer_skills", "skills"
  add_foreign_key "volunteer_skills", "volunteer_profiles"
end
