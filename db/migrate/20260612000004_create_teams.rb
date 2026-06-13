class CreateTeams < ActiveRecord::Migration[8.1]
  def change
    create_table :teams do |t|
      t.string :name
      t.string :code, null: false
      t.string :leader_name
      t.integer :member_count
      t.integer :shift, default: 0

      t.timestamps
    end

    add_index :teams, :code, unique: true
    add_index :teams, :shift
  end
end
