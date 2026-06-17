class CreatePriceHistories < ActiveRecord::Migration[8.1]
  def change
    create_table :price_histories do |t|
      t.references :treatment, null: false, foreign_key: true
      t.decimal :old_price, precision: 10, scale: 2
      t.decimal :new_price, precision: 10, scale: 2
      t.string :changed_by_type
      t.integer :changed_by_id
      t.datetime :changed_at

      t.timestamps
    end
  end
end
