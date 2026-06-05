class CreateWorkZones < ActiveRecord::Migration[8.0]
  def change
    create_table :work_zones do |t|
      t.string :name, null: false
      t.string :code, null: false
      t.string :zone_type, null: false, default: 'normal'
      t.string :location
      t.text :description
      t.boolean :requires_second_approval, default: false
      t.integer :max_capacity
      t.string :status, default: 'active'
      t.string :time_restrictions
      t.text :safety_requirements

      t.timestamps
    end
    add_index :work_zones, :code, unique: true
  end
end
