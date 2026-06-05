class CreateStudents < ActiveRecord::Migration[8.0]
  def change
    create_table :students do |t|
      t.references :school, null: false, foreign_key: true
      t.string :name
      t.integer :gender
      t.integer :age_group
      t.integer :status

      t.timestamps
    end
    add_index :students, :status
  end
end
