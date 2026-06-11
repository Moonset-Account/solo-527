class CreateRefundRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :refund_records do |t|
      t.string :refund_no, null: false
      t.references :appointment, null: false, foreign_key: true
      t.references :appointment_service_item, foreign_key: true
      t.decimal :refund_amount, precision: 10, scale: 2, null: false
      t.string :refund_reason, null: false
      t.string :refund_method, default: "original"
      t.string :status, default: "pending"
      t.text :notes
      t.string :operator
      t.datetime :processed_at
      t.string :transaction_id

      t.timestamps
    end

    add_index :refund_records, :refund_no, unique: true
    add_index :refund_records, :status
  end
end
