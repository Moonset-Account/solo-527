class CreateProcessSteps < ActiveRecord::Migration[8.1]
  def change
    create_table :process_steps do |t|
      t.string :name
      t.integer :sequence
      t.references :work_order, null: false, foreign_key: true
      t.integer :status, default: 0
      t.references :assigned_team, foreign_key: { to_table: :teams }
      t.references :assigned_equipment, foreign_key: { to_table: :equipment }
      t.references :mold, foreign_key: true
      t.datetime :started_at
      t.datetime :paused_at
      t.datetime :completed_at
      t.integer :actual_quantity, default: 0
      t.integer :defect_quantity, default: 0

      t.timestamps
    end

    add_index :process_steps, :status
    add_index :process_steps, :sequence
    add_index :process_steps, [:work_order_id, :sequence]
  end
end
