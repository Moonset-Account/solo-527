class CreateDriverAssignments < ActiveRecord::Migration[8.1]
  def change
    create_table :driver_assignments do |t|
      t.bigint :vehicle_id
      t.bigint :old_driver_id
      t.bigint :new_driver_id
      t.bigint :reassigned_by

      t.string :reason
      t.datetime :reassigned_at
      t.text :remark

      t.integer :processing_duration_seconds

      t.timestamps
    end

    add_index :driver_assignments, :vehicle_id
    add_index :driver_assignments, :old_driver_id
    add_index :driver_assignments, :new_driver_id
    add_index :driver_assignments, :reassigned_by_id
  end
end
