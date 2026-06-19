class CreateOperationLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :operation_logs do |t|
      t.bigint :user_id
      t.string :action
      t.string :target_type
      t.bigint :target_id
      t.string :ip_address
      t.string :user_agent
      t.text :details

      t.timestamps
    end

    add_index :operation_logs, :user_id
    add_index :operation_logs, [:target_type, :target_id]
    add_index :operation_logs, :created_at
  end
end
