class CreateEquipment < ActiveRecord::Migration[8.0]
  def change
    create_table :equipment do |t|
      t.string :name
      t.string :category
      t.integer :quantity
      t.integer :status
      t.text :description

      t.timestamps
    end
    add_index :equipment, :name
    add_index :equipment, :status
  end
end
