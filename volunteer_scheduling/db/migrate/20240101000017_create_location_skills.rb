class CreateLocationSkills < ActiveRecord::Migration[8.0]
  def change
    create_table :location_skills do |t|
      t.references :location, null: false, foreign_key: true
      t.references :skill, null: false, foreign_key: true

      t.timestamps
    end

    add_index :location_skills, [:location_id, :skill_id], unique: true
  end
end
