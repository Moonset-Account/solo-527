class CreateSchedules < ActiveRecord::Migration[8.0]
  def change
    create_table :schedules do |t|
      t.references :course, null: false, foreign_key: true
      t.datetime :start_time, null: false
      t.datetime :end_time, null: false
      t.string :location
      t.integer :max_students, default: 10

      t.timestamps
    end

    add_index :schedules, :course_id
    add_index :schedules, :start_time
  end
end
