class CreateStudents < ActiveRecord::Migration[8.0]
  def change
    create_table :students do |t|
      t.string :name, null: false
      t.integer :age, null: false
      t.string :grade
      t.bigint :school_id
      t.string :id_card_last_four
      t.string :emergency_contact_name
      t.string :emergency_contact_phone
      t.text :health_notes
      t.datetime :deleted_at

      t.timestamps
    end
    add_index :students, :school_id
    add_index :students, :deleted_at
  end
end
