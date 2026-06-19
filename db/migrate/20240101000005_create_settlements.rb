class CreateSettlements < ActiveRecord::Migration[8.1]
  def change
    create_table :settlements do |t|
      t.string :settlement_no, null: false
      t.bigint :vehicle_id
      t.bigint :driver_id
      t.bigint :captain_id

      t.date :start_date
      t.date :end_date
      t.decimal :total_mileage
      t.decimal :total_hours
      t.decimal :base_fee
      t.decimal :bonus_amount
      t.decimal :deduction_amount
      t.decimal :total_amount

      t.string :status, default: "draft"
      t.text :remark

      t.timestamps
    end

    add_index :settlements, :settlement_no, unique: true
    add_index :settlements, :vehicle_id
    add_index :settlements, :driver_id
    add_index :settlements, :captain_id
  end
end
