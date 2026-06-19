class CreateMaterials < ActiveRecord::Migration[8.1]
  def change
    create_table :materials do |t|
      t.string :name
      t.string :category
      t.string :unit
      t.integer :quantity
      t.integer :threshold

      t.timestamps
    end
  end
end
