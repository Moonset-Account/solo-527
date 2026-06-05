class CreateAuditLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :audit_logs do |t|
      t.references :user, foreign_key: true
      t.string :action, null: false
      t.string :auditable_type, null: false
      t.bigint :auditable_id, null: false
      t.jsonb :old_values, default: {}
      t.jsonb :new_values, default: {}
      t.string :ip_address
      t.string :user_agent
      t.text :comment
      t.timestamps
    end
    add_index :audit_logs, [:auditable_type, :auditable_id]
    add_index :audit_logs, [:user_id, :action, :created_at]
  end
end
