class CreateSchedules < ActiveRecord::Migration[8.1]
  def change
    create_table :schedules do |t|
      t.references :event, null: false, foreign_key: true
      t.string :name, null: false
      t.datetime :starts_at
      t.datetime :ends_at
      t.string :venue
      t.integer :sort_order, default: 0, null: false

      t.timestamps
    end

    add_index :schedules, [:event_id, :sort_order]
  end
end
