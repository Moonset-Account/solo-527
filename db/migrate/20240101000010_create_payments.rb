class CreatePayments < ActiveRecord::Migration[8.1]
  def change
    create_table :payments do |t|
      t.references :user, null: false, foreign_key: true
      t.references :payable, polymorphic: true, null: false
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :payment_method
      t.string :transaction_id
      t.string :status, null: false, default: "pending"
      t.text :failure_reason
      t.datetime :paid_at
      t.datetime :failed_at
      t.integer :retry_count, default: 0
      t.text :remark
      t.string :source

      t.timestamps
    end

    add_index :payments, [:payable_type, :payable_id]
    add_index :payments, :status
    add_index :payments, :transaction_id
  end
end
