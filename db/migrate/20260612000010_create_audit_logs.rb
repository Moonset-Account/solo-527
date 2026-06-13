class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.references :user, foreign_key: true
      t.string :action_type
      t.string :entity_type
      t.integer :entity_id
      t.text :details

      t.timestamps
    end

    add_index :audit_logs, :action_type
    add_index :audit_logs, [:entity_type, :entity_id]
    add_index :audit_logs, :created_at
  end
end
