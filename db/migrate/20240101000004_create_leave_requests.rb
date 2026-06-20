class CreateLeaveRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :leave_requests do |t|
      t.references :user, null: false, foreign_key: true
      t.references :course_enrollment, null: false, foreign_key: true
      t.date :leave_date, null: false
      t.string :reason
      t.string :status, null: false, default: "pending"
      t.text :approve_note
      t.references :approved_by, foreign_key: { to_table: :users }
      t.datetime :approved_at
      t.text :remark

      t.timestamps
    end

    add_index :leave_requests, :status
    add_index :leave_requests, :leave_date
    add_index :leave_requests, [:user_id, :leave_date]
  end
end
