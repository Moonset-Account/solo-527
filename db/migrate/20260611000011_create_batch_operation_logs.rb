class CreateBatchOperationLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :batch_operation_logs do |t|
      t.string :batch_no, null: false
      t.string :operation_type, null: false
      t.text :scope_description
      t.integer :total_count, default: 0
      t.integer :success_count, default: 0
      t.integer :failed_count, default: 0
      t.jsonb :field_errors
      t.string :status, default: "pending"
      t.string :operator
      t.datetime :started_at
      t.datetime :completed_at
      t.text :notes

      t.timestamps
    end

    add_index :batch_operation_logs, :batch_no, unique: true
    add_index :batch_operation_logs, :status
    add_index :batch_operation_logs, :operation_type
  end
end
