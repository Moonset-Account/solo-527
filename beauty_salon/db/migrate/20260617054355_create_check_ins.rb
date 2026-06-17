class CreateCheckIns < ActiveRecord::Migration[8.1]
  def change
    create_table :check_ins do |t|
      t.references :appointment, null: false, foreign_key: true
      t.references :customer, null: false, foreign_key: true
      t.references :technician, null: false, foreign_key: true
      t.references :treatment, null: false, foreign_key: true
      t.references :treatment_card_item, null: false, foreign_key: true
      t.datetime :checked_in_at
      t.integer :status, default: 0

      t.timestamps
    end
    add_index :check_ins, :checked_in_at
  end
end
