class CreateCourses < ActiveRecord::Migration[8.0]
  def change
    create_table :courses do |t|
      t.string :title, null: false
      t.text :description
      t.integer :age_min, null: false, default: 6
      t.integer :age_max, null: false, default: 18
      t.integer :duration_minutes, null: false, default: 90
      t.integer :max_participants, null: false, default: 30
      t.integer :status, null: false, default: 0
      t.references :created_by, foreign_key: { to_table: :users }
      t.datetime :deleted_at

      t.timestamps
    end
    add_index :courses, :status
    add_index :courses, :deleted_at
  end
end
