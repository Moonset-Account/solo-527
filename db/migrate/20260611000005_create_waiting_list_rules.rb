class CreateWaitingListRules < ActiveRecord::Migration[8.1]
  def change
    create_table :waiting_list_rules do |t|
      t.string :name, null: false
      t.integer :release_minutes_before, default: 60
      t.integer :max_waiting_per_slot, default: 5
      t.integer :confirmation_timeout_minutes, default: 15
      t.boolean :auto_notify, default: true
      t.boolean :active, default: true
      t.text :description
      t.string :notify_channel, default: "sms"
      t.integer :priority
      t.datetime :effective_from
      t.datetime :effective_to

      t.timestamps
    end

    add_index :waiting_list_rules, :active
    add_index :waiting_list_rules, :priority
  end
end
