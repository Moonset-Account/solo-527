class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.references :user, null: false, foreign_key: true
      t.string :order_no, null: false
      t.decimal :total_amount, precision: 10, scale: 2, null: false, default: 0
      t.string :status, default: "pending", null: false
      t.datetime :paid_at

      t.timestamps
    end

    add_index :orders, :order_no, unique: true
    add_index :orders, :status
  end
end
