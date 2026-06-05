class CreateVolunteerProfiles < ActiveRecord::Migration[8.0]
  def change
    create_table :volunteer_profiles do |t|
      t.references :user, null: false, foreign_key: true
      t.date :birth_date
      t.string :gender
      t.text :address
      t.float :latitude
      t.float :longitude
      t.integer :total_service_hours, default: 0
      t.boolean :is_minor, default: false
      t.text :bio

      t.timestamps
    end
  end
end
