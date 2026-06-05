class CreateNotifications < ActiveRecord::Migration[8.0]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title
      t.text :content
      t.string :notification_type
      t.datetime :read_at
      t.string :related_object_type
      t.integer :related_object_id

      t.timestamps
    end
    add_index :notifications, :notification_type
  end
end
