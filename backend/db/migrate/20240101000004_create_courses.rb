class CreateCourses < ActiveRecord::Migration[8.0]
  def change
    create_table :courses do |t|
      t.string :title, null: false
      t.text :description
      t.string :category, null: false
      t.string :cover_image
      t.integer :duration, default: 0
      t.decimal :price, precision: 10, scale: 2, default: 0.0
      t.integer :max_students, default: 10
      t.references :teacher, foreign_key: true
      t.references :material_kit, foreign_key: true
      t.string :status, null: false, default: 'draft'

      t.timestamps
    end

    add_index :courses, :category
    add_index :courses, :status
    add_index :courses, :teacher_id
  end
end
