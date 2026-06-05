
class FixStudentSchoolNullConstraint < ActiveRecord::Migration[8.0]
  def change
    change_column_null :students, :school_id, true
  end
end
