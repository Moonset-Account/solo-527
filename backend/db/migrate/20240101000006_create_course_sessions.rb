class CreateCourseSessions < ActiveRecord::Migration[8.0]
  def change
    create_table :course_sessions do |t|
      t.references :course, null: false, foreign_key: true
      t.references :teacher, null: false, foreign_key: true
      t.references :material_package, foreign_key: true
      t.datetime :start_time, null: false
      t.datetime :end_time, null: false
      t.string :location, null: false
      t.integer :status, null: false, default: 0
      t.integer :registered_count, null: false, default: 0
      t.integer :attended_count, null: false, default: 0
      t.text :notes
      t.jsonb :metadata, default: {}
      t.timestamps
    end
    add_index :course_sessions, [:start_time, :status]
    add_index :course_sessions, [:teacher_id, :start_time]
  end
end
