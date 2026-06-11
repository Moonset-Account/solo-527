class CreateDoctors < ActiveRecord::Migration[8.1]
  def change
    create_table :doctors do |t|
      t.string :name, null: false
      t.string :title
      t.string :department
      t.string :phone
      t.boolean :active, default: true
      t.integer :daily_max_patients, default: 20
      t.text :notes

      t.timestamps
    end

    add_index :doctors, :active
    add_index :doctors, :department
  end
end
