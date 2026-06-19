class CreateClaims < ActiveRecord::Migration[8.1]
  def change
    create_table :claims do |t|
      t.string :claim_no, null: false
      t.bigint :vehicle_id
      t.bigint :driver_id
      t.bigint :settlement_id

      t.string :claim_type
      t.decimal :amount
      t.string :status, default: "pending"

      t.text :description
      t.string :evidence_url
      t.bigint :handler_id
      t.datetime :handled_at
      t.text :handle_result

      t.datetime :reported_at
      t.bigint :reported_by

      t.timestamps
    end

    add_index :claims, :claim_no, unique: true
    add_index :claims, :vehicle_id
    add_index :claims, :driver_id
    add_index :claims, :settlement_id
    add_index :claims, :handler_id
    add_index :claims, :reported_by_id
  end
end
