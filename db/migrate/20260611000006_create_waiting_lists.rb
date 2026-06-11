class CreateWaitingLists < ActiveRecord::Migration[8.1]
  def change
    create_table :waiting_lists do |t|
      t.references :customer, null: false, foreign_key: true
      t.references :doctor, null: false, foreign_key: true
      t.references :time_slot, foreign_key: true
      t.references :service_item, foreign_key: true
      t.references :waiting_list_rule, foreign_key: true
      t.integer :position, null: false
      t.string :status, default: "waiting"
      t.string :source, default: "front_desk"
      t.datetime :joined_at, null: false
      t.datetime :expires_at
      t.datetime :notified_at
      t.datetime :confirmed_at
      t.string :contact_phone
      t.boolean :vip_priority, default: false
      t.text :notes
      t.string :tracking_code, null: false

      t.timestamps
    end

    add_index :waiting_lists, :tracking_code, unique: true
    add_index :waiting_lists, :status
    add_index :waiting_lists, [:doctor_id, :time_slot_id, :status]
    add_index :waiting_lists, :joined_at
    add_index :waiting_lists, :expires_at
  end
end
