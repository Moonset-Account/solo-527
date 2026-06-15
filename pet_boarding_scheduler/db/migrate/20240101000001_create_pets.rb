class CreatePets < ActiveRecord::Migration[8.1]
  def change
    create_table :pets do |t|
      t.string :name, null: false
      t.string :species, null: false
      t.string :breed
      t.integer :age
      t.decimal :weight, precision: 5, scale: 2
      t.string :gender
      t.string :owner_name, null: false
      t.string :owner_phone, null: false
      t.string :owner_email
      t.text :medical_notes
      t.text :allergies
      t.text :special_needs
      t.string :avatar_url
      t.boolean :active, default: true

      t.timestamps
    end

    add_index :pets, :name
    add_index :pets, :species
    add_index :pets, :owner_name
  end
end
