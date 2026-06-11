class CreateTimeSlots < ActiveRecord::Migration[8.1]
  def change
    create_table :time_slots do |t|
      t.references :doctor, null: false, foreign_key: true
      t.datetime :start_time, null: false
      t.datetime :end_time, null: false
      t.integer :capacity, default: 1
      t.integer :booked_count, default: 0
      t.integer :waiting_count, default: 0
      t.string :status, default: "available"
      t.text :notes

      t.timestamps
    end

    add_index :time_slots, [:doctor_id, :start_time]
    add_index :time_slots, :status
    add_index :time_slots, :start_time
  end
end
