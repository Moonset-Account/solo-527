class CreateAudits < ActiveRecord::Migration[8.0]
  def change
    create_table :audits do |t|
      t.string :auditable_type
      t.bigint :auditable_id
      t.string :user_type
      t.bigint :user_id
      t.string :user_name
      t.string :action
      t.jsonb :audited_changes
      t.integer :version, default: 0
      t.string :comment
      t.string :remote_address
      t.string :request_uuid

      t.timestamps
    end

    add_index :audits, [:auditable_type, :auditable_id], name: 'index_audits_on_auditable'
    add_index :audits, [:user_type, :user_id], name: 'index_audits_on_user'
    add_index :audits, :created_at
  end
end
