class CreateAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_logs do |t|
      t.references :ticket, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :action_type, null: false
      t.string :field_name
      t.text :old_value
      t.text :new_value
      t.string :remark

      t.timestamps
    end

    add_index :audit_logs, :action_type
    add_index :audit_logs, :created_at
  end
end
