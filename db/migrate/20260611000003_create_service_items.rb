class CreateServiceItems < ActiveRecord::Migration[8.1]
  def change
    create_table :service_items do |t|
      t.string :code, null: false
      t.string :name, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.integer :duration_minutes, default: 30
      t.string :category
      t.text :description
      t.boolean :active, default: true

      t.timestamps
    end

    add_index :service_items, :code, unique: true
    add_index :service_items, :category
    add_index :service_items, :active
  end
end
