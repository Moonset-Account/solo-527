class CreateKennels < ActiveRecord::Migration[8.1]
  def change
    create_table :kennels do |t|
      t.string :name, null: false
      t.string :size_category, null: false
      t.string :location
      t.integer :status, default: 0
      t.decimal :daily_rate, precision: 10, scale: 2, default: 0.0
      t.text :notes

      t.timestamps
    end

    add_index :kennels, :name, unique: true
    add_index :kennels, :size_category
    add_index :kennels, :status
  end
end
