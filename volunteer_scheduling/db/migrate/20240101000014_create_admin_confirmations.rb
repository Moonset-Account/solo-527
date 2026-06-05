class CreateAdminConfirmations < ActiveRecord::Migration[8.0]
  def change
    create_table :admin_confirmations do |t|
      t.references :confirmable, polymorphic: true, null: false
      t.references :admin, null: false, foreign_key: { to_table: :users }
      t.text :confirmation_notes
      t.datetime :confirmed_at, null: false

      t.timestamps
    end
  end
end
