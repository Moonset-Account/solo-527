class CreateBatchJobs < ActiveRecord::Migration[8.1]
  def change
    create_table :batch_jobs do |t|
      t.string :job_type, null: false
      t.string :status, null: false, default: "pending"
      t.integer :total_count, default: 0
      t.integer :success_count, default: 0
      t.integer :failure_count, default: 0
      t.text :failure_details, type: :text
      t.jsonb :payload, default: {}
      t.jsonb :result_data, default: {}
      t.references :user, foreign_key: true
      t.string :sidekiq_jid
      t.datetime :started_at
      t.datetime :completed_at
      t.text :error_message

      t.timestamps
    end

    add_index :batch_jobs, :status
    add_index :batch_jobs, :job_type
    add_index :batch_jobs, :sidekiq_jid
    add_index :batch_jobs, :created_at
  end
end
