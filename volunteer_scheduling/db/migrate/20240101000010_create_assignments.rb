class CreateAssignments < ActiveRecord::Migration[8.0]
  def change
    create_table :assignments do |t|
      t.references :volunteer_profile, null: false, foreign_key: true
      t.references :location, null: false, foreign_key: true
      t.references :activity, null: false, foreign_key: true
      t.integer :status, default: 0
      t.text :match_reason
      t.datetime :accepted_at
      t.datetime :declined_at
      t.text :decline_reason

      t.timestamps
    end

    add_index :assignments, [:volunteer_profile_id, :activity_id], unique: true
  end
end
