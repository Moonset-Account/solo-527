class CreateAppointments < ActiveRecord::Migration[8.1]
  def change
    create_table :appointments do |t|
      t.string :appointment_no, null: false
      t.references :customer, null: false, foreign_key: true
      t.references :doctor, null: false, foreign_key: true
      t.references :time_slot, null: false, foreign_key: true
      t.references :waiting_list, foreign_key: true
      t.decimal :total_amount, precision: 10, scale: 2, default: 0
      t.decimal :paid_amount, precision: 10, scale: 2, default: 0
      t.decimal :refunded_amount, precision: 10, scale: 2, default: 0
      t.string :status, default: "pending"
      t.string :source, default: "direct"
      t.datetime :appointment_date
      t.datetime :confirmed_at
      t.datetime :completed_at
      t.datetime :cancelled_at
      t.string :cancel_reason
      t.boolean :from_waiting_list, default: false
      t.text :notes
      t.string :operator

      t.timestamps
    end

    add_index :appointments, :appointment_no, unique: true
    add_index :appointments, :status
    add_index :appointments, [:doctor_id, :appointment_date]
  end
end
