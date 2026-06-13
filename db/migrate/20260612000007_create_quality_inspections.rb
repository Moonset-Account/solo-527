class CreateQualityInspections < ActiveRecord::Migration[8.1]
  def change
    create_table :quality_inspections do |t|
      t.references :process_step, null: false, foreign_key: true
      t.references :inspector, null: false, foreign_key: { to_table: :users }
      t.integer :result, default: 0
      t.string :defect_type
      t.integer :defect_quantity, default: 0
      t.datetime :inspection_time
      t.text :notes

      t.timestamps
    end

    add_index :quality_inspections, :result
    add_index :quality_inspections, :inspection_time
  end
end
