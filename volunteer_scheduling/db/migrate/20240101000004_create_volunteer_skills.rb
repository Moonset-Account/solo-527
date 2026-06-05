class CreateVolunteerSkills < ActiveRecord::Migration[8.0]
  def change
    create_table :volunteer_skills do |t|
      t.references :volunteer_profile, null: false, foreign_key: true
      t.references :skill, null: false, foreign_key: true
      t.integer :proficiency, default: 1
      t.text :certificate_details

      t.timestamps
    end

    add_index :volunteer_skills, [:volunteer_profile_id, :skill_id], unique: true
  end
end
