class CreateTickets < ActiveRecord::Migration[8.1]
  def change
    create_table :tickets do |t|
      t.string :title, null: false
      t.text :description
      t.integer :status, default: 0, null: false
      t.integer :priority, default: 1, null: false
      t.references :submitter, null: false, foreign_key: { to_table: :users }
      t.references :assignee, null: false, foreign_key: { to_table: :users }
      t.references :department, null: false, foreign_key: true
      t.string :process_node, default: '需求提交'
      t.datetime :deadline
      t.datetime :completed_at

      t.timestamps
    end

    add_index :tickets, :status
    add_index :tickets, :priority
    add_index :tickets, :process_node
    add_index :tickets, :created_at
  end
end
