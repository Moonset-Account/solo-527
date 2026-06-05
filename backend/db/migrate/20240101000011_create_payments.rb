class CreatePayments < ActiveRecord::Migration[8.0]
  def change
    create_table :payments do |t|
      t.string :payment_no, null: false, index: { unique: true }
      t.references :booking, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: true
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :payment_method, null: false
      t.integer :status, null: false, default: 0
      t.string :transaction_id
      t.datetime :paid_at
      t.text :failure_reason
      t.jsonb :raw_response, default: {}
      t.timestamps
    end
    add_index :payments, [:booking_id, :status]
    add_index :payments, [:student_id, :created_at]
  end
end
