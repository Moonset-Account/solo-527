class CreateFailedBatches < ActiveRecord::Migration[8.1]
  def change
    create_table :failed_batches do |t|
      t.string :batch_no
      t.references :work_order, null: false, foreign_key: true
      t.references :process_step, foreign_key: true
      t.text :payload
      t.text :error_message
      t.integer :retry_count, default: 0
      t.integer :status, default: 0
      t.datetime :resolved_at
      t.references :resolved_by, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :failed_batches, :batch_no
    add_index :failed_batches, :status
  end
end
