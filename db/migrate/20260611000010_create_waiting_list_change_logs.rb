class CreateWaitingListChangeLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :waiting_list_change_logs do |t|
      t.references :waiting_list, null: false, foreign_key: true
      t.references :appointment, foreign_key: true
      t.integer :old_position
      t.integer :new_position
      t.string :old_status
      t.string :new_status
      t.string :change_type, null: false
      t.text :change_details
      t.string :operator
      t.datetime :changed_at, null: false

      t.timestamps
    end

    add_index :waiting_list_change_logs, :change_type
    add_index :waiting_list_change_logs, :changed_at
  end
end
