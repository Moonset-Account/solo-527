class CreateRefunds < ActiveRecord::Migration[8.1]
  def change
    create_table :refunds do |t|
      t.references :order, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :reviewed_by, null: true, foreign_key: { to_table: :users }
      t.decimal :amount, precision: 10, scale: 2, null: false, default: 0
      t.text :reason
      t.string :status, default: "pending", null: false
      t.datetime :reviewed_at

      t.timestamps
    end

    add_index :refunds, :status
  end
end
