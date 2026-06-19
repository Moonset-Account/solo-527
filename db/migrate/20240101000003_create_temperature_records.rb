class CreateTemperatureRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :temperature_records do |t|
      t.bigint :vehicle_id
      t.decimal :temperature
      t.datetime :recorded_at

      t.timestamps
    end

    add_index :temperature_records, [:vehicle_id, :recorded_at]
  end
end
