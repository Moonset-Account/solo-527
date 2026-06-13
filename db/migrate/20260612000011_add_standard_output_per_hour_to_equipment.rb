class AddStandardOutputPerHourToEquipment < ActiveRecord::Migration[8.1]
  def change
    add_column :equipment, :standard_output_per_hour, :decimal, precision: 10, scale: 2, default: 50
  end
end
