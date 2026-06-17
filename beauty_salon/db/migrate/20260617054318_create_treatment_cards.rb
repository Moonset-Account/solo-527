class CreateTreatmentCards < ActiveRecord::Migration[8.1]
  def change
    create_table :treatment_cards do |t|
      t.references :customer, null: false, foreign_key: true
      t.string :card_number
      t.decimal :total_amount, precision: 10, scale: 2
      t.decimal :remaining_amount, precision: 10, scale: 2
      t.integer :status, default: 0
      t.datetime :purchased_at
      t.datetime :expired_at

      t.timestamps
    end
    add_index :treatment_cards, :card_number
  end
end
