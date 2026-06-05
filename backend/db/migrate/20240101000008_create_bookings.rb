class CreateBookings < ActiveRecord::Migration[8.0]
  def change
    create_table :bookings do |t|
      t.string :booking_no, null: false, index: { unique: true }
      t.references :student, null: false, foreign_key: true
      t.references :course_session, null: false, foreign_key: true
      t.references :material_package, foreign_key: true
      t.decimal :course_fee, precision: 10, scale: 2, null: false
      t.decimal :material_fee, precision: 10, scale: 2, null: false, default: 0
      t.decimal :total_amount, precision: 10, scale: 2, null: false
      t.decimal :paid_amount, precision: 10, scale: 2, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.integer :payment_status, null: false, default: 0
      t.integer :attendance_status, null: false, default: 0
      t.datetime :paid_at
      t.datetime :cancelled_at
      t.text :cancel_reason
      t.references :approved_by, foreign_key: { to_table: :users }
      t.datetime :approved_at
      t.text :notes
      t.jsonb :metadata, default: {}
      t.timestamps
    end
    add_index :bookings, [:student_id, :status]
    add_index :bookings, [:course_session_id, :status]
  end
end
