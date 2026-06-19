class AddStatusIndexes < ActiveRecord::Migration[8.1]
  def change
    add_index :shifts, :status
    add_index :shift_enrollments, :status
    add_index :donations, :status
    add_index :visit_records, :status
    add_index :tracking_reminders, :status
    add_index :volunteer_services, :status
    add_index :tracking_reminders, [:trackable_type, :trackable_id]
  end
end
