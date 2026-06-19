class CreateLocationRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :location_records do |t|
      t.bigint :vehicle_id
      t.decimal :latitude
      t.decimal :longitude
      t.decimal :speed
      t.decimal :heading
      t.datetime :recorded_at

      t.timestamps
    end

    add_index :location_records, [:vehicle_id, :recorded_at]
  end
end
