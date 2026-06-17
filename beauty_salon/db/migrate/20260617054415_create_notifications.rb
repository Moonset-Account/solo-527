class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :notifications do |t|
      t.string :recipient_type
      t.integer :recipient_id
      t.string :title
      t.text :body
      t.string :category
      t.boolean :read, default: false
      t.boolean :urgent

      t.timestamps
    end
    add_index :notifications, [:recipient_type, :recipient_id]
    add_index :notifications, :read
  end
end
