class CreateTemperatureAlerts < ActiveRecord::Migration[8.1]
  def change
    create_table :temperature_alerts do |t|
      t.bigint :vehicle_id
      t.string :alert_type
      t.decimal :temperature
      t.decimal :threshold

      t.datetime :start_time
      t.datetime :end_time
      t.integer :duration_seconds
      t.string :status, default: "active"

      t.bigint :resolved_by_id
      t.datetime :resolved_at
      t.text :resolution_note

      t.timestamps
    end

    add_index :temperature_alerts, :vehicle_id
    add_index :temperature_alerts, :status
    add_index :temperature_alerts, :resolved_by_id
  end
end
