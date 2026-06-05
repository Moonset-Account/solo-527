class CreateNotifications < ActiveRecord::Migration[8.0]
  def change
    create_table :notifications do |t|
      t.references :recipient, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :body
      t.string :notification_type, null: false
      t.references :notifiable, polymorphic: true
      t.boolean :read, default: false
      t.datetime :read_at

      t.timestamps
    end
  end
end
