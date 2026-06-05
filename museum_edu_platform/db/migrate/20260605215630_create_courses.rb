class CreateCourses < ActiveRecord::Migration[8.0]
  def change
    create_table :courses do |t|
      t.string :title
      t.string :slug
      t.text :description
      t.integer :age_min
      t.integer :age_max
      t.integer :duration_minutes
      t.integer :capacity
      t.integer :status
      t.string :category

      t.timestamps
    end
    add_index :courses, :slug
    add_index :courses, :status
  end
end
