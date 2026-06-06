class CreateEnrollments < ActiveRecord::Migration[8.0]
  def change
    create_table :enrollments do |t|
      t.references :course, null: false, foreign_key: true
      t.references :schedule, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.references :material_kit, foreign_key: true
      t.string :order_no, null: false
      t.decimal :total_amount, precision: 10, scale: 2, default: 0.0
      t.string :status, null: false, default: 'pending'
      t.string :payment_status
      t.decimal :amount_paid, precision: 10, scale: 2, default: 0.0
      t.string :refund_reason
      t.datetime :refund_requested_at
      t.datetime :refund_approved_at
      t.string :reject_reason
      t.datetime :completed_at
      t.string :payment_method
      t.datetime :paid_at

      t.timestamps
    end

    add_index :enrollments, :student_id
    add_index :enrollments, :course_id
    add_index :enrollments, :schedule_id
    add_index :enrollments, :status
    add_index :enrollments, :order_no, unique: true
    add_index :enrollments, :created_at
  end
end
