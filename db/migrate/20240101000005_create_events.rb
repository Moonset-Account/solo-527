class CreateEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :events do |t|
      t.string :name, null: false
      t.text :description
      t.string :event_type
      t.datetime :start_date
      t.datetime :end_date
      t.datetime :registration_start
      t.datetime :registration_end
      t.integer :max_participants
      t.decimal :registration_fee, precision: 10, scale: 2, default: 0.0
      t.string :status, null: false, default: "draft"
      t.bigint :venue_id, index: true
      t.text :rules
      t.text :prizes

      t.timestamps
    end

    add_index :events, :status
    add_index :events, :event_type
    add_index :events, :start_date
  end
end
