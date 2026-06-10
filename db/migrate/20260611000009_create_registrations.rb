class CreateRegistrations < ActiveRecord::Migration[8.1]
  def change
    create_table :registrations do |t|
      t.references :event, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :schedule, null: false, foreign_key: true
      t.string :status, default: "pending", null: false
      t.text :note
      t.datetime :reviewed_at

      t.timestamps
    end

    add_index :registrations, :status
    add_index :registrations, [:event_id, :user_id]
  end
end
