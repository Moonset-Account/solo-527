class CreateMolds < ActiveRecord::Migration[8.1]
  def change
    create_table :molds do |t|
      t.string :code, null: false
      t.string :name
      t.string :material
      t.integer :total_shots, default: 0
      t.integer :current_shots, default: 0
      t.integer :max_shots
      t.integer :status, default: 0
      t.date :maintenance_date

      t.timestamps
    end

    add_index :molds, :code, unique: true
    add_index :molds, :status
  end
end
