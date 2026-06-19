class CreateVehicles < ActiveRecord::Migration[8.1]
  def change
    create_table :vehicles do |t|
      t.string :plate_number, null: false
      t.string :vehicle_type
      t.string :model
      t.decimal :capacity
      t.string :status, default: "active"

      t.decimal :min_temperature
      t.decimal :max_temperature

      t.bigint :current_driver_id

      t.decimal :last_temperature
      t.datetime :last_temperature_at
      t.decimal :last_location_lat
      t.decimal :last_location_lng
      t.datetime :last_location_at

      t.timestamps
    end

    add_index :vehicles, :plate_number, unique: true
    add_index :vehicles, :current_driver_id
  end
end
