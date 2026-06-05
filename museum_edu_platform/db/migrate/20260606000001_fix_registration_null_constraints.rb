
class FixRegistrationNullConstraints < ActiveRecord::Migration[8.0]
  def change
    change_column_null :registrations, :user_id, true
    change_column_null :registrations, :school_id, true
  end
end
