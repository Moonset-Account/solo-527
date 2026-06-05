class AddQrTokenToLocations < ActiveRecord::Migration[8.0]
  def change
    add_column :locations, :qr_token, :string
    add_index :locations, :qr_token, unique: true
  end
end
