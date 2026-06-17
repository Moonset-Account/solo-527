class AddPriceToTreatments < ActiveRecord::Migration[8.1]
  def change
    add_column :treatments, :price, :decimal, precision: 10, scale: 2
  end
end
