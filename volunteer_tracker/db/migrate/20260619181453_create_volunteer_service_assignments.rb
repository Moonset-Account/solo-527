class CreateVolunteerServiceAssignments < ActiveRecord::Migration[8.1]
  def change
    create_table :volunteer_service_assignments do |t|
      t.references :volunteer_service, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :role

      t.timestamps
    end
  end
end
