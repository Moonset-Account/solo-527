class CreateStudents < ActiveRecord::Migration[8.0]
  def change
    create_table :students do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.date :birthday
      t.string :emergency_contact
      t.string :emergency_phone
      t.text :notes
      t.integer :level, null: false, default: 0
      t.integer :total_courses, null: false, default: 0
      t.decimal :total_spent, precision: 10, scale: 2, null: false, default: 0
      t.jsonb :preferences, default: {}
      t.timestamps
    end
  end
end
