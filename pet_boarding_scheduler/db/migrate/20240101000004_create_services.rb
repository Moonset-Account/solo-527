class CreateServices < ActiveRecord::Migration[8.1]
  def change
    create_table :services do |t|
      t.string :name, null: false
      t.text :description
      t.integer :duration_minutes, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.string :category, null: false
      t.boolean :is_active, default: true

      t.timestamps
    end

    add_index :services, :name
    add_index :services, :category
    add_index :services, :is_active
  end
end
