class CreateCourseEnrollments < ActiveRecord::Migration[8.1]
  def change
    create_table :course_enrollments do |t|
      t.references :user, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true
      t.string :status, null: false, default: "pending"
      t.decimal :price, precision: 10, scale: 2
      t.datetime :enrolled_at
      t.string :payment_status, default: "unpaid"
      t.text :remark
      t.string :source
      t.references :source_payment, polymorphic: true

      t.timestamps
    end

    add_index :course_enrollments, [:user_id, :course_id]
    add_index :course_enrollments, :status
    add_index :course_enrollments, :payment_status
    add_index :course_enrollments, :created_at
  end
end
