class CreateShiftEnrollments < ActiveRecord::Migration[8.1]
  def change
    create_table :shift_enrollments do |t|
      t.references :user, null: false, foreign_key: true
      t.references :shift, null: false, foreign_key: true
      t.string :status

      t.timestamps
    end
  end
end
