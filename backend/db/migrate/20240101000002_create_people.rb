class CreatePeople < ActiveRecord::Migration[8.0]
  def change
    create_table :people do |t|
      t.string :name, null: false
      t.string :id_card, null: false
      t.string :gender
      t.date :birth_date
      t.string :phone
      t.string :address
      t.string :company
      t.string :person_type, null: false, default: 'visitor'
      t.string :photo_url
      t.text :remark
      t.boolean :blacklisted, default: false

      t.timestamps
    end
    add_index :people, :id_card, unique: true
  end
end
