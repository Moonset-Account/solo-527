class CreateVenues < ActiveRecord::Migration[8.1]
  def change
    create_table :venues do |t|
      t.string :name, null: false
      t.string :location
      t.integer :capacity
      t.text :facilities
      t.string :status, default: "active"
      t.text :description

      t.timestamps
    end

    add_index :venues, :status
    add_index :venues, :name
  end
end
