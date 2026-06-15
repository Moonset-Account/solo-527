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

  create_table "boarding_reservations", force: :cascade do |t|
    t.bigint "caretaker_id", null: false
    t.datetime "check_in_at", null: false
    t.datetime "check_out_at"
    t.datetime "created_at", null: false
    t.bigint "kennel_id", null: false
    t.text "notes"
    t.bigint "pet_id", null: false
    t.text "special_requests"
    t.integer "status", default: 0
    t.decimal "total_price", precision: 10, scale: 2, default: "0.0"
    t.datetime "updated_at", null: false
    t.index ["caretaker_id"], name: "index_boarding_reservations_on_caretaker_id"
    t.index ["check_in_at"], name: "index_boarding_reservations_on_check_in_at"
    t.index ["check_out_at"], name: "index_boarding_reservations_on_check_out_at"
    t.index ["kennel_id"], name: "index_boarding_reservations_on_kennel_id"
    t.index ["pet_id"], name: "index_boarding_reservations_on_pet_id"
    t.index ["status"], name: "index_boarding_reservations_on_status"
  end

  create_table "caretakers", force: :cascade do |t|
    t.boolean "active", default: true
    t.string "avatar_url"
    t.text "bio"
    t.datetime "created_at", null: false
    t.string "email"
    t.integer "max_pets_capacity", default: 5
    t.string "name", null: false
    t.string "phone"
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_caretakers_on_active"
    t.index ["name"], name: "index_caretakers_on_name"
  end

  create_table "health_records", force: :cascade do |t|
    t.integer "activity_level"
    t.integer "appetite_level"
    t.bigint "caretaker_id"
    t.datetime "created_at", null: false
    t.text "notes"
    t.bigint "pet_id", null: false
    t.datetime "recorded_at", null: false
    t.text "symptoms"
    t.decimal "temperature", precision: 4, scale: 1
    t.datetime "updated_at", null: false
    t.decimal "weight", precision: 5, scale: 2
    t.index ["caretaker_id"], name: "index_health_records_on_caretaker_id"
    t.index ["pet_id", "recorded_at"], name: "index_health_records_on_pet_id_and_recorded_at"
    t.index ["pet_id"], name: "index_health_records_on_pet_id"
    t.index ["recorded_at"], name: "index_health_records_on_recorded_at"
  end

  create_table "kennels", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.decimal "daily_rate", precision: 10, scale: 2, default: "0.0"
    t.string "location"
    t.string "name", null: false
    t.text "notes"
    t.string "size_category", null: false
    t.integer "status", default: 0
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_kennels_on_name", unique: true
    t.index ["size_category"], name: "index_kennels_on_size_category"
    t.index ["status"], name: "index_kennels_on_status"
  end

  create_table "notifications", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.boolean "is_read", default: false
    t.bigint "notifiable_id"
    t.string "notifiable_type"
    t.string "notification_type", null: false
    t.datetime "read_at"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["is_read"], name: "index_notifications_on_is_read"
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable"
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable_type_and_notifiable_id"
    t.index ["notification_type"], name: "index_notifications_on_notification_type"
  end

  create_table "pets", force: :cascade do |t|
    t.boolean "active", default: true
    t.integer "age"
    t.text "allergies"
    t.string "avatar_url"
    t.string "breed"
    t.datetime "created_at", null: false
    t.string "gender"
    t.text "medical_notes"
    t.string "name", null: false
    t.string "owner_email"
    t.string "owner_name", null: false
    t.string "owner_phone", null: false
    t.text "special_needs"
    t.string "species", null: false
    t.datetime "updated_at", null: false
    t.decimal "weight", precision: 5, scale: 2
    t.index ["name"], name: "index_pets_on_name"
    t.index ["owner_name"], name: "index_pets_on_owner_name"
    t.index ["species"], name: "index_pets_on_species"
  end

  create_table "safety_incidents", force: :cascade do |t|
    t.text "action_taken"
    t.bigint "caretaker_id"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "incident_type", null: false
    t.bigint "kennel_id"
    t.datetime "occurred_at", null: false
    t.bigint "pet_id", null: false
    t.datetime "resolved_at"
    t.integer "severity", default: 1
    t.datetime "updated_at", null: false
    t.index ["caretaker_id"], name: "index_safety_incidents_on_caretaker_id"
    t.index ["incident_type"], name: "index_safety_incidents_on_incident_type"
    t.index ["kennel_id"], name: "index_safety_incidents_on_kennel_id"
    t.index ["occurred_at"], name: "index_safety_incidents_on_occurred_at"
    t.index ["pet_id"], name: "index_safety_incidents_on_pet_id"
    t.index ["severity"], name: "index_safety_incidents_on_severity"
  end

  create_table "services", force: :cascade do |t|
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "duration_minutes", null: false
    t.boolean "is_active", default: true
    t.string "name", null: false
    t.decimal "price", precision: 10, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_services_on_category"
    t.index ["is_active"], name: "index_services_on_is_active"
    t.index ["name"], name: "index_services_on_name"
  end

  create_table "training_records", force: :cascade do |t|
    t.bigint "caretaker_id", null: false
    t.text "content"
    t.datetime "created_at", null: false
    t.string "delay_reason"
    t.integer "duration_minutes"
    t.text "notes"
    t.bigint "pet_id", null: false
    t.text "progress"
    t.bigint "service_id"
    t.integer "status", default: 0
    t.date "training_date", null: false
    t.datetime "updated_at", null: false
    t.index ["caretaker_id"], name: "index_training_records_on_caretaker_id"
    t.index ["delay_reason"], name: "index_training_records_on_delay_reason"
    t.index ["pet_id"], name: "index_training_records_on_pet_id"
    t.index ["service_id"], name: "index_training_records_on_service_id"
    t.index ["status"], name: "index_training_records_on_status"
    t.index ["training_date"], name: "index_training_records_on_training_date"
  end

  create_table "users", force: :cascade do |t|
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.string "role", default: "staff"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "boarding_reservations", "caretakers"
  add_foreign_key "boarding_reservations", "kennels"
  add_foreign_key "boarding_reservations", "pets"
  add_foreign_key "health_records", "caretakers"
  add_foreign_key "health_records", "pets"
  add_foreign_key "safety_incidents", "caretakers"
  add_foreign_key "safety_incidents", "kennels"
  add_foreign_key "safety_incidents", "pets"
  add_foreign_key "training_records", "caretakers"
  add_foreign_key "training_records", "pets"
  add_foreign_key "training_records", "services"
end
