class CreateTodoItems < ActiveRecord::Migration[8.1]
  def change
    create_table :todo_items do |t|
      t.string :assignee_type
      t.integer :assignee_id
      t.string :title
      t.text :body
      t.string :category
      t.integer :status, default: 0
      t.datetime :due_at
      t.string :source_type
      t.integer :source_id

      t.timestamps
    end
    add_index :todo_items, [:assignee_type, :assignee_id]
    add_index :todo_items, :status
  end
end
