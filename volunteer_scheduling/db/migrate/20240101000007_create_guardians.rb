class CreateGuardians < ActiveRecord::Migration[8.0]
  def change
    create_table :guardians do |t|
      t.references :volunteer_profile, null: false, foreign_key: true
      t.string :name, null: false
      t.string :relationship, null: false
      t.string :phone, null: false
      t.string :email
      t.string :id_card_number
      t.boolean :consent_given, default: false
      t.datetime :consent_given_at

      t.timestamps
    end
  end
end
