class CreateConsumableRules < ActiveRecord::Migration[8.1]
  def change
    create_table :consumable_rules do |t|
      t.string :name
      t.references :treatment, null: false, foreign_key: true
      t.integer :threshold_sessions
      t.decimal :threshold_percentage
      t.integer :check_interval
      t.boolean :active, default: true

      t.timestamps
    end
  end
end
