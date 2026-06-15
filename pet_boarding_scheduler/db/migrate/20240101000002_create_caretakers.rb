class CreateCaretakers < ActiveRecord::Migration[8.1]
  def change
    create_table :caretakers do |t|
      t.string :name, null: false
      t.string :phone
      t.string :email
      t.text :bio
      t.string :avatar_url
      t.boolean :active, default: true
      t.integer :max_pets_capacity, default: 5

      t.timestamps
    end

    add_index :caretakers, :name
    add_index :caretakers, :active
  end
end
