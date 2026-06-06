class CreateWorks < ActiveRecord::Migration[8.0]
  def change
    create_table :works do |t|
      t.string :title, null: false
      t.text :description
      t.jsonb :images, default: []
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.references :course, foreign_key: true
      t.references :enrollment, foreign_key: true
      t.boolean :is_public, default: false
      t.datetime :authorized_at
      t.references :authorized_by, foreign_key: { to_table: :users }
      t.string :review_status, null: false, default: 'pending'
      t.datetime :approved_at
      t.references :approved_by, foreign_key: { to_table: :users }
      t.string :reject_reason
      t.datetime :rejected_at
      t.references :rejected_by, foreign_key: { to_table: :users }
      t.boolean :authorized_by_student, default: false

      t.timestamps
    end

    add_index :works, :student_id
    add_index :works, :course_id
    add_index :works, :is_public
    add_index :works, :review_status
  end
end
