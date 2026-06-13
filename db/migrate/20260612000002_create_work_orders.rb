class CreateWorkOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :work_orders do |t|
      t.string :order_no, null: false
      t.string :product_name
      t.integer :quantity
      t.date :planned_start_date
      t.date :planned_end_date
      t.integer :status, default: 0
      t.integer :priority, default: 0
      t.text :notes
      t.string :customer

      t.timestamps
    end

    add_index :work_orders, :order_no, unique: true
    add_index :work_orders, :status
    add_index :work_orders, :priority
  end
end
