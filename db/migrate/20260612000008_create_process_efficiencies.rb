class CreateProcessEfficiencies < ActiveRecord::Migration[8.1]
  def change
    create_table :process_efficiencies do |t|
      t.references :process_step, null: false, foreign_key: true
      t.references :equipment, foreign_key: true
      t.references :team, foreign_key: true
      t.references :mold, foreign_key: true
      t.decimal :standard_output_per_hour, precision: 10, scale: 2
      t.decimal :actual_output_per_hour, precision: 10, scale: 2
      t.decimal :duration_hours, precision: 10, scale: 2
      t.decimal :efficiency_rate, precision: 5, scale: 2

      t.timestamps
    end

    add_index :process_efficiencies, :efficiency_rate
  end
end
