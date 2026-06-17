class CreateTreatments < ActiveRecord::Migration[8.1]
  def change
    create_table :treatments do |t|
      t.string :name
      t.string :category
      t.integer :duration
      t.text :description
      t.boolean :active, default: true

      t.timestamps
    end
    add_index :treatments, :category
  end
end
