class CreateMaterialKits < ActiveRecord::Migration[8.0]
  def change
    create_table :material_kits do |t|
      t.string :name, null: false
      t.text :description
      t.string :cover_image
      t.integer :stock, null: false, default: 0
      t.integer :warning_threshold, default: 5
      t.decimal :unit_price, precision: 10, scale: 2, default: 0.0
      t.string :status, null: false, default: 'in_stock'

      t.timestamps
    end

    add_index :material_kits, :status
    add_index :material_kits, :stock
  end
end
