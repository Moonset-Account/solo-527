class CreateReviews < ActiveRecord::Migration[8.0]
  def change
    create_table :reviews do |t|
      t.references :student, null: false, foreign_key: true
      t.references :course_session, null: false, foreign_key: true
      t.references :teacher, foreign_key: true
      t.integer :rating, null: false
      t.text :content
      t.integer :status, null: false, default: 0
      t.boolean :is_anonymous, null: false, default: false
      t.jsonb :metadata, default: {}
      t.timestamps
    end
    add_index :reviews, [:course_session_id, :status]
    add_index :reviews, [:teacher_id, :status]
  end
end
