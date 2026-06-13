class CreateEquipment < ActiveRecord::Migration[8.1]
  def change
    create_table :equipment do |t|
      t.string :name
      t.string :code, null: false
      t.string :equipment_type
      t.integer :status, default: 0
      t.string :location
      t.date :purchase_date
      t.date :last_maintenance_date

      t.timestamps
    end

    add_index :equipment, :code, unique: true
    add_index :equipment, :status
  end
end
