class CreateCheckIns < ActiveRecord::Migration[8.0]
  def change
    create_table :check_ins do |t|
      t.references :registration, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: true
      t.references :session, null: false, foreign_key: true
      t.datetime :checked_in_at
      t.references :checked_in_by, null: false, foreign_key: { to_table: :users }
      t.integer :status
      t.string :check_in_method
      t.text :notes
      t.string :offline_uuid
      t.datetime :synced_at

      t.timestamps
    end
    add_index :check_ins, :status
    add_index :check_ins, :offline_uuid
  end
end
