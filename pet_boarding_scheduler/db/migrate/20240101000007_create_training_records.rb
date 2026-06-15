class CreateTrainingRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :training_records do |t|
      t.references :pet, null: false, foreign_key: true
      t.references :caretaker, null: false, foreign_key: true
      t.references :service, foreign_key: true
      t.date :training_date, null: false
      t.integer :duration_minutes
      t.text :content
      t.text :progress
      t.text :notes
      t.string :delay_reason
      t.integer :status, default: 0

      t.timestamps
    end

    add_index :training_records, :training_date
    add_index :training_records, :status
    add_index :training_records, :delay_reason
  end
end
