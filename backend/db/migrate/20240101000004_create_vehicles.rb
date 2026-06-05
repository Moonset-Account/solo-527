class CreateVehicles < ActiveRecord::Migration[8.0]
  def change
    create_table :vehicles do |t|
      t.string :plate_number, null: false
      t.string :vehicle_type
      t.string :color
      t.string :brand_model
      t.references :owner, polymorphic: true
      t.string :insurance_number
      t.date :insurance_expiry
      t.string :license_number
      t.date :license_expiry
      t.boolean :blacklisted, default: false
      t.text :remark

      t.timestamps
    end
    add_index :vehicles, :plate_number, unique: true
  end
end
