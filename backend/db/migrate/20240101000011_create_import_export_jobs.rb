class CreateImportExportJobs < ActiveRecord::Migration[8.0]
  def change
    create_table :import_export_jobs do |t|
      t.string :job_type, null: false
      t.string :status, null: false, default: 'pending'
      t.references :creator, foreign_key: { to_table: :users }
      t.string :file_name
      t.string :file_url
      t.text :params
      t.integer :total_count, default: 0
      t.integer :processed_count, default: 0
      t.integer :success_count, default: 0
      t.integer :failed_count, default: 0
      t.text :error_messages
      t.datetime :started_at
      t.datetime :completed_at

      t.timestamps
    end
  end
end
