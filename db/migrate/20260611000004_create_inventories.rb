class CreateInventories < ActiveRecord::Migration[8.1]
  def change
    create_table :inventories do |t|
      t.references :ticket_type, null: false, foreign_key: true
      t.integer :total, default: 0, null: false
      t.integer :sold, default: 0, null: false
      t.integer :reserved, default: 0, null: false
      t.integer :available, default: 0, null: false

      t.timestamps
    end
  end
end
