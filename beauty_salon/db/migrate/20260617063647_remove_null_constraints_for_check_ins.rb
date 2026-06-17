class RemoveNullConstraintsForCheckIns < ActiveRecord::Migration[8.1]
  def change
    change_column_null :check_ins, :appointment_id, true
    change_column_null :check_ins, :treatment_card_item_id, true
    change_column_null :appointments, :treatment_card_item_id, true
  end
end
