class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.string :auditable_type
      t.integer :auditable_id
      t.string :action
      t.jsonb :changes_data
      t.string :operator_type
      t.integer :operator_id
      t.text :description

      t.timestamps
    end
    add_index :audit_logs, [:auditable_type, :auditable_id]
    add_index :audit_logs, [:operator_type, :operator_id]
  end
end
