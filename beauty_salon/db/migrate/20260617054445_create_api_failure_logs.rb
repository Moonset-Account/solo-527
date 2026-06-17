class CreateApiFailureLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :api_failure_logs do |t|
      t.string :endpoint
      t.string :method
      t.text :request_body
      t.integer :response_code
      t.text :response_body
      t.boolean :retried, default: false
      t.integer :retry_count, default: 0
      t.integer :max_retries, default: 3
      t.integer :status, default: 0
      t.text :notes

      t.timestamps
    end
    add_index :api_failure_logs, :status
  end
end
