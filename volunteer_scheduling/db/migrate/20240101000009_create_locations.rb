class CreateLocations < ActiveRecord::Migration[8.0]
  def change
    create_table :locations do |t|
      t.references :activity, null: false, foreign_key: true
      t.string :name, null: false
      t.text :address, null: false
      t.float :latitude
      t.float :longitude
      t.integer :volunteers_needed, default: 1
      t.text :instructions

      t.timestamps
    end
  end
end
