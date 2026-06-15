class CreateHealthRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :health_records do |t|
      t.references :pet, null: false, foreign_key: true
      t.references :caretaker, foreign_key: true
      t.decimal :temperature, precision: 4, scale: 1
      t.decimal :weight, precision: 5, scale: 2
      t.integer :appetite_level
      t.integer :activity_level
      t.text :symptoms
      t.text :notes
      t.datetime :recorded_at, null: false

      t.timestamps
    end

    add_index :health_records, :recorded_at
    add_index :health_records, [:pet_id, :recorded_at]
  end
end
