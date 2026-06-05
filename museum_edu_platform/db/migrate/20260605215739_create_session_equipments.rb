class CreateSessionEquipments < ActiveRecord::Migration[8.0]
  def change
    create_table :session_equipments do |t|
      t.references :session, null: false, foreign_key: true
      t.references :equipment, null: false, foreign_key: true
      t.integer :quantity_allocated
      t.integer :status
      t.text :notes

      t.timestamps
    end
    add_index :session_equipments, :status
  end
end
