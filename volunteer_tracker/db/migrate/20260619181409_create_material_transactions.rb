class CreateMaterialTransactions < ActiveRecord::Migration[8.1]
  def change
    create_table :material_transactions do |t|
      t.references :material, null: false, foreign_key: true
      t.string :transaction_type
      t.integer :quantity
      t.references :operator, foreign_key: { to_table: :users }
      t.string :recipient
      t.text :remark

      t.timestamps
    end
  end
end
