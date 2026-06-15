class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :notifications do |t|
      t.string :title, null: false
      t.text :content
      t.string :notification_type, null: false
      t.boolean :is_read, default: false
      t.datetime :read_at
      t.references :notifiable, polymorphic: true

      t.timestamps
    end

    add_index :notifications, :is_read
    add_index :notifications, :notification_type
    add_index :notifications, [:notifiable_type, :notifiable_id]
  end
end
