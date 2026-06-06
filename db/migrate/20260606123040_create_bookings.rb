class CreateBookings < ActiveRecord::Migration[8.0]
  def change
    create_table :bookings do |t|
      t.bigint :course_session_id, null: false
      t.bigint :school_id
      t.bigint :created_by
      t.integer :booking_type, null: false, default: 0
      t.string :contact_name
      t.string :contact_phone
      t.string :contact_email
      t.integer :student_count, null: false, default: 0
      t.integer :teacher_count, default: 0
      t.text :special_requirements
      t.integer :status, null: false, default: 0
      t.datetime :cancelled_at
      t.bigint :cancelled_by
      t.text :cancel_reason

      t.timestamps
    end
    add_index :bookings, :booking_type
    add_index :bookings, :status
    add_index :bookings, :course_session_id
    add_index :bookings, :school_id
  end
end
