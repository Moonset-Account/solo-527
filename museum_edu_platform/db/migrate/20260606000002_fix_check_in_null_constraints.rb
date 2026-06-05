
class FixCheckInNullConstraints < ActiveRecord::Migration[8.0]
  def change
    change_column_null :check_ins, :checked_in_by_id, true
  end
end
