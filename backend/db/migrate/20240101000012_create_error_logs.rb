class CreateErrorLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :error_logs do |t|
      t.string :level, null: false, default: 'error'
      t.string :controller
      t.string :action
      t.string :error_class
      t.string :message
      t.text :backtrace
      t.text :request_info
      t.references :user, foreign_key: true
      t.string :session_id

      t.timestamps
    end
    add_index :error_logs, :level
    add_index :error_logs, :created_at
  end
end
