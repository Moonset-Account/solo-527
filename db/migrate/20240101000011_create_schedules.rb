class CreateSchedules < ActiveRecord::Migration[8.1]
  def change
    create_table :schedules do |t|
      t.references :event, null: false, foreign_key: true
      t.references :venue, foreign_key: true
      t.string :title, null: false
      t.string :category
      t.integer :round
      t.datetime :start_time, null: false
      t.datetime :end_time
      t.integer :max_participants
      t.text :description
      t.string :status, default: "scheduled"
      t.text :result_note

      t.timestamps
    end

    add_index :schedules, :start_time
    add_index :schedules, :status
  end
end
