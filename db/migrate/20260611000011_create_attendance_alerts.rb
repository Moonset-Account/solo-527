class CreateAttendanceAlerts < ActiveRecord::Migration[8.1]
  def change
    create_table :attendance_alerts do |t|
      t.references :event, null: false, foreign_key: true
      t.references :schedule, null: false, foreign_key: true
      t.integer :expected_count, default: 0, null: false
      t.integer :actual_count, default: 0, null: false
      t.integer :gap_count, default: 0, null: false
      t.string :status, default: "open", null: false
      t.datetime :closed_at
      t.text :close_note

      t.timestamps
    end

    add_index :attendance_alerts, :status
  end
end
