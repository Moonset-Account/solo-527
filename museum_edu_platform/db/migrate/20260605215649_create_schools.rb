class CreateSchools < ActiveRecord::Migration[8.0]
  def change
    create_table :schools do |t|
      t.string :name
      t.string :contact_person
      t.string :phone
      t.string :email
      t.string :address
      t.integer :status
      t.text :notes

      t.timestamps
    end
    add_index :schools, :name
    add_index :schools, :status
  end
end
