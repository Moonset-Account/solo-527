class CreateSchedules < ActiveRecord::Migration[8.1]
  def change
    create_table :schedules do |t|
      t.references :technician, null: false, foreign_key: true
      t.date :work_date
      t.time :start_time
      t.time :end_time
      t.integer :status, default: 0

      t.timestamps
    end
    add_index :schedules, [:technician_id, :work_date]
  end
end
