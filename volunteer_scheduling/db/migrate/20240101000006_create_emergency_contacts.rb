class CreateEmergencyContacts < ActiveRecord::Migration[8.0]
  def change
    create_table :emergency_contacts do |t|
      t.references :volunteer_profile, null: false, foreign_key: true
      t.string :name, null: false
      t.string :relationship, null: false
      t.string :phone, null: false
      t.string :email
      t.boolean :is_primary, default: false

      t.timestamps
    end
  end
end
