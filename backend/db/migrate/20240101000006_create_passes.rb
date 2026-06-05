class CreatePasses < ActiveRecord::Migration[8.0]
  def change
    create_table :passes do |t|
      t.string :pass_number, null: false
      t.references :person, null: false, foreign_key: true
      t.references :vehicle, foreign_key: true
      t.string :pass_type, null: false, default: 'temporary'
      t.string :purpose
      t.references :work_zone, foreign_key: true
      t.datetime :valid_from, null: false
      t.datetime :valid_until, null: false
      t.string :status, null: false, default: 'pending'
      t.boolean :frozen, default: false
      t.datetime :frozen_at
      t.string :freeze_reason
      t.text :remark
      t.references :creator, foreign_key: { to_table: :users }

      t.timestamps
    end
    add_index :passes, :pass_number, unique: true
    add_index :passes, :status
    add_index :passes, :valid_until
  end
end
