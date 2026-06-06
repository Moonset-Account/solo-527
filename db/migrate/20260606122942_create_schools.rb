class CreateSchools < ActiveRecord::Migration[8.0]
  def change
    create_table :schools do |t|
      t.string :name, null: false
      t.string :contact_person
      t.string :phone
      t.string :email
      t.string :address
      t.integer :status, null: false, default: 0
      t.datetime :deleted_at

      t.timestamps
    end
    add_index :schools, :status
    add_index :schools, :deleted_at
    add_index :schools, :name
  end
end
