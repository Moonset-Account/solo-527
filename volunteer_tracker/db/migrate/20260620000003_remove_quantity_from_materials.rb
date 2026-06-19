class RemoveQuantityFromMaterials < ActiveRecord::Migration[8.1]
  def change
    remove_column :materials, :quantity, :integer
  end
end
