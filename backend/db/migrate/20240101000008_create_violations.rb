class CreateViolations < ActiveRecord::Migration[8.0]
  def change
    create_table :violations do |t|
      t.references :person, foreign_key: true
      t.references :vehicle, foreign_key: true
      t.references :pass, foreign_key: true
      t.references :work_zone, foreign_key: true
      t.string :violation_type, null: false
      t.string :description
      t.datetime :violated_at, null: false
      t.string :location
      t.references :reporter, foreign_key: { to_table: :users }
      t.string :severity, default: 'minor'
      t.string :status, default: 'reported'
      t.text :handling_notes
      t.boolean :result_in_freeze, default: false
      t.integer :freeze_days

      t.timestamps
    end
  end
end
