class CreateAppointments < ActiveRecord::Migration[8.1]
  def change
    create_table :appointments do |t|
      t.references :customer, null: false, foreign_key: true
      t.references :technician, null: false, foreign_key: true
      t.references :treatment, null: false, foreign_key: true
      t.references :treatment_card_item, null: false, foreign_key: true
      t.datetime :scheduled_at
      t.integer :status, default: 0
      t.text :notes

      t.timestamps
    end
    add_index :appointments, :scheduled_at
  end
end
