class CreateEventRegistrations < ActiveRecord::Migration[8.1]
  def change
    create_table :event_registrations do |t|
      t.references :user, null: false, foreign_key: true
      t.references :event, null: false, foreign_key: true
      t.string :status, null: false, default: "pending"
      t.string :payment_status, default: "unpaid"
      t.decimal :registration_fee, precision: 10, scale: 2
      t.string :category
      t.string :team_name
      t.datetime :registered_at
      t.text :remark
      t.string :source

      t.timestamps
    end

    add_index :event_registrations, [:user_id, :event_id], unique: true
    add_index :event_registrations, :status
    add_index :event_registrations, :payment_status
  end
end
