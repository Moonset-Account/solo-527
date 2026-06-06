class CreateReviews < ActiveRecord::Migration[8.0]
  def change
    create_table :reviews do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.references :teacher, foreign_key: true
      t.integer :rating, null: false, default: 5
      t.text :content
      t.jsonb :images, default: []

      t.timestamps
    end

    add_index :reviews, :enrollment_id, unique: true
    add_index :reviews, :course_id
    add_index :reviews, :student_id
  end
end
