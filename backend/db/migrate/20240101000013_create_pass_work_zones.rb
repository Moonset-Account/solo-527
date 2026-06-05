class CreatePassWorkZones < ActiveRecord::Migration[8.0]
  def change
    create_table :pass_work_zones do |t|
      t.references :pass, null: false, foreign_key: true
      t.references :work_zone, null: false, foreign_key: true
      t.string :access_level, default: 'read'
      t.datetime :granted_at

      t.timestamps
    end
    add_index :pass_work_zones, [:pass_id, :work_zone_id], unique: true
  end
end
