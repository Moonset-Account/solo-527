class CreateFeedbacks < ActiveRecord::Migration[8.0]
  def change
    create_table :feedbacks do |t|
      t.bigint :course_session_id, null: false
      t.bigint :booking_id
      t.bigint :author_id
      t.integer :rating
      t.text :content
      t.text :improvement_suggestions
      t.boolean :would_recommend, default: false

      t.timestamps
    end
    add_index :feedbacks, :rating
    add_index :feedbacks, :course_session_id
    add_index :feedbacks, :booking_id
    add_index :feedbacks, :author_id
  end
end
