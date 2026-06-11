class CreateBatchOperationItems < ActiveRecord::Migration[8.1]
  def change
    create_table :batch_operation_items do |t|
      t.references :batch_operation_log, null: false, foreign_key: true
      t.string :record_type, null: false
      t.bigint :record_id, null: false
      t.boolean :success, default: false
      t.jsonb :field_errors
      t.text :error_message
      t.jsonb :original_data
      t.jsonb :updated_data

      t.timestamps
    end

    add_index :batch_operation_items, [:record_type, :record_id]
    add_index :batch_operation_items, :success
  end
end
