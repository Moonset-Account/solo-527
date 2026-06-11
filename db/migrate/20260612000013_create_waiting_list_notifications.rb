class CreateWaitingListNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :waiting_list_notifications do |t|
      t.references :waiting_list, null: false, foreign_key: true
      t.string :notification_type, null: false
      t.string :channel, default: "sms"
      t.string :recipient
      t.text :content
      t.string :status, default: "pending"
      t.string :provider_reference
      t.text :error_message
      t.datetime :sent_at
      t.datetime :read_at
      t.string :operator
      t.text :notes

      t.timestamps
    end

    add_index :waiting_list_notifications, :notification_type
    add_index :waiting_list_notifications, :status
    add_index :waiting_list_notifications, :sent_at
    add_index :waiting_list_notifications, [:waiting_list_id, :notification_type],
              name: "idx_wl_notifs_on_wl_id_and_type"
  end
end
