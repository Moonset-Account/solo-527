class AddSchoolIdToUsers < ActiveRecord::Migration[8.0]
  def change
    add_reference :users, :school, null: true
  end
end
