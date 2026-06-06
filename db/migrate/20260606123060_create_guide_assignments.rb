class CreateGuideAssignments < ActiveRecord::Migration[8.0]
  def change
    create_table :guide_assignments do |t|
      t.bigint :guide_id, null: false
      t.bigint :course_session_id, null: false
      t.bigint :assigned_by
      t.string :role
      t.text :notes
      t.integer :status, null: false, default: 0

      t.timestamps
    end
    add_index :guide_assignments, [:guide_id, :course_session_id], unique: true
    add_index :guide_assignments, :status
    add_index :guide_assignments, :guide_id
    add_index :guide_assignments, :course_session_id
  end
end
