class CreateTrackingReminders < ActiveRecord::Migration[8.1]
  def change
    create_table :tracking_reminders do |t|
      t.string :trackable_type
      t.integer :trackable_id
      t.string :reminder_type
      t.date :reminder_date
      t.text :message
      t.string :status

      t.timestamps
    end
  end
end
