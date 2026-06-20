class ChangeAuditLogsActionTypeToInteger < ActiveRecord::Migration[8.1]
  def up
    execute "ALTER TABLE audit_logs ALTER COLUMN action_type TYPE integer USING action_type::integer"
  end

  def down
    change_column :audit_logs, :action_type, :string
  end
end
