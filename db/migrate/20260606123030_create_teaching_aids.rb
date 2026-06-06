class CreateTeachingAids < ActiveRecord::Migration[8.0]
  def change
    create_table :teaching_aids do |t|
      t.string :name, null: false
      t.string :category
      t.integer :total_quantity, null: false, default: 0
      t.integer :available_quantity, null: false, default: 0
      t.text :description
      t.string :location
      t.datetime :deleted_at

      t.timestamps
    end
    add_index :teaching_aids, :category
    add_index :teaching_aids, :deleted_at
  end
end
