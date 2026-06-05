class CreateApprovals < ActiveRecord::Migration[8.0]
  def change
    create_table :approvals do |t|
      t.references :pass, null: false, foreign_key: true
      t.references :approver, foreign_key: { to_table: :users }
      t.integer :approval_level, null: false, default: 1
      t.string :status, null: false, default: 'pending'
      t.text :comment
      t.datetime :approved_at
      t.datetime :rejected_at

      t.timestamps
    end
  end
end
