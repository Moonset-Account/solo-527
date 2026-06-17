class CreateCustomers < ActiveRecord::Migration[8.1]
  def change
    create_table :customers do |t|
      t.string :name
      t.string :phone
      t.text :notes

      t.timestamps
    end
    add_index :customers, :phone
  end
end
