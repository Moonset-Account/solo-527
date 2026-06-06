class CreateTeachingAidAllocations < ActiveRecord::Migration[8.0]
  def change
    create_table :teaching_aid_allocations do |t|
      t.bigint :teaching_aid_id, null: false
      t.bigint :course_session_id, null: false
      t.integer :quantity, null: false, default: 1
      t.bigint :allocated_by
      t.datetime :returned_at
      t.text :notes

      t.timestamps
    end
    add_index :teaching_aid_allocations, [:teaching_aid_id, :course_session_id]
    add_index :teaching_aid_allocations, :returned_at
    add_index :teaching_aid_allocations, :teaching_aid_id
    add_index :teaching_aid_allocations, :course_session_id
  end
end
