class CreateCourseSessions < ActiveRecord::Migration[8.0]
  def change
    create_table :course_sessions do |t|
      t.bigint :course_id, null: false
      t.datetime :start_time, null: false
      t.datetime :end_time, null: false
      t.string :location
      t.integer :max_participants, null: false, default: 30
      t.integer :status, null: false, default: 0
      t.text :notes
      t.datetime :deleted_at

      t.timestamps
    end
    add_index :course_sessions, :status
    add_index :course_sessions, :start_time
    add_index :course_sessions, :deleted_at
    add_index :course_sessions, [:course_id, :start_time]
  end
end
