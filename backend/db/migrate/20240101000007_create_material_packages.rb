class CreateMaterialPackages < ActiveRecord::Migration[8.0]
  def change
    create_table :material_packages do |t|
      t.string :name, null: false
      t.string :sku, null: false, index: { unique: true }
      t.text :description
      t.string :image_url
      t.decimal :cost_price, precision: 10, scale: 2, null: false, default: 0
      t.decimal :sale_price, precision: 10, scale: 2, null: false, default: 0
      t.integer :stock_quantity, null: false, default: 0
      t.integer :reserved_quantity, null: false, default: 0
      t.integer :safety_stock, null: false, default: 5
      t.integer :status, null: false, default: 0
      t.jsonb :materials, default: []
      t.timestamps
    end
  end
end
