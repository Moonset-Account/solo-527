class CreateAssignmentChanges < ActiveRecord::Migration[8.0]
  def change
    create_table :assignment_changes do |t|
      t.references :assignment, null: false, foreign_key: true
      t.references :changed_by, null: false, foreign_key: { to_table: :users }
      t.references :old_volunteer_profile, foreign_key: { to_table: :volunteer_profiles }
      t.references :new_volunteer_profile, foreign_key: { to_table: :volunteer_profiles }
      t.text :original_match_reason
      t.text :change_reason
      t.datetime :changed_at, null: false

      t.timestamps
    end
  end
end
