class CreateTickets < ActiveRecord::Migration[8.1]
  def change
    create_table :tickets do |t|
      t.references :order, null: false, foreign_key: true
      t.references :ticket_type, null: false, foreign_key: true
      t.string :ticket_no, null: false
      t.string :status, default: "active", null: false
      t.string :holder_name

      t.timestamps
    end

    add_index :tickets, :ticket_no, unique: true
    add_index :tickets, :status
  end
end
