class CreateCustomers < ActiveRecord::Migration[8.1]
  def change
    create_table :customers do |t|
      t.string :name, null: false
      t.string :phone, null: false
      t.string :id_card
      t.date :birthday
      t.string :gender
      t.string :address
      t.integer :no_show_count, default: 0
      t.boolean :vip, default: false
      t.text :notes

      t.timestamps
    end

    add_index :customers, :phone, unique: true
    add_index :customers, :id_card
  end
end
