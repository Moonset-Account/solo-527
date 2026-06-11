class CreateAppointmentServiceItems < ActiveRecord::Migration[8.1]
  def change
    create_table :appointment_service_items do |t|
      t.references :appointment, null: false, foreign_key: true
      t.references :service_item, null: false, foreign_key: true
      t.integer :quantity, default: 1
      t.decimal :unit_price, precision: 10, scale: 2, null: false
      t.decimal :subtotal, precision: 10, scale: 2, null: false
      t.decimal :discount, precision: 10, scale: 2, default: 0
      t.string :status, default: "pending"
      t.text :notes

      t.timestamps
    end

    add_index :appointment_service_items, [:appointment_id, :service_item_id], name: "idx_appt_svc_items_on_appt_and_svc"
  end
end
