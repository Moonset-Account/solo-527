class CreateBookingStudents < ActiveRecord::Migration[8.0]
  def change
    create_table :booking_students do |t|
      t.bigint :booking_id, null: false
      t.bigint :student_id, null: false
      t.boolean :attended, default: false
      t.datetime :checked_in_at
      t.bigint :checked_in_by
      t.text :notes

      t.timestamps
    end
    add_index :booking_students, [:booking_id, :student_id], unique: true
    add_index :booking_students, :attended
    add_index :booking_students, :booking_id
    add_index :booking_students, :student_id
  end
end
