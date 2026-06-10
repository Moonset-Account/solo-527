class CreateBatchOperations < ActiveRecord::Migration[8.1]
  def change
    create_table :batch_operations do |t|
      t.references :user, null: false, foreign_key: true
      t.string :operation_type, null: false
      t.string :target_type, null: false
      t.jsonb :target_ids, default: [], null: false
      t.string :status, default: "pending", null: false
      t.integer :total_count, default: 0, null: false
      t.integer :success_count, default: 0, null: false
      t.integer :failure_count, default: 0, null: false
      t.datetime :started_at
      t.datetime :completed_at

      t.timestamps
    end

    add_index :batch_operations, :status
  end
end
