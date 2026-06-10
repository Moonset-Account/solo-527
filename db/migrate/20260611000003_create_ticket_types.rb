class CreateTicketTypes < ActiveRecord::Migration[8.1]
  def change
    create_table :ticket_types do |t|
      t.references :event, null: false, foreign_key: true
      t.string :name, null: false
      t.decimal :price, precision: 10, scale: 2, null: false, default: 0
      t.text :description
      t.integer :purchase_limit, default: 10, null: false
      t.string :status, default: "active", null: false

      t.timestamps
    end

    add_index :ticket_types, :status
  end
end
