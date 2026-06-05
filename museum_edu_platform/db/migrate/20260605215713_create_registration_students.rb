class CreateRegistrationStudents < ActiveRecord::Migration[8.0]
  def change
    create_table :registration_students do |t|
      t.references :registration, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: true
      t.integer :status
      t.text :notes

      t.timestamps
    end
    add_index :registration_students, :status
  end
end
